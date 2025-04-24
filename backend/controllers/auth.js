const crypto = require('crypto');
const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const githubService = require('../services/github/githubService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email and password', 400));
  }

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already in use', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'developer' // Default to developer role
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/resetpassword/${resetToken}`;

  // In a real implementation, you would send an email with the reset URL
  // For now, just return the reset URL in the response
  res.status(200).json({
    success: true,
    data: {
      resetUrl,
      message: 'Password reset token sent'
    }
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    GitHub OAuth login
// @route   GET /api/auth/github
// @access  Public
exports.githubAuth = asyncHandler(async (req, res, next) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  const scope = 'user:email,read:user,repo';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  res.redirect(githubAuthUrl);
});

// @desc    GitHub OAuth callback
// @route   GET /api/auth/github/callback
// @access  Public
exports.githubCallback = asyncHandler(async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    return next(new ErrorResponse('GitHub authentication failed', 400));
  }

  try {
    // If user is already logged in, link GitHub account
    if (req.user) {
      const result = await githubService.linkGitHubAccount(code, req.user.id);
      
      if (!result.success) {
        return next(new ErrorResponse(result.error, 400));
      }

      return res.redirect('/dashboard');
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const { access_token } = tokenResponse.data;
    
    // Get GitHub user info
    githubService.setAuthToken(access_token);
    const githubUser = await githubService.makeRequest('/user');
    
    // Check if user exists with this GitHub ID
    let user = await User.findOne({ githubId: githubUser.id.toString() });
    
    if (!user) {
      // Check if user exists with this email
      const emails = await githubService.makeRequest('/user/emails');
      const primaryEmail = emails.find(email => email.primary).email;
      
      user = await User.findOne({ email: primaryEmail });
      
      if (user) {
        // Link GitHub account to existing user
        user.githubId = githubUser.id.toString();
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name: githubUser.name || githubUser.login,
          email: primaryEmail,
          password: crypto.randomBytes(20).toString('hex'), // Random password
          githubId: githubUser.id.toString(),
          role: 'developer'
        });
      }
    }
    
    sendTokenResponse(user, 200, res);
  } catch (error) {
    return next(new ErrorResponse('GitHub authentication failed', 400));
  }
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || process.env.JWT_EXPIRE || '30d').replace('d', '') * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
