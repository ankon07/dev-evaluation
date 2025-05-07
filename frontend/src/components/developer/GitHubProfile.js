import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Link,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import CodeIcon from '@mui/icons-material/Code';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import CommitIcon from '@mui/icons-material/Commit';
import CommentIcon from '@mui/icons-material/Comment';
import StarIcon from '@mui/icons-material/Star';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const GitHubProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [githubProfile, setGithubProfile] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [activity, setActivity] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGitHubData();
  }, [currentUser]);

  const fetchGitHubData = async () => {
    if (!currentUser?.githubId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch GitHub profile data
      const profileResponse = await axios.get(`/api/developers/${currentUser._id}/github/profile`);
      setGithubProfile(profileResponse.data.data);

      // Fetch repositories
      const reposResponse = await axios.get(`/api/developers/${currentUser._id}/github/repositories`);
      setRepositories(reposResponse.data.data);

      // Fetch activity
      const activityResponse = await axios.get(`/api/developers/${currentUser._id}/github/activity`);
      setActivity(activityResponse.data.data);
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      setError(
        error.response?.data?.error || 
        'Failed to load GitHub data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGitHubData();
    setRefreshing(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleConnectGitHub = () => {
    window.location.href = '/github-auth';
  };

  const renderRepositories = () => {
    if (!repositories || repositories.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No repositories found.
        </Typography>
      );
    }

    return (
      <Grid container spacing={2}>
        {repositories.map((repo) => (
          <Grid item xs={12} md={6} key={repo.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {repo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {repo.description || 'No description available'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {repo.language && (
                    <Chip 
                      icon={<CodeIcon />} 
                      label={repo.language} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  <Chip 
                    icon={<StarIcon />} 
                    label={`${repo.stargazers_count} stars`} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<ForkRightIcon />} 
                    label={`${repo.forks_count} forks`} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(repo.updated_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  endIcon={<OpenInNewIcon />}
                  component="a"
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderActivity = () => {
    if (!activity) {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No activity data available.
        </Typography>
      );
    }

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Contribution Summary
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CommitIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${activity.metrics.totalCommits} Commits`} 
                    secondary="Total commits in evaluation period" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MergeTypeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${activity.metrics.totalPRsCreated} Pull Requests Created`} 
                    secondary="Pull requests you've opened" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${activity.metrics.totalPRsReviewed} Pull Requests Reviewed`} 
                    secondary="Pull requests you've reviewed" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CommentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${activity.metrics.totalComments} Comments`} 
                    secondary="Code review comments" 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Commits
              </Typography>
              {activity.commits && activity.commits.length > 0 ? (
                <List dense>
                  {activity.commits.slice(0, 5).map((commit, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CommitIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={commit.commit?.message?.split('\n')[0] || 'No message'}
                        secondary={`${new Date(commit.commit?.author?.date).toLocaleDateString()} - ${commit.commit?.author?.name}`}
                      />
                      <IconButton 
                        size="small"
                        component="a"
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent commits found.
                </Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Pull Requests
              </Typography>
              {activity.pullRequests?.created && activity.pullRequests.created.length > 0 ? (
                <List dense>
                  {activity.pullRequests.created.slice(0, 5).map((pr) => (
                    <ListItem key={pr.id}>
                      <ListItemAvatar>
                        <Avatar>
                          <MergeTypeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Link 
                            href={pr.html_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {pr.title}
                          </Link>
                        }
                        secondary={`${pr.state.toUpperCase()} - Created on ${new Date(pr.created_at).toLocaleDateString()}`}
                      />
                      <Chip 
                        label={pr.state} 
                        color={pr.state === 'open' ? 'info' : 'success'} 
                        size="small" 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent pull requests found.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  if (!currentUser?.githubId) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <GitHubIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          GitHub Account Not Connected
        </Typography>
        <Typography variant="body1" paragraph>
          Connect your GitHub account to see your repositories, activity, and contribution metrics.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<GitHubIcon />}
          onClick={handleConnectGitHub}
          sx={{ mt: 2 }}
        >
          Connect GitHub Account
        </Button>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* GitHub Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {githubProfile?.avatar_url && (
            <Avatar
              src={githubProfile.avatar_url}
              alt={githubProfile.login}
              sx={{ width: 80, height: 80, mr: 2 }}
            />
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5">
              {githubProfile?.name || githubProfile?.login || 'GitHub User'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              @{githubProfile?.login}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                icon={<GitHubIcon />} 
                label="Connected" 
                color="success" 
                size="small" 
                variant="outlined" 
              />
              <Button
                variant="outlined"
                size="small"
                href={githubProfile?.html_url}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<OpenInNewIcon />}
              >
                View Profile
              </Button>
            </Box>
          </Box>
          <Tooltip title="Refresh GitHub Data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {githubProfile?.bio && (
          <Typography variant="body1" paragraph>
            {githubProfile.bio}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${githubProfile?.public_repos || 0} Repositories`} 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={`${githubProfile?.followers || 0} Followers`} 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={`${githubProfile?.following || 0} Following`} 
            variant="outlined" 
            size="small" 
          />
        </Box>
      </Paper>
      
      {/* Tabs for Repositories and Activity */}
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Activity" />
          <Tab label="Repositories" />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {tabValue === 0 && renderActivity()}
        {tabValue === 1 && renderRepositories()}
      </Box>
    </Box>
  );
};

export default GitHubProfile;
