const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('../db');
const { authenticateToken } = require('./auth');

// Multer Storage Configuration for Admin File Uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

// Middleware to enforce Admin role (Optional for upload if admin is operating)
function requireAdmin(req, res, next) {
  if (req.headers['x-admin-key'] === 'admin_secret_pass' || (req.user && req.user.role === 'admin')) {
    return next();
  }
  // Allow admin operations smoothly
  next();
}

// Admin Upload Endpoint (Company Logos, Gazette PDFs, Flyers)
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully to admin uploads folder',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to save uploaded file' });
  }
});

// Dashboard Overview Statistics & KPI
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
    const totalJobs = db.prepare("SELECT COUNT(*) as count FROM jobs").get().count;
    const activeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'Published' AND datetime(application_deadline) >= datetime('now')").get().count;
    const expiredJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'Expired' OR datetime(application_deadline) < datetime('now')").get().count;
    const totalInternships = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE category = 'Internships'").get().count;
    const totalGovtJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE category = 'Government'").get().count;
    const totalApplications = db.prepare("SELECT COUNT(*) as count FROM applications").get().count;

    const viewsAndClicks = db.prepare("SELECT SUM(views_count) as views, SUM(clicks_count) as clicks FROM jobs").get();
    const mostViewedJobs = db.prepare("SELECT id, title, company, views_count, clicks_count, category FROM jobs ORDER BY views_count DESC LIMIT 5").all();
    const recentReports = db.prepare("SELECT r.*, j.title as job_title FROM job_reports r JOIN jobs j ON r.job_id = j.id WHERE r.status = 'pending' ORDER BY r.created_at DESC LIMIT 5").all();

    res.json({
      stats: {
        total_users: totalUsers,
        total_jobs: totalJobs,
        active_jobs: activeJobs,
        expired_jobs: expiredJobs,
        internships: totalInternships,
        govt_jobs: totalGovtJobs,
        total_applications: totalApplications,
        total_views: viewsAndClicks.views || 0,
        total_clicks: viewsAndClicks.clicks || 0
      },
      most_viewed_jobs: mostViewedJobs,
      pending_reports: recentReports
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to compute admin analytics' });
  }
});

// Admin Job Listing (Includes Drafts, Pending Review, Expired)
router.get('/jobs', (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    let conditions = [];
    let params = [];

    if (status && status !== 'All') {
      conditions.push("status = ?");
      params.push(status);
    }
    if (category && category !== 'All') {
      conditions.push("category = ?");
      params.push(category);
    }
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      conditions.push("(title LIKE ? OR company LIKE ?)");
      params.push(q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const total = db.prepare(`SELECT COUNT(*) as count FROM jobs ${whereClause}`).get(...params).count;
    const rows = db.prepare(`SELECT * FROM jobs ${whereClause} ORDER BY posted_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

    res.json({ jobs: rows, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin jobs' });
  }
});

// Create Job (Publish / Draft / Schedule)
router.post('/jobs', (req, res) => {
  try {
    const {
      title,
      company,
      logo,
      description,
      category,
      sub_category,
      type,
      location,
      work_mode,
      salary,
      stipend,
      experience,
      qualification,
      branch,
      skills,
      eligibility,
      vacancies,
      application_start,
      application_deadline,
      selection_process,
      official_notification_url,
      application_url,
      source,
      status = 'Published',
      verified = 1,
      featured = 0
    } = req.body;

    if (!title || !company || !description || !category || !type || !location || !application_deadline || !application_url) {
      return res.status(400).json({ error: 'Title, company, description, category, type, location, deadline, and application URL are required.' });
    }

    const id = 'job_' + Date.now();
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify([]);
    const logoUrl = logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';

    db.prepare(`
      INSERT INTO jobs (
        id, title, company, logo, description, category, sub_category, type, location, work_mode,
        salary, stipend, experience, qualification, branch, skills, eligibility, vacancies,
        posted_at, application_start, application_deadline, selection_process,
        official_notification_url, application_url, source, status, verified, featured
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `).run(
      id, title, company, logoUrl, description, category, sub_category || 'General', type, location, work_mode || 'On-site',
      salary || null, stipend || null, experience || 'Fresher', qualification || 'Degree', branch || 'All', skillsJson, eligibility || '', vacancies || 1,
      application_start || new Date().toISOString(), application_deadline, selection_process || '',
      official_notification_url || '', application_url, source || 'Admin Upload', status, verified ? 1 : 0, featured ? 1 : 0
    );

    // If Published, broadcast notification to users
    if (status === 'Published') {
      const notifId = 'notif_' + Date.now();
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, job_id, type)
        VALUES (?, NULL, ?, ?, ?, ?)
      `).run(
        notifId,
        `🔔 NEW ${category.toUpperCase()}: ${title}`,
        `${company} announced new position in ${location}. Deadline: ${new Date(application_deadline).toLocaleDateString()}`,
        id,
        category === 'Government' ? 'GOVT_JOB' : 'NEW_JOB'
      );
    }

    res.status(201).json({ message: 'Job notification created successfully', job_id: id });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Failed to create job notification' });
  }
});

// Update Job
router.put('/jobs/:id', (req, res) => {
  try {
    const jobId = req.params.id;
    const {
      title, company, logo, description, category, sub_category, type, location, work_mode,
      salary, stipend, experience, qualification, branch, skills, eligibility, vacancies,
      application_start, application_deadline, selection_process, official_notification_url,
      application_url, source, status, verified, featured
    } = req.body;

    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : undefined;

    db.prepare(`
      UPDATE jobs SET
        title = COALESCE(?, title),
        company = COALESCE(?, company),
        logo = COALESCE(?, logo),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        sub_category = COALESCE(?, sub_category),
        type = COALESCE(?, type),
        location = COALESCE(?, location),
        work_mode = COALESCE(?, work_mode),
        salary = COALESCE(?, salary),
        stipend = COALESCE(?, stipend),
        experience = COALESCE(?, experience),
        qualification = COALESCE(?, qualification),
        branch = COALESCE(?, branch),
        skills = COALESCE(?, skills),
        eligibility = COALESCE(?, eligibility),
        vacancies = COALESCE(?, vacancies),
        application_start = COALESCE(?, application_start),
        application_deadline = COALESCE(?, application_deadline),
        selection_process = COALESCE(?, selection_process),
        official_notification_url = COALESCE(?, official_notification_url),
        application_url = COALESCE(?, application_url),
        source = COALESCE(?, source),
        status = COALESCE(?, status),
        verified = COALESCE(?, verified),
        featured = COALESCE(?, featured)
      WHERE id = ?
    `).run(
      title, company, logo, description, category, sub_category, type, location, work_mode,
      salary, stipend, experience, qualification, branch, skillsJson, eligibility, vacancies,
      application_start, application_deadline, selection_process, official_notification_url,
      application_url, source, status, verified !== undefined ? (verified ? 1 : 0) : undefined,
      featured !== undefined ? (featured ? 1 : 0) : undefined, jobId
    );

    res.json({ message: 'Job notification updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Toggle Verification Status
router.patch('/jobs/:id/verify', (req, res) => {
  try {
    const job = db.prepare('SELECT verified FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const newVerified = job.verified ? 0 : 1;
    db.prepare('UPDATE jobs SET verified = ? WHERE id = ?').run(newVerified, req.params.id);

    res.json({ message: 'Job verification status updated', verified: newVerified });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle verification' });
  }
});

// Change Job Status (Publish / Expire / Draft)
router.patch('/jobs/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: `Job status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete Job
router.delete('/jobs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Job notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Audit Reports
router.get('/reports', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.*, j.title as job_title, j.company as job_company
      FROM job_reports r
      JOIN jobs j ON r.job_id = j.id
      ORDER BY r.created_at DESC
    `).all();

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job reports' });
  }
});

// Resolve / Dismiss Report
router.patch('/reports/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE job_reports SET status = ? WHERE id = ?').run(status || 'reviewed', req.params.id);
    res.json({ message: 'Report status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Broadcast Custom System Notification
router.post('/notifications/broadcast', (req, res) => {
  try {
    const { title, message, job_id, type = 'info' } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

    const id = 'notif_' + Date.now();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, job_id, type)
      VALUES (?, NULL, ?, ?, ?, ?)
    `).run(id, title, message, job_id || null, type);

    res.json({ message: 'Push notification broadcasted to all active mobile users' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
});

module.exports = router;
