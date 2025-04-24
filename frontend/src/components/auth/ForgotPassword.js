import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import LockResetIcon from '@mui/icons-material/LockReset';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const result = await forgotPassword(values.email);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send password reset email. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Forgot password error:', error);
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
            Password reset email sent! Check your inbox for further instructions.
          </Alert>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Back to Login
            </Link>
          </Box>
        </Box>
      ) : (
        <>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>

          <Formik
            initialValues={{ email: '' }}
            validationSchema={ForgotPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
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
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading || isSubmitting}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
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

export default ForgotPassword;
