const express = require('express');
const router = express.Router();
const {
  getSystemConfig,
  updateSystemConfig,
  getRewardRules,
  updateRewardRules,
  syncExternalData,
  getSystemStats,
  generateReport,
  getAuditLogs,
  manageUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  testConnection
} = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(protect, authorize('admin'));

// System configuration routes
router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);

// Reward rules routes
router.get('/rules', getRewardRules);
router.put('/rules', updateRewardRules);

// Data synchronization routes
router.post('/sync', syncExternalData);

// Statistics and reporting routes
router.get('/stats', getSystemStats);
router.get('/reports', generateReport);
router.get('/reports/overview', generateReport);
router.get('/reports/top-developers', generateReport);
router.get('/reports/token-distribution', generateReport);
router.get('/reports/activity-trends', generateReport);
router.get('/reports/evaluation-metrics', generateReport);
router.get('/reports/export', generateReport);
router.get('/logs', getAuditLogs);

// Test connection routes
router.post('/config/test/:type', testConnection);

// User management routes
router.get('/users', manageUsers);
router.post('/users', createUser);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
