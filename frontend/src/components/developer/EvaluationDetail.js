import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Radar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, RadialLinearScale, PointElement, LineElement, Tooltip, Legend);

const EvaluationDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [commits, setCommits] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [codeQualityMetrics, setCodeQualityMetrics] = useState(null);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch evaluation details
        const evaluationResponse = await axios.get(`/api/evaluations/${id}`);
        setEvaluation(evaluationResponse.data.data);
        
        // Fetch related tasks
        const tasksResponse = await axios.get(`/api/evaluations/${id}/tasks`);
        setTasks(tasksResponse.data.data);
        
        // Fetch related commits
        const commitsResponse = await axios.get(`/api/evaluations/${id}/commits`);
        setCommits(commitsResponse.data.data);
        
        // Fetch related pull requests
        const prsResponse = await axios.get(`/api/evaluations/${id}/pull-requests`);
        setPullRequests(prsResponse.data.data);
        
        // Fetch code quality metrics
        const codeQualityResponse = await axios.get(`/api/evaluations/${id}/code-quality`);
        setCodeQualityMetrics(codeQualityResponse.data.data);
        
      } catch (error) {
        console.error('Error fetching evaluation data:', error);
        setError('Failed to load evaluation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchEvaluationData();
    }
  }, [id]);

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

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'evaluation-score-high';
    if (score >= 60) return 'evaluation-score-medium';
    return 'evaluation-score-low';
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'Done':
      case 'Verified':
        return <CheckCircleIcon color="success" />;
      case 'In Progress':
        return <InfoIcon color="warning" />;
      case 'Failed':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  // Prepare chart data for performance metrics
  const preparePerformanceMetricsData = () => {
    if (!evaluation || !evaluation.metrics) {
      return null;
    }
    
    const metrics = evaluation.metrics;
    
    // Extract score values from metrics objects
    // Handle both object format and direct numeric format
    const getMetricScore = (metric) => {
      if (typeof metric === 'object' && metric !== null) {
        return metric.score || 0;
      }
      return typeof metric === 'number' ? metric : 0;
    };
    
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
            getMetricScore(metrics.taskCompletion),
            getMetricScore(metrics.codeQuality),
            getMetricScore(metrics.collaboration),
            getMetricScore(metrics.cicdSuccess),
            getMetricScore(metrics.knowledgeSharing)
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        }
      ]
    };
  };

  // Prepare chart data for code quality metrics
  const prepareCodeQualityData = () => {
    if (!codeQualityMetrics) {
      return null;
    }
    
    return {
      labels: ['Clean Code', 'Bugs', 'Vulnerabilities', 'Code Smells', 'Test Coverage'],
      datasets: [
        {
          label: 'Code Quality',
          data: [
            codeQualityMetrics.cleanCode,
            100 - codeQualityMetrics.bugs,
            100 - codeQualityMetrics.vulnerabilities,
            100 - codeQualityMetrics.codeSmells,
            codeQualityMetrics.testCoverage
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
        }
      ]
    };
  };

  // Prepare chart data for task distribution
  const prepareTaskDistributionData = () => {
    if (!tasks || tasks.length === 0) {
      return null;
    }
    
    const taskTypes = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      labels: Object.keys(taskTypes),
      datasets: [
        {
          data: Object.values(taskTypes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Determine if we're in admin view or developer view
  const isAdminView = window.location.pathname.includes('/admin/');
  const backPath = isAdminView ? '/admin/evaluations' : '/evaluations';
  const backLabel = isAdminView ? 'Back to Admin Evaluations' : 'Back to Evaluations';

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backPath)}
          sx={{ mt: 2 }}
        >
          {backLabel}
        </Button>
      </Box>
    );
  }

  if (!evaluation) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Evaluation not found.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backPath)}
          sx={{ mt: 2 }}
        >
          {backLabel}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            // Check if we're in admin view or developer view
            const path = window.location.pathname;
            if (path.includes('/admin/')) {
              navigate('/admin/evaluations');
            } else {
              navigate('/evaluations');
            }
          }}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="div">
          Evaluation Details
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Evaluation Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom>
                  Evaluation Period: {new Date(evaluation.period.startDate).toLocaleDateString()} - {new Date(evaluation.period.endDate).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>
                    Status:
                  </Typography>
                  <Chip 
                    label={evaluation.status} 
                    color={getStatusChipColor(evaluation.status)} 
                  />
                </Box>
                {evaluation.status === 'completed' && (
                  <Typography variant="body1" paragraph>
                    Completed on: {new Date(evaluation.completedAt).toLocaleDateString()}
                  </Typography>
                )}
                <Typography variant="body1" paragraph>
                  {evaluation.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom textAlign="center">
                      Overall Score
                    </Typography>
                    {evaluation.status === 'completed' ? (
                      <>
                        <Typography 
                          variant="h2" 
                          className={getScoreColorClass(evaluation.overallScore)}
                          sx={{ fontWeight: 'bold', textAlign: 'center' }}
                        >
                          {evaluation.overallScore}
                        </Typography>
                        <Typography variant="h6" textAlign="center" color="text.secondary">
                          Tokens Earned: {evaluation.tokensEarned}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary" textAlign="center">
                        Score will be available once the evaluation is completed.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Performance Metrics */}
        {evaluation.status === 'completed' && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {preparePerformanceMetricsData() ? (
                <Box className="chart-container">
                  <Radar 
                    data={preparePerformanceMetricsData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            stepSize: 20
                          }
                        }
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
              
              {evaluation.metrics && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Task Completion
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const score = typeof evaluation.metrics.taskCompletion === 'object' 
                          ? evaluation.metrics.taskCompletion.score || 0 
                          : typeof evaluation.metrics.taskCompletion === 'number' 
                            ? evaluation.metrics.taskCompletion 
                            : 0;
                        return (
                          <>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={score} 
                                color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {score}%
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Code Quality
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const score = typeof evaluation.metrics.codeQuality === 'object' 
                          ? evaluation.metrics.codeQuality.score || 0 
                          : typeof evaluation.metrics.codeQuality === 'number' 
                            ? evaluation.metrics.codeQuality 
                            : 0;
                        return (
                          <>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={score} 
                                color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {score}%
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Collaboration
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const score = typeof evaluation.metrics.collaboration === 'object' 
                          ? evaluation.metrics.collaboration.score || 0 
                          : typeof evaluation.metrics.collaboration === 'number' 
                            ? evaluation.metrics.collaboration 
                            : 0;
                        return (
                          <>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={score} 
                                color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {score}%
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      CI/CD Success
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const score = typeof evaluation.metrics.cicdSuccess === 'object' 
                          ? evaluation.metrics.cicdSuccess.score || 0 
                          : typeof evaluation.metrics.cicdSuccess === 'number' 
                            ? evaluation.metrics.cicdSuccess 
                            : 0;
                        return (
                          <>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={score} 
                                color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {score}%
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Knowledge Sharing
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const score = typeof evaluation.metrics.knowledgeSharing === 'object' 
                          ? evaluation.metrics.knowledgeSharing.score || 0 
                          : typeof evaluation.metrics.knowledgeSharing === 'number' 
                            ? evaluation.metrics.knowledgeSharing 
                            : 0;
                        return (
                          <>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={score} 
                                color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {score}%
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        )}
        
        {/* Code Quality Metrics */}
        {evaluation.status === 'completed' && codeQualityMetrics && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Code Quality Metrics
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {prepareCodeQualityData() ? (
                <Box className="chart-container">
                  <Radar 
                    data={prepareCodeQualityData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            stepSize: 20
                          }
                        }
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body1" color="text.secondary">
                    No code quality data available
                  </Typography>
                </Box>
              )}
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Bugs
                  </Typography>
                  <Typography variant="h6">
                    {codeQualityMetrics.bugsCount} {codeQualityMetrics.bugsCount === 1 ? 'issue' : 'issues'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Vulnerabilities
                  </Typography>
                  <Typography variant="h6">
                    {codeQualityMetrics.vulnerabilitiesCount} {codeQualityMetrics.vulnerabilitiesCount === 1 ? 'issue' : 'issues'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Code Smells
                  </Typography>
                  <Typography variant="h6">
                    {codeQualityMetrics.codeSmellsCount} {codeQualityMetrics.codeSmellsCount === 1 ? 'issue' : 'issues'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Test Coverage
                  </Typography>
                  <Typography variant="h6">
                    {codeQualityMetrics.testCoverage}%
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
        
        {/* Task Distribution */}
        {tasks.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Task Distribution
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {prepareTaskDistributionData() ? (
                    <Box sx={{ height: 250 }}>
                      <Doughnut 
                        data={prepareTaskDistributionData()} 
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                      <Typography variant="body1" color="text.secondary">
                        No task data available
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom>
                    Task Summary
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Total Tasks" 
                        secondary={tasks.length} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Completed Tasks" 
                        secondary={tasks.filter(task => task.status === 'Done' || task.status === 'Verified').length} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Completion Rate" 
                        secondary={`${Math.round((tasks.filter(task => task.status === 'Done' || task.status === 'Verified').length / tasks.length) * 100)}%`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Average Difficulty" 
                        secondary={
                          tasks.reduce((acc, task) => {
                            const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 };
                            return acc + difficultyMap[task.difficulty];
                          }, 0) / tasks.length
                        } 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
        
        {/* GitHub Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              GitHub Activity
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      {commits.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Commits
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      {pullRequests.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pull Requests
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                  Lines of Code Changed
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="success.main">
                      Added: {commits.reduce((acc, commit) => acc + commit.additions, 0)}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      Deleted: {commits.reduce((acc, commit) => acc + commit.deletions, 0)}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {commits.reduce((acc, commit) => acc + commit.additions + commit.deletions, 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Tasks List */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Tasks ({tasks.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {tasks.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Difficulty</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task._id} hover>
                          <TableCell>{task.jiloId}</TableCell>
                          <TableCell>{task.title}</TableCell>
                          <TableCell>
                            <Chip 
                              label={task.type} 
                              color={task.type === 'Bug' ? 'error' : task.type === 'Feature' ? 'primary' : 'default'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{task.difficulty}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getTaskStatusIcon(task.status)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {task.status}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No tasks found for this evaluation period.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Commits List */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Commits ({commits.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {commits.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Hash</TableCell>
                        <TableCell>Message</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Changes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {commits.map((commit) => (
                        <TableRow key={commit._id} hover>
                          <TableCell>{commit.hash.substring(0, 7)}</TableCell>
                          <TableCell>{commit.message}</TableCell>
                          <TableCell>{new Date(commit.date).toLocaleString()}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main" component="span">
                              +{commit.additions}
                            </Typography>
                            <Typography variant="body2" component="span"> / </Typography>
                            <Typography variant="body2" color="error.main" component="span">
                              -{commit.deletions}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No commits found for this evaluation period.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Pull Requests List */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Pull Requests ({pullRequests.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {pullRequests.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Merged</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pullRequests.map((pr) => (
                        <TableRow key={pr._id} hover>
                          <TableCell>{pr.title}</TableCell>
                          <TableCell>
                            <Chip 
                              label={pr.state} 
                              color={pr.state === 'merged' ? 'success' : pr.state === 'open' ? 'warning' : 'default'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{new Date(pr.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            {pr.mergedAt ? new Date(pr.mergedAt).toLocaleString() : 'Not merged'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No pull requests found for this evaluation period.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Feedback */}
        {evaluation.feedback && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Feedback
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="body1" paragraph>
                {evaluation.feedback}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EvaluationDetail;
