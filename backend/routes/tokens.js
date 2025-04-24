const express = require('express');
const router = express.Router();
const {
  mintTokens,
  getTokenBalance,
  transferTokens,
  stakeTokens,
  unstakeTokens,
  getTransactionHistory,
  getTransactionStatus,
  redeemTokens,
  getStakingInfo,
  getTransactionStats,
  recordTransfer,
  recordMint
} = require('../controllers/tokens');
const { protect, authorize } = require('../middleware/auth');

// Routes
router.post('/mint', protect, authorize('admin'), mintTokens);
router.get('/balance', protect, getTokenBalance);
router.post('/transfer', protect, transferTokens);
router.post('/stake', protect, stakeTokens);
router.post('/unstake', protect, unstakeTokens);
router.get('/transactions', protect, getTransactionHistory);
router.get('/transactions/:id', protect, getTransactionStatus);
router.post('/redeem', protect, redeemTokens);
router.get('/staking', protect, getStakingInfo);
router.get('/stats', protect, getTransactionStats);
router.post('/record-transfer', protect, recordTransfer);
router.post('/record-mint', protect, authorize('admin'), recordMint);

module.exports = router;
