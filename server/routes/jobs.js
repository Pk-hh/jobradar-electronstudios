const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getOrCreateUser } = require('./auth');

// Optional / Guest Auth helper
function getUserFromReq(req) {
  return getOrCreateUser(req);
}

// Global Public Job Listing & Search & Filter
router.get('/', (req, res) => {
  try {
    const user = getUserFromReq(req);
    const {
      search,
      category,
      sub_category,
      type,
      work_mode,
      location,
      qualification,
      branch,
      skills,
      experience,
      verified_only,
      include_expired,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    let conditions = [];
    let params = [];

    // Filter by status (default published & verified)
    if (!include_expired || include_expired !== 'true') {
      conditions.push("status = 'Published'");
      conditions.push("datetime(application_deadline) >= datetime('now')");
    } else {
      conditions.push("status != 'Draft'");
    }

    if (verified_only === 'true') {
      conditions.push("verified = 1");
    }

    // Category filter
    if (category && category !== 'All') {
      if (category === 'Freshers') {
        conditions.push("(category = 'Freshers' OR experience LIKE '%Fresher%' OR experience LIKE '%0-%')");
      } else if (category === 'Government') {
        conditions.push("category = 'Government'");
      } else if (category === 'Internships') {
        conditions.push("category = 'Internships'");
      } else if (category === 'Work From Home') {
        conditions.push("(category = 'Work From Home' OR work_mode = 'Remote')");
      } else {
        conditions.push("category = ?");
        params.push(category);
      }
    }

    // Sub category filter
    if (sub_category && sub_category !== 'All') {
      conditions.push("sub_category = ?");
      params.push(sub_category);
    }

    // Type filter
    if (type && type !== 'All') {
      conditions.push("type = ?");
      params.push(type);
    }

    // Work Mode
    if (work_mode && work_mode !== 'All') {
      conditions.push("work_mode = ?");
      params.push(work_mode);
    }

    // Location
    if (location && location !== 'All') {
      conditions.push("location LIKE ?");
      params.push(`%${location}%`);
    }

    // Qualification
    if (qualification && qualification !== 'All') {
      conditions.push("qualification LIKE ?");
      params.push(`%${qualification}%`);
    }

    // Search Query across Title, Company, Skills, Location, Qualification
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      conditions.push("(title LIKE ? OR company LIKE ? OR skills LIKE ? OR location LIKE ? OR qualification LIKE ? OR description LIKE ?)");
      params.push(q, q, q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Order By
    let orderBy = 'ORDER BY featured DESC, posted_at DESC';
    if (sort === 'deadline') {
      orderBy = 'ORDER BY application_deadline ASC';
    } else if (sort === 'popular') {
      orderBy = 'ORDER BY views_count DESC, clicks_count DESC';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const countSql = `SELECT COUNT(*) as count FROM jobs ${whereClause}`;
    const total = db.prepare(countSql).get(...params).count;

    const sql = `SELECT * FROM jobs ${whereClause} ${orderBy} LIMIT ? OFFSET ?`;
    const rows = db.prepare(sql).all(...params, parseInt(limit), offset);

    // Check saved status for user
    let savedJobIds = new Set();
    if (user) {
      const saved = db.prepare('SELECT job_id FROM saved_jobs WHERE user_id = ?').all(user.id);
      saved.forEach(s => savedJobIds.add(s.job_id));
    }

    const jobs = rows.map(job => {
      let parsedSkills = [];
      try { parsedSkills = JSON.parse(job.skills || '[]'); } catch(e){}
      return {
        ...job,
        skills: parsedSkills,
        is_saved: savedJobIds.has(job.id),
        is_expired: new Date(job.application_deadline) < new Date()
      };
    });

    res.json({
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  }
});

// Rule-Based Recommendation Engine (No Login Required!)
router.get('/recommended', (req, res) => {
  try {
    const user = getUserFromReq(req);

    let userSkills = [];
    let userLocs = [];
    let userCats = [];
    try { userSkills = JSON.parse(user.skills || '[]'); } catch(e){}
    try { userLocs = JSON.parse(user.preferred_locations || '[]'); } catch(e){}
    try { userCats = JSON.parse(user.preferred_categories || '[]'); } catch(e){}

    const activeJobs = db.prepare(`
      SELECT * FROM jobs
      WHERE status = 'Published' AND datetime(application_deadline) >= datetime('now')
    `).all();

    const scoredJobs = activeJobs.map(job => {
      let score = 0;
      let jobSkills = [];
      try { jobSkills = JSON.parse(job.skills || '[]'); } catch(e){}

      const skillMatches = jobSkills.filter(s =>
        userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
      );
      score += Math.min(skillMatches.length * 10, 30);

      if (user.branch && job.branch && (job.branch.toLowerCase().includes(user.branch.toLowerCase()) || job.branch.includes('All'))) {
        score += 20;
      }

      if (user.qualification && job.qualification && job.qualification.toLowerCase().includes(user.qualification.toLowerCase())) {
        score += 20;
      }

      if (job.work_mode === 'Remote' || userLocs.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()))) {
        score += 15;
      }

      if (userCats.some(cat => job.category.toLowerCase().includes(cat.toLowerCase()))) {
        score += 15;
      }

      return {
        ...job,
        skills: jobSkills,
        match_score: Math.min(score, 100)
      };
    });

    scoredJobs.sort((a, b) => b.match_score - a.match_score);

    const saved = db.prepare('SELECT job_id FROM saved_jobs WHERE user_id = ?').all(user.id);
    const savedSet = new Set(saved.map(s => s.job_id));

    const recommendations = scoredJobs.slice(0, 10).map(job => ({
      ...job,
      is_saved: savedSet.has(job.id)
    }));

    res.json({ recommendations });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Single Job Details
router.get('/:id', (req, res) => {
  try {
    const user = getUserFromReq(req);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job notification not found' });

    db.prepare('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?').run(job.id);

    let isSaved = false;
    let applicationState = null;

    if (user) {
      const saved = db.prepare('SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?').get(user.id, job.id);
      isSaved = !!saved;

      const app = db.prepare('SELECT * FROM applications WHERE user_id = ? AND job_id = ?').get(user.id, job.id);
      if (app) applicationState = app.status;
    }

    let parsedSkills = [];
    try { parsedSkills = JSON.parse(job.skills || '[]'); } catch(e){}

    let customTables = null;
    let customFields = null;
    let customTable = null;
    if (job.custom_tables) { try { customTables = JSON.parse(job.custom_tables); } catch(e){} }
    if (job.custom_fields) { try { customFields = JSON.parse(job.custom_fields); } catch(e){} }
    if (job.custom_table) { try { customTable = JSON.parse(job.custom_table); } catch(e){} }

    res.json({
      job: {
        ...job,
        skills: parsedSkills,
        custom_tables: customTables,
        custom_fields: customFields,
        custom_table: customTable,
        is_saved: isSaved,
        user_application_status: applicationState,
        is_expired: new Date(job.application_deadline) < new Date()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// Increment click count on Apply
router.post('/:id/apply-click', (req, res) => {
  try {
    db.prepare('UPDATE jobs SET clicks_count = clicks_count + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Failed to log click' });
  }
});

// Bookmark / Save Toggle (No Login Required!)
router.post('/:id/save', (req, res) => {
  try {
    const user = getUserFromReq(req);
    const jobId = req.params.id;
    const userId = user.id;

    const existing = db.prepare('SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?').get(userId, jobId);

    if (existing) {
      db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?').run(userId, jobId);
      return res.json({ message: 'Job removed from saved list', is_saved: false });
    } else {
      db.prepare('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)').run(userId, jobId);
      return res.json({ message: 'Job saved successfully', is_saved: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update saved job status' });
  }
});

// Get User's Saved Jobs (No Login Required!)
router.get('/user/saved', (req, res) => {
  try {
    const user = getUserFromReq(req);
    const rows = db.prepare(`
      SELECT j.*, sj.saved_at, a.status as application_status
      FROM jobs j
      JOIN saved_jobs sj ON j.id = sj.job_id
      LEFT JOIN applications a ON (a.user_id = sj.user_id AND a.job_id = j.id)
      WHERE sj.user_id = ?
      ORDER BY sj.saved_at DESC
    `).all(user.id);

    const savedJobs = rows.map(job => {
      let parsedSkills = [];
      try { parsedSkills = JSON.parse(job.skills || '[]'); } catch(e){}
      return {
        ...job,
        skills: parsedSkills,
        is_saved: true,
        is_expired: new Date(job.application_deadline) < new Date()
      };
    });

    res.json({ saved_jobs: savedJobs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved jobs' });
  }
});

// Application Tracker Update / Record (No Login Required!)
router.post('/:id/track-application', (req, res) => {
  try {
    const user = getUserFromReq(req);
    const jobId = req.params.id;
    const userId = user.id;
    const { status = 'Applied', notes = '' } = req.body;

    const appId = 'app_' + Date.now();

    db.prepare(`
      INSERT INTO applications (id, user_id, job_id, status, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).run(appId, userId, jobId, status, notes);

    res.json({ message: 'Application status updated', status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application tracker' });
  }
});

// Get User's Tracked Applications (No Login Required!)
router.get('/user/applications', (req, res) => {
  try {
    const user = getUserFromReq(req);
    const rows = db.prepare(`
      SELECT a.*, j.title, j.company, j.logo, j.location, j.type, j.application_deadline
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.user_id = ?
      ORDER BY a.updated_at DESC
    `).all(user.id);

    res.json({ applications: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Trust & Safety: Report Job
router.post('/:id/report', (req, res) => {
  try {
    const user = getUserFromReq(req);
    const jobId = req.params.id;
    const userId = user ? user.id : null;
    const { reason, details } = req.body;

    if (!reason) return res.status(400).json({ error: 'Reason for report is required' });

    const reportId = 'rep_' + Date.now();
    db.prepare(`
      INSERT INTO job_reports (id, job_id, user_id, reason, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(reportId, jobId, userId, reason, details || '');

    res.json({ message: 'Report submitted for review. Thank you for keeping the platform safe.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit job report' });
  }
});

module.exports = router;
