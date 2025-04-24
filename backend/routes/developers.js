const express = require('express');
const router = express.Router();
const {
  getDevelopers,
  getDeveloper,
  updateDeveloperProfile,
  addSkill,
  updateSkill,
  removeSkill,
  connectWallet,
  disconnectWallet,
  getDeveloperStats,
  getDeveloperTransactions
} = require('../controllers/developers');
const { protect, authorize } = require('../middleware/auth');

// Routes
router.get('/', protect, authorize('admin', 'hr', 'developer'), getDevelopers);
router.get('/stats', protect, getDeveloperStats);
router.get('/transactions', protect, getDeveloperTransactions);
router.get('/:id', protect, getDeveloper);
router.put('/:id/profile', protect, updateDeveloperProfile);
router.post('/:id/skills', protect, addSkill);
router.put('/:id/skills/:skillId', protect, updateSkill);
router.delete('/:id/skills/:skillId', protect, removeSkill);
router.post('/:id/wallet', protect, authorize('developer', 'admin'), connectWallet);
router.delete('/:id/wallet', protect, authorize('developer', 'admin'), disconnectWallet);

module.exports = router;
