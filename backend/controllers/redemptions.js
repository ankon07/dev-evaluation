const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Redemption = require('../models/Redemption');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const tokenService = require('../services/blockchain/tokenService');
const notificationService = require('../services/notification/notificationService');

// @desc    Create a new redemption request
// @route   POST /api/redemptions
// @access  Private
exports.createRedemption = asyncHandler(async (req, res, next) => {
  const { type, amount, details } = req.body;

  // Validate required fields
  if (!type || !amount || !details) {
    return next(
      new ErrorResponse('Please provide type, amount, and details', 400)
    );
  }

  // Check if user has enough tokens
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(
      new ErrorResponse('User not found', 404)
    );
  }

  // Get user's token balance
  const balance = await tokenService.getBalance(user.walletAddress);
  
  if (balance < amount) {
    return next(
      new ErrorResponse('Insufficient token balance', 400)
    );
  }

  // Create redemption request
  const redemption = await Redemption.create({
    user: req.user.id,
    type,
    amount,
    details,
    status: 'pending'
  });

  // Notify admins about the redemption request
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await notificationService.sendInAppNotification(
      admin._id,
      'New Redemption Request',
      `A new ${type} redemption request for ${amount} tokens has been submitted by ${user.name}`,
      'info',
      { redemptionId: redemption._id }
    );
  }

  // Notify user that their request has been submitted
  await notificationService.sendInAppNotification(
    user._id,
    'Redemption Request Submitted',
    `Your ${type} redemption request for ${amount} tokens has been submitted and is pending approval`,
    'info',
    { redemptionId: redemption._id }
  );

  res.status(201).json({
    success: true,
    data: redemption
  });
});

// @desc    Get all redemption requests
// @route   GET /api/redemptions
// @access  Private/Admin
exports.getRedemptions = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Filter by status if provided
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // If not admin, only show user's own redemptions
  if (req.user.role !== 'admin') {
    filter.user = req.user.id;
  }
  
  const total = await Redemption.countDocuments(filter);
  
  // Get redemptions with pagination
  const redemptions = await Redemption.find(filter)
    .populate('user', 'name email')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .sort({ createdAt: -1 })
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
    count: redemptions.length,
    pagination,
    data: redemptions
  });
});

// @desc    Get single redemption request
// @route   GET /api/redemptions/:id
// @access  Private
exports.getRedemption = asyncHandler(async (req, res, next) => {
  const redemption = await Redemption.findById(req.params.id)
    .populate('user', 'name email')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email');
  
  if (!redemption) {
    return next(
      new ErrorResponse(`Redemption not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is redemption owner or admin
  if (
    redemption.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to access this redemption`, 403)
    );
  }
  
  res.status(200).json({
    success: true,
    data: redemption
  });
});

// @desc    Approve redemption request
// @route   PUT /api/redemptions/:id/approve
// @access  Private/Admin
exports.approveRedemption = asyncHandler(async (req, res, next) => {
  let redemption = await Redemption.findById(req.params.id).populate('user');
  
  if (!redemption) {
    return next(
      new ErrorResponse(`Redemption not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if redemption is already processed
  if (redemption.status !== 'pending') {
    return next(
      new ErrorResponse(`Redemption ${req.params.id} is already ${redemption.status}`, 400)
    );
  }
  
  // Create token transaction for monetary redemptions
  if (redemption.type === 'monetary') {
    // Create transaction
    const transaction = await Transaction.create({
      from: redemption.user._id,
      amount: redemption.amount,
      type: 'redeem',
      reason: 'token_redemption',
      redemption: redemption._id,
      status: 'pending'
    });
    
    try {
      // Process transaction on blockchain
      const result = await tokenService.processRedemptionTransaction(transaction._id);
      
      if (result.success) {
        redemption.transactionHash = result.transactionHash;
        redemption.status = 'approved';
        redemption.approvedBy = req.user.id;
        redemption.approvedAt = Date.now();
        
        await redemption.save();
        
        // Notify user about approved redemption
        await notificationService.sendInAppNotification(
          redemption.user._id,
          'Redemption Request Approved',
          `Your monetary redemption request for ${redemption.amount} tokens has been approved`,
          'success',
          { redemptionId: redemption._id }
        );
      } else {
        console.error(`Blockchain error: ${result.error}. Proceeding with administrative approval.`);
        
        // Even if blockchain fails, still approve the redemption administratively
        redemption.status = 'approved';
        redemption.approvedBy = req.user.id;
        redemption.approvedAt = Date.now();
        
        await redemption.save();
        
        // Notify user about approved redemption
        await notificationService.sendInAppNotification(
          redemption.user._id,
          'Redemption Request Approved',
          `Your monetary redemption request for ${redemption.amount} tokens has been approved`,
          'success',
          { redemptionId: redemption._id }
        );
      }
    } catch (error) {
      console.error(`Error in blockchain processing: ${error.message}. Proceeding with administrative approval.`);
      
      // Even if blockchain fails, still approve the redemption administratively
      redemption.status = 'approved';
      redemption.approvedBy = req.user.id;
      redemption.approvedAt = Date.now();
      
      await redemption.save();
      
      // Notify user about approved redemption
      await notificationService.sendInAppNotification(
        redemption.user._id,
        'Redemption Request Approved',
        `Your monetary redemption request for ${redemption.amount} tokens has been approved`,
        'success',
        { redemptionId: redemption._id }
      );
    }
  } else {
    // For non-monetary redemptions, just mark as approved
    redemption.status = 'approved';
    redemption.approvedBy = req.user.id;
    redemption.approvedAt = Date.now();
    
    await redemption.save();
    
    // Notify user about approved redemption
    await notificationService.sendInAppNotification(
      redemption.user._id,
      'Redemption Request Approved',
      `Your ${redemption.type} redemption request for ${redemption.amount} tokens has been approved`,
      'success',
      { redemptionId: redemption._id }
    );
  }
  
  res.status(200).json({
    success: true,
    data: redemption
  });
});

// @desc    Reject redemption request
// @route   PUT /api/redemptions/:id/reject
// @access  Private/Admin
exports.rejectRedemption = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  let redemption = await Redemption.findById(req.params.id).populate('user');
  
  if (!redemption) {
    return next(
      new ErrorResponse(`Redemption not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if redemption is already processed
  if (redemption.status !== 'pending') {
    return next(
      new ErrorResponse(`Redemption ${req.params.id} is already ${redemption.status}`, 400)
    );
  }
  
  // Update redemption status
  redemption.status = 'rejected';
  redemption.rejectedBy = req.user.id;
  redemption.rejectedAt = Date.now();
  redemption.rejectionReason = reason || 'No reason provided';
  
  await redemption.save();
  
  // Notify user about rejected redemption
  await notificationService.sendInAppNotification(
    redemption.user._id,
    'Redemption Request Rejected',
    `Your ${redemption.type} redemption request for ${redemption.amount} tokens has been rejected: ${redemption.rejectionReason}`,
    'error',
    { redemptionId: redemption._id }
  );
  
  res.status(200).json({
    success: true,
    data: redemption
  });
});

// @desc    Get user's redemption history
// @route   GET /api/redemptions/history
// @access  Private
exports.getUserRedemptionHistory = asyncHandler(async (req, res, next) => {
  const redemptions = await Redemption.find({ user: req.user.id })
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: redemptions.length,
    data: redemptions
  });
});
