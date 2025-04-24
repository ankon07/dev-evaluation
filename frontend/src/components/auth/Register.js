import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GitHubIcon from '@mui/icons-material/GitHub';

// Validation schema
const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const Register = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    setRegisterError('');
    
    console.log('Starting registration process...');
    
    try {
      console.log('Submitting registration form with values:', { 
        name: values.name, 
        email: values.email, 
        password: '***' 
      });
      
      const result = await register(values.name, values.email, values.password);
      console.log('Registration result:', result);
      
      if (result.success) {
        console.log('Registration successful, navigating to home page');
        navigate('/');
      } else {
        console.error('Registration failed with error:', result.error);
        setRegisterError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      setRegisterError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('Registration process completed');
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <PersonAddIcon sx={{ color: 'white' }} />
        </Box>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
      </Box>

      {(registerError || error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {registerError || error}
        </Alert>
      )}

      <Formik
        initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
        validationSchema={RegisterSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Field
              as={TextField}
              name="name"
              label="Full Name"
              fullWidth
              margin="normal"
              variant="outlined"
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
              disabled={loading}
              autoComplete="name"
            />
            <Field
              as={TextField}
              name="email"
              label="Email Address"
              fullWidth
              margin="normal"
              variant="outlined"
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              disabled={loading}
              autoComplete="email"
            />
            <Field
              as={TextField}
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              variant="outlined"
              error={touched.password && Boolean(errors.password)}
              helperText={touched.password && errors.password}
              disabled={loading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Field
              as={TextField}
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              variant="outlined"
              error={touched.confirmPassword && Boolean(errors.confirmPassword)}
              helperText={touched.confirmPassword && errors.confirmPassword}
              disabled={loading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || isSubmitting}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<GitHubIcon />}
              onClick={handleGitHubLogin}
              sx={{ mb: 2 }}
              disabled={loading}
            >
              Sign up with GitHub
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default Register;
