import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import moment from 'moment';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Reports = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState(moment().subtract(1, 'months').toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [topDevelopers, setTopDevelopers] = useState([]);
  const [tokenDistribution, setTokenDistribution] = useState(null);
  const [activityTrends, setActivityTrends] = useState(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch overview data
        const overviewResponse = await axios.get('/api/admin/reports/overview', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setReportData(overviewResponse.data.data);
        
        // Fetch top developers
        const developersResponse = await axios.get('/api/admin/reports/top-developers', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD'),
            limit: 10
          }
        });
        setTopDevelopers(developersResponse.data.data);
        
        // Fetch token distribution
        const tokenResponse = await axios.get('/api/admin/reports/token-distribution', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setTokenDistribution(tokenResponse.data.data);
        
        // Fetch activity trends
        const activityResponse = await axios.get('/api/admin/reports/activity-trends', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setActivityTrends(activityResponse.data.data);
        
        // Fetch evaluation metrics
        const metricsResponse = await axios.get('/api/admin/reports/evaluation-metrics', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setEvaluationMetrics(metricsResponse.data.data);
        
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && currentUser.role === 'admin') {
      fetchReportData();
    }
  }, [currentUser, startDate, endDate, reportType]);

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleTimeRangeChange = (event) => {
    const range = event.target.value;
    setTimeRange(range);
    
    // Update date range based on selected time range
    const now = new Date();
    
    switch (range) {
      case 'week':
        setStartDate(moment().subtract(7, 'days').toDate());
        setEndDate(now);
        break;
      case 'month':
        setStartDate(moment().subtract(1, 'months').toDate());
        setEndDate(now);
        break;
      case 'quarter':
        setStartDate(moment().subtract(3, 'months').toDate());
        setEndDate(now);
        break;
      case 'year':
        setStartDate(moment().subtract(12, 'months').toDate());
        setEndDate(now);
        break;
      case 'custom':
        // Keep current custom dates
        break;
      default:
        setStartDate(moment().subtract(1, 'months').toDate());
        setEndDate(now);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    // Refetch data with current parameters
    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch overview data
        const overviewResponse = await axios.get('/api/admin/reports/overview', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setReportData(overviewResponse.data.data);
        
        // Fetch top developers
        const developersResponse = await axios.get('/api/admin/reports/top-developers', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD'),
            limit: 10
          }
        });
        setTopDevelopers(developersResponse.data.data);
        
        // Fetch token distribution
        const tokenResponse = await axios.get('/api/admin/reports/token-distribution', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setTokenDistribution(tokenResponse.data.data);
        
        // Fetch activity trends
        const activityResponse = await axios.get('/api/admin/reports/activity-trends', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setActivityTrends(activityResponse.data.data);
        
        // Fetch evaluation metrics
        const metricsResponse = await axios.get('/api/admin/reports/evaluation-metrics', {
          params: {
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          }
        });
        setEvaluationMetrics(metricsResponse.data.data);
        
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  };

  const handleExportReport = async () => {
    try {
      const response = await axios.get('/api/admin/reports/export', {
        params: {
          startDate: moment(startDate).format('YYYY-MM-DD'),
          endDate: moment(endDate).format('YYYY-MM-DD'),
          reportType
        },
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${moment().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report. Please try again.');
    }
  };

  // Prepare chart data for token distribution
  const prepareTokenDistributionData = () => {
    if (!tokenDistribution) return null;
    
    return {
      labels: ['Task Completion', 'Code Quality', 'Collaboration', 'CI/CD Success', 'Knowledge Sharing'],
      datasets: [
        {
          data: [
            tokenDistribution.taskTokens,
            tokenDistribution.codeTokens,
            tokenDistribution.collaborationTokens,
            tokenDistribution.cicdTokens,
            tokenDistribution.knowledgeTokens
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

  // Prepare chart data for activity trends
  const prepareActivityTrendsData = () => {
    if (!activityTrends || !activityTrends.dates || activityTrends.dates.length === 0) return null;
    
    return {
      labels: activityTrends.dates,
      datasets: [
        {
          label: 'Tasks Completed',
          data: activityTrends.tasksCompleted,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Commits',
          data: activityTrends.commits,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Pull Requests',
          data: activityTrends.pullRequests,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
        }
      ],
    };
  };

  // Prepare chart data for evaluation metrics
  const prepareEvaluationMetricsData = () => {
    if (!evaluationMetrics || !evaluationMetrics.developers || evaluationMetrics.developers.length === 0) return null;
    
    return {
      labels: evaluationMetrics.developers.map(dev => dev.name),
      datasets: [
        {
          label: 'Task Completion',
          data: evaluationMetrics.developers.map(dev => dev.metrics.taskCompletion),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
        {
          label: 'Code Quality',
          data: evaluationMetrics.developers.map(dev => dev.metrics.codeQuality),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Collaboration',
          data: evaluationMetrics.developers.map(dev => dev.metrics.collaboration),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
        },
        {
          label: 'CI/CD Success',
          data: evaluationMetrics.developers.map(dev => dev.metrics.cicdSuccess),
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
        },
        {
          label: 'Knowledge Sharing',
          data: evaluationMetrics.developers.map(dev => dev.metrics.knowledgeSharing),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }
      ],
    };
  };

  if (loading && !reportData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Reports & Analytics
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Report Configuration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleExportReport}
              disabled={loading}
            >
              Export Report
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                value={reportType}
                onChange={handleReportTypeChange}
                label="Report Type"
                disabled={loading}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="developers">Developer Performance</MenuItem>
                <MenuItem value="tokens">Token Distribution</MenuItem>
                <MenuItem value="activity">Activity Trends</MenuItem>
                <MenuItem value="evaluations">Evaluation Metrics</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
                disabled={loading}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {timeRange === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => {
                      setStartDate(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    disabled={loading}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => {
                      setEndDate(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    disabled={loading}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Report Content */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Overview" />
          <Tab label="Developer Performance" />
          <Tab label="Token Distribution" />
          <Tab label="Activity Trends" />
          <Tab label="Evaluation Metrics" />
        </Tabs>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Overview Tab */}
        {tabValue === 0 && reportData && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Developers
                  </Typography>
                  <Typography variant="h3">
                    {reportData.totalDevelopers}
                  </Typography>
                  <Typography variant="body2">
                    Active in selected period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Tokens
                  </Typography>
                  <Typography variant="h3">
                    {reportData.totalTokens}
                  </Typography>
                  <Typography variant="body2">
                    Distributed in selected period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tasks Completed
                  </Typography>
                  <Typography variant="h3">
                    {reportData.tasksCompleted}
                  </Typography>
                  <Typography variant="body2">
                    In selected period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Evaluations
                  </Typography>
                  <Typography variant="h3">
                    {reportData.evaluationsCompleted}
                  </Typography>
                  <Typography variant="body2">
                    Completed in selected period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Top Developers
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Developer</TableCell>
                      <TableCell>Tokens Earned</TableCell>
                      <TableCell>Tasks Completed</TableCell>
                      <TableCell>Avg. Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topDevelopers.map((developer) => (
                      <TableRow key={developer._id} hover>
                        <TableCell>{developer.name}</TableCell>
                        <TableCell>{developer.tokensEarned}</TableCell>
                        <TableCell>{developer.tasksCompleted}</TableCell>
                        <TableCell>{developer.averageScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Token Distribution
              </Typography>
              {prepareTokenDistributionData() ? (
                <Box sx={{ height: 300 }}>
                  <Doughnut 
                    data={prepareTokenDistributionData()} 
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
                    No token distribution data available
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Activity Trends
              </Typography>
              {prepareActivityTrendsData() ? (
                <Box sx={{ height: 300 }}>
                  <Line 
                    data={prepareActivityTrendsData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body1" color="text.secondary">
                    No activity trend data available
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        )}
        
        {/* Developer Performance Tab */}
        {tabValue === 1 && topDevelopers && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Developer Performance Rankings
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Developer</TableCell>
                    <TableCell>Tokens Earned</TableCell>
                    <TableCell>Tasks Completed</TableCell>
                    <TableCell>Commits</TableCell>
                    <TableCell>Pull Requests</TableCell>
                    <TableCell>Avg. Score</TableCell>
                    <TableCell>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topDevelopers.map((developer, index) => (
                    <TableRow key={developer._id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{developer.name}</TableCell>
                      <TableCell>{developer.tokensEarned}</TableCell>
                      <TableCell>{developer.tasksCompleted}</TableCell>
                      <TableCell>{developer.commits}</TableCell>
                      <TableCell>{developer.pullRequests}</TableCell>
                      <TableCell>{developer.averageScore}</TableCell>
                      <TableCell>
                        <Chip 
                          label={developer.performance} 
                          color={
                            developer.performance === 'Excellent' ? 'success' :
                            developer.performance === 'Good' ? 'primary' :
                            developer.performance === 'Average' ? 'warning' : 'default'
                          } 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Token Distribution Tab */}
        {tabValue === 2 && tokenDistribution && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Token Distribution by Category
              </Typography>
              {prepareTokenDistributionData() ? (
                <Box sx={{ height: 400 }}>
                  <Doughnut 
                    data={prepareTokenDistributionData()} 
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
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                  <Typography variant="body1" color="text.secondary">
                    No token distribution data available
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Token Distribution Details
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Tokens</TableCell>
                      <TableCell>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>Task Completion</TableCell>
                      <TableCell>{tokenDistribution.taskTokens}</TableCell>
                      <TableCell>{tokenDistribution.taskPercentage}%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Code Quality</TableCell>
                      <TableCell>{tokenDistribution.codeTokens}</TableCell>
                      <TableCell>{tokenDistribution.codePercentage}%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Collaboration</TableCell>
                      <TableCell>{tokenDistribution.collaborationTokens}</TableCell>
                      <TableCell>{tokenDistribution.collaborationPercentage}%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>CI/CD Success</TableCell>
                      <TableCell>{tokenDistribution.cicdTokens}</TableCell>
                      <TableCell>{tokenDistribution.cicdPercentage}%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Knowledge Sharing</TableCell>
                      <TableCell>{tokenDistribution.knowledgeTokens}</TableCell>
                      <TableCell>{tokenDistribution.knowledgePercentage}%</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell><strong>{tokenDistribution.totalTokens}</strong></TableCell>
                      <TableCell><strong>100%</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
        
        {/* Activity Trends Tab */}
        {tabValue === 3 && activityTrends && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Activity Trends Over Time
            </Typography>
            {prepareActivityTrendsData() ? (
              <Box sx={{ height: 400 }}>
                <Line 
                  data={prepareActivityTrendsData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <Typography variant="body1" color="text.secondary">
                  No activity trend data available
                </Typography>
              </Box>
            )}
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Activity Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Tasks
                    </Typography>
                    <Typography variant="h3">
                      {activityTrends.totalTasks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed: {activityTrends.tasksCompleted.reduce((a, b) => a + b, 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Commits
                    </Typography>
                    <Typography variant="h3">
                      {activityTrends.commits.reduce((a, b) => a + b, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg per day: {Math.round(activityTrends.commits.reduce((a, b) => a + b, 0) / activityTrends.dates.length)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pull Requests
                    </Typography>
                    <Typography variant="h3">
                      {activityTrends.pullRequests.reduce((a, b) => a + b, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Merged: {activityTrends.mergedPRs}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Code Reviews
                    </Typography>
                    <Typography variant="h3">
                      {activityTrends.codeReviews}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comments: {activityTrends.codeReviewComments}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Evaluation Metrics Tab */}
        {tabValue === 4 && evaluationMetrics && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Developer Evaluation Metrics
            </Typography>
            {prepareEvaluationMetricsData() ? (
              <Box sx={{ height: 400 }}>
                <Bar 
                  data={prepareEvaluationMetricsData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Score'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Developer'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Developer Performance by Category'
                      }
                    }
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <Typography variant="body1" color="text.secondary">
                  No evaluation metrics data available
                </Typography>
              </Box>
            )}
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Evaluation Details
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Developer</TableCell>
                    <TableCell>Task Completion</TableCell>
                    <TableCell>Code Quality</TableCell>
                    <TableCell>Collaboration</TableCell>
                    <TableCell>CI/CD Success</TableCell>
                    <TableCell>Knowledge Sharing</TableCell>
                    <TableCell>Overall Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluationMetrics.developers.map((developer) => (
                    <TableRow key={developer._id} hover>
                      <TableCell>{developer.name}</TableCell>
                      <TableCell>{developer.metrics.taskCompletion}</TableCell>
                      <TableCell>{developer.metrics.codeQuality}</TableCell>
                      <TableCell>{developer.metrics.collaboration}</TableCell>
                      <TableCell>{developer.metrics.cicdSuccess}</TableCell>
                      <TableCell>{developer.metrics.knowledgeSharing}</TableCell>
                      <TableCell>
                        <Chip 
                          label={developer.metrics.overallScore} 
                          color={
                            developer.metrics.overallScore >= 90 ? 'success' :
                            developer.metrics.overallScore >= 70 ? 'primary' :
                            developer.metrics.overallScore >= 50 ? 'warning' : 'error'
                          } 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;
