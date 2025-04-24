const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const tokenService = require('../services/blockchain/tokenService');

// @desc    Get all developers
// @route   GET /api/developers
// @access  Private/Admin/HR
exports.getDevelopers = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments({ role: 'developer' });

  // Query with pagination
  const developers = await User.find({ role: 'developer' })
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
    count: developers.length,
    pagination,
    data: developers
  });
});

// @desc    Get single developer
// @route   GET /api/developers/:id
// @access  Private
exports.getDeveloper = asyncHandler(async (req, res, next) => {
  const developer = await User.findById(req.params.id);

  // Check if developer exists
  if (!developer) {
    return next(
      new ErrorResponse(`Developer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the developer or an admin/HR
  if (
    developer._id.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'hr'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this developer's profile`,
        403
      )
    );
  }

  res.status(200).json({
    success: true,
    data: developer
  });
});

// @desc    Update developer profile
// @route   PUT /api/developers/:id/profile
// @access  Private
exports.updateDeveloperProfile = asyncHandler(async (req, res, next) => {
  // Fields to update
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  // Find developer
  const developer = await User.findById(req.params.id);

  // Check if developer exists
  if (!developer) {
    return next(
      new ErrorResponse(`Developer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the developer or an admin
  if (
    developer._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this developer's profile`,
        403
      )
    );
  }

  // Update developer
  const updatedDeveloper = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: updatedDeveloper
  });
});

// @desc    Add skill to developer
// @route   POST /api/developers/:id/skills
// @access  Private
exports.addSkill = asyncHandler(async (req, res, next) => {
  // Find developer
  const developer = await User.findById(req.params.id);

  // Check if developer exists
  if (!developer) {
    return next(
      new ErrorResponse(`Developer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the developer or an admin
  if (
    developer._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this developer's skills`,
        403
      )
    );
  }

  // Check if skill already exists
  const skillExists = developer.skills.find(
    skill => skill.name.toLowerCase() === req.body.name.toLowerCase()
  );

  if (skillExists) {
    return next(
      new ErrorResponse(`Skill ${req.body.name} already exists`, 400)
    );
  }

  // Add skill
  developer.skills.push({
    name: req.body.name,
    level: req.body.level || 'intermediate',
    endorsements: 0
  });

  // Save developer
  await developer.save();

  res.status(201).json({
    success: true,
    data: developer
  });
});

// @desc    Update skill
// @route   PUT /api/developers/:id/skills/:skillId
// @access  Private
exports.updateSkill = asyncHandler(async (req, res, next) => {
  // Find developer
  const developer = await User.findById(req.params.id);

  // Check if developer exists
  if (!developer) {
    return next(
      new ErrorResponse(`Developer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the developer or an admin
  if (
    developer._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this developer's skills`,
        403
      )
    );
  }

  // Find skill
  const skill = developer.skills.id(req.params.skillId);

  // Check if skill exists
  if (!skill) {
    return next(
      new ErrorResponse(`Skill not found with id of ${req.params.skillId}`, 404)
    );
  }

  // Update skill
  skill.name = req.body.name || skill.name;
  skill.level = req.body.level || skill.level;

  // Save developer
  await developer.save();

  res.status(200).json({
    success: true,
    data: developer
  });
});

// @desc    Remove skill
// @route   DELETE /api/developers/:id/skills/:skillId
// @access  Private
exports.removeSkill = asyncHandler(async (req, res, next) => {
  // Find developer
  const developer = await User.findById(req.params.id);

  // Check if developer exists
  if (!developer) {
    return next(
      new ErrorResponse(`Developer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the developer or an admin
  if (
    developer._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this developer's skills`,
        403
      )
    );
  }

  // Find skill
  const skill = developer.skills.id(req.params.skillId);

  // Check if skill exists
  if (!skill) {
    return next(
      new ErrorResponse(`Skill not found with id of ${req.params.skillId}`, 404)
    );
  }

  // Remove skill
  developer.skills.pull(req.params.skillId);

  // Save developer
  await developer.save();

  res.status(200).json({
    success: true,
    data: developer
  });
});

// @desc    Connect wallet
// @route   POST /api/developers/:id/wallet
// @access  Private
exports.connectWallet = asyncHandler(async (req, res, next) => {
  // Find developer
  const developer = await User.findById(req.params.id);

  // Check if developer exists
  if (!developer) {
    return next(
      new ErrorResponse(`Developer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the developer or an admin
  if (
    developer._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this developer's wallet`,
        403
      )
    );
  }

  // Check if wallet address is already in use by another user
  const existingUser = await User.findOne({ 
    walletAddress: req.body.walletAddress,
    _id: { $ne: developer._id } // Exclude the current user
  });

  if (existingUser) {
    return next(
      new ErrorResponse(
        `Wallet address ${req.body.walletAddress} is already connected to another account`,
        400
      )
    );
  }

  // Update wallet address
  developer.walletAddress = req.body.walletAddress;

  try {
    // Save developer
    await developer.save();

    // Get token balance if wallet is connected
    let tokenBalance = 0;
    if (developer.walletAddress) {
      try {
        tokenBalance = await tokenService.getBalance(developer.walletAddress);
        developer.tokenBalance = tokenBalance;
        await developer.save();
      } catch (err) {
        console.error(`Error getting token balance: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        developer,
        tokenBalance
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return next(
        new ErrorResponse(
          `Wallet address ${req.body.walletAddress} is already connected to another account`,
          400
        )
      );
    }
    // Handle other errors
    return next(error);
  }
});

// @desc    Disconnect wallet
// @route   DELETE /api/developers/:id/wallet
// @access  Private
exports.disconnectWallet = asyncHandler(async (req, res, next) => {
  // Find developer
  const developer = await User.findById(req.params.id);

  // Check if developer exists
  if (!developer) {
    return next(
      new ErrorResponse(`Developer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the developer or an admin
  if (
    developer._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to disconnect this developer's wallet`,
        403
      )
    );
  }

  // Check if wallet is already disconnected
  if (!developer.walletAddress) {
    return next(
      new ErrorResponse(`No wallet is connected to this account`, 400)
    );
  }

  // Store the wallet address for logging
  const previousWalletAddress = developer.walletAddress;

  // Disconnect wallet
  developer.walletAddress = null;
  developer.tokenBalance = 0;
  developer.stakedTokens = 0;

  // Save developer
  await developer.save();

  // Log the wallet disconnection
  console.log(`Wallet ${previousWalletAddress} disconnected from user ${developer._id}`);

  res.status(200).json({
    success: true,
    data: {
      message: 'Wallet disconnected successfully',
      developer
    }
  });
});

// @desc    Get developer stats
// @route   GET /api/developers/stats
// @access  Private
exports.getDeveloperStats = asyncHandler(async (req, res, next) => {
  // Get developer
  const developer = await User.findById(req.user.id);

  // Get token balance if wallet is connected
  let tokenBalance = 0;
  let stakedTokens = 0;
  if (developer.walletAddress) {
    try {
      tokenBalance = await tokenService.getBalance(developer.walletAddress);
      stakedTokens = await tokenService.getStakedAmount(developer.walletAddress);
      
      // Update developer with latest balances
      developer.tokenBalance = tokenBalance;
      developer.stakedTokens = stakedTokens;
      await developer.save();
    } catch (err) {
      console.error(`Error getting token balances: ${err.message}`);
    }
  }

  // Get transaction count
  const transactionCount = await Transaction.countDocuments({
    $or: [
      { from: req.user.id },
      { to: req.user.id }
    ]
  });

  res.status(200).json({
    success: true,
    data: {
      tokenBalance,
      stakedTokens,
      transactionCount,
      skills: developer.skills
    }
  });
});

// @desc    Get developer transactions
// @route   GET /api/developers/transactions
// @access  Private
exports.getDeveloperTransactions = asyncHandler(async (req, res, next) => {
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
