const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, db } = require('./db');

// Initialize database & tables
initDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve Admin Uploaded Files (Logos, Notification PDFs, Banners)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const { router: authRouter } = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const adminRouter = require('./routes/admin');
const notificationsRouter = require('./routes/notifications');

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);

// Automated Expiry & Deadline Notification Background Worker
function runBackgroundExpiryWorker() {
  try {
    const nowIso = new Date().toISOString();

    // 1. Automatically update jobs past application deadline to 'Expired'
    const expiredResult = db.prepare(`
      UPDATE jobs
      SET status = 'Expired'
      WHERE status = 'Published' AND datetime(application_deadline) < datetime(?)
    `).run(nowIso);

    if (expiredResult.changes > 0) {
      console.log(`[Background Worker] Automatically expired ${expiredResult.changes} job(s) past deadline.`);
    }

    // 2. Check for jobs expiring in the next 24 hours and issue DEADLINE_SOON notifications if not already issued
    const tomorrowIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const expiringSoonJobs = db.prepare(`
      SELECT id, title, company, application_deadline FROM jobs
      WHERE status = 'Published' AND datetime(application_deadline) BETWEEN datetime(?) AND datetime(?)
    `).all(nowIso, tomorrowIso);

    for (const job of expiringSoonJobs) {
      const existingNotif = db.prepare(`
        SELECT id FROM notifications WHERE job_id = ? AND type = 'DEADLINE_SOON'
      `).get(job.id);

      if (!existingNotif) {
        const notifId = 'notif_exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, job_id, type)
          VALUES (?, NULL, ?, ?, ?, 'DEADLINE_SOON')
        `).run(
          notifId,
          `DEADLINE NOTICE: ${job.title}`,
          `Applications for ${job.title} at ${job.company} close within 24 hours!`,
          job.id
        );
      }
    }
  } catch (err) {
    console.error('[Background Worker Error]:', err);
  }
}

// Run worker immediately on start and every 60 seconds
runBackgroundExpiryWorker();
setInterval(runBackgroundExpiryWorker, 60000);

// Serve static assets in production or built client
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Job Notification Platform Server running on port ${PORT}`);
  console.log(`====================================================`);
});
