import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Alert } from '@mui/material';

const AdminRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if user is authenticated and has admin privileges
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if user has admin role
  if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          height: '80vh',
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Access Denied: You do not have permission to access this page.
        </Alert>
        <Navigate to="/" />
      </Box>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
