const { initDB, db } = require('./db');
initDB();

console.log('--- Testing Database Queries ---');
const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
console.log('Total Jobs in DB:', totalJobs);

const activeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'Published' AND datetime(application_deadline) >= datetime('now')").get().count;
console.log('Active Jobs in DB:', activeJobs);

const expiredJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'Expired' OR datetime(application_deadline) < datetime('now')").get().count;
console.log('Expired Jobs in DB:', expiredJobs);

const user = db.prepare("SELECT id, email, name, role FROM users WHERE email = 'student@example.com'").get();
console.log('Seeded User:', user);

console.log('--- Testing API Logic Complete ---');
