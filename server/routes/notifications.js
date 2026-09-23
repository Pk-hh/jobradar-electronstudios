const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { getOrCreateUser } = require('./auth');

// Get User Notifications (Global Broadcasts + User-Specific)
router.get('/', (req, res) => {
  try {
    const user = getOrCreateUser(req);
    const userId = user ? user.id : null;

    let sql;
    let params;

    if (userId) {
      sql = `
        SELECT * FROM notifications
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY created_at DESC LIMIT 30
      `;
      params = [userId];
    } else {
      sql = `
        SELECT * FROM notifications
        WHERE user_id IS NULL
        ORDER BY created_at DESC LIMIT 15
      `;
      params = [];
    }

    const notifications = db.prepare(sql).all(...params);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      notifications,
      unread_count: unreadCount
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Single Notification as Read
router.patch('/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification status' });
  }
});

// Mark All as Read
router.post('/read-all', (req, res) => {
  try {
    const user = getOrCreateUser(req);
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL').run(user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

module.exports = router;
