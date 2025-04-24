import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningIcon from '@mui/icons-material/Warning';

// Validation schema for system configuration
const SystemConfigSchema = Yup.object().shape({
  // GitHub Integration
  githubApiKey: Yup.string()
    .required('GitHub API Key is required'),
  githubOrganization: Yup.string()
    .required('GitHub Organization is required'),
  
  // Jilo Integration
  jiloApiKey: Yup.string()
    .required('Jilo API Key is required'),
  jiloProjectId: Yup.string()
    .required('Jilo Project ID is required'),
  
  // CI/CD Integration
  cicdProvider: Yup.string()
    .oneOf(['jenkins', 'github-actions', 'gitlab-ci'], 'Invalid CI/CD Provider')
    .required('CI/CD Provider is required'),
  cicdApiKey: Yup.string()
    .required('CI/CD API Key is required'),
  cicdUrl: Yup.string()
    .url('Must be a valid URL')
    .required('CI/CD URL is required'),
  
  // Code Quality Integration
  codeQualityProvider: Yup.string()
    .oneOf(['sonarqube', 'codeclimate'], 'Invalid Code Quality Provider')
    .required('Code Quality Provider is required'),
  codeQualityApiKey: Yup.string()
    .required('Code Quality API Key is required'),
  codeQualityUrl: Yup.string()
    .url('Must be a valid URL')
    .required('Code Quality URL is required'),
  
  // Blockchain Integration
  blockchainNetwork: Yup.string()
    .oneOf(['ethereum', 'polygon', 'arbitrum', 'hyperledger'], 'Invalid Blockchain Network')
    .required('Blockchain Network is required'),
  blockchainRpcUrl: Yup.string()
    .url('Must be a valid URL')
    .required('Blockchain RPC URL is required'),
  contractAddress: Yup.string()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
    .required('Contract Address is required'),
  adminWalletAddress: Yup.string()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
    .required('Admin Wallet Address is required'),
  
  // Email Configuration
  emailProvider: Yup.string()
    .oneOf(['smtp', 'sendgrid', 'mailgun'], 'Invalid Email Provider')
    .required('Email Provider is required'),
  emailApiKey: Yup.string()
    .required('Email API Key is required'),
  emailFromAddress: Yup.string()
    .email('Invalid email address')
    .required('From Email Address is required'),
  
  // System Settings
  systemName: Yup.string()
    .required('System Name is required'),
  evaluationPeriod: Yup.number()
    .positive('Must be a positive number')
    .required('Evaluation Period is required'),
  enableAutoEvaluations: Yup.boolean(),
  enableNotifications: Yup.boolean(),
  enableStaking: Yup.boolean(),
  stakingAPY: Yup.number()
    .min(0, 'Must be at least 0')
    .max(100, 'Must be at most 100')
    .required('Staking APY is required'),
});

const SystemConfig = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState(null);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get('/api/admin/config');
        setConfig(response.data.data);
      } catch (error) {
        console.error('Error fetching system configuration:', error);
        setError('Failed to load system configuration. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && currentUser.role === 'admin') {
      fetchConfig();
    }
  }, [currentUser]);

  const handleSaveConfig = async (values, { setSubmitting }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.put('/api/admin/config', values);
      setConfig(response.data.data);
      setSuccess('System configuration saved successfully');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error saving system configuration:', error);
      setError('Failed to save system configuration. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleResetConfig = async () => {
    setResetLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('/api/admin/config/reset');
      setConfig(response.data.data);
      setSuccess('System configuration reset to defaults successfully');
      setOpenResetDialog(false);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error resetting system configuration:', error);
      setError('Failed to reset system configuration. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setResetLoading(false);
    }
  };

  const handleTestConnection = async (type) => {
    setTestingConnection(true);
    setTestConnectionResult(null);
    
    try {
      const response = await axios.post(`/api/admin/config/test/${type}`);
      setTestConnectionResult({
        success: response.data.success,
        message: response.data.message
      });
    } catch (error) {
      console.error(`Error testing ${type} connection:`, error);
      setTestConnectionResult({
        success: false,
        message: error.response?.data?.error || `Failed to test ${type} connection. Please try again.`
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading && !config) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        System Configuration
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
      
      {testConnectionResult && (
        <Alert 
          severity={testConnectionResult.success ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setTestConnectionResult(null)}
        >
          {testConnectionResult.message}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Configuration Settings
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RefreshIcon />}
            onClick={() => setOpenResetDialog(true)}
          >
            Reset to Defaults
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {config && (
          <Formik
            initialValues={{
              // GitHub Integration
              githubApiKey: config.github?.apiKey || '',
              githubOrganization: config.github?.organization || '',
              
              // Jilo Integration
              jiloApiKey: config.jilo?.apiKey || '',
              jiloProjectId: config.jilo?.projectId || '',
              
              // CI/CD Integration
              cicdProvider: config.cicd?.provider || 'github-actions',
              cicdApiKey: config.cicd?.apiKey || '',
              cicdUrl: config.cicd?.url || '',
              
              // Code Quality Integration
              codeQualityProvider: config.codeQuality?.provider || 'sonarqube',
              codeQualityApiKey: config.codeQuality?.apiKey || '',
              codeQualityUrl: config.codeQuality?.url || '',
              
              // Blockchain Integration
              blockchainNetwork: config.blockchain?.network || 'polygon',
              blockchainRpcUrl: config.blockchain?.rpcUrl || '',
              contractAddress: config.blockchain?.contractAddress || '',
              adminWalletAddress: config.blockchain?.adminWalletAddress || '',
              
              // Email Configuration
              emailProvider: config.email?.provider || 'smtp',
              emailApiKey: config.email?.apiKey || '',
              emailFromAddress: config.email?.fromAddress || '',
              
              // System Settings
              systemName: config.system?.name || 'Developer Evaluation System',
              evaluationPeriod: config.system?.evaluationPeriod || 30,
              enableAutoEvaluations: config.system?.enableAutoEvaluations !== undefined ? config.system.enableAutoEvaluations : true,
              enableNotifications: config.system?.enableNotifications !== undefined ? config.system.enableNotifications : true,
              enableStaking: config.system?.enableStaking !== undefined ? config.system.enableStaking : true,
              stakingAPY: config.system?.stakingAPY || 5,
            }}
            validationSchema={SystemConfigSchema}
            onSubmit={handleSaveConfig}
          >
            {({ errors, touched, isSubmitting, values, setFieldValue }) => (
              <Form>
                <Box sx={{ mb: 4 }}>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">System Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="systemName"
                            label="System Name"
                            fullWidth
                            variant="outlined"
                            error={touched.systemName && Boolean(errors.systemName)}
                            helperText={touched.systemName && errors.systemName}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="evaluationPeriod"
                            label="Default Evaluation Period (days)"
                            type="number"
                            fullWidth
                            variant="outlined"
                            error={touched.evaluationPeriod && Boolean(errors.evaluationPeriod)}
                            helperText={touched.evaluationPeriod && errors.evaluationPeriod}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={values.enableAutoEvaluations}
                                onChange={(e) => setFieldValue('enableAutoEvaluations', e.target.checked)}
                                color="primary"
                                disabled={loading || isSubmitting}
                              />
                            }
                            label="Enable Automatic Evaluations"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={values.enableNotifications}
                                onChange={(e) => setFieldValue('enableNotifications', e.target.checked)}
                                color="primary"
                                disabled={loading || isSubmitting}
                              />
                            }
                            label="Enable Email Notifications"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={values.enableStaking}
                                onChange={(e) => setFieldValue('enableStaking', e.target.checked)}
                                color="primary"
                                disabled={loading || isSubmitting}
                              />
                            }
                            label="Enable Token Staking"
                          />
                        </Grid>
                        {values.enableStaking && (
                          <Grid item xs={12} md={6}>
                            <Field
                              as={TextField}
                              name="stakingAPY"
                              label="Staking APY (%)"
                              type="number"
                              fullWidth
                              variant="outlined"
                              error={touched.stakingAPY && Boolean(errors.stakingAPY)}
                              helperText={touched.stakingAPY && errors.stakingAPY}
                              disabled={loading || isSubmitting}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">GitHub Integration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleTestConnection('github')}
                              disabled={testingConnection || !values.githubApiKey || !values.githubOrganization}
                              startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                            >
                              Test Connection
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="githubApiKey"
                            label="GitHub API Key"
                            fullWidth
                            variant="outlined"
                            error={touched.githubApiKey && Boolean(errors.githubApiKey)}
                            helperText={touched.githubApiKey && errors.githubApiKey}
                            disabled={loading || isSubmitting}
                            type="password"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="githubOrganization"
                            label="GitHub Organization"
                            fullWidth
                            variant="outlined"
                            error={touched.githubOrganization && Boolean(errors.githubOrganization)}
                            helperText={touched.githubOrganization && errors.githubOrganization}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Jilo Integration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleTestConnection('jilo')}
                              disabled={testingConnection || !values.jiloApiKey || !values.jiloProjectId}
                              startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                            >
                              Test Connection
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="jiloApiKey"
                            label="Jilo API Key"
                            fullWidth
                            variant="outlined"
                            error={touched.jiloApiKey && Boolean(errors.jiloApiKey)}
                            helperText={touched.jiloApiKey && errors.jiloApiKey}
                            disabled={loading || isSubmitting}
                            type="password"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="jiloProjectId"
                            label="Jilo Project ID"
                            fullWidth
                            variant="outlined"
                            error={touched.jiloProjectId && Boolean(errors.jiloProjectId)}
                            helperText={touched.jiloProjectId && errors.jiloProjectId}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">CI/CD Integration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleTestConnection('cicd')}
                              disabled={testingConnection || !values.cicdApiKey || !values.cicdUrl}
                              startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                            >
                              Test Connection
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel id="cicd-provider-label">CI/CD Provider</InputLabel>
                            <Select
                              labelId="cicd-provider-label"
                              name="cicdProvider"
                              value={values.cicdProvider}
                              onChange={(e) => setFieldValue('cicdProvider', e.target.value)}
                              label="CI/CD Provider"
                              disabled={loading || isSubmitting}
                            >
                              <MenuItem value="jenkins">Jenkins</MenuItem>
                              <MenuItem value="github-actions">GitHub Actions</MenuItem>
                              <MenuItem value="gitlab-ci">GitLab CI</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field
                            as={TextField}
                            name="cicdApiKey"
                            label="CI/CD API Key"
                            fullWidth
                            variant="outlined"
                            error={touched.cicdApiKey && Boolean(errors.cicdApiKey)}
                            helperText={touched.cicdApiKey && errors.cicdApiKey}
                            disabled={loading || isSubmitting}
                            type="password"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field
                            as={TextField}
                            name="cicdUrl"
                            label="CI/CD URL"
                            fullWidth
                            variant="outlined"
                            error={touched.cicdUrl && Boolean(errors.cicdUrl)}
                            helperText={touched.cicdUrl && errors.cicdUrl}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Code Quality Integration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleTestConnection('codeQuality')}
                              disabled={testingConnection || !values.codeQualityApiKey || !values.codeQualityUrl}
                              startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                            >
                              Test Connection
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel id="code-quality-provider-label">Code Quality Provider</InputLabel>
                            <Select
                              labelId="code-quality-provider-label"
                              name="codeQualityProvider"
                              value={values.codeQualityProvider}
                              onChange={(e) => setFieldValue('codeQualityProvider', e.target.value)}
                              label="Code Quality Provider"
                              disabled={loading || isSubmitting}
                            >
                              <MenuItem value="sonarqube">SonarQube</MenuItem>
                              <MenuItem value="codeclimate">CodeClimate</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field
                            as={TextField}
                            name="codeQualityApiKey"
                            label="Code Quality API Key"
                            fullWidth
                            variant="outlined"
                            error={touched.codeQualityApiKey && Boolean(errors.codeQualityApiKey)}
                            helperText={touched.codeQualityApiKey && errors.codeQualityApiKey}
                            disabled={loading || isSubmitting}
                            type="password"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field
                            as={TextField}
                            name="codeQualityUrl"
                            label="Code Quality URL"
                            fullWidth
                            variant="outlined"
                            error={touched.codeQualityUrl && Boolean(errors.codeQualityUrl)}
                            helperText={touched.codeQualityUrl && errors.codeQualityUrl}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Blockchain Integration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleTestConnection('blockchain')}
                              disabled={testingConnection || !values.blockchainRpcUrl || !values.contractAddress}
                              startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                            >
                              Test Connection
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel id="blockchain-network-label">Blockchain Network</InputLabel>
                            <Select
                              labelId="blockchain-network-label"
                              name="blockchainNetwork"
                              value={values.blockchainNetwork}
                              onChange={(e) => setFieldValue('blockchainNetwork', e.target.value)}
                              label="Blockchain Network"
                              disabled={loading || isSubmitting}
                            >
                              <MenuItem value="ethereum">Ethereum</MenuItem>
                              <MenuItem value="polygon">Polygon</MenuItem>
                              <MenuItem value="arbitrum">Arbitrum</MenuItem>
                              <MenuItem value="hyperledger">Hyperledger Fabric</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="blockchainRpcUrl"
                            label="Blockchain RPC URL"
                            fullWidth
                            variant="outlined"
                            error={touched.blockchainRpcUrl && Boolean(errors.blockchainRpcUrl)}
                            helperText={touched.blockchainRpcUrl && errors.blockchainRpcUrl}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="contractAddress"
                            label="Token Contract Address"
                            fullWidth
                            variant="outlined"
                            error={touched.contractAddress && Boolean(errors.contractAddress)}
                            helperText={touched.contractAddress && errors.contractAddress}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            as={TextField}
                            name="adminWalletAddress"
                            label="Admin Wallet Address"
                            fullWidth
                            variant="outlined"
                            error={touched.adminWalletAddress && Boolean(errors.adminWalletAddress)}
                            helperText={touched.adminWalletAddress && errors.adminWalletAddress}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">Email Configuration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleTestConnection('email')}
                              disabled={testingConnection || !values.emailApiKey || !values.emailFromAddress}
                              startIcon={testingConnection ? <CircularProgress size={20} /> : null}
                            >
                              Test Connection
                            </Button>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel id="email-provider-label">Email Provider</InputLabel>
                            <Select
                              labelId="email-provider-label"
                              name="emailProvider"
                              value={values.emailProvider}
                              onChange={(e) => setFieldValue('emailProvider', e.target.value)}
                              label="Email Provider"
                              disabled={loading || isSubmitting}
                            >
                              <MenuItem value="smtp">SMTP</MenuItem>
                              <MenuItem value="sendgrid">SendGrid</MenuItem>
                              <MenuItem value="mailgun">Mailgun</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field
                            as={TextField}
                            name="emailApiKey"
                            label="Email API Key / Password"
                            fullWidth
                            variant="outlined"
                            error={touched.emailApiKey && Boolean(errors.emailApiKey)}
                            helperText={touched.emailApiKey && errors.emailApiKey}
                            disabled={loading || isSubmitting}
                            type="password"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field
                            as={TextField}
                            name="emailFromAddress"
                            label="From Email Address"
                            fullWidth
                            variant="outlined"
                            error={touched.emailFromAddress && Boolean(errors.emailFromAddress)}
                            helperText={touched.emailFromAddress && errors.emailFromAddress}
                            disabled={loading || isSubmitting}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || isSubmitting}
                    startIcon={loading || isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    size="large"
                  >
                    Save Configuration
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        )}
      </Paper>
      
      {/* Reset Confirmation Dialog */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Reset Configuration
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all system configuration settings to their default values? This action cannot be undone.
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will reset all API keys, connection settings, and system preferences. You will need to reconfigure the system after this operation.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)} disabled={resetLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleResetConfig} 
            color="error" 
            variant="contained"
            disabled={resetLoading}
            startIcon={resetLoading ? <CircularProgress size={20} /> : null}
          >
            Reset Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemConfig;
