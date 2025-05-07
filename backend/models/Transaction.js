const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type !== 'mint';
    }
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !['burn', 'stake', 'unstake', 'redeem'].includes(this.type);
    }
  },
  amount: {
    type: Number,
    required: [true, 'Please add a transaction amount'],
    min: [0, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    enum: ['mint', 'transfer', 'burn', 'stake', 'unstake', 'reward', 'redeem'],
    required: [true, 'Please specify transaction type']
  },
  reason: {
    type: String,
    required: [true, 'Please add a reason for the transaction']
  },
  evaluation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    required: function() {
      return this.type === 'mint' && this.reason === 'evaluation_reward';
    }
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: function() {
      return this.type === 'mint' && this.reason === 'task_completion_reward';
    }
  },
  redemption: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Redemption',
    required: function() {
      return this.type === 'redeem' && this.reason === 'token_redemption';
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: {
    type: String,
    sparse: true
  },
  blockNumber: {
    type: Number,
    sparse: true
  },
  gasUsed: {
    type: Number,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    sparse: true
  }
});

// Index for faster queries
TransactionSchema.index({ from: 1, to: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
