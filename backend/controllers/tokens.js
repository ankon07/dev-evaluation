const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const tokenService = require('../services/blockchain/tokenService');

// @desc    Mint tokens (admin only)
// @route   POST /api/tokens/mint
// @access  Private/Admin
exports.mintTokens = asyncHandler(async (req, res, next) => {
  const { userId, amount, reason } = req.body;

  // Validate input
  if (!userId || !amount || !reason) {
    return next(
      new ErrorResponse('Please provide userId, amount, and reason', 400)
    );
  }

  // Check if amount is positive
  if (amount <= 0) {
    return next(
      new ErrorResponse('Amount must be greater than 0', 400)
    );
  }

  // Get recipient user
  const recipient = await User.findById(userId);
  if (!recipient) {
    return next(
      new ErrorResponse(`User not found with id of ${userId}`, 404)
    );
  }

  if (!recipient.walletAddress) {
    return next(
      new ErrorResponse('User has not connected a wallet yet', 400)
    );
  }

  // Create transaction record
  const transaction = await Transaction.create({
    to: userId,
    amount,
    type: 'mint',
    reason,
    status: 'pending'
  });

  // Process transaction on blockchain
  const result = await tokenService.processTransaction(transaction._id);

  if (!result.success) {
    return next(
      new ErrorResponse(`Minting failed: ${result.error}`, 500)
    );
  }

  // Update recipient's token balance
  recipient.tokenBalance = await tokenService.getBalance(recipient.walletAddress);
  await recipient.save();

  res.status(200).json({
    success: true,
    data: {
      transaction,
      transactionHash: result.transactionHash,
      recipientBalance: recipient.tokenBalance
    }
  });
});

// @desc    Get token balance
// @route   GET /api/tokens/balance
// @access  Private
exports.getTokenBalance = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  try {
    // Get token balance from blockchain
    const balance = await tokenService.getBalance(user.walletAddress);
    
    // Update user's token balance in database
    user.tokenBalance = balance;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        balance
      }
    });
  } catch (error) {
    return next(
      new ErrorResponse(`Error getting token balance: ${error.message}`, 500)
    );
  }
});

// @desc    Transfer tokens
// @route   POST /api/tokens/transfer
// @access  Private
exports.transferTokens = asyncHandler(async (req, res, next) => {
  const { recipientId, amount, reason } = req.body;

  // Validate input
  if (!recipientId || !amount || !reason) {
    return next(
      new ErrorResponse('Please provide recipient, amount, and reason', 400)
    );
  }

  // Check if amount is positive
  if (amount <= 0) {
    return next(
      new ErrorResponse('Amount must be greater than 0', 400)
    );
  }

  // Get sender
  const sender = await User.findById(req.user.id);
  if (!sender.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  // Get recipient
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(
      new ErrorResponse(`Recipient not found with id of ${recipientId}`, 404)
    );
  }

  if (!recipient.walletAddress) {
    return next(
      new ErrorResponse('Recipient has not connected a wallet yet', 400)
    );
  }

  // Check if sender has enough tokens
  const balance = await tokenService.getBalance(sender.walletAddress);
  if (balance < amount) {
    return next(
      new ErrorResponse('Insufficient token balance', 400)
    );
  }

  // Create transaction record
  const transaction = await Transaction.create({
    from: req.user.id,
    to: recipientId,
    amount,
    type: 'transfer',
    reason,
    status: 'pending'
  });

  // Process transaction on blockchain
  const result = await tokenService.processTransaction(transaction._id);

  if (!result.success) {
    return next(
      new ErrorResponse(`Transaction failed: ${result.error}`, 500)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      transaction,
      transactionHash: result.transactionHash
    }
  });
});

// @desc    Stake tokens
// @route   POST /api/tokens/stake
// @access  Private
exports.stakeTokens = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  // Validate input
  if (!amount) {
    return next(
      new ErrorResponse('Please provide an amount to stake', 400)
    );
  }

  // Check if amount is positive
  if (amount <= 0) {
    return next(
      new ErrorResponse('Amount must be greater than 0', 400)
    );
  }

  // Get user
  const user = await User.findById(req.user.id);
  if (!user.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  // Check if user has enough tokens
  const balance = await tokenService.getBalance(user.walletAddress);
  if (balance < amount) {
    return next(
      new ErrorResponse('Insufficient token balance', 400)
    );
  }

  // Create transaction record
  const transaction = await Transaction.create({
    from: req.user.id,
    amount,
    type: 'stake',
    reason: 'Token staking',
    status: 'pending'
  });

  // Process transaction on blockchain
  const result = await tokenService.processTransaction(transaction._id);

  if (!result.success) {
    return next(
      new ErrorResponse(`Staking failed: ${result.error}`, 500)
    );
  }

  // Update user's staked tokens
  user.stakedTokens = await tokenService.getStakedAmount(user.walletAddress);
  user.tokenBalance = await tokenService.getBalance(user.walletAddress);
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      transaction,
      transactionHash: result.transactionHash,
      stakedTokens: user.stakedTokens,
      tokenBalance: user.tokenBalance
    }
  });
});

// @desc    Unstake tokens
// @route   POST /api/tokens/unstake
// @access  Private
exports.unstakeTokens = asyncHandler(async (req, res, next) => {
  // Get user
  const user = await User.findById(req.user.id);
  if (!user.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  // Check if user has staked tokens
  const stakedAmount = await tokenService.getStakedAmount(user.walletAddress);
  if (stakedAmount <= 0) {
    return next(
      new ErrorResponse('No tokens staked', 400)
    );
  }

  // Create transaction record
  const transaction = await Transaction.create({
    from: req.user.id,
    amount: stakedAmount, // Unstake all tokens
    type: 'unstake',
    reason: 'Token unstaking',
    status: 'pending'
  });

  // Process transaction on blockchain
  const result = await tokenService.processTransaction(transaction._id);

  if (!result.success) {
    return next(
      new ErrorResponse(`Unstaking failed: ${result.error}`, 500)
    );
  }

  // Update user's staked tokens and balance
  user.stakedTokens = 0;
  user.tokenBalance = await tokenService.getBalance(user.walletAddress);
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      transaction,
      transactionHash: result.transactionHash,
      stakedTokens: user.stakedTokens,
      tokenBalance: user.tokenBalance
    }
  });
});

// @desc    Get transaction history
// @route   GET /api/tokens/transactions
// @access  Private
exports.getTransactionHistory = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Get total count
  const total = await Transaction.countDocuments({
    $or: [
      { from: req.user.id },
      { to: req.user.id }
    ]
  });

  // Get transactions
  const transactions = await Transaction.find({
    $or: [
      { from: req.user.id },
      { to: req.user.id }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('from to', 'name email');

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
    count: transactions.length,
    pagination,
    data: transactions
  });
});

// @desc    Get transaction status
// @route   GET /api/tokens/transactions/:id
// @access  Private
exports.getTransactionStatus = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('from to', 'name email');

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is part of the transaction
  if (
    transaction.from?.toString() !== req.user.id &&
    transaction.to?.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this transaction`,
        403
      )
    );
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Redeem tokens
// @route   POST /api/tokens/redeem
// @access  Private
exports.redeemTokens = asyncHandler(async (req, res, next) => {
  const { amount, redeemOption } = req.body;

  // Validate input
  if (!amount || !redeemOption) {
    return next(
      new ErrorResponse('Please provide amount and redemption option', 400)
    );
  }

  // Check if amount is positive
  if (amount <= 0) {
    return next(
      new ErrorResponse('Amount must be greater than 0', 400)
    );
  }

  // Get user
  const user = await User.findById(req.user.id);
  if (!user.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  // Check if user has enough tokens
  const balance = await tokenService.getBalance(user.walletAddress);
  if (balance < amount) {
    return next(
      new ErrorResponse('Insufficient token balance', 400)
    );
  }

  // Create transaction record
  const transaction = await Transaction.create({
    from: req.user.id,
    amount,
    type: 'burn',
    reason: `Token redemption: ${redeemOption}`,
    status: 'pending'
  });

  // Process transaction on blockchain
  const result = await tokenService.processTransaction(transaction._id);

  if (!result.success) {
    return next(
      new ErrorResponse(`Redemption failed: ${result.error}`, 500)
    );
  }

  // Update user's token balance
  user.tokenBalance = await tokenService.getBalance(user.walletAddress);
  await user.save();

  // In a real implementation, this would trigger a notification to HR/Admin
  // to process the redemption request (e.g., monetary value, career progression)

  res.status(200).json({
    success: true,
    data: {
      transaction,
      transactionHash: result.transactionHash,
      tokenBalance: user.tokenBalance,
      message: `Redemption request for ${redeemOption} has been submitted and will be processed by HR/Admin.`
    }
  });
});

// @desc    Get staking info
// @route   GET /api/tokens/staking
// @access  Private
exports.getStakingInfo = asyncHandler(async (req, res, next) => {
  // Get user
  const user = await User.findById(req.user.id);
  if (!user.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  try {
    // Get staked amount from blockchain
    const stakedAmount = await tokenService.getStakedAmount(user.walletAddress);
    
    // Get token contract info (APY)
    const stakingAPY = 5; // In a real implementation, this would come from the smart contract
    
    // Update user's staked tokens in database
    user.stakedTokens = stakedAmount;
    await user.save();

    // Calculate potential rewards
    const potentialRewards = (stakedAmount * stakingAPY) / 100;

    res.status(200).json({
      success: true,
      data: {
        stakedAmount,
        stakingAPY,
        potentialAnnualRewards: potentialRewards
      }
    });
  } catch (error) {
    return next(
      new ErrorResponse(`Error getting staking info: ${error.message}`, 500)
    );
  }
});

// @desc    Get transaction statistics
// @route   GET /api/tokens/stats
// @access  Private
exports.getTransactionStats = asyncHandler(async (req, res, next) => {
  // Get user
  const user = await User.findById(req.user.id);
  if (!user.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  try {
    // Get all transactions for the user
    const transactions = await Transaction.find({
      $or: [
        { from: req.user.id },
        { to: req.user.id }
      ]
    });

    // Calculate total earned (sum of all incoming transactions)
    const totalEarned = transactions
      .filter(t => t.to && t.to.toString() === req.user.id && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate total spent (sum of all outgoing transactions)
    const totalSpent = transactions
      .filter(t => t.from && t.from.toString() === req.user.id && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get current balance from blockchain
    const currentBalance = await tokenService.getBalance(user.walletAddress);

    res.status(200).json({
      success: true,
      data: {
        totalEarned,
        totalSpent,
        currentBalance
      }
    });
  } catch (error) {
    return next(
      new ErrorResponse(`Error getting transaction stats: ${error.message}`, 500)
    );
  }
});

// @desc    Record a token transfer done directly through MetaMask
// @route   POST /api/tokens/record-transfer
// @access  Private
exports.recordTransfer = asyncHandler(async (req, res, next) => {
  const { recipientId, amount, reason, transactionHash } = req.body;

  // Validate input
  if (!recipientId || !amount || !reason || !transactionHash) {
    return next(
      new ErrorResponse('Please provide recipientId, amount, reason, and transactionHash', 400)
    );
  }

  // Check if amount is positive
  if (amount <= 0) {
    return next(
      new ErrorResponse('Amount must be greater than 0', 400)
    );
  }

  // Get sender
  const sender = await User.findById(req.user.id);
  if (!sender.walletAddress) {
    return next(
      new ErrorResponse('Wallet not connected. Please connect a wallet first.', 400)
    );
  }

  // Get recipient
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(
      new ErrorResponse(`Recipient not found with id of ${recipientId}`, 404)
    );
  }

  if (!recipient.walletAddress) {
    return next(
      new ErrorResponse('Recipient has not connected a wallet yet', 400)
    );
  }

  // Create transaction record
  const transaction = await Transaction.create({
    from: req.user.id,
    to: recipientId,
    amount,
    type: 'transfer',
    reason,
    status: 'completed',
    transactionHash,
    processedAt: Date.now()
  });

  // Update sender's token balance
  sender.tokenBalance = await tokenService.getBalance(sender.walletAddress);
  await sender.save();

  // Update recipient's token balance
  recipient.tokenBalance = await tokenService.getBalance(recipient.walletAddress);
  await recipient.save();

  res.status(200).json({
    success: true,
    data: {
      transaction,
      senderBalance: sender.tokenBalance
    }
  });
});

// @desc    Record a token mint done directly through MetaMask
// @route   POST /api/tokens/record-mint
// @access  Private/Admin
exports.recordMint = asyncHandler(async (req, res, next) => {
  const { userId, amount, reason, transactionHash } = req.body;

  // Validate input
  if (!userId || !amount || !reason || !transactionHash) {
    return next(
      new ErrorResponse('Please provide userId, amount, reason, and transactionHash', 400)
    );
  }

  // Check if amount is positive
  if (amount <= 0) {
    return next(
      new ErrorResponse('Amount must be greater than 0', 400)
    );
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Only admins can mint tokens', 403)
    );
  }

  // Get recipient
  const recipient = await User.findById(userId);
  if (!recipient) {
    return next(
      new ErrorResponse(`User not found with id of ${userId}`, 404)
    );
  }

  if (!recipient.walletAddress) {
    return next(
      new ErrorResponse('User has not connected a wallet yet', 400)
    );
  }

  // Create transaction record
  const transaction = await Transaction.create({
    to: userId,
    amount,
    type: 'mint',
    reason,
    status: 'completed',
    transactionHash,
    processedAt: Date.now()
  });

  // Update recipient's token balance
  recipient.tokenBalance = await tokenService.getBalance(recipient.walletAddress);
  await recipient.save();

  res.status(200).json({
    success: true,
    data: {
      transaction,
      recipientBalance: recipient.tokenBalance
    }
  });
});
