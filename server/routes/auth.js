const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Helper to get or create guest user by x-user-id
function getOrCreateUser(req) {
  const userId = req.headers['x-user-id'] || 'usr_guest_default';
  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!user) {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, qualification, degree, branch, graduation_year, skills, preferred_locations, preferred_categories)
      VALUES (?, 'Job Seeker', ?, 'guest_hash', 'user', 'B.Tech', 'Bachelor of Technology', 'Computer Science & Engineering', 2026, '["React","Node.js","Python","SQL"]', '["Hyderabad","Remote","Bengaluru"]', '["Jobs","Internships","Freshers"]')
    `).run(userId, `${userId}@guest.local`);

    db.prepare(`INSERT OR IGNORE INTO notification_preferences (user_id) VALUES (?)`).run(userId);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  return user;
}

// Get User Profile (No Login Required!)
router.get('/me', (req, res) => {
  try {
    const user = getOrCreateUser(req);

    let parsedSkills = [];
    let parsedLocations = [];
    let parsedCategories = [];
    try { parsedSkills = JSON.parse(user.skills || '[]'); } catch(e){}
    try { parsedLocations = JSON.parse(user.preferred_locations || '[]'); } catch(e){}
    try { parsedCategories = JSON.parse(user.preferred_categories || '[]'); } catch(e){}

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        qualification: user.qualification,
        degree: user.degree,
        branch: user.branch,
        graduation_year: user.graduation_year,
        skills: parsedSkills,
        preferred_locations: parsedLocations,
        preferred_categories: parsedCategories
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile Preferences (No Login Required!)
router.put('/profile', (req, res) => {
  try {
    const user = getOrCreateUser(req);
    const { name, phone, qualification, degree, branch, graduation_year, skills, preferred_locations, preferred_categories } = req.body;

    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : undefined;
    const locsJson = Array.isArray(preferred_locations) ? JSON.stringify(preferred_locations) : undefined;
    const catsJson = Array.isArray(preferred_categories) ? JSON.stringify(preferred_categories) : undefined;

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        qualification = COALESCE(?, qualification),
        degree = COALESCE(?, degree),
        branch = COALESCE(?, branch),
        graduation_year = COALESCE(?, graduation_year),
        skills = COALESCE(?, skills),
        preferred_locations = COALESCE(?, preferred_locations),
        preferred_categories = COALESCE(?, preferred_categories)
      WHERE id = ?
    `).run(name, phone, qualification, degree, branch, graduation_year, skillsJson, locsJson, catsJson, user.id);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = { router, getOrCreateUser };
