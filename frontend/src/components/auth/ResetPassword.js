import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const result = await resetPassword(token, values.password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
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
          <LockResetIcon sx={{ color: 'white' }} />
        </Box>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Password has been reset successfully! You will be redirected to the login page.
          </Alert>
        </Box>
      ) : (
        <>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Enter your new password below.
          </Typography>

          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Field
                  as={TextField}
                  name="password"
                  label="New Password"
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
                  label="Confirm New Password"
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
                  {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Back to Login
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </>
      )}
    </Box>
  );
};

export default ResetPassword;
