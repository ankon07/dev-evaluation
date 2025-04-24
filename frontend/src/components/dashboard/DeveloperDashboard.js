import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CodeIcon from '@mui/icons-material/Code';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const DeveloperDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch developer stats
        const statsResponse = await axios.get('/api/developers/stats');
        setStats(statsResponse.data.data);
        
        // Fetch recent evaluations
        const evaluationsResponse = await axios.get(`/api/evaluations/developer/${currentUser._id}`);
        setEvaluations(evaluationsResponse.data.data.slice(0, 5)); // Get only the 5 most recent
        
        // Fetch recent transactions
        const transactionsResponse = await axios.get('/api/developers/transactions', {
          params: { limit: 5 }
        });
        setTransactions(transactionsResponse.data.data);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  // Prepare chart data for metrics
  const prepareMetricsChartData = () => {
    if (!evaluations || evaluations.length === 0) {
      return null;
    }
    
    // Get the most recent evaluation
    const latestEvaluation = evaluations[0];
    
    if (!latestEvaluation || !latestEvaluation.metrics) {
      return null;
    }
    
    const metrics = latestEvaluation.metrics;
    
    return {
      labels: [
        'Task Completion',
        'Code Quality',
        'Collaboration',
        'CI/CD Success',
        'Knowledge Sharing'
      ],
      datasets: [
        {
          label: 'Performance Metrics',
          data: [
            metrics.taskCompletion,
            metrics.codeQuality,
            metrics.collaboration,
            metrics.cicdSuccess,
            metrics.knowledgeSharing
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare chart data for evaluation history
  const prepareEvaluationHistoryData = () => {
    if (!evaluations || evaluations.length === 0) {
      return null;
    }
    
    // Reverse to get chronological order
    const sortedEvaluations = [...evaluations].reverse();
    
    return {
      labels: sortedEvaluations.map(evaluation => {
        const date = new Date(evaluation.period.endDate);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }),
      datasets: [
        {
          label: 'Overall Score',
          data: sortedEvaluations.map(evaluation => evaluation.overallScore),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        },
      ],
    };
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'evaluation-score-high';
    if (score >= 60) return 'evaluation-score-medium';
    return 'evaluation-score-low';
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'transaction-success';
      case 'pending':
        return 'transaction-pending';
      case 'failed':
        return 'transaction-failed';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Developer Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <Card className="wallet-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Token Balance</Typography>
              </Box>
              <Typography variant="h3" className="token-amount">
                {stats?.tokenBalance || 0}
              </Typography>
              <Typography variant="body2">
                {stats?.stakedTokens ? `${stats.stakedTokens} tokens staked` : 'No tokens staked'}
              </Typography>
              <Button 
                variant="contained" 
                color="inherit" 
                sx={{ mt: 2, color: 'primary.main', bgcolor: 'white' }}
                onClick={() => navigate('/wallet')}
              >
                Manage Wallet
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Latest Evaluation</Typography>
            </Box>
            {evaluations.length > 0 ? (
              <>
                <Typography variant="h3" className={getScoreColorClass(evaluations[0].overallScore)}>
                  {evaluations[0].overallScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(evaluations[0].period.endDate).toLocaleDateString()}
                </Typography>
                <Chip 
                  label={evaluations[0].status} 
                  color={getStatusChipColor(evaluations[0].status)} 
                  size="small" 
                  sx={{ mt: 1, alignSelf: 'flex-start' }} 
                />
                <Button 
                  variant="outlined" 
                  sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                  onClick={() => navigate(`/evaluations/${evaluations[0]._id}`)}
                >
                  View Details
                </Button>
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                No evaluations yet
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEventsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Achievements</Typography>
            </Box>
            <Typography variant="h3">
              {evaluations.filter(e => e.status === 'completed').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed Evaluations
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {stats?.transactionCount || 0} Transactions
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 'auto', alignSelf: 'flex-start' }}
              onClick={() => navigate('/evaluations')}
            >
              View All
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Skills</Typography>
            </Box>
            {stats?.skills && stats.skills.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {stats.skills.map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={`${skill.name} (${skill.level})`} 
                      className="skill-chip" 
                      color="primary" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                  onClick={() => navigate('/profile')}
                >
                  Manage Skills
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  No skills added yet
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                  onClick={() => navigate('/profile')}
                >
                  Add Skills
                </Button>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {prepareMetricsChartData() ? (
              <Box className="chart-container">
                <Doughnut 
                  data={prepareMetricsChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  No metrics data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Evaluation History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {prepareEvaluationHistoryData() ? (
              <Box className="chart-container">
                <Line 
                  data={prepareEvaluationHistoryData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  Not enough evaluation data to display history
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Evaluations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Evaluations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {evaluations.length > 0 ? (
              <List>
                {evaluations.map((evaluation) => (
                  <React.Fragment key={evaluation._id}>
                    <ListItem 
                      button 
                      onClick={() => navigate(`/evaluations/${evaluation._id}`)}
                      sx={{ px: 1 }}
                    >
                      <ListItemText
                        primary={`Period: ${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()}`}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography
                              component="span"
                              variant="body2"
                              className={getScoreColorClass(evaluation.overallScore)}
                              sx={{ mr: 1, fontWeight: 'bold' }}
                            >
                              Score: {evaluation.overallScore}
                            </Typography>
                            <Chip 
                              label={evaluation.status} 
                              color={getStatusChipColor(evaluation.status)} 
                              size="small" 
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                No evaluations available
              </Typography>
            )}
            {evaluations.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="text" onClick={() => navigate('/evaluations')}>
                  View All
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {transactions.length > 0 ? (
              <List>
                {transactions.map((transaction) => (
                  <React.Fragment key={transaction._id}>
                    <ListItem 
                      button 
                      onClick={() => navigate(`/transactions`)}
                      sx={{ px: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography component="span">
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Typography>
                            <Typography 
                              component="span" 
                              sx={{ fontWeight: 'bold' }}
                            >
                              {transaction.amount} tokens
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              className={getTransactionStatusClass(transaction.status)}
                            >
                              {transaction.status}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                No transactions available
              </Typography>
            )}
            {transactions.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="text" onClick={() => navigate('/transactions')}>
                  View All
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeveloperDashboard;
