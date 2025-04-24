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
  Tooltip,
  Slider,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningIcon from '@mui/icons-material/Warning';

// Validation schema for reward rules
const RewardRuleSchema = Yup.object().shape({
  name: Yup.string()
    .required('Rule name is required'),
  description: Yup.string()
    .required('Description is required'),
  category: Yup.string()
    .oneOf(['task', 'code', 'collaboration', 'cicd', 'knowledge'], 'Invalid category')
    .required('Category is required'),
  metricType: Yup.string()
    .oneOf(['count', 'percentage', 'boolean'], 'Invalid metric type')
    .required('Metric type is required'),
  tokenAmount: Yup.number()
    .positive('Token amount must be positive')
    .required('Token amount is required'),
  enabled: Yup.boolean(),
  conditions: Yup.object().shape({
    minValue: Yup.number()
      .when('metricType', {
        is: (type) => type === 'count' || type === 'percentage',
        then: Yup.number().required('Minimum value is required'),
        otherwise: Yup.number().nullable()
      }),
    maxValue: Yup.number()
      .when('metricType', {
        is: (type) => type === 'count' || type === 'percentage',
        then: Yup.number().required('Maximum value is required'),
        otherwise: Yup.number().nullable()
      }),
    difficulty: Yup.string()
      .oneOf(['any', 'easy', 'medium', 'hard'], 'Invalid difficulty')
      .when('category', {
        is: 'task',
        then: Yup.string().required('Difficulty is required'),
        otherwise: Yup.string().nullable()
      }),
    taskType: Yup.string()
      .oneOf(['any', 'feature', 'bug', 'improvement'], 'Invalid task type')
      .when('category', {
        is: 'task',
        then: Yup.string().required('Task type is required'),
        otherwise: Yup.string().nullable()
      })
  })
});

const RewardRules = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rules, setRules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentRule, setCurrentRule] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [openSimulationDialog, setOpenSimulationDialog] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get('/api/admin/rules');
        // Convert the rules object to an array of rule objects
        if (response.data.data && typeof response.data.data === 'object') {
          // If it's an object, convert it to an array of rule objects
          const rulesArray = [];
          
          // Add a dummy ID for each rule
          let id = 1;
          
          // Process each category
          Object.entries(response.data.data).forEach(([category, values]) => {
            if (typeof values === 'object') {
              // For nested objects like taskCompletion, codeQuality, etc.
              Object.entries(values).forEach(([name, value]) => {
                rulesArray.push({
                  _id: `rule_${id++}`,
                  name: `${category}_${name}`,
                  description: `Rule for ${category} - ${name}`,
                  category: category,
                  metricType: typeof value === 'number' ? 'count' : 'boolean',
                  tokenAmount: typeof value === 'number' ? value : 1,
                  enabled: true,
                  conditions: {}
                });
              });
            } else {
              // For direct values like baseRewardMultiplier, stakingAPY
              rulesArray.push({
                _id: `rule_${id++}`,
                name: category,
                description: `Rule for ${category}`,
                category: 'general',
                metricType: 'count',
                tokenAmount: typeof values === 'number' ? values : 1,
                enabled: true,
                conditions: {}
              });
            }
          });
          
          setRules(rulesArray);
        } else {
          // If it's already an array, use it directly
          setRules(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching reward rules:', error);
        setError('Failed to load reward rules. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && currentUser.role === 'admin') {
      fetchRules();
    }
  }, [currentUser]);

  const handleAddRule = () => {
    setDialogMode('add');
    setCurrentRule(null);
    setOpenDialog(true);
  };

  const handleEditRule = (rule) => {
    setDialogMode('edit');
    setCurrentRule(rule);
    setOpenDialog(true);
  };

  const handleDeleteRule = (rule) => {
    setRuleToDelete(rule);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteRule = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(`/api/admin/rules/${ruleToDelete._id}`);
      
      // Update rules list
      setRules(rules.filter(rule => rule._id !== ruleToDelete._id));
      setSuccess(`Rule "${ruleToDelete.name}" deleted successfully`);
      setOpenDeleteDialog(false);
      setRuleToDelete(null);
    } catch (error) {
      console.error('Error deleting rule:', error);
      setError('Failed to delete rule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRule = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (dialogMode === 'add') {
        // Create new rule
        const response = await axios.post('/api/admin/rules', values);
        setRules([...rules, response.data.data]);
        setSuccess('Reward rule created successfully');
      } else {
        // Update existing rule
        const response = await axios.put(`/api/admin/rules/${currentRule._id}`, values);
        setRules(rules.map(rule => rule._id === currentRule._id ? response.data.data : rule));
        setSuccess('Reward rule updated successfully');
      }
      
      resetForm();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error managing reward rule:', error);
      setError(error.response?.data?.error || 'Failed to manage reward rule. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimulationLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/admin/rules/simulate');
      setSimulationResults(response.data.data);
      setOpenSimulationDialog(true);
    } catch (error) {
      console.error('Error running simulation:', error);
      setError('Failed to run simulation. Please try again.');
    } finally {
      setSimulationLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'task':
        return 'Task Completion';
      case 'code':
        return 'Code Quality';
      case 'collaboration':
        return 'Collaboration';
      case 'cicd':
        return 'CI/CD Success';
      case 'knowledge':
        return 'Knowledge Sharing';
      default:
        return category;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'task':
        return 'primary';
      case 'code':
        return 'success';
      case 'collaboration':
        return 'info';
      case 'cicd':
        return 'warning';
      case 'knowledge':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getMetricTypeLabel = (type) => {
    switch (type) {
      case 'count':
        return 'Count';
      case 'percentage':
        return 'Percentage';
      case 'boolean':
        return 'Boolean';
      default:
        return type;
    }
  };

  if (loading && rules.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Reward Rules
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
            Reward Rules Configuration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleRunSimulation}
              disabled={simulationLoading || rules.length === 0}
              startIcon={simulationLoading ? <CircularProgress size={20} /> : null}
            >
              Run Simulation
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddRule}
            >
              Add Rule
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Rules
                  </Typography>
                  <Typography variant="h3">
                    {rules.length}
                  </Typography>
                  <Typography variant="body2">
                    Active: {rules.filter(rule => rule.enabled).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Reward
                  </Typography>
                  <Typography variant="h3">
                    {rules.length > 0 ? Math.round(rules.reduce((acc, rule) => acc + rule.tokenAmount, 0) / rules.length) : 0}
                  </Typography>
                  <Typography variant="body2">
                    Tokens per rule
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Categories
                  </Typography>
                  <Typography variant="h3">
                    {new Set(rules.map(rule => rule.category)).size}
                  </Typography>
                  <Typography variant="body2">
                    Different rule categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Rules List
          </Typography>
          
          {rules.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Metric Type</TableCell>
                    <TableCell>Token Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule._id} hover>
                      <TableCell>
                        <Tooltip title={rule.description}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {rule.name}
                            <InfoIcon fontSize="small" sx={{ ml: 1, opacity: 0.5 }} />
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getCategoryLabel(rule.category)} 
                          color={getCategoryColor(rule.category)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{getMetricTypeLabel(rule.metricType)}</TableCell>
                      <TableCell>{rule.tokenAmount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={rule.enabled ? 'Active' : 'Inactive'} 
                          color={rule.enabled ? 'success' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditRule(rule)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteRule(rule)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No reward rules found. Click "Add Rule" to create your first rule.
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Rule Categories Explanation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Task Completion
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Rewards developers for completing tasks in the Jilo system. Rules can be configured based on task difficulty, type, and completion status.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Code Quality
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Rewards developers for maintaining high code quality standards. Metrics include code coverage, reduced bugs, and code complexity.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Collaboration
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Rewards developers for collaborative activities such as code reviews, PR approvals, and helping other team members.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    CI/CD Success
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Rewards developers for successful builds, deployments, and maintaining CI/CD pipeline health.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Knowledge Sharing
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Rewards developers for contributing to documentation, knowledge base, and sharing expertise with the team.
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Paper>
      
      {/* Add/Edit Rule Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Reward Rule' : 'Edit Reward Rule'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: currentRule?.name || '',
            description: currentRule?.description || '',
            category: currentRule?.category || 'task',
            metricType: currentRule?.metricType || 'count',
            tokenAmount: currentRule?.tokenAmount || 10,
            enabled: currentRule?.enabled !== undefined ? currentRule.enabled : true,
            conditions: {
              minValue: currentRule?.conditions?.minValue || 0,
              maxValue: currentRule?.conditions?.maxValue || 100,
              difficulty: currentRule?.conditions?.difficulty || 'any',
              taskType: currentRule?.conditions?.taskType || 'any'
            }
          }}
          validationSchema={RewardRuleSchema}
          onSubmit={handleSubmitRule}
          enableReinitialize
        >
          {({ errors, touched, isSubmitting, values, setFieldValue }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      name="name"
                      label="Rule Name"
                      fullWidth
                      variant="outlined"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      disabled={loading || isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="category-label">Category</InputLabel>
                      <Select
                        labelId="category-label"
                        name="category"
                        value={values.category}
                        onChange={(e) => setFieldValue('category', e.target.value)}
                        label="Category"
                        disabled={loading || isSubmitting}
                      >
                        <MenuItem value="task">Task Completion</MenuItem>
                        <MenuItem value="code">Code Quality</MenuItem>
                        <MenuItem value="collaboration">Collaboration</MenuItem>
                        <MenuItem value="cicd">CI/CD Success</MenuItem>
                        <MenuItem value="knowledge">Knowledge Sharing</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="description"
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      error={touched.description && Boolean(errors.description)}
                      helperText={touched.description && errors.description}
                      disabled={loading || isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="metric-type-label">Metric Type</InputLabel>
                      <Select
                        labelId="metric-type-label"
                        name="metricType"
                        value={values.metricType}
                        onChange={(e) => setFieldValue('metricType', e.target.value)}
                        label="Metric Type"
                        disabled={loading || isSubmitting}
                      >
                        <MenuItem value="count">Count</MenuItem>
                        <MenuItem value="percentage">Percentage</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      name="tokenAmount"
                      label="Token Amount"
                      type="number"
                      fullWidth
                      variant="outlined"
                      error={touched.tokenAmount && Boolean(errors.tokenAmount)}
                      helperText={touched.tokenAmount && errors.tokenAmount}
                      disabled={loading || isSubmitting}
                    />
                  </Grid>
                  
                  {/* Conditional fields based on category and metric type */}
                  {values.metricType !== 'boolean' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          name="conditions.minValue"
                          label="Minimum Value"
                          type="number"
                          fullWidth
                          variant="outlined"
                          error={touched.conditions?.minValue && Boolean(errors.conditions?.minValue)}
                          helperText={touched.conditions?.minValue && errors.conditions?.minValue}
                          disabled={loading || isSubmitting}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          name="conditions.maxValue"
                          label="Maximum Value"
                          type="number"
                          fullWidth
                          variant="outlined"
                          error={touched.conditions?.maxValue && Boolean(errors.conditions?.maxValue)}
                          helperText={touched.conditions?.maxValue && errors.conditions?.maxValue}
                          disabled={loading || isSubmitting}
                        />
                      </Grid>
                    </>
                  )}
                  
                  {values.category === 'task' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="difficulty-label">Task Difficulty</InputLabel>
                          <Select
                            labelId="difficulty-label"
                            name="conditions.difficulty"
                            value={values.conditions.difficulty}
                            onChange={(e) => setFieldValue('conditions.difficulty', e.target.value)}
                            label="Task Difficulty"
                            disabled={loading || isSubmitting}
                          >
                            <MenuItem value="any">Any Difficulty</MenuItem>
                            <MenuItem value="easy">Easy</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="hard">Hard</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="task-type-label">Task Type</InputLabel>
                          <Select
                            labelId="task-type-label"
                            name="conditions.taskType"
                            value={values.conditions.taskType}
                            onChange={(e) => setFieldValue('conditions.taskType', e.target.value)}
                            label="Task Type"
                            disabled={loading || isSubmitting}
                          >
                            <MenuItem value="any">Any Type</MenuItem>
                            <MenuItem value="feature">Feature</MenuItem>
                            <MenuItem value="bug">Bug</MenuItem>
                            <MenuItem value="improvement">Improvement</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth component="fieldset">
                      <Typography id="token-slider" gutterBottom>
                        Token Amount: {values.tokenAmount}
                      </Typography>
                      <Slider
                        value={values.tokenAmount}
                        onChange={(e, newValue) => setFieldValue('tokenAmount', newValue)}
                        aria-labelledby="token-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={100}
                        disabled={loading || isSubmitting}
                      />
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth component="fieldset">
                      <Typography component="div" variant="body2">
                        Rule Status
                      </Typography>
                      <Chip 
                        label={values.enabled ? 'Active' : 'Inactive'} 
                        color={values.enabled ? 'success' : 'default'} 
                        onClick={() => setFieldValue('enabled', !values.enabled)}
                        sx={{ mt: 1 }}
                      />
                    </FormControl>
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
                  startIcon={loading || isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {dialogMode === 'add' ? 'Add Rule' : 'Update Rule'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Delete Rule
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the rule <strong>{ruleToDelete?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteRule} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Simulation Results Dialog */}
      <Dialog open={openSimulationDialog} onClose={() => setOpenSimulationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reward Rules Simulation Results</DialogTitle>
        <DialogContent>
          {simulationResults ? (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Simulation Summary
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Developers
                      </Typography>
                      <Typography variant="h3">
                        {simulationResults.totalDevelopers}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Tokens
                      </Typography>
                      <Typography variant="h3">
                        {simulationResults.totalTokens}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Average Per Developer
                      </Typography>
                      <Typography variant="h3">
                        {Math.round(simulationResults.totalTokens / simulationResults.totalDevelopers)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom>
                Developer Breakdown
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Developer</TableCell>
                      <TableCell>Task Tokens</TableCell>
                      <TableCell>Code Tokens</TableCell>
                      <TableCell>Collaboration Tokens</TableCell>
                      <TableCell>CI/CD Tokens</TableCell>
                      <TableCell>Knowledge Tokens</TableCell>
                      <TableCell>Total Tokens</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {simulationResults.developerBreakdown.map((dev) => (
                      <TableRow key={dev.developerId}>
                        <TableCell>{dev.developerName}</TableCell>
                        <TableCell>{dev.taskTokens}</TableCell>
                        <TableCell>{dev.codeTokens}</TableCell>
                        <TableCell>{dev.collaborationTokens}</TableCell>
                        <TableCell>{dev.cicdTokens}</TableCell>
                        <TableCell>{dev.knowledgeTokens}</TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">
                            {dev.totalTokens}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSimulationDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RewardRules;
