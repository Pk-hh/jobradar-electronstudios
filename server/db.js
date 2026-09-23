const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'job_platform.db');
const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');

function initDB() {
  console.log('Initializing database tables...');

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user',
      qualification TEXT,
      degree TEXT,
      branch TEXT,
      graduation_year INTEGER,
      skills TEXT,
      preferred_locations TEXT,
      preferred_categories TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Jobs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      logo TEXT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      work_mode TEXT NOT NULL,
      salary TEXT,
      stipend TEXT,
      experience TEXT NOT NULL,
      qualification TEXT,
      branch TEXT,
      skills TEXT,
      eligibility TEXT,
      vacancies INTEGER DEFAULT 1,
      posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      application_start DATETIME,
      application_deadline DATETIME NOT NULL,
      selection_process TEXT,
      official_notification_url TEXT,
      application_url TEXT NOT NULL,
      source TEXT,
      status TEXT DEFAULT 'Published',
      verified INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      clicks_count INTEGER DEFAULT 0
    );
  `);

  // Saved Jobs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, job_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Applications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      status TEXT DEFAULT 'Applied',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      job_id TEXT,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Notification Preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      new_jobs INTEGER DEFAULT 1,
      internships INTEGER DEFAULT 1,
      govt_jobs INTEGER DEFAULT 1,
      deadline_reminders INTEGER DEFAULT 1,
      recommendations INTEGER DEFAULT 1
    );
  `);

  // Job Reports Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_reports (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      user_id TEXT,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('Seeding initial accounts...');
  const salt = bcrypt.genSaltSync(10);

  // Admin User
  const adminId = 'usr_admin_1';
  const adminPass = bcrypt.hashSync('admin123', salt);
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, qualification, degree, branch, graduation_year, skills, preferred_locations, preferred_categories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'System Admin',
    'admin@jobportal.com',
    adminPass,
    '+91 9876543210',
    'admin',
    'B.Tech',
    'Computer Science',
    'CSE',
    2023,
    JSON.stringify(['Management', 'Recruitment', 'Platform Operations']),
    JSON.stringify(['All India']),
    JSON.stringify(['Jobs', 'Government', 'Internships'])
  );

  // Student User
  const studentId = 'usr_student_1';
  const studentPass = bcrypt.hashSync('student123', salt);
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, qualification, degree, branch, graduation_year, skills, preferred_locations, preferred_categories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studentId,
    'Rahul Sharma',
    'student@example.com',
    studentPass,
    '+91 9123456789',
    'user',
    'B.Tech',
    'Bachelor of Technology',
    'Computer Science & Engineering',
    2026,
    JSON.stringify(['React', 'Node.js', 'Python', 'SQL', 'Data Structures']),
    JSON.stringify(['Hyderabad', 'Remote', 'Bengaluru']),
    JSON.stringify(['Jobs', 'Internships', 'Freshers', 'Work From Home'])
  );

  db.prepare(`
    INSERT INTO notification_preferences (user_id) VALUES (?)
  `).run(studentId);

  console.log('Seeding complete! Admin: admin@jobportal.com / admin123 | Student: student@example.com / student123');
}

module.exports = { db, initDB };
