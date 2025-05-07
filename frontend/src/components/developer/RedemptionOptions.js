import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const RedemptionOptions = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [redemptionType, setRedemptionType] = useState('');
  const [redemptionAmount, setRedemptionAmount] = useState('');
  const [redemptionDetails, setRedemptionDetails] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        const response = await axios.get('/api/tokens/balance');
        setTokenBalance(response.data.data.balance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
      }
    };

    if (currentUser) {
      fetchTokenBalance();
    }
  }, [currentUser]);

  const handleOpenDialog = (type) => {
    setRedemptionType(type);
    setRedemptionAmount('');
    setRedemptionDetails('');
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getDetailsPlaceholder = () => {
    switch (redemptionType) {
      case 'monetary':
        return 'Provide payment details or any specific instructions';
      case 'career':
        return 'Specify what career progression benefit you are requesting (e.g., promotion consideration, skill development)';
      case 'benefits':
        return 'Specify what benefits you are requesting (e.g., additional vacation days, learning course)';
      default:
        return 'Provide details about your redemption request';
    }
  };

  const getDialogTitle = () => {
    switch (redemptionType) {
      case 'monetary':
        return 'Redeem Tokens for Money';
      case 'career':
        return 'Redeem Tokens for Career Progression';
      case 'benefits':
        return 'Redeem Tokens for Special Benefits';
      default:
        return 'Redeem Tokens';
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!redemptionAmount || isNaN(redemptionAmount) || parseFloat(redemptionAmount) <= 0) {
        throw new Error('Please enter a valid token amount');
      }

      if (parseFloat(redemptionAmount) > parseFloat(tokenBalance)) {
        throw new Error('Insufficient token balance');
      }

      if (!redemptionDetails.trim()) {
        throw new Error('Please provide details for your redemption request');
      }

      // Submit redemption request
      const response = await axios.post('/api/redemptions', {
        type: redemptionType,
        amount: parseFloat(redemptionAmount),
        details: redemptionDetails
      });

      // Update token balance
      setTokenBalance(prevBalance => (parseFloat(prevBalance) - parseFloat(redemptionAmount)).toFixed(2));
      
      // Show success message
      setSuccess('Redemption request submitted successfully! Your request is pending approval.');
      setOpenSnackbar(true);
      
      // Close dialog
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Redemption Options
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Balance: {tokenBalance} Tokens
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Monetary Value
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }}>
              Redeem your tokens for monetary value. The exchange rate is determined by the organization.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => handleOpenDialog('monetary')}
              disabled={parseFloat(tokenBalance) <= 0}
            >
              Redeem for Money
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Career Progression
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }}>
              Use your tokens to boost your career progression, such as increments or promotions.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => handleOpenDialog('career')}
              disabled={parseFloat(tokenBalance) <= 0}
            >
              Redeem for Career
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Special Benefits
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }}>
              Exchange tokens for special benefits like additional vacation days, learning opportunities, etc.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => handleOpenDialog('benefits')}
              disabled={parseFloat(tokenBalance) <= 0}
            >
              Redeem for Benefits
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Redemption Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            Please specify how many tokens you want to redeem and provide necessary details.
          </DialogContentText>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Available Balance: {tokenBalance} Tokens
            </Typography>
          </Box>
          
          <TextField
            label="Token Amount"
            type="number"
            fullWidth
            value={redemptionAmount}
            onChange={(e) => setRedemptionAmount(e.target.value)}
            margin="normal"
            inputProps={{ min: 1, max: tokenBalance, step: "0.01" }}
            required
          />
          
          <TextField
            label="Details"
            multiline
            rows={4}
            fullWidth
            value={redemptionDetails}
            onChange={(e) => setRedemptionDetails(e.target.value)}
            margin="normal"
            placeholder={getDetailsPlaceholder()}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RedemptionOptions;
