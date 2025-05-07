import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GitHubIcon from '@mui/icons-material/GitHub';

// Validation schema for profile update
const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

// Validation schema for password update
const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

// Validation schema for skill
const SkillSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Skill name must be at least 2 characters')
    .max(30, 'Skill name must be less than 30 characters')
    .required('Skill name is required'),
  level: Yup.string()
    .required('Skill level is required'),
});

const Profile = () => {
  const { currentUser, updateProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skills, setSkills] = useState([]);
  const [openSkillDialog, setOpenSkillDialog] = useState(false);
  const [skillDialogMode, setSkillDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentSkill, setCurrentSkill] = useState(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await axios.get(`/api/developers/${currentUser._id}`);
        if (response.data.data.skills) {
          setSkills(response.data.data.skills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        setError('Failed to load skills. Please try again.');
      }
    };

    if (currentUser) {
      fetchSkills();
    }
  }, [currentUser]);

  const handleProfileUpdate = async (values, { setSubmitting }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await updateProfile(values);
      if (result.success) {
        setSuccess('Profile updated successfully');
      } else {
        setError(result.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (values, { setSubmitting, resetForm }) => {
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      const result = await updatePassword(values.currentPassword, values.newPassword);
      if (result.success) {
        setPasswordSuccess('Password updated successfully');
        resetForm();
        setTimeout(() => {
          setOpenPasswordDialog(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(result.error || 'Failed to update password. Please try again.');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSkill = () => {
    setSkillDialogMode('add');
    setCurrentSkill(null);
    setOpenSkillDialog(true);
  };

  const handleEditSkill = (skill) => {
    setSkillDialogMode('edit');
    setCurrentSkill(skill);
    setOpenSkillDialog(true);
  };

  const handleDeleteSkill = async (skillId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(`/api/developers/${currentUser._id}/skills/${skillId}`);
      
      // Update local skills state
      setSkills(skills.filter(skill => skill._id !== skillId));
      setSuccess('Skill removed successfully');
    } catch (error) {
      console.error('Error deleting skill:', error);
      setError('Failed to delete skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (skillDialogMode === 'add') {
        // Add new skill
        const response = await axios.post(`/api/developers/${currentUser._id}/skills`, values);
        setSkills(response.data.data.skills);
        setSuccess('Skill added successfully');
      } else {
        // Edit existing skill
        const response = await axios.put(
          `/api/developers/${currentUser._id}/skills/${currentSkill._id}`, 
          values
        );
        setSkills(response.data.data.skills);
        setSuccess('Skill updated successfully');
      }
      
      resetForm();
      setOpenSkillDialog(false);
    } catch (error) {
      console.error('Error managing skill:', error);
      setError('Failed to manage skill. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleConnectGitHub = () => {
    // Use the full backend URL to avoid proxy issues
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'info';
      case 'intermediate':
        return 'success';
      case 'advanced':
        return 'warning';
      case 'expert':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Profile
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
      
      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Formik
              initialValues={{
                name: currentUser?.name || '',
                email: currentUser?.email || ''
              }}
              validationSchema={ProfileSchema}
              onSubmit={handleProfileUpdate}
              enableReinitialize
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="name"
                        label="Full Name"
                        fullWidth
                        variant="outlined"
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="email"
                        label="Email Address"
                        fullWidth
                        variant="outlined"
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={loading || isSubmitting}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => setOpenPasswordDialog(true)}
                          disabled={loading}
                        >
                          Change Password
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Paper>
        </Grid>
        
        {/* Skills */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Skills
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddSkill}
                disabled={loading}
              >
                Add Skill
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {skills.length > 0 ? (
              <Grid container spacing={2}>
                {skills.map((skill) => (
                  <Grid item key={skill._id}>
                    <Chip
                      label={`${skill.name} (${skill.level})`}
                      color={getSkillLevelColor(skill.level)}
                      onDelete={() => handleDeleteSkill(skill._id)}
                      deleteIcon={<DeleteIcon />}
                      onClick={() => handleEditSkill(skill)}
                      sx={{ 
                        p: 0.5, 
                        '& .MuiChip-label': { 
                          px: 1 
                        } 
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No skills added yet. Click "Add Skill" to add your first skill.
              </Typography>
            )}
          </Paper>
          
          {/* External Accounts */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              External Accounts
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GitHubIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">
                  GitHub Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.githubId ? 'Connected' : 'Not connected'}
                </Typography>
              </Box>
              <Button
                variant={currentUser?.githubId ? "outlined" : "contained"}
                color="primary"
                onClick={handleConnectGitHub}
                disabled={loading}
              >
                {currentUser?.githubId ? 'Reconnect' : 'Connect'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Skill Dialog */}
      <Dialog open={openSkillDialog} onClose={() => setOpenSkillDialog(false)}>
        <DialogTitle>
          {skillDialogMode === 'add' ? 'Add New Skill' : 'Edit Skill'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: currentSkill?.name || '',
            level: currentSkill?.level || 'intermediate'
          }}
          validationSchema={SkillSchema}
          onSubmit={handleSkillSubmit}
          enableReinitialize
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="name"
                      label="Skill Name"
                      fullWidth
                      variant="outlined"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="skill-level-label">Skill Level</InputLabel>
                      <Field
                        as={Select}
                        labelId="skill-level-label"
                        name="level"
                        label="Skill Level"
                        disabled={isSubmitting}
                      >
                        <MenuItem value="beginner">Beginner</MenuItem>
                        <MenuItem value="intermediate">Intermediate</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                        <MenuItem value="expert">Expert</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenSkillDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
      
      {/* Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }}
          validationSchema={PasswordSchema}
          onSubmit={handlePasswordUpdate}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                {passwordError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {passwordError}
                  </Alert>
                )}
                
                {passwordSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {passwordSuccess}
                  </Alert>
                )}
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="currentPassword"
                      label="Current Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      error={touched.currentPassword && Boolean(errors.currentPassword)}
                      helperText={touched.currentPassword && errors.currentPassword}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="newPassword"
                      label="New Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      error={touched.newPassword && Boolean(errors.newPassword)}
                      helperText={touched.newPassword && errors.newPassword}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="confirmPassword"
                      label="Confirm New Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenPasswordDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Update Password'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default Profile;
