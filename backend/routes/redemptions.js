const express = require('express');
const router = express.Router();
const {
  createRedemption,
  getRedemptions,
  getRedemption,
  approveRedemption,
  rejectRedemption,
  getUserRedemptionHistory
} = require('../controllers/redemptions');
const { protect, authorize } = require('../middleware/auth');

// Routes
router.post('/', protect, createRedemption);
router.get('/', protect, getRedemptions);
router.get('/history', protect, getUserRedemptionHistory);
router.get('/:id', protect, getRedemption);
router.put('/:id/approve', protect, authorize('admin'), approveRedemption);
router.put('/:id/reject', protect, authorize('admin'), rejectRedemption);

module.exports = router;
