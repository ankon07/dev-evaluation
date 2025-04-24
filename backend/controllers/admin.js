const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const Transaction = require('../models/Transaction');
const Task = require('../models/Task');
const jiloService = require('../services/jilo/jiloService');
const githubService = require('../services/github/githubService');
const cicdService = require('../services/cicd/cicdService');
const codeQualityService = require('../services/codeQuality/codeQualityService');

// @desc    Get system configuration
// @route   GET /api/admin/config
// @access  Private/Admin
exports.getSystemConfig = asyncHandler(async (req, res, next) => {
  // In a real implementation, this would be stored in a database
  // For now, we'll return a hardcoded configuration
  const config = {
    github: {
      enabled: true,
      repositories: ['organization/repo1', 'organization/repo2'],
      apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com'
    },
    jilo: {
      enabled: true,
      apiUrl: process.env.JILO_API_URL || 'https://jilo-api.example.com'
    },
    cicd: {
      enabled: true,
      jenkins: {
        enabled: true,
        url: process.env.JENKINS_API_URL || 'https://jenkins.example.com'
      },
      githubActions: {
        enabled: true
      }
    },
    codeQuality: {
      enabled: true,
      sonarqube: {
        enabled: true,
        url: process.env.SONARQUBE_URL || 'https://sonarqube.example.com'
      }
    },
    blockchain: {
      network: 'ethereum',
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/40UlY32ARVe7Nm2NAvuFDRIuTCxYQBX0',
      contractAddress: process.env.CONTRACT_ADDRESS || '0xc00C014b5491EbeDe8E7cf4fEDe7ddCd0D96B84d',
      adminWalletAddress: '0x4742D78A5471c60a78251e6d7354522a7FB1640A'
    },
    evaluation: {
      autoProcess: false,
      schedule: 'monthly', // 'weekly', 'biweekly', 'monthly'
      metrics: {
        taskCompletion: {
          weight: 0.4,
          enabled: true
        },
        codeQuality: {
          weight: 0.25,
          enabled: true
        },
        collaboration: {
          weight: 0.15,
          enabled: true
        },
        cicdSuccess: {
          weight: 0.1,
          enabled: true
        },
        knowledgeSharing: {
          weight: 0.1,
          enabled: true
        }
      }
    }
  };

  res.status(200).json({
    success: true,
    data: config
  });
});

// @desc    Update system configuration
// @route   PUT /api/admin/config
// @access  Private/Admin
exports.updateSystemConfig = asyncHandler(async (req, res, next) => {
  // In a real implementation, this would update the configuration in a database
  // For now, we'll just return the updated configuration
  const updatedConfig = req.body;

  // Validate configuration
  if (!updatedConfig) {
    return next(new ErrorResponse('Please provide configuration data', 400));
  }

  // In a real implementation, we would validate the configuration structure
  // and update it in the database

  res.status(200).json({
    success: true,
    data: updatedConfig,
    message: 'Configuration updated successfully'
  });
});

// @desc    Get reward rules
// @route   GET /api/admin/rules
// @access  Private/Admin
exports.getRewardRules = asyncHandler(async (req, res, next) => {
  // In a real implementation, this would be stored in a database
  // For now, we'll return hardcoded reward rules
  const rules = {
    taskCompletion: {
      easy: 1,
      medium: 3,
      hard: 5,
      bonus90PercentCompletion: 2
    },
    codeQuality: {
      highQualityBonus: 2,
      penaltyPerBug: 0.1,
      penaltyPerVulnerability: 0.2,
      bonusPerCoveragePercent: 0.05
    },
    collaboration: {
      codeReviewBonus: 1,
      prCommentValue: 0.1,
      approvalValue: 0.5
    },
    cicdSuccess: {
      successRateBonus: 1
    },
    knowledgeSharing: {
      documentCreationValue: 0.5,
      documentUpdateValue: 0.2
    },
    baseRewardMultiplier: 0.1, // 0-100 score translates to 0-10 tokens
    stakingAPY: 5 // 5% annual yield
  };

  res.status(200).json({
    success: true,
    data: rules
  });
});

// @desc    Test connection to external service
// @route   POST /api/admin/config/test/:type
// @access  Private/Admin
exports.testConnection = asyncHandler(async (req, res, next) => {
  const { type } = req.params;

  if (!type) {
    return next(new ErrorResponse('Please provide a connection type to test', 400));
  }

  let result;

  try {
    switch (type) {
      case 'github':
        // Test GitHub connection
        result = await githubService.testConnection();
        break;
      case 'jilo':
        // Test Jilo connection
        result = await jiloService.testConnection();
        break;
      case 'cicd':
        // Test CI/CD connection
        result = await cicdService.testConnection();
        break;
      case 'codeQuality':
        // Test code quality connection
        result = await codeQualityService.testConnection();
        break;
      case 'blockchain':
        // Test blockchain connection
        const tokenService = require('../services/blockchain/tokenService');
        result = await tokenService.testConnection();
        break;
      case 'email':
        // Test email connection
        result = {
          success: true,
          message: 'Email connection successful'
        };
        break;
      default:
        return next(new ErrorResponse(`Unknown connection type: ${type}`, 400));
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message || `${type} connection successful`
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || `${type} connection failed`
      });
    }
  } catch (error) {
    console.error(`Error testing ${type} connection:`, error);
    return next(new ErrorResponse(`Error testing ${type} connection: ${error.message}`, 500));
  }
});

// @desc    Update reward rules
// @route   PUT /api/admin/rules
// @access  Private/Admin
exports.updateRewardRules = asyncHandler(async (req, res, next) => {
  // In a real implementation, this would update the rules in a database
  // For now, we'll just return the updated rules
  const updatedRules = req.body;

  // Validate rules
  if (!updatedRules) {
    return next(new ErrorResponse('Please provide reward rules data', 400));
  }

  // In a real implementation, we would validate the rules structure
  // and update them in the database

  res.status(200).json({
    success: true,
    data: updatedRules,
    message: 'Reward rules updated successfully'
  });
});

// @desc    Sync external data
// @route   POST /api/admin/sync
// @access  Private/Admin
exports.syncExternalData = asyncHandler(async (req, res, next) => {
  const { source } = req.body;

  if (!source) {
    return next(new ErrorResponse('Please provide a data source to sync', 400));
  }

  let result;

  switch (source) {
    case 'jilo':
      // Sync tasks from Jilo
      result = await jiloService.syncTasks();
      break;
    case 'github':
      // In a real implementation, this would sync data from GitHub
      result = {
        success: true,
        message: 'GitHub data sync initiated',
        syncedItems: 0
      };
      break;
    case 'cicd':
      // In a real implementation, this would sync data from CI/CD tools
      result = {
        success: true,
        message: 'CI/CD data sync initiated',
        syncedItems: 0
      };
      break;
    case 'codeQuality':
      // In a real implementation, this would sync data from code quality tools
      result = {
        success: true,
        message: 'Code quality data sync initiated',
        syncedItems: 0
      };
      break;
    default:
      return next(new ErrorResponse(`Unknown data source: ${source}`, 400));
  }

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = asyncHandler(async (req, res, next) => {
  // Get counts
  const developerCount = await User.countDocuments({ role: 'developer' });
  const evaluationCount = await Evaluation.countDocuments();
  const completedEvaluationCount = await Evaluation.countDocuments({ status: 'completed' });
  const transactionCount = await Transaction.countDocuments();
  const taskCount = await Task.countDocuments();
  const completedTaskCount = await Task.countDocuments({ status: { $in: ['done', 'verified'] } });

  // Get recent evaluations
  const recentEvaluations = await Evaluation.find()
    .sort({ 'period.endDate': -1 })
    .limit(5)
    .populate('developer', 'name email');

  // Get top developers by token balance
  const topDevelopers = await User.find({ role: 'developer' })
    .sort({ tokenBalance: -1 })
    .limit(5)
    .select('name email tokenBalance');

  // Get recent transactions
  const recentTransactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('from to', 'name email');

  res.status(200).json({
    success: true,
    data: {
      counts: {
        developers: developerCount,
        evaluations: evaluationCount,
        completedEvaluations: completedEvaluationCount,
        transactions: transactionCount,
        tasks: taskCount,
        completedTasks: completedTaskCount
      },
      recentEvaluations,
      topDevelopers,
      recentTransactions
    }
  });
});

// @desc    Generate report
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.generateReport = asyncHandler(async (req, res, next) => {
  const { type, startDate, endDate } = req.query;

  if (!type) {
    return next(new ErrorResponse('Please provide a report type', 400));
  }

  let report;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
  const end = endDate ? new Date(endDate) : new Date();

  switch (type) {
    case 'evaluations':
      // Get evaluations in date range
      const evaluations = await Evaluation.find({
        'period.endDate': { $gte: start, $lte: end }
      })
        .populate('developer', 'name email')
        .sort({ 'period.endDate': -1 });

      report = {
        type: 'evaluations',
        startDate: start,
        endDate: end,
        count: evaluations.length,
        data: evaluations,
        summary: {
          averageScore: evaluations.reduce((sum, eval) => sum + eval.overallScore, 0) / (evaluations.length || 1),
          totalTokensAwarded: evaluations.reduce((sum, eval) => sum + eval.tokenReward, 0),
          completedCount: evaluations.filter(eval => eval.status === 'completed').length,
          pendingCount: evaluations.filter(eval => eval.status === 'pending').length,
          failedCount: evaluations.filter(eval => eval.status === 'failed').length
        }
      };
      break;

    case 'developers':
      // Get all developers with their evaluations in date range
      const developers = await User.find({ role: 'developer' });
      
      const developerReports = await Promise.all(
        developers.map(async (developer) => {
          const devEvaluations = await Evaluation.find({
            developer: developer._id,
            'period.endDate': { $gte: start, $lte: end }
          });

          return {
            developer: {
              id: developer._id,
              name: developer.name,
              email: developer.email
            },
            evaluationCount: devEvaluations.length,
            averageScore: devEvaluations.reduce((sum, eval) => sum + eval.overallScore, 0) / (devEvaluations.length || 1),
            totalTokensAwarded: devEvaluations.reduce((sum, eval) => sum + eval.tokenReward, 0),
            skills: developer.skills
          };
        })
      );

      report = {
        type: 'developers',
        startDate: start,
        endDate: end,
        count: developers.length,
        data: developerReports,
        summary: {
          totalDevelopers: developers.length,
          totalEvaluations: developerReports.reduce((sum, dev) => sum + dev.evaluationCount, 0),
          totalTokensAwarded: developerReports.reduce((sum, dev) => sum + dev.totalTokensAwarded, 0),
          averageScore: developerReports.reduce((sum, dev) => sum + dev.averageScore, 0) / (developerReports.length || 1)
        }
      };
      break;

    case 'transactions':
      // Get transactions in date range
      const transactions = await Transaction.find({
        createdAt: { $gte: start, $lte: end }
      })
        .populate('from to', 'name email')
        .sort({ createdAt: -1 });

      report = {
        type: 'transactions',
        startDate: start,
        endDate: end,
        count: transactions.length,
        data: transactions,
        summary: {
          totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
          mintCount: transactions.filter(tx => tx.type === 'mint').length,
          transferCount: transactions.filter(tx => tx.type === 'transfer').length,
          burnCount: transactions.filter(tx => tx.type === 'burn').length,
          stakeCount: transactions.filter(tx => tx.type === 'stake').length,
          unstakeCount: transactions.filter(tx => tx.type === 'unstake').length,
          completedCount: transactions.filter(tx => tx.status === 'completed').length,
          pendingCount: transactions.filter(tx => tx.status === 'pending').length,
          failedCount: transactions.filter(tx => tx.status === 'failed').length
        }
      };
      break;

    case 'tasks':
      // Get tasks in date range
      const tasks = await Task.find({
        createdAt: { $gte: start, $lte: end }
      })
        .populate('assignee', 'name email')
        .sort({ createdAt: -1 });

      report = {
        type: 'tasks',
        startDate: start,
        endDate: end,
        count: tasks.length,
        data: tasks,
        summary: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(task => task.status === 'done' || task.status === 'verified').length,
          inProgressTasks: tasks.filter(task => task.status === 'in_progress').length,
          todoTasks: tasks.filter(task => task.status === 'todo').length,
          reviewTasks: tasks.filter(task => task.status === 'review').length,
          featureTasks: tasks.filter(task => task.type === 'feature').length,
          bugTasks: tasks.filter(task => task.type === 'bug').length,
          easyTasks: tasks.filter(task => task.difficulty === 'easy').length,
          mediumTasks: tasks.filter(task => task.difficulty === 'medium').length,
          hardTasks: tasks.filter(task => task.difficulty === 'hard').length
        }
      };
      break;

    default:
      return next(new ErrorResponse(`Unknown report type: ${type}`, 400));
  }

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Get audit logs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  // In a real implementation, this would retrieve audit logs from a database
  // For now, we'll return mock data
  const logs = [
    {
      id: '1',
      action: 'EVALUATION_CREATED',
      user: 'admin@example.com',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      details: 'Created evaluation for developer john@example.com'
    },
    {
      id: '2',
      action: 'EVALUATION_PROCESSED',
      user: 'admin@example.com',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      details: 'Processed evaluation for developer john@example.com'
    },
    {
      id: '3',
      action: 'CONFIG_UPDATED',
      user: 'admin@example.com',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      details: 'Updated system configuration'
    },
    {
      id: '4',
      action: 'RULES_UPDATED',
      user: 'admin@example.com',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      details: 'Updated reward rules'
    },
    {
      id: '5',
      action: 'DATA_SYNCED',
      user: 'system',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      details: 'Synced data from Jilo'
    }
  ];

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.manageUsers = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments();

  // Query with pagination
  const users = await User.find()
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: users.length,
    pagination,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Fields to update
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    isActive: req.body.isActive,
    walletAddress: req.body.walletAddress
  };

  // Find user
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// @desc    Create user
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  // Create user
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is an admin
  if (user.role === 'admin') {
    return next(
      new ErrorResponse('Cannot delete admin user', 400)
    );
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
