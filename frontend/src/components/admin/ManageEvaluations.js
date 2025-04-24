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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

// Validation schema for evaluation creation/edit
const EvaluationSchema = Yup.object().shape({
  developerId: Yup.string()
    .required('Developer is required'),
  startDate: Yup.date()
    .required('Start date is required'),
  endDate: Yup.date()
    .required('End date is required')
    .min(
      Yup.ref('startDate'),
      'End date must be after start date'
    ),
  description: Yup.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .required('Description is required')
});

const ManageEvaluations = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [sortField, setSortField] = useState('endDate'); // 'startDate', 'endDate', 'status'
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState(null);
  const [openRunDialog, setOpenRunDialog] = useState(false);
  const [evaluationToRun, setEvaluationToRun] = useState(null);
  const [runningEvaluation, setRunningEvaluation] = useState(false);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch all evaluations
        const evaluationsResponse = await axios.get('/api/evaluations');
        setEvaluations(evaluationsResponse.data.data);
        setFilteredEvaluations(evaluationsResponse.data.data);
        setTotalPages(Math.ceil(evaluationsResponse.data.data.length / rowsPerPage));
        
        // Fetch all developers for the dropdown
        const developersResponse = await axios.get('/api/admin/users?role=developer');
        setDevelopers(developersResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'hr')) {
      fetchData();
    }
  }, [currentUser]);

  useEffect(() => {
    // Filter evaluations based on search term and status filter
    let filtered = [...evaluations];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(evaluation => 
        evaluation.developer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(evaluation => evaluation.status === statusFilter);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === 'startDate') {
        valueA = new Date(a.period.startDate);
        valueB = new Date(b.period.startDate);
      } else if (sortField === 'endDate') {
        valueA = new Date(a.period.endDate);
        valueB = new Date(b.period.endDate);
      } else if (sortField === 'status') {
        valueA = a.status;
        valueB = b.status;
      } else {
        valueA = a.createdAt;
        valueB = b.createdAt;
      }
      
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredEvaluations(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, sortOrder, sortField, evaluations]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSortFieldChange = (field) => {
    if (sortField === field) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleAddEvaluation = () => {
    setDialogMode('add');
    setCurrentEvaluation(null);
    setOpenDialog(true);
  };

  const handleEditEvaluation = (evaluation) => {
    setDialogMode('edit');
    setCurrentEvaluation(evaluation);
    setOpenDialog(true);
  };

  const handleDeleteEvaluation = (evaluation) => {
    setEvaluationToDelete(evaluation);
    setOpenDeleteDialog(true);
  };

  const handleRunEvaluation = (evaluation) => {
    setEvaluationToRun(evaluation);
    setOpenRunDialog(true);
  };

  const handleViewEvaluation = (id) => {
    navigate(`/admin/evaluations/${id}`);
  };

  const confirmDeleteEvaluation = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(`/api/evaluations/${evaluationToDelete._id}`);
      
      // Update evaluations list
      setEvaluations(evaluations.filter(evaluation => evaluation._id !== evaluationToDelete._id));
      setSuccess(`Evaluation for ${evaluationToDelete.developer?.name} deleted successfully`);
      setOpenDeleteDialog(false);
      setEvaluationToDelete(null);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      setError('Failed to delete evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmRunEvaluation = async () => {
    setRunningEvaluation(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post(`/api/evaluations/${evaluationToRun._id}/process`);
      
      // Update evaluation status
      const updatedEvaluations = evaluations.map(evaluation => {
        if (evaluation._id === evaluationToRun._id) {
          return { ...evaluation, status: 'completed' };
        }
        return evaluation;
      });
      
      setEvaluations(updatedEvaluations);
      setSuccess(`Evaluation for ${evaluationToRun.developer?.name} completed successfully`);
      setOpenRunDialog(false);
      setEvaluationToRun(null);
    } catch (error) {
      console.error('Error running evaluation:', error);
      setError('Failed to run evaluation. Please try again.');
    } finally {
      setRunningEvaluation(false);
    }
  };

  const handleSubmitEvaluation = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (dialogMode === 'add') {
        // Create new evaluation
        const response = await axios.post('/api/evaluations', {
          developerId: values.developerId,
          startDate: values.startDate,
          endDate: values.endDate,
          description: values.description
        });
        setEvaluations([...evaluations, response.data.data]);
        setSuccess('Evaluation created successfully');
      } else {
        // Update existing evaluation
        const response = await axios.put(`/api/evaluations/${currentEvaluation._id}`, {
          developerId: values.developerId,
          period: {
            startDate: values.startDate,
            endDate: values.endDate
          },
          description: values.description
        });
        setEvaluations(evaluations.map(evaluation => 
          evaluation._id === currentEvaluation._id ? response.data.data : evaluation
        ));
        setSuccess('Evaluation updated successfully');
      }
      
      resetForm();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error managing evaluation:', error);
      setError(error.response?.data?.error || 'Failed to manage evaluation. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
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

  // Get paginated evaluations
  const paginatedEvaluations = filteredEvaluations.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading && evaluations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Manage Evaluations
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Evaluations ({filteredEvaluations.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddEvaluation}
            >
              New Evaluation
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {filteredEvaluations.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Developer</TableCell>
                    <TableCell 
                      onClick={() => handleSortFieldChange('startDate')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Start Date
                        {sortField === 'startDate' && (
                          <SortIcon sx={{ ml: 0.5, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSortFieldChange('endDate')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        End Date
                        {sortField === 'endDate' && (
                          <SortIcon sx={{ ml: 0.5, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSortFieldChange('status')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Status
                        {sortField === 'status' && (
                          <SortIcon sx={{ ml: 0.5, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEvaluations.map((evaluation) => (
                    <TableRow key={evaluation._id} hover>
                      <TableCell>{evaluation.developer?.name || 'Unknown'}</TableCell>
                      <TableCell>{new Date(evaluation.period.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(evaluation.period.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={evaluation.status} 
                          color={getStatusChipColor(evaluation.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {evaluation.status === 'completed' ? evaluation.overallScore : '-'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewEvaluation(evaluation._id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {evaluation.status === 'pending' && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleEditEvaluation(evaluation)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Run Evaluation">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleRunEvaluation(evaluation)}
                                >
                                  <PlayArrowIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteEvaluation(evaluation)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
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
      
      {/* Add/Edit Evaluation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Create New Evaluation' : 'Edit Evaluation'}
        </DialogTitle>
        <Formik
          initialValues={{
            developerId: currentEvaluation?.developer?._id || '',
            startDate: currentEvaluation ? new Date(currentEvaluation.period.startDate) : new Date(),
            endDate: currentEvaluation ? new Date(currentEvaluation.period.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
            description: currentEvaluation?.description || ''
          }}
          validationSchema={EvaluationSchema}
          onSubmit={handleSubmitEvaluation}
          enableReinitialize
        >
          {({ errors, touched, isSubmitting, values, setFieldValue }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={touched.developerId && Boolean(errors.developerId)}>
                      <InputLabel id="developer-label">Developer</InputLabel>
                      <Select
                        labelId="developer-label"
                        value={values.developerId}
                        label="Developer"
                        onChange={(e) => setFieldValue('developerId', e.target.value)}
                        disabled={loading || isSubmitting}
                      >
                        {developers.map((developer) => (
                          <MenuItem key={developer._id} value={developer._id}>
                            {developer.name} ({developer.email})
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.developerId && errors.developerId && (
                        <FormHelperText>{errors.developerId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={values.startDate}
                        onChange={(newValue) => {
                          setFieldValue('startDate', newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            error={touched.startDate && Boolean(errors.startDate)}
                            helperText={touched.startDate && errors.startDate}
                          />
                        )}
                        disabled={loading || isSubmitting}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={values.endDate}
                        onChange={(newValue) => {
                          setFieldValue('endDate', newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            error={touched.endDate && Boolean(errors.endDate)}
                            helperText={touched.endDate && errors.endDate}
                          />
                        )}
                        disabled={loading || isSubmitting}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Description"
                      multiline
                      rows={4}
                      fullWidth
                      variant="outlined"
                      value={values.description}
                      onChange={(e) => setFieldValue('description', e.target.value)}
                      error={touched.description && Boolean(errors.description)}
                      helperText={touched.description && errors.description}
                      disabled={loading || isSubmitting}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)} disabled={loading || isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading || isSubmitting}
                  startIcon={dialogMode === 'add' ? <AddIcon /> : <EditIcon />}
                >
                  {loading || isSubmitting ? <CircularProgress size={24} /> : dialogMode === 'add' ? 'Create Evaluation' : 'Update Evaluation'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the evaluation for <strong>{evaluationToDelete?.developer?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteEvaluation} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Run Evaluation Dialog */}
      <Dialog open={openRunDialog} onClose={() => setOpenRunDialog(false)}>
        <DialogTitle>Run Evaluation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to run the evaluation for <strong>{evaluationToRun?.developer?.name}</strong>? This will process all data for the evaluation period and calculate the final score.
          </DialogContentText>
          <Alert severity="info" sx={{ mt: 2 }}>
            This process will analyze GitHub activity, Jilo tasks, code quality metrics, and other data sources to generate a comprehensive evaluation.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRunDialog(false)} disabled={runningEvaluation}>
            Cancel
          </Button>
          <Button 
            onClick={confirmRunEvaluation} 
            color="primary" 
            variant="contained"
            disabled={runningEvaluation}
            startIcon={runningEvaluation ? <CircularProgress size={20} /> : <PlayArrowIcon />}
          >
            {runningEvaluation ? 'Processing...' : 'Run Evaluation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageEvaluations;
