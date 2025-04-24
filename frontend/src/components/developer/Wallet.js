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
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
  IconButton,
  Link
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SendIcon from '@mui/icons-material/Send';
import StarsIcon from '@mui/icons-material/Stars';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import { ethers } from 'ethers';
import Web3 from 'web3';

// Validation schema for wallet connection
const WalletSchema = Yup.object().shape({
  walletAddress: Yup.string()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
    .required('Wallet address is required'),
});

// Validation schema for token transfer
const TransferSchema = Yup.object().shape({
  recipientId: Yup.string()
    .required('Recipient is required'),
  amount: Yup.number()
    .positive('Amount must be positive')
    .required('Amount is required'),
  reason: Yup.string()
    .min(3, 'Reason must be at least 3 characters')
    .max(100, 'Reason must be less than 100 characters')
    .required('Reason is required'),
});

// Validation schema for token staking
const StakeSchema = Yup.object().shape({
  amount: Yup.number()
    .positive('Amount must be positive')
    .required('Amount is required'),
});

// Validation schema for token redemption
const RedeemSchema = Yup.object().shape({
  amount: Yup.number()
    .positive('Amount must be positive')
    .required('Amount is required'),
  redeemOption: Yup.string()
    .required('Redemption option is required'),
});

const Wallet = () => {
  const { currentUser, connectWallet } = useAuth();
  const { connectMetaMask, account, isConnecting: isWeb3Connecting, error: web3Error } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [stakingInfo, setStakingInfo] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [openStakeDialog, setOpenStakeDialog] = useState(false);
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [stakeError, setStakeError] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // State to track MetaMask connection status
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState(null);

  // Function to check if MetaMask is installed and connected
  const checkMetaMaskConnection = async () => {
    try {
      if (!window.ethereum) {
        console.log('MetaMask is not installed');
        return false;
      }
      
      // Check if already connected
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' // This doesn't trigger the MetaMask popup
      });
      
      if (accounts && accounts.length > 0) {
        console.log('MetaMask is connected with account:', accounts[0]);
        setMetaMaskAccount(accounts[0]);
        setIsMetaMaskConnected(true);
        return true;
      } else {
        console.log('MetaMask is installed but not connected');
        setIsMetaMaskConnected(false);
        setMetaMaskAccount(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
      setIsMetaMaskConnected(false);
      setMetaMaskAccount(null);
      return false;
    }
  };

  // Function to handle MetaMask account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
      setIsMetaMaskConnected(false);
      setMetaMaskAccount(null);
    } else if (accounts[0] !== metaMaskAccount) {
      setMetaMaskAccount(accounts[0]);
      setIsMetaMaskConnected(true);
      console.log('MetaMask account changed to:', accounts[0]);
      
      // Check if the connected account matches the user's registered wallet
      if (currentUser && currentUser.walletAddress && 
          accounts[0].toLowerCase() !== currentUser.walletAddress.toLowerCase() &&
          currentUser.role !== 'admin') {
        setError('Warning: The connected MetaMask wallet does not match your registered wallet address.');
      } else {
        setError('');
      }
    }
  };

  // Set up MetaMask event listeners
  useEffect(() => {
    if (window.ethereum) {
      // Check connection on initial load
      checkMetaMaskConnection();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        console.log('MetaMask chain changed, reloading...');
        window.location.reload();
      });
      
      // Listen for connect events
      window.ethereum.on('connect', (connectInfo) => {
        console.log('MetaMask connected:', connectInfo);
        checkMetaMaskConnection();
      });
      
      // Listen for disconnect events
      window.ethereum.on('disconnect', (error) => {
        console.log('MetaMask disconnected:', error);
        setIsMetaMaskConnected(false);
        setMetaMaskAccount(null);
      });
      
      // Cleanup event listeners
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('connect', () => {});
        window.ethereum.removeListener('disconnect', () => {});
      };
    }
  }, [currentUser, metaMaskAccount]);
  
  // Auto-connect MetaMask if available and user doesn't have a wallet connected
  useEffect(() => {
    const autoConnectMetaMask = async () => {
      // Only try to auto-connect if user is logged in but doesn't have a wallet connected
      if (currentUser && !currentUser.walletAddress && window.ethereum) {
        try {
          // Check if MetaMask is already connected (has accounts)
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' // This doesn't trigger the popup
          });
          
          if (accounts && accounts.length > 0) {
            console.log('Auto-connecting MetaMask account:', accounts[0]);
            setMetaMaskAccount(accounts[0]);
            setIsMetaMaskConnected(true);
            
            // Automatically connect the wallet to the backend
            const result = await connectWallet(accounts[0]);
            if (result.success) {
              setSuccess('Wallet connected automatically');
              setWalletInfo({
                balance: result.data?.tokenBalance || 0,
                address: accounts[0]
              });
              
              // Fetch additional data after wallet connection
              try {
                const stakingResponse = await axios.get('/api/tokens/staking');
                setStakingInfo(stakingResponse.data.data);
                
                const transactionsResponse = await axios.get('/api/tokens/transactions', {
                  params: { limit: 5 }
                });
                setRecentTransactions(transactionsResponse.data.data);
              } catch (dataError) {
                console.error('Error fetching wallet data:', dataError);
              }
            }
          }
        } catch (error) {
          console.error('Auto-connect error:', error);
          // Silent fail - don't show error to user for auto-connect
        }
      }
    };
    
    autoConnectMetaMask();
  }, [currentUser, connectWallet]);

  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Ensure token is set in axios headers
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch wallet balance
        const balanceResponse = await axios.get('/api/tokens/balance');
        setWalletInfo({
          balance: balanceResponse.data.data.balance,
          address: currentUser.walletAddress
        });
        
        // Fetch staking info
        const stakingResponse = await axios.get('/api/tokens/staking');
        setStakingInfo(stakingResponse.data.data);
        
        // Fetch developers for transfer
        const developersResponse = await axios.get('/api/developers');
        setDevelopers(developersResponse.data.data.filter(dev => dev._id !== currentUser._id));
        
        // Fetch recent transactions
        const transactionsResponse = await axios.get('/api/tokens/transactions', {
          params: { limit: 5 }
        });
        setRecentTransactions(transactionsResponse.data.data);
        
        // Check MetaMask connection
        await checkMetaMaskConnection();
        
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        if (error.response?.status === 400 && error.response?.data?.error?.includes('Wallet not connected')) {
          // This is expected if wallet is not connected yet
          setWalletInfo(null);
        } else {
          setError('Failed to load wallet data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      if (currentUser.walletAddress) {
        fetchWalletData();
      } else {
        setLoading(false);
      }
    }
  }, [currentUser]);

  // Function to connect wallet using the Web3Context
  const connectToMetaMask = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      setSuccess('Connecting wallet...');
      const result = await connectMetaMask();
      
      if (result.success) {
        setSuccess('Wallet connected successfully');
        setWalletInfo({
          balance: result.data?.tokenBalance || 0,
          address: result.data?.developer?.walletAddress || account
        });
        
        // Fetch additional data after wallet connection
        try {
          setSuccess('Fetching wallet data...');
          
          // Fetch staking info after wallet connection
          const stakingResponse = await axios.get('/api/tokens/staking');
          setStakingInfo(stakingResponse.data.data);
          
          // Fetch recent transactions
          const transactionsResponse = await axios.get('/api/tokens/transactions', {
            params: { limit: 5 }
          });
          setRecentTransactions(transactionsResponse.data.data);
          
          setSuccess('Wallet connected and data loaded successfully');
        } catch (dataError) {
          console.error('Error fetching wallet data:', dataError);
          setSuccess('Wallet connected, but there was an issue loading some data');
        }
      } else {
        setError(result.error || 'Failed to connect wallet. Please try again.');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(`Error connecting wallet: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch Ethereum balance from Etherscan
  const fetchEthereumBalance = async (address) => {
    try {
      if (!address) return;
      
      // Check if window.ethereum is available (MetaMask)
      if (window.ethereum) {
        try {
          // Use MetaMask provider if available
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(address);
          return ethers.formatEther(balance);
        } catch (metaMaskError) {
          console.error('MetaMask provider error:', metaMaskError);
          // Fall back to public provider if MetaMask fails
        }
      }
      
      // Fallback to public provider
      try {
        // Create a provider with fallback options
        const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/40UlY32ARVe7Nm2NAvuFDRIuTCxYQBX0');
        
        // Get balance
        const balance = await provider.getBalance(address);
        
        // Convert balance from wei to ether
        const etherBalance = ethers.formatEther(balance);
        
        return etherBalance;
      } catch (providerError) {
        console.error('Provider error:', providerError);
        
        // Try another public provider as last resort
        try {
          const backupProvider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
          const balance = await backupProvider.getBalance(address);
          return ethers.formatEther(balance);
        } catch (backupError) {
          console.error('Backup provider error:', backupError);
          throw new Error('All providers failed');
        }
      }
    } catch (error) {
      console.error('Error fetching Ethereum balance:', error);
      throw error;
    }
  };

  const handleTransferTokens = async (values, { setSubmitting, resetForm }) => {
    setTransferError('');
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setTransferError('MetaMask is not installed. Please install MetaMask to transfer tokens.');
        return;
      }
      
      // First, get the recipient's wallet address
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      // Show pending status immediately
      setSuccess('Preparing transfer...');
      
      // Get recipient user details - do this in parallel with other operations
      const recipientPromise = axios.get(`/api/developers/${values.recipientId}`);
      
      // Get the contract ABI and address
      const contractAddress = '0xc00C014b5491EbeDe8E7cf4fEDe7ddCd0D96B84d'; // Replace with your actual contract address
      
      // Create a provider using MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get the signer (user's wallet)
      const signer = await provider.getSigner();
      
      // Get the signer's address
      const signerAddress = await signer.getAddress();
      
      // Only check wallet match for non-admin users
      if (currentUser.role !== 'admin' && currentUser.walletAddress && 
          signerAddress.toLowerCase() !== currentUser.walletAddress.toLowerCase()) {
        setTransferError('The connected MetaMask wallet does not match your registered wallet. Please connect the correct wallet in MetaMask.');
        return;
      }
      
      // Create a contract instance with a more complete ABI
      const contractABI = [
        // Transfer function
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
            }
          ],
          "name": "transfer",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        // BalanceOf function (useful for checking balance)
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Check balance before transfer
      const balance = await contract.balanceOf(signerAddress);
      const amountInWei = ethers.parseEther(values.amount.toString());
      
      if (balance < amountInWei) {
        setTransferError(`Insufficient balance. You have ${ethers.formatEther(balance)} tokens, but trying to send ${values.amount} tokens.`);
        return;
      }
      
      // Show pending status
      setSuccess('Preparing transfer transaction. Please confirm in MetaMask...');
      
      // Get recipient data from the promise
      const recipientResponse = await recipientPromise;
      const recipientWalletAddress = recipientResponse.data.data.walletAddress;
      
      // Call the transfer function directly from the frontend
      const tx = await contract.transfer(recipientWalletAddress, amountInWei, {
        gasLimit: 100000,
        gasPrice: ethers.parseUnits('5', 'gwei')
      });
      
      // Wait for the transaction to be mined
      setSuccess('Transfer transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      // Create a transaction record in the backend
      await axios.post('/api/tokens/record-transfer', {
        recipientId: values.recipientId,
        amount: values.amount,
        reason: values.reason,
        transactionHash: tx.hash
      });
      
      // Update UI after successful transfer
      // Get updated token balance
      const balanceResponse = await axios.get('/api/tokens/balance');
      setWalletInfo({
        ...walletInfo,
        balance: balanceResponse.data.data.balance
      });
      
      // Update recent transactions
      const transactionsResponse = await axios.get('/api/tokens/transactions', {
        params: { limit: 5 }
      });
      setRecentTransactions(transactionsResponse.data.data);
      
      setSuccess('Tokens transferred successfully');
      resetForm();
      setOpenTransferDialog(false);
    } catch (error) {
      console.error('Token transfer error:', error);
      if (error.code === 4001) {
        // User rejected the transaction
        setTransferError('You rejected the transaction. Please approve the transaction to transfer tokens.');
      } else if (error.response?.data?.error) {
        setTransferError(error.response.data.error);
      } else {
        setTransferError(error.message || 'Failed to transfer tokens. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStakeTokens = async (values, { setSubmitting, resetForm }) => {
    setStakeError('');
    setSuccess('');
    
    try {
      console.log('Starting staking process...');
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setStakeError('MetaMask is not installed. Please install MetaMask to stake tokens.');
        return;
      }
      
      // Validate amount
      const amount = parseFloat(values.amount);
      if (isNaN(amount) || amount <= 0) {
        setStakeError('Please enter a valid amount greater than 0.');
        return;
      }
      
      if (amount > walletInfo.balance) {
        setStakeError(`Insufficient balance. You only have ${walletInfo.balance} tokens available.`);
        return;
      }
      
      console.log('Amount validation passed, connecting to MetaMask...');
      setSuccess('Connecting to MetaMask. Please check your browser extension...');
      
      // Request MetaMask accounts
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: []
        });
        
        console.log('MetaMask accounts:', accounts);
        
        if (accounts && accounts.length > 0) {
          setSuccess('MetaMask connected! Preparing transaction...');
          
          // Create a provider using ethers.js
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          // Get the signer (user's wallet)
          const signer = await provider.getSigner();
          
          // Get the signer's address
          const signerAddress = await signer.getAddress();
          
          // Only check wallet match for non-admin users
          if (currentUser.role !== 'admin' && currentUser.walletAddress && 
              signerAddress.toLowerCase() !== currentUser.walletAddress.toLowerCase()) {
            setStakeError('The connected MetaMask wallet does not match your registered wallet. Please connect the correct wallet in MetaMask.');
            setSubmitting(false);
            return;
          }
          
          // Get the contract ABI and address
          const contractAddress = '0xc00C014b5491EbeDe8E7cf4fEDe7ddCd0D96B84d';
          
          // Create a contract instance with ethers.js
          // Use a more complete ABI that matches the actual contract
          const contractABI = [
            // ERC20 standard functions
            {
              "constant": true,
              "inputs": [{"name": "_owner", "type": "address"}],
              "name": "balanceOf",
              "outputs": [{"name": "balance", "type": "uint256"}],
              "type": "function"
            },
            // CreateStake function
            {
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                }
              ],
              "name": "createStake",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ];
          
          const contract = new ethers.Contract(contractAddress, contractABI, signer);
          
          // Convert amount to wei
          const amountInWei = ethers.parseEther(amount.toString());
          
          // Skip balance check with contract and use the balance from the state
          // This avoids potential ABI mismatch issues
          const balance = ethers.parseEther(walletInfo.balance.toString());
          if (balance < amountInWei) {
            setStakeError(`Insufficient balance. You have ${ethers.formatEther(balance)} tokens, but trying to stake ${amount} tokens.`);
            setSubmitting(false);
            return;
          }
          
          // Show pending status
          setSuccess('Preparing to stake tokens. Please confirm in MetaMask...');
          
          // Call the createStake function
          const tx = await contract.createStake(amountInWei, {
            gasLimit: 200000,
            gasPrice: ethers.parseUnits('5', 'gwei')
          });
          
          // Wait for the transaction to be mined
          setSuccess(`Transaction submitted! Hash: ${tx.hash}. Waiting for confirmation...`);
          await tx.wait();
          
          setSuccess('Transaction confirmed! Updating balances...');
          
          // Create a transaction record in the backend
          await axios.post('/api/tokens/stake', {
            amount: amount,
            transactionHash: tx.hash
          });
          
          // Get updated token balance
          const balanceResponse = await axios.get('/api/tokens/balance');
          setWalletInfo({
            ...walletInfo,
            balance: balanceResponse.data.data.balance
          });
          
          // Get updated staking info
          const stakingResponse = await axios.get('/api/tokens/staking');
          setStakingInfo(stakingResponse.data.data);
          
          // Update recent transactions
          const transactionsResponse = await axios.get('/api/tokens/transactions', {
            params: { limit: 5 }
          });
          setRecentTransactions(transactionsResponse.data.data);
          
          setSuccess(`Successfully staked ${amount} tokens!`);
          resetForm();
          setOpenStakeDialog(false);
        } else {
          throw new Error('No accounts returned from MetaMask');
        }
      } catch (error) {
        console.error('Transaction error:', error);
        if (error.code === 4001) {
          setStakeError('You rejected the transaction. Please approve the transaction to stake tokens.');
        } else {
          setStakeError(`Transaction error: ${error.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Unhandled token staking error:', error);
      setStakeError(`Error: ${error.message || 'Unknown error occurred. Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnstakeTokens = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Starting unstaking process...');
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to unstake tokens.');
        setLoading(false);
        return;
      }
      
      // Check if user has staked tokens
      if (!stakingInfo || parseFloat(stakingInfo.stakedAmount) <= 0) {
        setError('You don\'t have any staked tokens to unstake.');
        setLoading(false);
        return;
      }
      
      console.log('Staking validation passed, connecting to MetaMask...');
      setSuccess('Connecting to MetaMask. Please check your browser extension...');
      
      // Request MetaMask accounts
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: []
        });
        
        console.log('MetaMask accounts:', accounts);
        
        if (accounts && accounts.length > 0) {
          setSuccess('MetaMask connected! Preparing transaction...');
          
          // Create a provider using ethers.js
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          // Get the signer (user's wallet)
          const signer = await provider.getSigner();
          
          // Get the signer's address
          const signerAddress = await signer.getAddress();
          
          // Only check wallet match for non-admin users
          if (currentUser.role !== 'admin' && currentUser.walletAddress && 
              signerAddress.toLowerCase() !== currentUser.walletAddress.toLowerCase()) {
            setError('The connected MetaMask wallet does not match your registered wallet. Please connect the correct wallet in MetaMask.');
            setLoading(false);
            return;
          }
          
          // Get the contract ABI and address
          const contractAddress = '0xc00C014b5491EbeDe8E7cf4fEDe7ddCd0D96B84d';
          
          // Create a contract instance with ethers.js
          const contractABI = [
            // ReleaseStake function
            {
              "inputs": [],
              "name": "releaseStake",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            // GetStakedAmount function (useful for checking staked amount)
            {
              "inputs": [
                {
                  "internalType": "address",
                  "name": "account",
                  "type": "address"
                }
              ],
              "name": "getStakedAmount",
              "outputs": [
                {
                  "internalType": "uint256",
                  "name": "",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            }
          ];
          
          const contract = new ethers.Contract(contractAddress, contractABI, signer);
          
          // Check staked amount before unstaking
          try {
            const stakedAmount = await contract.getStakedAmount(signerAddress);
            if (stakedAmount <= 0) {
              setError('You don\'t have any staked tokens to unstake.');
              setLoading(false);
              return;
            }
          } catch (checkError) {
            console.warn('Error checking staked amount:', checkError);
            // Continue anyway since we already checked with the backend
          }
          
          // Show pending status
          setSuccess('Preparing to unstake tokens. Please confirm in MetaMask...');
          
          // Call the releaseStake function
          const tx = await contract.releaseStake({
            gasLimit: 200000,
            gasPrice: ethers.parseUnits('5', 'gwei')
          });
          
          // Wait for the transaction to be mined
          setSuccess(`Transaction submitted! Hash: ${tx.hash}. Waiting for confirmation...`);
          await tx.wait();
          
          setSuccess('Transaction confirmed! Updating balances...');
          
          // Create a transaction record in the backend
          await axios.post('/api/tokens/unstake', {
            transactionHash: tx.hash
          });
          
          // Get updated token balance
          const balanceResponse = await axios.get('/api/tokens/balance');
          setWalletInfo({
            ...walletInfo,
            balance: balanceResponse.data.data.balance
          });
          
          // Get updated staking info
          const stakingResponse = await axios.get('/api/tokens/staking');
          setStakingInfo(stakingResponse.data.data);
          
          // Update recent transactions
          const transactionsResponse = await axios.get('/api/tokens/transactions', {
            params: { limit: 5 }
          });
          setRecentTransactions(transactionsResponse.data.data);
          
          setSuccess(`Successfully unstaked tokens with rewards!`);
        } else {
          throw new Error('No accounts returned from MetaMask');
        }
      } catch (error) {
        console.error('Transaction error:', error);
        if (error.code === 4001) {
          setError('You rejected the transaction. Please approve the transaction to unstake tokens.');
        } else {
          setError(`Transaction error: ${error.message || 'Unknown error'}`);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Unhandled token unstaking error:', error);
      setError(`Error: ${error.message || 'Unknown error occurred. Please try again.'}`);
      setLoading(false);
    }
  };

  const handleRedeemTokens = async (values, { setSubmitting, resetForm }) => {
    setRedeemError('');
    
    try {
      // Ensure token is set in axios headers
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.post('/api/tokens/redeem', values);
      
      if (response.data.success) {
        // Update wallet balance
        setWalletInfo({
          ...walletInfo,
          balance: response.data.data.tokenBalance
        });
        
        // Update recent transactions
        const transactionsResponse = await axios.get('/api/tokens/transactions', {
          params: { limit: 5 }
        });
        setRecentTransactions(transactionsResponse.data.data);
        
        setSuccess('Tokens redeemed successfully. ' + response.data.data.message);
        resetForm();
        setOpenRedeemDialog(false);
      }
    } catch (error) {
      console.error('Token redemption error:', error);
      setRedeemError(error.response?.data?.error || 'Failed to redeem tokens. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getTransactionStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'transaction-success';
      case 'pending':
        return 'transaction-pending';
      case 'failed':
        return 'transaction-failed';
      default:
        return '';
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading && !walletInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Wallet
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
      
      {!currentUser.walletAddress ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Connect Wallet
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="body1" paragraph>
            Connect your MetaMask wallet to receive and manage your reward tokens.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Card sx={{ maxWidth: 500, width: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  Connect with MetaMask
                </Typography>
                <Typography variant="body2" paragraph align="center">
                  Connect directly with MetaMask browser extension for blockchain interactions.
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={connectToMetaMask}
                    disabled={loading}
                    startIcon={<AccountBalanceWalletIcon />}
                    sx={{ 
                      py: 1.5, 
                      px: 4,
                      fontSize: '1.1rem', 
                      fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                      '&:hover': {
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Connect MetaMask'}
                  </Button>
                </Box>
                
                {isMetaMaskConnected && metaMaskAccount && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      MetaMask connected with account: {formatAddress(metaMaskAccount)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Click "Connect MetaMask" to use this account with the application.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Wallet Card */}
          <Grid item xs={12} md={6}>
            <Card className="wallet-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Token Balance</Typography>
                </Box>
                <Typography variant="h3" className="token-amount">
                  {walletInfo?.balance || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {formatAddress(currentUser.walletAddress)}
                  </Typography>
                  <Tooltip title={copySuccess ? "Copied!" : "Copy address"}>
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(currentUser.walletAddress)}
                      sx={{ color: 'white' }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View on Etherscan">
                    <IconButton 
                      size="small" 
                      component="a"
                      href={`https://sepolia.etherscan.io/address/${currentUser.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'white', ml: 1 }}
                    >
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', mt: 3, gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="inherit" 
                    sx={{ color: 'primary.main', bgcolor: 'white' }}
                    startIcon={<SendIcon />}
                    onClick={() => setOpenTransferDialog(true)}
                    disabled={loading || !walletInfo?.balance || walletInfo?.balance <= 0}
                  >
                    Transfer
                  </Button>
                  <Button 
                    variant="contained" 
                    color="inherit" 
                    sx={{ color: 'primary.main', bgcolor: 'white' }}
                    startIcon={<StarsIcon />}
                    onClick={() => setOpenStakeDialog(true)}
                    disabled={loading || !walletInfo?.balance || walletInfo?.balance <= 0}
                  >
                    Stake
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Staking Card */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Staking
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {stakingInfo ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Staked Amount
                      </Typography>
                      <Typography variant="h5">
                        {stakingInfo.stakedAmount || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Annual Yield (APY)
                      </Typography>
                      <Typography variant="h5">
                        {stakingInfo.stakingAPY}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Potential Annual Rewards
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {stakingInfo.potentialAnnualRewards || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    {stakingInfo.stakedAmount > 0 ? (
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleUnstakeTokens}
                        disabled={loading}
                      >
                        Unstake All
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        You don't have any staked tokens. Stake tokens to earn rewards.
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Ethereum Balance Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ethereum Network
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Ethereum Balance
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Your Ethereum balance on the Sepolia testnet.
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={async () => {
                            setLoading(true);
                            setError('');
                            try {
                              const ethBalance = await fetchEthereumBalance(currentUser.walletAddress);
                              if (ethBalance !== null) {
                                setSuccess(`Ethereum balance: ${ethBalance} ETH`);
                              } else {
                                setError('Failed to fetch Ethereum balance');
                              }
                            } catch (error) {
                              console.error('Balance fetch error:', error);
                              setError('Error fetching Ethereum balance. Please try again later.');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                        >
                          Refresh Balance
                        </Button>
                        
                        <Link
                          href={`https://sepolia.etherscan.io/address/${currentUser.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          View on Etherscan
                          <LaunchIcon fontSize="small" sx={{ ml: 0.5 }} />
                        </Link>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Contract Interaction
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Interact with the DevToken smart contract.
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Link
                          href={`https://sepolia.etherscan.io/address/0xc00C014b5491EbeDe8E7cf4fEDe7ddCd0D96B84d`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          View Contract on Etherscan
                          <LaunchIcon fontSize="small" sx={{ ml: 0.5 }} />
                        </Link>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Note: Some operations require admin privileges. If you encounter authorization errors, 
                          please contact an administrator.
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Redemption Options */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Redemption Options
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Monetary Value
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Redeem your tokens for monetary value. The exchange rate is determined by the organization.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => setOpenRedeemDialog(true)}
                        disabled={loading || !walletInfo?.balance || walletInfo?.balance <= 0}
                        fullWidth
                      >
                        Redeem for Money
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Career Progression
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Use your tokens to boost your career progression, such as increments or promotions.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => setOpenRedeemDialog(true)}
                        disabled={loading || !walletInfo?.balance || walletInfo?.balance <= 0}
                        fullWidth
                      >
                        Redeem for Career
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Special Benefits
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Exchange tokens for special benefits like additional vacation days, learning opportunities, etc.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => setOpenRedeemDialog(true)}
                        disabled={loading || !walletInfo?.balance || walletInfo?.balance <= 0}
                        fullWidth
                      >
                        Redeem for Benefits
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Recent Transactions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {recentTransactions.length > 0 ? (
                <List>
                  {recentTransactions.map((transaction) => (
                    <React.Fragment key={transaction._id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography component="span">
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                {transaction.reason && `: ${transaction.reason}`}
                              </Typography>
                              <Typography 
                                component="span" 
                                sx={{ fontWeight: 'bold' }}
                              >
                                {transaction.amount} tokens
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {new Date(transaction.createdAt).toLocaleDateString()} {new Date(transaction.createdAt).toLocaleTimeString()}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                className={getTransactionStatusClass(transaction.status)}
                              >
                                {transaction.status}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No transactions yet.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Transfer Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)}>
        <DialogTitle>Transfer Tokens</DialogTitle>
        <Formik
          initialValues={{
            recipientId: '',
            amount: '',
            reason: ''
          }}
          validationSchema={TransferSchema}
          onSubmit={handleTransferTokens}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                {transferError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {transferError}
                  </Alert>
                )}
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="recipient-label">Recipient</InputLabel>
                      <Field
                        as={Select}
                        labelId="recipient-label"
                        name="recipientId"
                        label="Recipient"
                        disabled={isSubmitting}
                      >
                        {developers.map((developer) => (
                          <MenuItem key={developer._id} value={developer._id}>
                            {developer.name} ({developer.email})
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.recipientId && errors.recipientId && (
                        <Typography color="error" variant="caption">
                          {errors.recipientId}
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
                      InputProps={{
                        endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
                      }}
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
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenTransferDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Transfer'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
      
      {/* Stake Dialog */}
      <Dialog open={openStakeDialog} onClose={() => setOpenStakeDialog(false)}>
        <DialogTitle>Stake Tokens</DialogTitle>
        <Formik
          initialValues={{
            amount: ''
          }}
          validationSchema={StakeSchema}
          onSubmit={handleStakeTokens}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form>
              <DialogContent>
                {stakeError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {stakeError}
                  </Alert>
                )}
                
                <DialogContentText>
                  Stake your tokens to earn additional rewards. The current APY is {stakingInfo?.stakingAPY || 5}%.
                </DialogContentText>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="amount"
                      label="Amount to Stake"
                      type="number"
                      fullWidth
                      variant="outlined"
                      error={touched.amount && Boolean(errors.amount)}
                      helperText={touched.amount && errors.amount}
                      disabled={isSubmitting}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  {values.amount && !isNaN(values.amount) && values.amount > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="body2" gutterBottom>
                          Potential Annual Rewards:
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {(values.amount * (stakingInfo?.stakingAPY || 5) / 100).toFixed(2)} tokens
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenStakeDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Stake Tokens'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
      
      {/* Redeem Dialog */}
      <Dialog open={openRedeemDialog} onClose={() => setOpenRedeemDialog(false)}>
        <DialogTitle>Redeem Tokens</DialogTitle>
        <Formik
          initialValues={{
            amount: '',
            redeemOption: ''
          }}
          validationSchema={RedeemSchema}
          onSubmit={handleRedeemTokens}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                {redeemError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {redeemError}
                  </Alert>
                )}
                
                <DialogContentText>
                  Redeem your tokens for various benefits. This action cannot be undone.
                </DialogContentText>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="redeem-option-label">Redemption Option</InputLabel>
                      <Field
                        as={Select}
                        labelId="redeem-option-label"
                        name="redeemOption"
                        label="Redemption Option"
                        disabled={isSubmitting}
                      >
                        <MenuItem value="monetary">Monetary Value</MenuItem>
                        <MenuItem value="career">Career Progression</MenuItem>
                        <MenuItem value="benefits">Special Benefits</MenuItem>
                      </Field>
                      {touched.redeemOption && errors.redeemOption && (
                        <Typography color="error" variant="caption">
                          {errors.redeemOption}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="amount"
                      label="Amount to Redeem"
                      type="number"
                      fullWidth
                      variant="outlined"
                      error={touched.amount && Boolean(errors.amount)}
                      helperText={touched.amount && errors.amount}
                      disabled={isSubmitting}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenRedeemDialog(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Redeem Tokens'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default Wallet;
