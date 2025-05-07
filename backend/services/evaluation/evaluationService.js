const Evaluation = require('../../models/Evaluation');
const User = require('../../models/User');
const Task = require('../../models/Task');
const Transaction = require('../../models/Transaction');
const githubService = require('../github/githubService');
const jiloService = require('../jilo/jiloService');
const cicdService = require('../cicd/cicdService');
const codeQualityService = require('../codeQuality/codeQualityService');
const tokenService = require('../blockchain/tokenService');
const notificationService = require('../notification/notificationService');

class EvaluationService {
  /**
   * Create a new evaluation period for a developer
   * @param {string} developerId - Developer user ID
   * @param {Date} startDate - Start date of evaluation period
   * @param {Date} endDate - End date of evaluation period
   * @returns {Promise<Object>} - Created evaluation
   */
  async createEvaluation(developerId, startDate, endDate) {
    try {
      const developer = await User.findById(developerId);
      if (!developer) {
        throw new Error('Developer not found');
      }

      const evaluation = await Evaluation.create({
        developer: developerId,
        period: {
          startDate,
          endDate
        },
        status: 'pending'
      });

      // Notify developer about new evaluation
      await notificationService.notifyDeveloperAboutNewEvaluation(evaluation._id);

      // Notify admins about new evaluation
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await notificationService.sendInAppNotification(
          admin._id,
          'New Evaluation Created',
          `A new evaluation has been created for ${developer.name} (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
          'info',
          { evaluationId: evaluation._id }
        );
      }

      return evaluation;
    } catch (error) {
      console.error(`Error creating evaluation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process evaluation for a developer
   * @param {string} evaluationId - Evaluation ID
   * @returns {Promise<Object>} - Processed evaluation
   */
  async processEvaluation(evaluationId) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('developer');
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      // Update status to processing
      evaluation.status = 'processing';
      await evaluation.save();

      const developer = evaluation.developer;
      const { startDate, endDate } = evaluation.period;

      // Collect data from different sources
      const taskMetrics = await this.processTaskMetrics(developer._id, startDate, endDate);
      const codeQualityMetrics = await this.processCodeQualityMetrics(developer, startDate, endDate);
      const collaborationMetrics = await this.processCollaborationMetrics(developer, startDate, endDate);
      const cicdMetrics = await this.processCICDMetrics(developer, startDate, endDate);
      const knowledgeSharingMetrics = await this.processKnowledgeSharingMetrics(developer, startDate, endDate);

      // Update evaluation with metrics
      evaluation.metrics = {
        taskCompletion: taskMetrics,
        codeQuality: codeQualityMetrics,
        collaboration: collaborationMetrics,
        cicdSuccess: cicdMetrics,
        knowledgeSharing: knowledgeSharingMetrics
      };

      // Calculate token reward
      const tokenReward = this.calculateTokenReward(evaluation);
      evaluation.tokenReward = tokenReward;

      // Save evaluation
      await evaluation.save();

      // Create token transaction
      if (tokenReward > 0 && developer.walletAddress) {
        const transaction = await Transaction.create({
          to: developer._id,
          amount: tokenReward,
          type: 'mint',
          reason: 'evaluation_reward',
          evaluation: evaluation._id,
          status: 'pending'
        });

        // Process transaction on blockchain
        const result = await tokenService.processTransaction(transaction._id);
        
        if (result.success) {
          evaluation.transactionHash = result.transactionHash;
          evaluation.status = 'completed';
          
          // Notify developer about completed evaluation
          await notificationService.notifyDeveloperAboutCompletedEvaluation(evaluation._id);
          
          // Notify admins about completed evaluation
          await notificationService.notifyAdminAboutStatusChange(evaluation._id, 'completed');
        } else {
          evaluation.status = 'failed';
          evaluation.error = result.error;
          
          // Notify admins about failed evaluation
          await notificationService.notifyAdminAboutStatusChange(evaluation._id, 'failed');
          
          // Notify developer about failed evaluation
          await notificationService.sendInAppNotification(
            developer._id,
            'Evaluation Processing Failed',
            `Your evaluation for the period ${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()} has failed to process. An administrator will review the issue.`,
            'error',
            { evaluationId: evaluation._id }
          );
        }
        
        await evaluation.save();
      } else {
        evaluation.status = 'completed';
        await evaluation.save();
        
        // Notify developer about completed evaluation
        await notificationService.notifyDeveloperAboutCompletedEvaluation(evaluation._id);
        
        // Notify admins about completed evaluation
        await notificationService.notifyAdminAboutStatusChange(evaluation._id, 'completed');
      }

      return evaluation;
    } catch (error) {
      console.error(`Error processing evaluation: ${error.message}`);
      
      // Update evaluation status to failed
      const evaluation = await Evaluation.findById(evaluationId).populate('developer');
      if (evaluation) {
        evaluation.status = 'failed';
        evaluation.error = error.message;
        await evaluation.save();
        
        // Notify admins about failed evaluation
        await notificationService.notifyAdminAboutStatusChange(evaluation._id, 'failed');
        
        // Notify developer about failed evaluation
        await notificationService.sendInAppNotification(
          evaluation.developer._id,
          'Evaluation Processing Failed',
          `Your evaluation for the period ${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()} has failed to process. An administrator will review the issue.`,
          'error',
          { evaluationId: evaluation._id, error: error.message }
        );
      }
      
      throw error;
    }
  }

  /**
   * Process task metrics for a developer
   * @param {string} developerId - Developer user ID
   * @param {Date} startDate - Start date of evaluation period
   * @param {Date} endDate - End date of evaluation period
   * @returns {Promise<Object>} - Task metrics
   */
  async processTaskMetrics(developerId, startDate, endDate) {
    try {
      // Get completed tasks for the developer in the period
      const completedTasks = await Task.find({
        assignee: developerId,
        status: { $in: ['done', 'verified'] },
        completedAt: { $gte: startDate, $lte: endDate },
        evaluationProcessed: false
      });

      // Get total tasks assigned to the developer in the period
      const totalTasks = await Task.find({
        assignee: developerId,
        createdAt: { $lte: endDate },
        $or: [
          { completedAt: { $gte: startDate, $lte: endDate } },
          { completedAt: null }
        ]
      });

      // Calculate score based on completion rate and difficulty
      const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
      const maxPossiblePoints = totalTasks.reduce((sum, task) => sum + task.points, 0);
      
      // Calculate score (0-100)
      const score = maxPossiblePoints > 0 
        ? Math.min(100, Math.round((totalPoints / maxPossiblePoints) * 100))
        : 0;

      // Prepare task details
      const details = completedTasks.map(task => ({
        taskId: task.externalId,
        title: task.title,
        difficulty: task.difficulty,
        completedAt: task.completedAt,
        points: task.points
      }));

      // Mark tasks as processed
      await Task.updateMany(
        { _id: { $in: completedTasks.map(task => task._id) } },
        { evaluationProcessed: true }
      );

      return {
        completed: completedTasks.length,
        total: totalTasks.length,
        score,
        details
      };
    } catch (error) {
      console.error(`Error processing task metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process code quality metrics for a developer
   * @param {Object} developer - Developer user object
   * @param {Date} startDate - Start date of evaluation period
   * @param {Date} endDate - End date of evaluation period
   * @returns {Promise<Object>} - Code quality metrics
   */
  async processCodeQualityMetrics(developer, startDate, endDate) {
    try {
      if (!developer.githubId) {
        return {
          score: 0,
          bugs: 0,
          vulnerabilities: 0,
          codeSmells: 0,
          coverage: 0,
          details: []
        };
      }

      // Get repositories to analyze
      const repositories = await this.getRepositoriesToAnalyze();
      
      // Get code quality data from SonarQube or similar tool
      const codeQualityData = await codeQualityService.getDeveloperCodeQuality(
        developer.githubId,
        repositories,
        startDate,
        endDate
      );

      // Calculate score based on code quality metrics
      const { bugs, vulnerabilities, codeSmells, coverage, details } = codeQualityData;
      
      // Calculate score (0-100)
      // Lower bugs, vulnerabilities, code smells = better score
      // Higher coverage = better score
      const maxBugs = 10; // Threshold for minimum score
      const maxVulnerabilities = 5; // Threshold for minimum score
      const maxCodeSmells = 20; // Threshold for minimum score
      
      const bugsScore = Math.max(0, 100 - (bugs / maxBugs) * 100);
      const vulnerabilitiesScore = Math.max(0, 100 - (vulnerabilities / maxVulnerabilities) * 100);
      const codeSmellsScore = Math.max(0, 100 - (codeSmells / maxCodeSmells) * 100);
      const coverageScore = coverage; // Coverage is already 0-100
      
      // Weighted average
      const score = Math.round(
        (bugsScore * 0.3) +
        (vulnerabilitiesScore * 0.3) +
        (codeSmellsScore * 0.2) +
        (coverageScore * 0.2)
      );

      return {
        score,
        bugs,
        vulnerabilities,
        codeSmells,
        coverage,
        details
      };
    } catch (error) {
      console.error(`Error processing code quality metrics: ${error.message}`);
      
      // Return default values in case of error
      return {
        score: 0,
        bugs: 0,
        vulnerabilities: 0,
        codeSmells: 0,
        coverage: 0,
        details: []
      };
    }
  }

  /**
   * Process collaboration metrics for a developer
   * @param {Object} developer - Developer user object
   * @param {Date} startDate - Start date of evaluation period
   * @param {Date} endDate - End date of evaluation period
   * @returns {Promise<Object>} - Collaboration metrics
   */
  async processCollaborationMetrics(developer, startDate, endDate) {
    try {
      if (!developer.githubId) {
        return {
          score: 0,
          codeReviews: 0,
          prComments: 0,
          details: []
        };
      }

      // Get repositories to analyze
      const repositories = await this.getRepositoriesToAnalyze();
      
      // Get GitHub activity
      const githubActivity = await githubService.getDeveloperActivity(
        developer.githubId,
        repositories,
        startDate,
        endDate
      );

      // Extract collaboration metrics
      const codeReviews = githubActivity.pullRequests.reviewed.length;
      const prComments = githubActivity.comments.length;
      
      // Prepare details
      const details = githubActivity.pullRequests.reviewed.map(pr => ({
        prId: pr.number.toString(),
        reviewType: this.mapReviewType(pr.reviews[0].state),
        points: this.calculateReviewPoints(pr.reviews[0].state)
      }));

      // Calculate score (0-100)
      // Based on number of reviews and comments
      const targetReviews = 10; // Target number of reviews for max score
      const targetComments = 20; // Target number of comments for max score
      
      const reviewsScore = Math.min(100, (codeReviews / targetReviews) * 100);
      const commentsScore = Math.min(100, (prComments / targetComments) * 100);
      
      // Weighted average
      const score = Math.round((reviewsScore * 0.7) + (commentsScore * 0.3));

      return {
        score,
        codeReviews,
        prComments,
        details
      };
    } catch (error) {
      console.error(`Error processing collaboration metrics: ${error.message}`);
      
      // Return default values in case of error
      return {
        score: 0,
        codeReviews: 0,
        prComments: 0,
        details: []
      };
    }
  }

  /**
   * Process CI/CD metrics for a developer
   * @param {Object} developer - Developer user object
   * @param {Date} startDate - Start date of evaluation period
   * @param {Date} endDate - End date of evaluation period
   * @returns {Promise<Object>} - CI/CD metrics
   */
  async processCICDMetrics(developer, startDate, endDate) {
    try {
      if (!developer.githubId) {
        return {
          score: 0,
          successfulBuilds: 0,
          totalBuilds: 0,
          details: []
        };
      }

      // Get CI/CD data
      const cicdData = await cicdService.getDeveloperBuilds(
        developer.githubId,
        startDate,
        endDate
      );

      // Extract CI/CD metrics
      const { successfulBuilds, totalBuilds, details } = cicdData;
      
      // Calculate score (0-100)
      const score = totalBuilds > 0
        ? Math.round((successfulBuilds / totalBuilds) * 100)
        : 0;

      return {
        score,
        successfulBuilds,
        totalBuilds,
        details
      };
    } catch (error) {
      console.error(`Error processing CI/CD metrics: ${error.message}`);
      
      // Return default values in case of error
      return {
        score: 0,
        successfulBuilds: 0,
        totalBuilds: 0,
        details: []
      };
    }
  }

  /**
   * Process knowledge sharing metrics for a developer
   * @param {Object} developer - Developer user object
   * @param {Date} startDate - Start date of evaluation period
   * @param {Date} endDate - End date of evaluation period
   * @returns {Promise<Object>} - Knowledge sharing metrics
   */
  async processKnowledgeSharingMetrics(developer, startDate, endDate) {
    try {
      // This is optional and depends on integration with knowledge sharing platforms
      // For now, return default values
      return {
        score: 0,
        documentsCreated: 0,
        documentsUpdated: 0,
        details: []
      };
    } catch (error) {
      console.error(`Error processing knowledge sharing metrics: ${error.message}`);
      
      // Return default values in case of error
      return {
        score: 0,
        documentsCreated: 0,
        documentsUpdated: 0,
        details: []
      };
    }
  }

  /**
   * Process a completed task and reward the developer
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} - Result of task processing
   */
  async processCompletedTask(taskId) {
    try {
      // Get the task
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Check if task is completed and not already processed
      if (!['done', 'verified'].includes(task.status) || task.evaluationProcessed) {
        return {
          success: false,
          message: 'Task is not completed or already processed'
        };
      }

      // Get the developer
      const developer = await User.findById(task.assignee);
      if (!developer) {
        throw new Error('Developer not found');
      }

      // Calculate token reward based on task difficulty
      const tokenReward = this.calculateTaskTokenReward(task);

      // Create token transaction
      if (tokenReward > 0 && developer.walletAddress) {
        const transaction = await Transaction.create({
          to: developer._id,
          amount: tokenReward,
          type: 'mint',
          reason: 'task_completion_reward',
          taskId: task._id,
          status: 'pending'
        });

        // Process transaction on blockchain
        const result = await tokenService.processTransaction(transaction._id);
        
        // Mark task as processed
        task.evaluationProcessed = true;
        await task.save();

        // Notify developer about task reward
        await notificationService.sendInAppNotification(
          developer._id,
          'Task Completion Reward',
          `You have received ${tokenReward} DEV tokens for completing the task: ${task.title}`,
          'success',
          { taskId: task._id, tokenReward }
        );

        return {
          success: result.success,
          taskId: task._id,
          tokenReward,
          transactionHash: result.transactionHash,
          message: `Developer ${developer.name} rewarded with ${tokenReward} tokens for completing task ${task.title}`
        };
      } else {
        return {
          success: false,
          message: 'No reward issued - either reward amount is 0 or developer has no wallet address'
        };
      }
    } catch (error) {
      console.error(`Error processing completed task: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate token reward for a completed task
   * @param {Object} task - Task object
   * @returns {number} - Token reward amount
   */
  calculateTaskTokenReward(task) {
    // Base reward based on task difficulty
    const difficultyRewards = {
      easy: 0.5,
      medium: 1.0,
      hard: 2.0
    };
    
    let reward = difficultyRewards[task.difficulty] || 1.0;
    
    // Additional reward for verified tasks (higher quality)
    if (task.status === 'verified') {
      reward *= 1.25; // 25% bonus for verified tasks
    }
    
    // Additional reward based on task type
    if (task.type === 'bug') {
      reward *= 1.1; // 10% bonus for bug fixes
    } else if (task.type === 'feature') {
      reward *= 1.2; // 20% bonus for new features
    }
    
    // Round to 2 decimal places
    return Math.round(reward * 100) / 100;
  }

  /**
   * Calculate token reward based on evaluation metrics
   * @param {Object} evaluation - Evaluation object with metrics
   * @returns {number} - Token reward amount
   */
  calculateTokenReward(evaluation) {
    const { metrics, overallScore } = evaluation;
    
    // Base reward for overall score
    const baseReward = overallScore / 10; // 0-10 tokens based on overall score (0-100)
    
    // Additional rewards for specific achievements
    let additionalReward = 0;
    
    // Reward for task completion
    const taskCompletionRate = metrics.taskCompletion.completed / Math.max(1, metrics.taskCompletion.total);
    if (taskCompletionRate >= 0.9) {
      additionalReward += 2; // Bonus for completing 90%+ of tasks
    }
    
    // Reward for high code quality
    if (metrics.codeQuality.score >= 90) {
      additionalReward += 2; // Bonus for excellent code quality
    }
    
    // Reward for active collaboration
    if (metrics.collaboration.codeReviews >= 5) {
      additionalReward += 1; // Bonus for active code reviews
    }
    
    // Reward for CI/CD success
    if (metrics.cicdSuccess.score >= 95) {
      additionalReward += 1; // Bonus for high CI/CD success rate
    }
    
    // Calculate total reward
    const totalReward = baseReward + additionalReward;
    
    // Round to 2 decimal places
    return Math.round(totalReward * 100) / 100;
  }

  /**
   * Get repositories to analyze
   * @returns {Promise<Array>} - List of repositories
   */
  async getRepositoriesToAnalyze() {
    // This would typically come from configuration or database
    // For now, return a hardcoded list
    return [
      'organization/repo1',
      'organization/repo2'
    ];
  }

  /**
   * Map GitHub review state to internal review type
   * @param {string} state - GitHub review state
   * @returns {string} - Internal review type
   */
  mapReviewType(state) {
    switch (state) {
      case 'APPROVED':
        return 'approval';
      case 'CHANGES_REQUESTED':
        return 'change_request';
      default:
        return 'comment';
    }
  }

  /**
   * Calculate points for a review based on type
   * @param {string} state - GitHub review state
   * @returns {number} - Points for the review
   */
  calculateReviewPoints(state) {
    switch (state) {
      case 'APPROVED':
        return 3;
      case 'CHANGES_REQUESTED':
        return 2;
      default:
        return 1;
    }
  }

  /**
   * Get evaluation by ID
   * @param {string} evaluationId - Evaluation ID
   * @returns {Promise<Object>} - Evaluation object
   */
  async getEvaluation(evaluationId) {
    return await Evaluation.findById(evaluationId).populate('developer');
  }

  /**
   * Get evaluations for a developer
   * @param {string} developerId - Developer user ID
   * @returns {Promise<Array>} - List of evaluations
   */
  async getDeveloperEvaluations(developerId) {
    return await Evaluation.find({ developer: developerId }).sort({ 'period.endDate': -1 });
  }

  /**
   * Get all evaluations with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Paginated evaluations
   */
  async getAllEvaluations(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const evaluations = await Evaluation.find()
      .populate('developer', 'name email')
      .sort({ 'period.endDate': -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Evaluation.countDocuments();
    
    return {
      evaluations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new EvaluationService();
