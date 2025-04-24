const express = require('express');
const router = express.Router();
const {
  getEvaluations,
  getEvaluation,
  createEvaluation,
  processEvaluation,
  getDeveloperEvaluations,
  getEvaluationMetrics,
  getEvaluationHistory
} = require('../controllers/evaluations');
const { protect, authorize } = require('../middleware/auth');

// Routes
router.get('/', protect, authorize('admin', 'hr'), getEvaluations);
router.post('/', protect, authorize('admin', 'hr'), createEvaluation);
// Put specific routes before parameterized routes
router.get('/developer/:developerId', protect, getDeveloperEvaluations);
router.get('/developer/:developerId/history', protect, getEvaluationHistory);
// Parameterized routes
router.get('/:id', protect, getEvaluation);
router.post('/:id/process', protect, authorize('admin'), processEvaluation);
router.get('/:id/metrics', protect, getEvaluationMetrics);

// Additional routes for evaluation details
router.get('/:id/tasks', protect, (req, res) => {
  // Mock data for tasks
  const tasks = [
    {
      _id: '1',
      jiloId: 'TASK-001',
      title: 'Implement user authentication',
      type: 'Feature',
      difficulty: 'Medium',
      status: 'Done',
      assignee: req.params.id
    },
    {
      _id: '2',
      jiloId: 'TASK-002',
      title: 'Fix login page responsiveness',
      type: 'Bug',
      difficulty: 'Easy',
      status: 'Done',
      assignee: req.params.id
    },
    {
      _id: '3',
      jiloId: 'TASK-003',
      title: 'Add password reset functionality',
      type: 'Feature',
      difficulty: 'Medium',
      status: 'In Progress',
      assignee: req.params.id
    },
    {
      _id: '4',
      jiloId: 'TASK-004',
      title: 'Implement token-based authorization',
      type: 'Feature',
      difficulty: 'Hard',
      status: 'Done',
      assignee: req.params.id
    },
    {
      _id: '5',
      jiloId: 'TASK-005',
      title: 'Fix memory leak in dashboard',
      type: 'Bug',
      difficulty: 'Hard',
      status: 'Verified',
      assignee: req.params.id
    }
  ];
  
  res.status(200).json({
    success: true,
    data: tasks
  });
});

router.get('/:id/commits', protect, (req, res) => {
  // Mock data for commits
  const commits = [
    {
      _id: '1',
      hash: '7f8d9e2a1b3c4d5e6f7a8b9c',
      message: 'Implement user authentication',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      additions: 120,
      deletions: 5
    },
    {
      _id: '2',
      hash: '1a2b3c4d5e6f7g8h9i0j1k2l',
      message: 'Fix login page responsiveness',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      additions: 45,
      deletions: 12
    },
    {
      _id: '3',
      hash: '3e4d5c6b7a8f9e0d1c2b3a4',
      message: 'Add password reset functionality',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      additions: 87,
      deletions: 3
    },
    {
      _id: '4',
      hash: '5f6e7d8c9b0a1f2e3d4c5b6',
      message: 'Implement token-based authorization',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      additions: 156,
      deletions: 23
    },
    {
      _id: '5',
      hash: '7a8b9c0d1e2f3g4h5i6j7k8',
      message: 'Fix memory leak in dashboard',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      additions: 34,
      deletions: 67
    }
  ];
  
  res.status(200).json({
    success: true,
    data: commits
  });
});

router.get('/:id/pull-requests', protect, (req, res) => {
  // Mock data for pull requests
  const pullRequests = [
    {
      _id: '1',
      title: 'Implement user authentication',
      state: 'merged',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      mergedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
    },
    {
      _id: '2',
      title: 'Fix login page responsiveness',
      state: 'merged',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      mergedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      _id: '3',
      title: 'Add password reset functionality',
      state: 'open',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      mergedAt: null
    },
    {
      _id: '4',
      title: 'Implement token-based authorization',
      state: 'merged',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      mergedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];
  
  res.status(200).json({
    success: true,
    data: pullRequests
  });
});

router.get('/:id/code-quality', protect, (req, res) => {
  // Mock data for code quality metrics
  const codeQualityMetrics = {
    cleanCode: 85,
    bugs: 15,
    vulnerabilities: 5,
    codeSmells: 25,
    testCoverage: 78,
    bugsCount: 3,
    vulnerabilitiesCount: 1,
    codeSmellsCount: 12
  };
  
  res.status(200).json({
    success: true,
    data: codeQualityMetrics
  });
});

module.exports = router;
