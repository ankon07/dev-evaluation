const express = require('express');
const router = express.Router();
const { 
  processGitHubCallback,
  getGitHubProfile,
  getGitHubRepositories,
  getGitHubActivity,
  disconnectGitHub
} = require('../controllers/github');
const { protect } = require('../middleware/auth');

// Routes for GitHub callback processing
router.post('/auth/github/process', protect, processGitHubCallback);

// Routes for GitHub profile, repositories, and activity
// These are nested under /api/developers/:id/github
router.get('/developers/:id/github/profile', protect, getGitHubProfile);
router.get('/developers/:id/github/repositories', protect, getGitHubRepositories);
router.get('/developers/:id/github/activity', protect, getGitHubActivity);
router.delete('/developers/:id/github', protect, disconnectGitHub);

module.exports = router;
