import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Pagination
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Evaluations = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchEvaluations = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(`/api/evaluations/developer/${currentUser._id}`);
        const sortedEvaluations = response.data.data.sort((a, b) => {
          return new Date(b.period.endDate) - new Date(a.period.endDate);
        });
        
        setEvaluations(sortedEvaluations);
        setFilteredEvaluations(sortedEvaluations);
        setTotalPages(Math.ceil(sortedEvaluations.length / rowsPerPage));
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        setError('Failed to load evaluations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchEvaluations();
    }
  }, [currentUser]);

  useEffect(() => {
    // Filter evaluations based on search term and tab value
    let filtered = [...evaluations];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(evaluation => 
        evaluation.period.startDate.includes(searchTerm) ||
        evaluation.period.endDate.includes(searchTerm) ||
        evaluation.status.includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply tab filter
    if (tabValue === 1) { // Completed
      filtered = filtered.filter(evaluation => evaluation.status === 'completed');
    } else if (tabValue === 2) { // Pending
      filtered = filtered.filter(evaluation => evaluation.status === 'pending');
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.period.endDate);
      const dateB = new Date(b.period.endDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredEvaluations(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, tabValue, sortOrder, evaluations]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleViewEvaluation = (id) => {
    navigate(`/evaluations/${id}`);
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

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'evaluation-score-high';
    if (score >= 60) return 'evaluation-score-medium';
    return 'evaluation-score-low';
  };

  // Prepare chart data for evaluation history
  const prepareEvaluationHistoryData = () => {
    if (!evaluations || evaluations.length === 0) {
      return null;
    }
    
    // Sort by date for chronological display
    const sortedEvaluations = [...evaluations]
      .filter(evaluation => evaluation.status === 'completed')
      .sort((a, b) => new Date(a.period.endDate) - new Date(b.period.endDate));
    
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

  // Get paginated evaluations
  const paginatedEvaluations = filteredEvaluations.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Evaluations
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Performance Trend Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Trend
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
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
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Score: ${context.raw}`;
                          }
                        }
                      }
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  Not enough evaluation data to display performance trend
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Evaluations List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Evaluation History
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="Search evaluations..."
                  size="small"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton onClick={toggleSortOrder} color="primary">
                  <SortIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="All" />
              <Tab label="Completed" />
              <Tab label="Pending" />
            </Tabs>
            
            <Divider sx={{ mb: 2 }} />
            
            {filteredEvaluations.length > 0 ? (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Tokens Earned</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedEvaluations.map((evaluation) => (
                        <TableRow key={evaluation._id} hover>
                          <TableCell>
                            {new Date(evaluation.period.startDate).toLocaleDateString()} - {new Date(evaluation.period.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {evaluation.status === 'completed' ? (
                              <Typography className={getScoreColorClass(evaluation.overallScore)}>
                                {evaluation.overallScore}
                              </Typography>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={evaluation.status} 
                              color={getStatusChipColor(evaluation.status)} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {evaluation.tokensEarned || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewEvaluation(evaluation._id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary" 
                  />
                </Box>
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No evaluations found matching your criteria.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Evaluations;
