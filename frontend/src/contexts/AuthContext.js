import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginTimestamp, setLoginTimestamp] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      // Set the auth token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get('/api/auth/me');
      setCurrentUser(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching current user:', error);
      logout();
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setError('');
      console.log('Sending registration request:', { name, email, password: '***' });
      
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password
      }, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Registration response:', response.data);
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await fetchCurrentUser(token);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        setError(error.response.data?.error || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        setError('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        setError(`Request error: ${error.message}`);
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Registration failed' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set login timestamp for MetaMask connection prompt
      setLoginTimestamp(new Date().getTime());
      
      await fetchCurrentUser(token);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.error ||
        'Login failed. Please check your credentials.'
      );
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      setError('');
      await axios.post('/api/auth/forgotpassword', { email });
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(
        error.response?.data?.error ||
        'Failed to send password reset email. Please try again.'
      );
      return { success: false, error: error.response?.data?.error || 'Failed to send reset email' };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setError('');
      await axios.put(`/api/auth/resetpassword/${token}`, { password });
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      setError(
        error.response?.data?.error ||
        'Failed to reset password. Please try again.'
      );
      return { success: false, error: error.response?.data?.error || 'Failed to reset password' };
    }
  };

  const updateProfile = async (userData) => {
    try {
      setError('');
      const response = await axios.put('/api/auth/updatedetails', userData);
      setCurrentUser(response.data.data);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      setError(
        error.response?.data?.error ||
        'Failed to update profile. Please try again.'
      );
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError('');
      await axios.put('/api/auth/updatepassword', {
        currentPassword,
        newPassword
      });
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      setError(
        error.response?.data?.error ||
        'Failed to update password. Please try again.'
      );
      return { success: false, error: error.response?.data?.error || 'Failed to update password' };
    }
  };

  const connectWallet = async (walletAddress) => {
    try {
      setError('');
      const response = await axios.post(`/api/developers/${currentUser._id}/wallet`, {
        walletAddress
      });
      setCurrentUser(prev => ({
        ...prev,
        walletAddress: response.data.data.developer.walletAddress,
        tokenBalance: response.data.data.tokenBalance
      }));
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Connect wallet error:', error);
      setError(
        error.response?.data?.error ||
        'Failed to connect wallet. Please try again.'
      );
      return { success: false, error: error.response?.data?.error || 'Failed to connect wallet' };
    }
  };
  
  const disconnectWallet = async () => {
    try {
      setError('');
      const response = await axios.delete(`/api/developers/${currentUser._id}/wallet`);
      
      if (response.data.success) {
        setCurrentUser(prev => ({
          ...prev,
          walletAddress: null,
          tokenBalance: 0,
          stakedTokens: 0
        }));
        return { success: true };
      } else {
        throw new Error('Failed to disconnect wallet');
      }
    } catch (error) {
      console.error('Disconnect wallet error:', error);
      setError(
        error.response?.data?.error ||
        'Failed to disconnect wallet. Please try again.'
      );
      return { success: false, error: error.response?.data?.error || 'Failed to disconnect wallet' };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    loginTimestamp,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    updatePassword,
    connectWallet,
    disconnectWallet
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
