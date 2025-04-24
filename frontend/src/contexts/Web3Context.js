import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const { currentUser, connectWallet } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
  // Mock wallet address for testing
  const mockWalletAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  
  // Connect wallet function that doesn't require MetaMask
  const connectMetaMask = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // If user is logged in, connect their wallet with the mock address
      if (currentUser) {
        const result = await connectUserWallet(mockWalletAddress);
        return result;
      }

      return { success: true, account: mockWalletAddress };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect user's wallet in the backend
  const connectUserWallet = async (walletAddress) => {
    if (!currentUser) return { success: false, error: 'User not logged in' };

    try {
      console.log('Connecting wallet to user account:', walletAddress);
      
      // Ensure token is set in axios headers
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      try {
        const response = await axios.post(`/api/developers/${currentUser._id}/wallet`, {
          walletAddress
        });
        
        // Update user data in AuthContext
        if (connectWallet) {
          await connectWallet(walletAddress);
        }
        
        return { 
          success: true, 
          data: response.data.data,
          message: 'Wallet connected successfully'
        };
      } catch (apiError) {
        console.error('API Error connecting wallet:', apiError);
        
        // Handle specific error cases
        if (apiError.response) {
          const statusCode = apiError.response.status;
          const errorMessage = apiError.response.data?.error || 'Unknown error';
          
          console.error(`API Error ${statusCode}: ${errorMessage}`);
          setError(`Failed to connect wallet: ${errorMessage}`);
          return { success: false, error: errorMessage };
        }
        
        throw apiError; // Re-throw for the outer catch block
      }
    } catch (error) {
      console.error('Error connecting wallet to user account:', error);
      setError('Failed to connect wallet to your account. Please try again.');
      return { success: false, error: error.message };
    }
  };
  
  // Disconnect user's wallet in the backend
  const disconnectUserWallet = async () => {
    if (!currentUser || !currentUser.walletAddress) return { success: false, error: 'No wallet connected' };

    try {
      console.log('Disconnecting wallet from user account');
      
      // Ensure token is set in axios headers
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      // Call the backend API to disconnect the wallet
      const response = await axios.delete(`/api/developers/${currentUser._id}/wallet`);
      
      if (response.data.success) {
        console.log('Wallet disconnected successfully');
        return { success: true };
      } else {
        throw new Error('Failed to disconnect wallet');
      }
    } catch (error) {
      console.error('Error disconnecting wallet from user account:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    account: currentUser?.walletAddress || null,
    chainId: 11155111, // Sepolia testnet
    isConnecting,
    error,
    isMetaMaskInstalled: true, // Always return true to avoid MetaMask installation prompts
    connectMetaMask,
    disconnectUserWallet
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}
