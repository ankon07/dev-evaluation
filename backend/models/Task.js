const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  externalId: {
    type: String,
    required: [true, 'Please add an external task ID'],
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['feature', 'bug', 'improvement', 'documentation', 'test'],
    default: 'feature'
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done', 'verified'],
    default: 'todo'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: function() {
      // Default points based on difficulty
      const difficultyPoints = {
        easy: 1,
        medium: 3,
        hard: 5
      };
      return difficultyPoints[this.difficulty] || 3;
    }
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  project: {
    type: String,
    required: [true, 'Please add a project name']
  },
  sprint: {
    type: String,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    sparse: true
  },
  completedAt: {
    type: Date,
    sparse: true
  },
  verifiedAt: {
    type: Date,
    sparse: true
  },
  relatedPRs: [{
    prId: String,
    title: String,
    url: String,
    status: {
      type: String,
      enum: ['open', 'merged', 'closed'],
      default: 'open'
    }
  }],
  relatedCommits: [{
    commitId: String,
    message: String,
    url: String
  }],
  evaluationProcessed: {
    type: Boolean,
    default: false
  }
});

// Update timestamps on save
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set status-related timestamps
  if (this.isModified('status')) {
    if (this.status === 'in_progress' && !this.startedAt) {
      this.startedAt = Date.now();
    } else if (this.status === 'done' && !this.completedAt) {
      this.completedAt = Date.now();
    } else if (this.status === 'verified' && !this.verifiedAt) {
      this.verifiedAt = Date.now();
    }
  }
  
  next();
});

// Index for faster queries
TaskSchema.index({ externalId: 1 });
TaskSchema.index({ assignee: 1, status: 1 });
TaskSchema.index({ project: 1, sprint: 1 });
TaskSchema.index({ evaluationProcessed: 1 });

module.exports = mongoose.model('Task', TaskSchema);
