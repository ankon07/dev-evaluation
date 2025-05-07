const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications
} = require('../controllers/notifications');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get user notifications and unread count
router.get('/', getUserNotifications);
router.get('/unread/count', getUnreadCount);

// Mark notifications as read
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

// Delete notifications
router.delete('/:id', deleteNotification);
router.delete('/read', deleteReadNotifications);

module.exports = router;
