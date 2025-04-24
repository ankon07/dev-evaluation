import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TokenIcon from '@mui/icons-material/Token';
import TaskIcon from '@mui/icons-material/Task';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [topDevelopers, setTopDevelopers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch system stats
        const statsResponse = await axios.get('/api/admin/stats');
        setStats(statsResponse.data.data);
        
        // Extract data from stats response
        if (statsResponse.data.data) {
          setRecentEvaluations(statsResponse.data.data.recentEvaluations || []);
          setTopDevelopers(statsResponse.data.data.topDevelopers || []);
          setRecentTransactions(statsResponse.data.data.recentTransactions || []);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'hr')) {
      fetchDashboardData();
    } else {
      // Redirect non-admin users
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Prepare chart data for evaluation distribution
  const prepareEvaluationDistributionData = () => {
    if (!stats || !stats.counts) {
      return null;
    }
    
    return {
      labels: ['Completed', 'Pending', 'Failed'],
      datasets: [
        {
          label: 'Evaluations',
          data: [
            stats.counts.completedEvaluations,
            stats.counts.evaluations - stats.counts.completedEvaluations,
            0 // Assuming no failed evaluations for now
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare chart data for task completion
  const prepareTaskCompletionData = () => {
    if (!stats || !stats.counts) {
      return null;
    }
    
    return {
      labels: ['Completed', 'In Progress'],
      datasets: [
        {
          label: 'Tasks',
          data: [
            stats.counts.completedTasks,
            stats.counts.tasks - stats.counts.completedTasks
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare chart data for developer metrics
  const prepareDeveloperMetricsData = () => {
    if (!topDevelopers || topDevelopers.length === 0) {
      return null;
    }
    
    return {
      labels: topDevelopers.map(dev => dev.name),
      datasets: [
        {
          label: 'Token Balance',
          data: topDevelopers.map(dev => dev.tokenBalance),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }
      ],
    };
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
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Developers</Typography>
            </Box>
            <Typography variant="h3">
              {stats?.counts?.developers || 0}
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 'auto', alignSelf: 'flex-start' }}
              onClick={() => navigate('/admin/users')}
            >
              Manage Users
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Evaluations</Typography>
            </Box>
            <Typography variant="h3">
              {stats?.counts?.evaluations || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.counts?.completedEvaluations || 0} completed
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 'auto', alignSelf: 'flex-start' }}
              onClick={() => navigate('/admin/evaluations')}
            >
              Manage Evaluations
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TokenIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Transactions</Typography>
            </Box>
            <Typography variant="h3">
              {stats?.counts?.transactions || 0}
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 'auto', alignSelf: 'flex-start' }}
              onClick={() => navigate('/admin/reports?type=transactions')}
            >
              View Reports
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TaskIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Tasks</Typography>
            </Box>
            <Typography variant="h3">
              {stats?.counts?.tasks || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.counts?.completedTasks || 0} completed
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 'auto', alignSelf: 'flex-start' }}
              onClick={() => navigate('/admin/reports?type=tasks')}
            >
              View Reports
            </Button>
          </Paper>
        </Grid>
        
        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Evaluation Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {prepareEvaluationDistributionData() ? (
              <Box className="chart-container">
                <Doughnut 
                  data={prepareEvaluationDistributionData()} 
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
                  No evaluation data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Completion
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {prepareTaskCompletionData() ? (
              <Box className="chart-container">
                <Doughnut 
                  data={prepareTaskCompletionData()} 
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
                  No task data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Developers by Token Balance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {prepareDeveloperMetricsData() ? (
              <Box className="chart-container">
                <Bar 
                  data={prepareDeveloperMetricsData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
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
                  No developer metrics available
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
            {recentEvaluations.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Developer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEvaluations.map((evaluation) => (
                      <TableRow 
                        key={evaluation._id}
                        hover
                        onClick={() => navigate(`/admin/evaluations/${evaluation._id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{evaluation.developer?.name || 'Unknown'}</TableCell>
                        <TableCell>{new Date(evaluation.period?.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{evaluation.overallScore}</TableCell>
                        <TableCell>
                          <Chip 
                            label={evaluation.status} 
                            color={getStatusChipColor(evaluation.status)} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                No evaluations available
              </Typography>
            )}
            {recentEvaluations.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="text" onClick={() => navigate('/admin/evaluations')}>
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
            {recentTransactions.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow 
                        key={transaction._id}
                        hover
                        onClick={() => navigate(`/admin/reports?type=transactions&id=${transaction._id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</TableCell>
                        <TableCell>{transaction.from?.name || 'System'}</TableCell>
                        <TableCell>{transaction.to?.name || '-'}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            variant="body2"
                            className={getTransactionStatusClass(transaction.status)}
                          >
                            {transaction.status}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                No transactions available
              </Typography>
            )}
            {recentTransactions.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="text" onClick={() => navigate('/admin/reports?type=transactions')}>
                  View All
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/admin/evaluations/new')}
                >
                  Create Evaluation
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/admin/users/new')}
                >
                  Add User
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/admin/config')}
                >
                  System Config
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/admin/rules')}
                >
                  Reward Rules
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
