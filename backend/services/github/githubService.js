const axios = require('axios');
const User = require('../../models/User');

class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  /**
   * Set authentication token for GitHub API requests
   * @param {string} token - GitHub API token
   */
  setAuthToken(token) {
    this.headers['Authorization'] = `token ${token}`;
  }

  /**
   * Make authenticated request to GitHub API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - API response
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios({
        method,
        url,
        headers: this.headers,
        data
      });
      return response.data;
    } catch (error) {
      console.error(`GitHub API Error: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Get user information from GitHub
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} - User information
   */
  async getUserInfo(username) {
    return await this.makeRequest(`/users/${username}`);
  }

  /**
   * Get repositories for an organization
   * @param {string} org - Organization name
   * @returns {Promise<Array>} - List of repositories
   */
  async getOrgRepos(org) {
    return await this.makeRequest(`/orgs/${org}/repos`);
  }

  /**
   * Get commits for a repository within a date range
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} author - GitHub username of the author
   * @param {Date} since - Start date
   * @param {Date} until - End date
   * @returns {Promise<Array>} - List of commits
   */
  async getCommits(owner, repo, author, since, until) {
    const sinceDate = since ? since.toISOString() : null;
    const untilDate = until ? until.toISOString() : null;
    
    let queryParams = '';
    if (author) queryParams += `&author=${author}`;
    if (sinceDate) queryParams += `&since=${sinceDate}`;
    if (untilDate) queryParams += `&until=${untilDate}`;
    
    return await this.makeRequest(`/repos/${owner}/${repo}/commits?${queryParams.substring(1)}`);
  }

  /**
   * Get pull requests for a repository within a date range
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} state - PR state (open, closed, all)
   * @param {string} creator - GitHub username of the creator
   * @returns {Promise<Array>} - List of pull requests
   */
  async getPullRequests(owner, repo, state = 'all', creator = null) {
    let queryParams = `state=${state}`;
    if (creator) queryParams += `&creator=${creator}`;
    
    return await this.makeRequest(`/repos/${owner}/${repo}/pulls?${queryParams}`);
  }

  /**
   * Get pull request reviews
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Array>} - List of reviews
   */
  async getPullRequestReviews(owner, repo, pullNumber) {
    return await this.makeRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`);
  }

  /**
   * Get pull request comments
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Array>} - List of comments
   */
  async getPullRequestComments(owner, repo, pullNumber) {
    return await this.makeRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}/comments`);
  }

  /**
   * Get commit details
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} ref - Commit reference (SHA)
   * @returns {Promise<Object>} - Commit details
   */
  async getCommitDetails(owner, repo, ref) {
    return await this.makeRequest(`/repos/${owner}/${repo}/commits/${ref}`);
  }

  /**
   * Get developer activity for evaluation period
   * @param {string} username - GitHub username
   * @param {Array} repositories - List of repositories to check
   * @param {Date} startDate - Start date of evaluation period
   * @param {Date} endDate - End date of evaluation period
   * @returns {Promise<Object>} - Developer activity metrics
   */
  async getDeveloperActivity(username, repositories, startDate, endDate) {
    try {
      const activity = {
        commits: [],
        pullRequests: {
          created: [],
          reviewed: []
        },
        comments: [],
        metrics: {
          totalCommits: 0,
          totalPRsCreated: 0,
          totalPRsReviewed: 0,
          totalComments: 0
        }
      };

      // Process each repository
      for (const repo of repositories) {
        const [owner, repoName] = repo.split('/');
        
        // Get commits
        const commits = await this.getCommits(owner, repoName, username, startDate, endDate);
        activity.commits.push(...commits);
        
        // Get pull requests created by the developer
        const createdPRs = await this.getPullRequests(owner, repoName, 'all', username);
        const filteredCreatedPRs = createdPRs.filter(pr => {
          const createdAt = new Date(pr.created_at);
          return createdAt >= startDate && createdAt <= endDate;
        });
        activity.pullRequests.created.push(...filteredCreatedPRs);
        
        // Get all pull requests in the period to check for reviews
        const allPRs = await this.getPullRequests(owner, repoName, 'all');
        const filteredPRs = allPRs.filter(pr => {
          const createdAt = new Date(pr.created_at);
          return createdAt >= startDate && createdAt <= endDate;
        });
        
        // Check each PR for reviews by the developer
        for (const pr of filteredPRs) {
          const reviews = await this.getPullRequestReviews(owner, repoName, pr.number);
          const developerReviews = reviews.filter(review => review.user.login === username);
          
          if (developerReviews.length > 0) {
            activity.pullRequests.reviewed.push({
              ...pr,
              reviews: developerReviews
            });
          }
          
          // Get PR comments
          const comments = await this.getPullRequestComments(owner, repoName, pr.number);
          const developerComments = comments.filter(comment => comment.user.login === username);
          activity.comments.push(...developerComments);
        }
      }
      
      // Calculate metrics
      activity.metrics.totalCommits = activity.commits.length;
      activity.metrics.totalPRsCreated = activity.pullRequests.created.length;
      activity.metrics.totalPRsReviewed = activity.pullRequests.reviewed.length;
      activity.metrics.totalComments = activity.comments.length;
      
      return activity;
    } catch (error) {
      console.error(`Error getting developer activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test connection to GitHub API
   * @returns {Promise<Object>} - Connection test result
   */
  async testConnection() {
    try {
      // Try to get rate limit info as a simple API test
      const response = await this.makeRequest('/rate_limit');
      
      return {
        success: true,
        message: 'Successfully connected to GitHub API',
        details: {
          rateLimit: response.resources.core
        }
      };
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return {
        success: false,
        error: `Failed to connect to GitHub API: ${error.message}`
      };
    }
  }

  /**
   * Link GitHub account to user
   * @param {string} code - OAuth code from GitHub
   * @param {string} userId - User ID in the system
   * @returns {Promise<Object>} - Updated user information
   */
  async linkGitHubAccount(code, userId) {
    try {
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
      this.setAuthToken(access_token);
      const githubUser = await this.makeRequest('/user');
      
      // Update user in database
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      user.githubId = githubUser.id.toString();
      await user.save();
      
      return {
        success: true,
        user,
        githubUser
      };
    } catch (error) {
      console.error(`Error linking GitHub account: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GitHubService();
