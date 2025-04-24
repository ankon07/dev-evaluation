import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { ethers } from 'ethers';

// Validation schema for minting tokens
const MintTokenSchema = Yup.object().shape({
  userId: Yup.string()
    .required('Recipient is required'),
  amount: Yup.number()
    .positive('Amount must be positive')
    .required('Amount is required'),
  reason: Yup.string()
    .min(3, 'Reason must be at least 3 characters')
    .max(100, 'Reason must be less than 100 characters')
    .required('Reason is required'),
});

const MintTokens = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [developers, setDevelopers] = useState([]);
  const [recentMints, setRecentMints] = useState([]);
  const [totalMinted, setTotalMinted] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Ensure token is set in axios headers
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch developers
        const developersResponse = await axios.get('/api/developers');
        setDevelopers(developersResponse.data.data);
        
        // Fetch recent mint transactions
        const transactionsResponse = await axios.get('/api/tokens/transactions', {
          params: { 
            limit: 10,
            type: 'mint'
          }
        });
        setRecentMints(transactionsResponse.data.data);
        
        // Calculate total minted
        const total = transactionsResponse.data.data.reduce((sum, tx) => {
          if (tx.status === 'completed') {
            return sum + tx.amount;
          }
          return sum;
        }, 0);
        setTotalMinted(total);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && currentUser.role === 'admin') {
      fetchData();
    }
  }, [currentUser]);

  const handleMintTokens = async (values, { setSubmitting, resetForm }) => {
    setError('');
    setSuccess('');
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to mint tokens.');
        return;
      }
      
      // First, get the recipient's wallet address
      const recipientResponse = await axios.get(`/api/developers/${values.userId}`);
      const recipientWalletAddress = recipientResponse.data.data.walletAddress;
      
      if (!recipientWalletAddress) {
        setError('Recipient has not connected a wallet yet.');
        return;
      }
      
      // Get the contract ABI and address
      const contractAddress = '0xc00C014b5491EbeDe8E7cf4fEDe7ddCd0D96B84d'; // Replace with your actual contract address
      
      // Create a provider using MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get the signer (admin's wallet)
      const signer = await provider.getSigner();
      
      // Create a contract instance
      const contractABI = [
        // Simplified ABI with just the mint function
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "reason",
              "type": "string"
            }
          ],
          "name": "mint",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(values.amount.toString());
      
      // Call the mint function directly from the frontend
      const tx = await contract.mint(recipientWalletAddress, amountInWei, values.reason, {
        gasLimit: 150000,
        gasPrice: ethers.parseUnits('5', 'gwei')
      });
      
      // Wait for the transaction to be mined
      setSuccess('Minting transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      // Create a transaction record in the backend
      await axios.post('/api/tokens/record-mint', {
        userId: values.userId,
        amount: values.amount,
        reason: values.reason,
        transactionHash: tx.hash
      });
      
      // Update UI after successful minting
      setSuccess(`Successfully minted ${values.amount} tokens to ${recipientResponse.data.data.name}`);
      
      // Refresh recent mints
      const transactionsResponse = await axios.get('/api/tokens/transactions', {
        params: { 
          limit: 10,
          type: 'mint'
        }
      });
      setRecentMints(transactionsResponse.data.data);
      
      // Update total minted
      setTotalMinted(totalMinted + parseFloat(values.amount));
      
      resetForm();
    } catch (error) {
      console.error('Token minting error:', error);
      if (error.code === 4001) {
        // User rejected the transaction
        setError('You rejected the transaction. Please approve the transaction to mint tokens.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(error.message || 'Failed to mint tokens. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && developers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Mint Tokens
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
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Mint Tokens to Developer
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Formik
              initialValues={{
                userId: '',
                amount: '',
                reason: ''
              }}
              validationSchema={MintTokenSchema}
              onSubmit={handleMintTokens}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="recipient-label">Recipient</InputLabel>
                        <Field
                          as={Select}
                          labelId="recipient-label"
                          name="userId"
                          label="Recipient"
                          disabled={isSubmitting}
                        >
                          {developers.map((developer) => (
                            <MenuItem key={developer._id} value={developer._id}>
                              {developer.name} ({developer.email})
                            </MenuItem>
                          ))}
                        </Field>
                        {touched.userId && errors.userId && (
                          <Typography color="error" variant="caption">
                            {errors.userId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="amount"
                        label="Amount"
                        type="number"
                        fullWidth
                        variant="outlined"
                        error={touched.amount && Boolean(errors.amount)}
                        helperText={touched.amount && errors.amount}
                        disabled={isSubmitting}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="reason"
                        label="Reason"
                        fullWidth
                        variant="outlined"
                        error={touched.reason && Boolean(errors.reason)}
                        helperText={touched.reason && errors.reason}
                        disabled={isSubmitting}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        fullWidth
                        disabled={isSubmitting}
                        sx={{ py: 1.5 }}
                      >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Mint Tokens'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Minting Statistics
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Minted
                    </Typography>
                    <Typography variant="h3">
                      {totalMinted}
                    </Typography>
                    <Typography variant="body2">
                      Tokens
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Mints
                    </Typography>
                    <Typography variant="h3">
                      {recentMints.length}
                    </Typography>
                    <Typography variant="body2">
                      Transactions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Recent Minting Activity
              </Typography>
              
              {recentMints.length > 0 ? (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {recentMints.map((mint) => (
                    <Box 
                      key={mint._id} 
                      sx={{ 
                        p: 2, 
                        mb: 1, 
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: 1
                      }}
                    >
                      <Typography variant="subtitle2">
                        {mint.to?.name || 'Unknown Developer'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Amount: {mint.amount} tokens
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reason: {mint.reason}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(mint.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent minting activity
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MintTokens;
