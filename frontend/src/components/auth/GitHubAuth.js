import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const GitHubAuth = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    // Check if this is a callback from GitHub OAuth
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    
    if (code) {
      setIsProcessingCallback(true);
      processGitHubCallback(code);
    }
  }, [location]);

  const processGitHubCallback = async (code) => {
    setLoading(true);
    setError('');
    
    try {
      // Exchange code for token (this is handled by the backend)
      const response = await axios.post('/api/auth/github/process', { code });
      
      if (response.data.success) {
        setSuccess('GitHub account connected successfully!');
        
        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to connect GitHub account');
      }
    } catch (error) {
      console.error('GitHub auth error:', error);
      setError(
        error.response?.data?.error || 
        'An error occurred while connecting your GitHub account'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGitHub = () => {
    // Use the full backend URL to avoid proxy issues
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  const renderBenefits = () => (
    <List>
      <ListItem>
        <ListItemIcon>
          <AssessmentIcon color="primary" />
        </ListItemIcon>
        <ListItemText 
          primary="Automatic Evaluation" 
          secondary="Your GitHub activity is automatically analyzed for evaluations" 
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <CodeIcon color="primary" />
        </ListItemIcon>
        <ListItemText 
          primary="Code Quality Metrics" 
          secondary="Get insights on your code quality and contributions" 
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <IntegrationInstructionsIcon color="primary" />
        </ListItemIcon>
        <ListItemText 
          primary="CI/CD Integration" 
          secondary="Connect your CI/CD pipelines for comprehensive evaluation" 
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <SecurityIcon color="primary" />
        </ListItemIcon>
        <ListItemText 
          primary="Secure Authentication" 
          secondary="Use your GitHub account for secure login" 
        />
      </ListItem>
    </List>
  );

  if (isProcessingCallback) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <Typography variant="h4" gutterBottom>
          Processing GitHub Authentication
        </Typography>
        
        {loading ? (
          <CircularProgress size={60} sx={{ my: 4 }} />
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: 600 }}>
            {error}
          </Alert>
        ) : success ? (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Alert severity="success" sx={{ width: '100%', maxWidth: 600 }}>
              {success}
            </Alert>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Redirecting to your profile...
            </Typography>
          </Box>
        ) : null}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        GitHub Integration
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GitHubIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5">
                Connect Your GitHub Account
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              Connecting your GitHub account enhances your developer evaluation experience by automatically tracking your contributions, code quality, and collaboration metrics.
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Benefits of Connecting
            </Typography>
            
            {renderBenefits()}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<GitHubIcon />}
                onClick={handleConnectGitHub}
                disabled={loading}
                sx={{ py: 1.5, px: 3 }}
              >
                {currentUser?.githubId ? 'Reconnect GitHub Account' : 'Connect GitHub Account'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              How It Works
            </Typography>
            
            <Typography variant="body1" paragraph>
              When you connect your GitHub account, we'll analyze your repositories, commits, pull requests, and code reviews to provide comprehensive insights into your development activities.
            </Typography>
            
            <Typography variant="body1" paragraph>
              This data is used to:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Calculate your contribution metrics for evaluations" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Track your code quality improvements over time" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Measure your collaboration with team members" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Provide personalized improvement recommendations" />
              </ListItem>
            </List>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              We only request read access to your repositories and user information. We never modify your code or repositories.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GitHubAuth;
