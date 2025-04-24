const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  metrics: {
    taskCompletion: {
      completed: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      details: [{
        taskId: String,
        title: String,
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
          default: 'medium'
        },
        completedAt: Date,
        points: Number
      }]
    },
    codeQuality: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      bugs: {
        type: Number,
        default: 0
      },
      vulnerabilities: {
        type: Number,
        default: 0
      },
      codeSmells: {
        type: Number,
        default: 0
      },
      coverage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      details: [{
        commitId: String,
        prId: String,
        metrics: {
          bugs: Number,
          vulnerabilities: Number,
          codeSmells: Number,
          coverage: Number
        },
        points: Number
      }]
    },
    collaboration: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      codeReviews: {
        type: Number,
        default: 0
      },
      prComments: {
        type: Number,
        default: 0
      },
      details: [{
        prId: String,
        reviewType: {
          type: String,
          enum: ['comment', 'approval', 'change_request'],
          default: 'comment'
        },
        points: Number
      }]
    },
    cicdSuccess: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      successfulBuilds: {
        type: Number,
        default: 0
      },
      totalBuilds: {
        type: Number,
        default: 0
      },
      details: [{
        buildId: String,
        commitId: String,
        status: {
          type: String,
          enum: ['success', 'failure'],
          default: 'success'
        },
        points: Number
      }]
    },
    knowledgeSharing: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      documentsCreated: {
        type: Number,
        default: 0
      },
      documentsUpdated: {
        type: Number,
        default: 0
      },
      details: [{
        documentId: String,
        title: String,
        action: {
          type: String,
          enum: ['created', 'updated'],
          default: 'updated'
        },
        points: Number
      }]
    }
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tokenReward: {
    type: Number,
    default: 0
  },
  transactionHash: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate overall score before saving
EvaluationSchema.pre('save', function(next) {
  const metrics = this.metrics;
  
  // Define weights for each metric category
  const weights = {
    taskCompletion: 0.4,
    codeQuality: 0.25,
    collaboration: 0.15,
    cicdSuccess: 0.1,
    knowledgeSharing: 0.1
  };
  
  // Calculate weighted average
  this.overallScore = 
    (metrics.taskCompletion.score * weights.taskCompletion) +
    (metrics.codeQuality.score * weights.codeQuality) +
    (metrics.collaboration.score * weights.collaboration) +
    (metrics.cicdSuccess.score * weights.cicdSuccess) +
    (metrics.knowledgeSharing.score * weights.knowledgeSharing);
  
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);
