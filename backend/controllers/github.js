const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const githubService = require('../services/github/githubService');

// @desc    Process GitHub OAuth callback code
// @route   POST /api/auth/github/process
// @access  Public
exports.processGitHubCallback = asyncHandler(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return next(new ErrorResponse('GitHub code is required', 400));
  }

  try {
    // If user is already logged in, link GitHub account
    if (req.user) {
      const result = await githubService.linkGitHubAccount(code, req.user.id);
      
      if (!result.success) {
        return next(new ErrorResponse(result.error, 400));
      }

      return res.status(200).json({
        success: true,
        data: result.user
      });
    } else {
      // Handle the case where user is not logged in
      return next(new ErrorResponse('User must be logged in to process GitHub callback', 401));
    }
  } catch (error) {
    console.error('GitHub callback processing error:', error);
    return next(new ErrorResponse('GitHub authentication failed', 400));
  }
});

// @desc    Get GitHub profile for a developer
// @route   GET /api/developers/:id/github/profile
// @access  Private
exports.getGitHubProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Check if user has GitHub account linked
  if (!user.githubId) {
    return next(new ErrorResponse('GitHub account not linked', 400));
  }

  // Check if user is requesting their own profile or is an admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this resource', 403));
  }

  try {
    // Get GitHub profile
    const profile = await githubService.makeRequest('/user');
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching GitHub profile:', error);
    return next(new ErrorResponse('Failed to fetch GitHub profile', 500));
  }
});

// @desc    Get GitHub repositories for a developer
// @route   GET /api/developers/:id/github/repositories
// @access  Private
exports.getGitHubRepositories = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Check if user has GitHub account linked
  if (!user.githubId) {
    return next(new ErrorResponse('GitHub account not linked', 400));
  }

  // Check if user is requesting their own repositories or is an admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this resource', 403));
  }

  try {
    // Get GitHub repositories
    const repositories = await githubService.makeRequest('/user/repos?sort=updated&per_page=10');
    
    res.status(200).json({
      success: true,
      count: repositories.length,
      data: repositories
    });
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return next(new ErrorResponse('Failed to fetch GitHub repositories', 500));
  }
});

// @desc    Get GitHub activity for a developer
// @route   GET /api/developers/:id/github/activity
// @access  Private
exports.getGitHubActivity = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Check if user has GitHub account linked
  if (!user.githubId) {
    return next(new ErrorResponse('GitHub account not linked', 400));
  }

  // Check if user is requesting their own activity or is an admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this resource', 403));
  }

  try {
    // Get GitHub profile to get username
    const profile = await githubService.makeRequest('/user');
    
    // Get repositories to analyze
    const repositories = await githubService.makeRequest('/user/repos?sort=updated&per_page=5');
    
    // Get activity for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const repoNames = repositories.map(repo => `${repo.owner.login}/${repo.name}`);
    
    const activity = await githubService.getDeveloperActivity(
      profile.login,
      repoNames,
      startDate,
      endDate
    );
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching GitHub activity:', error);
    return next(new ErrorResponse('Failed to fetch GitHub activity', 500));
  }
});

// @desc    Disconnect GitHub account
// @route   DELETE /api/developers/:id/github
// @access  Private
exports.disconnectGitHub = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Check if user is disconnecting their own account or is an admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this resource', 403));
  }

  // Check if user has GitHub account linked
  if (!user.githubId) {
    return next(new ErrorResponse('GitHub account not linked', 400));
  }

  // Remove GitHub ID
  user.githubId = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});
