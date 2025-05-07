import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Developer Pages
import DeveloperDashboard from './components/dashboard/DeveloperDashboard';
import Profile from './components/developer/Profile';
import Evaluations from './components/developer/Evaluations';
import EvaluationDetail from './components/developer/EvaluationDetail';
import Wallet from './components/developer/Wallet';
import Transactions from './components/developer/Transactions';
import RedemptionOptions from './components/developer/RedemptionOptions';
import GitHubProfile from './components/developer/GitHubProfile';

// GitHub Auth
import GitHubAuth from './components/auth/GitHubAuth';

// Admin Pages
import AdminDashboard from './components/dashboard/AdminDashboard';
import ManageUsers from './components/admin/ManageUsers';
import ManageEvaluations from './components/admin/ManageEvaluations';
import ManageRedemptions from './components/admin/ManageRedemptions';
import SystemConfig from './components/admin/SystemConfig';
import RewardRules from './components/admin/RewardRules';
import Reports from './components/admin/Reports';
import MintTokens from './components/admin/MintTokens';

// Common Components
import NotFound from './components/common/NotFound';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';

function App() {
  const { currentUser, loading } = useAuth();
  const { theme } = useTheme();

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
        Loading...
      </Box>
    );
  }

  return (
    <>
      <CssBaseline />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={currentUser ? <Navigate to="/" /> : <Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/github-auth" element={<GitHubAuth />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            {/* Developer Routes */}
            <Route path="/" element={<DeveloperDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/evaluations/:id" element={<EvaluationDetail />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/redemptions" element={<RedemptionOptions />} />
            <Route path="/github-profile" element={<GitHubProfile />} />
          </Route>
        </Route>

        {/* Admin Routes - Protected with AdminRoute */}
        <Route element={<AdminRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/evaluations" element={<ManageEvaluations />} />
            <Route path="/admin/evaluations/:id" element={<EvaluationDetail />} />
            <Route path="/admin/redemptions" element={<ManageRedemptions />} />
            <Route path="/admin/config" element={<SystemConfig />} />
            <Route path="/admin/rules" element={<RewardRules />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/mint-tokens" element={<MintTokens />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
