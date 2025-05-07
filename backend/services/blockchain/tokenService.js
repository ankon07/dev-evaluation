const { Web3 } = require('web3');
const Contract = require('@truffle/contract');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');

// Load contract artifacts
const DevTokenArtifact = require('../../../smart-contracts/artifacts/contracts/DevToken.sol/DevToken.json');
const TaskRewardManagerArtifact = require('../../../smart-contracts/artifacts/contracts/TaskRewardManager.sol/TaskRewardManager.json');

class TokenService {
  constructor() {
    this.isInitialized = false;
    this.initializationError = null;
    this.initializationPromise = this.initialize();
    this.taskRewardManagerInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing blockchain service...');
      
      // Initialize Web3 with the provider
      const provider = this.getProvider();
      this.web3 = new Web3(provider);
      
      // Check if we can connect to the network with timeout
      try {
        const networkIdPromise = this.web3.eth.net.getId();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network ID request timed out')), 10000)
        );
        
        const networkId = await Promise.race([networkIdPromise, timeoutPromise]);
        console.log(`Connected to network ID: ${networkId}`);
      } catch (netError) {
        console.warn('Could not get network ID, but continuing:', netError.message);
      }

      // Initialize the DevToken contract
      this.DevToken = Contract(DevTokenArtifact);
      this.DevToken.setProvider(provider);

      // Initialize the TaskRewardManager contract
      this.TaskRewardManager = Contract(TaskRewardManagerArtifact);
      this.TaskRewardManager.setProvider(provider);

      // Get deployed contract instance with retry logic
      let retries = 5; // Increased retries
      let delay = 2000; // Starting delay
      
      while (retries > 0) {
        try {
          const contractInstancePromise = this.getContractInstance();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Contract instance request timed out')), 15000)
          );
          
          this.tokenInstance = await Promise.race([contractInstancePromise, timeoutPromise]);
          console.log('DevToken contract instance obtained successfully');
          this.isInitialized = true;
          
          // Try to get TaskRewardManager instance
          try {
            this.taskRewardManagerInstance = await this.getTaskRewardManagerInstance();
            console.log('TaskRewardManager contract instance obtained successfully');
            this.taskRewardManagerInitialized = true;
          } catch (taskRewardError) {
            console.warn('Could not initialize TaskRewardManager, but continuing:', taskRewardError.message);
          }
          
          break;
        } catch (contractError) {
          retries--;
          console.warn(`Error getting contract instance, retrying (${retries} attempts left):`, contractError.message);
          
          if (retries === 0) {
            console.error('Failed to get contract instance after multiple attempts');
            this.initializationError = contractError;
            break;
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 10000); // Increase delay but cap it
        }
      }

      if (this.isInitialized) {
        console.log('Blockchain service initialized successfully');
      } else {
        console.warn('Blockchain service initialized in degraded state');
      }
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      this.initializationError = error;
    }
  }

  getProvider() {
    try {
      // Use different providers based on environment
      if (process.env.NODE_ENV === 'production') {
        // For production, use HDWalletProvider with mnemonic
        return new HDWalletProvider({
          mnemonic: process.env.MNEMONIC,
          providerOrUrl: process.env.POLYGON_RPC_URL,
          pollingInterval: 30000, // Increased polling interval to reduce load
          networkCheckTimeout: 60000, // 60 seconds timeout
          timeoutBlocks: 200,
          maxReconnectTries: 5,
          reconnectDelay: 5000
        });
      } else if (process.env.NODE_ENV === 'test') {
        // For test environment, use Mumbai testnet
        return new HDWalletProvider({
          mnemonic: process.env.MNEMONIC,
          providerOrUrl: process.env.POLYGON_MUMBAI_RPC_URL,
          pollingInterval: 30000, // Increased polling interval
          networkCheckTimeout: 60000, // 60 seconds timeout
          timeoutBlocks: 200,
          maxReconnectTries: 5,
          reconnectDelay: 5000
        });
      } else {
        // For development, use a more reliable approach with multiple fallbacks
        console.log('Connecting to Ethereum network for development');
        
        // Try multiple RPC endpoints in order of preference
        const rpcUrls = [
          process.env.SEPOLIA_RPC_URL,
          `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
          'https://rpc.sepolia.org',
          'https://eth-sepolia.public.blastapi.io'
        ];
        
        // Filter out undefined or empty URLs
        const validRpcUrls = rpcUrls.filter(url => url && url.trim() !== '');
        
        if (validRpcUrls.length === 0) {
          throw new Error('No valid RPC URLs available');
        }
        
        console.log(`Using RPC URL: ${validRpcUrls[0]}`);
        
        // Use the first available RPC URL
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATE_KEY],
          providerOrUrl: validRpcUrls[0],
          pollingInterval: 60000, // Increased polling interval even more
          networkCheckTimeout: 120000, // 120 seconds timeout
          timeoutBlocks: 400,
          maxReconnectTries: 10,
          reconnectDelay: 10000,
          skipSomeConfirmations: true
        });
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      
      // Create a mock provider that doesn't actually connect to any network
      // This allows the application to start without crashing, but blockchain operations will fail gracefully
      console.log('Creating mock provider to prevent application crash');
      
      // Return a minimal provider that doesn't try to connect to the network
      const mockProvider = {
        send: () => Promise.resolve({}),
        on: () => {},
        removeListener: () => {},
        engine: { on: () => {}, removeListener: () => {} }
      };
      
      return mockProvider;
    }
  }

  async getContractInstance() {
    try {
      // If contract address is provided in env, use it
      if (process.env.DEV_TOKEN_ADDRESS) {
        try {
          console.log(`Attempting to connect to DevToken contract at address: ${process.env.DEV_TOKEN_ADDRESS}`);
          return await this.DevToken.at(process.env.DEV_TOKEN_ADDRESS);
        } catch (atError) {
          console.error(`Error connecting to contract at ${process.env.DEV_TOKEN_ADDRESS}:`, atError.message);
          console.log('Falling back to deployed contract...');
          // Fall back to deployed contract if "at" fails
          return await this.DevToken.deployed();
        }
      }
      
      // Otherwise get the deployed contract
      console.log('Getting deployed DevToken contract instance...');
      return await this.DevToken.deployed();
    } catch (error) {
      console.error('Error getting DevToken contract instance:', error);
      
      // Create a more descriptive error
      const enhancedError = new Error(
        `Failed to get DevToken contract instance: ${error.message}. ` +
        'This could be due to network connectivity issues, ' +
        'invalid contract address, or the contract not being deployed to this network.'
      );
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }
  
  async getTaskRewardManagerInstance() {
    try {
      // If contract address is provided in env, use it
      if (process.env.TASK_REWARD_MANAGER_ADDRESS) {
        try {
          console.log(`Attempting to connect to TaskRewardManager contract at address: ${process.env.TASK_REWARD_MANAGER_ADDRESS}`);
          return await this.TaskRewardManager.at(process.env.TASK_REWARD_MANAGER_ADDRESS);
        } catch (atError) {
          console.error(`Error connecting to contract at ${process.env.TASK_REWARD_MANAGER_ADDRESS}:`, atError.message);
          console.log('Falling back to deployed contract...');
          // Fall back to deployed contract if "at" fails
          return await this.TaskRewardManager.deployed();
        }
      }
      
      // Otherwise get the deployed contract
      console.log('Getting deployed TaskRewardManager contract instance...');
      return await this.TaskRewardManager.deployed();
    } catch (error) {
      console.error('Error getting TaskRewardManager contract instance:', error);
      
      // Create a more descriptive error
      const enhancedError = new Error(
        `Failed to get TaskRewardManager contract instance: ${error.message}. ` +
        'This could be due to network connectivity issues, ' +
        'invalid contract address, or the contract not being deployed to this network.'
      );
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  // Helper method to ensure service is initialized before operations
  async ensureInitialized() {
    if (!this.isInitialized) {
      if (this.initializationPromise) {
        await this.initializationPromise;
      }
      
      if (!this.isInitialized) {
        throw new Error('Blockchain service is not properly initialized');
      }
    }
  }

  async getAccounts() {
    try {
      await this.ensureInitialized();
      
      const accountsPromise = this.web3.eth.getAccounts();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get accounts request timed out')), 10000)
      );
      
      return await Promise.race([accountsPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error getting accounts:', error);
      throw new Error(`Failed to get accounts: ${error.message}`);
    }
  }

  async mintTokens(toAddress, amount, reason) {
    try {
      await this.ensureInitialized();
      
      const accounts = await this.getAccounts();
      const adminAccount = accounts[0]; // Admin account is the first one

      // Call the mint function on the smart contract with timeout
      const mintPromise = this.tokenInstance.mint(
        toAddress,
        this.web3.utils.toWei(amount.toString(), 'ether'),
        reason,
        { 
          from: adminAccount,
          gas: 150000, // Lower gas limit
          gasPrice: this.web3.utils.toWei('5', 'gwei') // Lower gas price for testnet
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Mint tokens request timed out')), 60000) // Increased timeout to 60 seconds
      );
      
      const result = await Promise.race([mintPromise, timeoutPromise]);

      return {
        success: true,
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async transferTokens(fromAddress, toAddress, amount, reason) {
    try {
      await this.ensureInitialized();
      
      // Check if contract is paused
      try {
        const isPaused = await this.tokenInstance.paused();
        if (isPaused) {
          return {
            success: false,
            error: 'Token transfers are currently paused'
          };
        }
      } catch (pauseCheckError) {
        console.warn('Could not check if contract is paused:', pauseCheckError.message);
        // Continue anyway, the transfer will fail if paused
      }
      
      // Check for staked tokens
      try {
        const stakedAmount = await this.tokenInstance.getStakedAmount(fromAddress);
        const balance = await this.tokenInstance.balanceOf(fromAddress);
        const availableBalance = this.web3.utils.toBigInt(balance) - this.web3.utils.toBigInt(stakedAmount);
        const transferAmount = this.web3.utils.toBigInt(this.web3.utils.toWei(amount.toString(), 'ether'));
        
        if (transferAmount > availableBalance) {
          return {
            success: false,
            error: 'Cannot transfer staked tokens or insufficient available balance'
          };
        }
      } catch (balanceCheckError) {
        console.warn('Could not check staked amount:', balanceCheckError.message);
        // Continue anyway, the transfer will fail if there are staked tokens
      }
      
      // Call the transfer function on the smart contract with timeout
      const transferPromise = this.tokenInstance.transfer(
        toAddress,
        this.web3.utils.toWei(amount.toString(), 'ether'),
        { 
          from: fromAddress,
          gas: 200000, // Increased gas limit
          gasPrice: this.web3.utils.toWei('5', 'gwei') // Lower gas price for testnet
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transfer tokens request timed out')), 120000) // Increased timeout to 120 seconds
      );
      
      const result = await Promise.race([transferPromise, timeoutPromise]);

      return {
        success: true,
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      
      // Provide more detailed error information
      let errorMessage = error.message;
      
      // Check for common revert reasons
      if (error.message.includes('gas')) {
        errorMessage = 'Transaction failed due to gas issues. Try increasing the gas limit.';
      } else if (error.message.includes('staked')) {
        errorMessage = 'Cannot transfer staked tokens. Please unstake tokens before transferring.';
      } else if (error.message.includes('balance')) {
        errorMessage = 'Insufficient token balance for transfer.';
      } else if (error.message.includes('paused')) {
        errorMessage = 'Token transfers are currently paused.';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message
      };
    }
  }

  async burnTokens(fromAddress, amount, reason) {
    try {
      await this.ensureInitialized();
      
      const accounts = await this.getAccounts();
      const adminAccount = accounts[0]; // Admin account is the first one

      // Call the burnTokens function on the smart contract with timeout
      const burnPromise = this.tokenInstance.burnTokens(
        fromAddress,
        this.web3.utils.toWei(amount.toString(), 'ether'),
        reason,
        { 
          from: adminAccount,
          gas: 100000, // Lower gas limit
          gasPrice: this.web3.utils.toWei('5', 'gwei') // Lower gas price for testnet
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Burn tokens request timed out')), 120000) // Increased timeout to 120 seconds
      );
      
      const result = await Promise.race([burnPromise, timeoutPromise]);

      return {
        success: true,
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };
    } catch (error) {
      console.error('Error burning tokens:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createStake(fromAddress, amount) {
    try {
      await this.ensureInitialized();
      
      // Call the createStake function on the smart contract with timeout
      const stakePromise = this.tokenInstance.createStake(
        this.web3.utils.toWei(amount.toString(), 'ether'),
        { 
          from: fromAddress,
          gas: 100000, // Lower gas limit
          gasPrice: this.web3.utils.toWei('5', 'gwei') // Lower gas price for testnet
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Create stake request timed out')), 60000) // Increased timeout to 60 seconds
      );
      
      const result = await Promise.race([stakePromise, timeoutPromise]);

      return {
        success: true,
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };
    } catch (error) {
      console.error('Error creating stake:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async releaseStake(fromAddress) {
    try {
      await this.ensureInitialized();
      
      // Call the releaseStake function on the smart contract with timeout
      const releasePromise = this.tokenInstance.releaseStake(
        { 
          from: fromAddress,
          gas: 100000, // Lower gas limit
          gasPrice: this.web3.utils.toWei('5', 'gwei') // Lower gas price for testnet
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Release stake request timed out')), 60000) // Increased timeout to 60 seconds
      );
      
      const result = await Promise.race([releasePromise, timeoutPromise]);

      return {
        success: true,
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };
    } catch (error) {
      console.error('Error releasing stake:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBalance(address) {
    try {
      await this.ensureInitialized();
      
      const balancePromise = this.tokenInstance.balanceOf(address);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get balance request timed out')), 10000)
      );
      
      const balance = await Promise.race([balancePromise, timeoutPromise]);
      return this.web3.utils.fromWei(balance.toString(), 'ether');
    } catch (error) {
      console.error('Error getting balance:', error);
      // Return 0 instead of throwing to prevent app crashes
      return "0";
    }
  }

  async getStakedAmount(address) {
    try {
      await this.ensureInitialized();
      
      const stakedPromise = this.tokenInstance.getStakedAmount(address);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get staked amount request timed out')), 10000)
      );
      
      const stakedAmount = await Promise.race([stakedPromise, timeoutPromise]);
      return this.web3.utils.fromWei(stakedAmount.toString(), 'ether');
    } catch (error) {
      console.error('Error getting staked amount:', error);
      // Return 0 instead of throwing to prevent app crashes
      return "0";
    }
  }
  
  /**
   * Issue a task reward using the TaskRewardManager contract
   * @param {string} taskId - The ID of the completed task
   * @param {string} developerAddress - The address of the developer to reward
   * @param {string} difficulty - The difficulty level of the task (easy, medium, hard)
   * @param {string} taskType - The type of the task (feature, bug, improvement, etc.)
   * @param {string} status - The status of the task (done, verified)
   * @returns {Promise<Object>} - Result of the reward issuance
   */
  async issueTaskReward(taskId, developerAddress, difficulty, taskType, status) {
    try {
      await this.ensureInitialized();
      
      if (!this.taskRewardManagerInitialized || !this.taskRewardManagerInstance) {
        throw new Error('TaskRewardManager contract is not initialized');
      }
      
      const accounts = await this.getAccounts();
      const adminAccount = accounts[0]; // Admin account is the first one
      
      // Call the issueTaskReward function on the TaskRewardManager contract
      const issueRewardPromise = this.taskRewardManagerInstance.issueTaskReward(
        taskId,
        developerAddress,
        difficulty,
        taskType,
        status,
        { 
          from: adminAccount,
          gas: 200000, // Higher gas limit for this complex operation
          gasPrice: this.web3.utils.toWei('5', 'gwei') // Lower gas price for testnet
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Issue task reward request timed out')), 120000) // 120 seconds timeout
      );
      
      const result = await Promise.race([issueRewardPromise, timeoutPromise]);
      
      // Get the reward amount from the event logs
      let rewardAmount = "0";
      if (result.logs && result.logs.length > 0) {
        // Find the RewardIssued event
        const rewardEvent = result.logs.find(log => log.event === 'RewardIssued');
        if (rewardEvent && rewardEvent.args) {
          rewardAmount = this.web3.utils.fromWei(rewardEvent.args.amount.toString(), 'ether');
        }
      }
      
      return {
        success: true,
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed,
        rewardAmount
      };
    } catch (error) {
      console.error('Error issuing task reward:', error);
      
      // If TaskRewardManager fails, fall back to direct minting
      if (error.message.includes('TaskRewardManager') || error.message.includes('not initialized')) {
        console.log('Falling back to direct token minting for task reward');
        
        // Calculate reward based on difficulty and status (similar to the smart contract logic)
        const difficultyRewards = {
          easy: 0.5,
          medium: 1.0,
          hard: 2.0
        };
        
        const typeMultipliers = {
          feature: 1.2,
          bug: 1.1,
          improvement: 1.0,
          documentation: 0.8,
          test: 0.9
        };
        
        const statusMultipliers = {
          done: 1.0,
          verified: 1.25
        };
        
        // Calculate reward amount
        let rewardAmount = difficultyRewards[difficulty] || 1.0;
        rewardAmount *= typeMultipliers[taskType] || 1.0;
        rewardAmount *= statusMultipliers[status] || 1.0;
        
        // Round to 2 decimal places
        rewardAmount = Math.round(rewardAmount * 100) / 100;
        
        // Mint tokens directly
        return await this.mintTokens(
          developerAddress,
          rewardAmount,
          `Task reward: ${taskId}`
        );
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        if (this.initializationPromise) {
          await this.initializationPromise;
        }
        
        if (!this.isInitialized) {
          return {
            success: false,
            error: 'Blockchain service is not properly initialized'
          };
        }
      }
      
      // Test connection to blockchain network
      try {
        const networkIdPromise = this.web3.eth.net.getId();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network ID request timed out')), 10000)
        );
        
        const networkId = await Promise.race([networkIdPromise, timeoutPromise]);
        console.log(`Connected to network ID: ${networkId}`);
        
        // Try to get accounts to further verify connection
        const accounts = await this.getAccounts();
        
        return {
          success: true,
          message: `Successfully connected to blockchain network (ID: ${networkId})`
        };
      } catch (error) {
        console.error('Error testing blockchain connection:', error);
        return {
          success: false,
          error: `Failed to connect to blockchain network: ${error.message}`
        };
      }
    } catch (error) {
      console.error('Error in testConnection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processTransaction(transactionId) {
    try {
      await this.ensureInitialized();
      
      // Get transaction from database
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction status
      transaction.status = 'processing';
      await transaction.save();

      let result;
      let fromUser, toUser;

      // Process based on transaction type
      switch (transaction.type) {
        case 'mint':
          toUser = await User.findById(transaction.to);
          if (!toUser || !toUser.walletAddress) {
            throw new Error('Recipient wallet address not found');
          }
          
          // Check if this is a task completion reward
          if (transaction.reason === 'task_completion_reward' && this.taskRewardManagerInitialized) {
            // Get the task details
            const Task = require('../../models/Task');
            const task = await Task.findById(transaction.taskId);
            
            if (!task) {
              throw new Error('Task not found');
            }
            
            // Use TaskRewardManager to issue the reward
            result = await this.issueTaskReward(
              task.externalId || task._id.toString(),
              toUser.walletAddress,
              task.difficulty.toLowerCase(),
              task.type.toLowerCase(),
              task.status.toLowerCase()
            );
          } else {
            // Regular minting
            result = await this.mintTokens(
              toUser.walletAddress,
              transaction.amount,
              transaction.reason
            );
          }
          break;

        case 'transfer':
          fromUser = await User.findById(transaction.from);
          toUser = await User.findById(transaction.to);
          
          if (!fromUser || !fromUser.walletAddress) {
            throw new Error('Sender wallet address not found');
          }
          if (!toUser || !toUser.walletAddress) {
            throw new Error('Recipient wallet address not found');
          }
          
          result = await this.transferTokens(
            fromUser.walletAddress,
            toUser.walletAddress,
            transaction.amount,
            transaction.reason
          );
          break;

        case 'burn':
          fromUser = await User.findById(transaction.from);
          if (!fromUser || !fromUser.walletAddress) {
            throw new Error('Sender wallet address not found');
          }
          
          result = await this.burnTokens(
            fromUser.walletAddress,
            transaction.amount,
            transaction.reason
          );
          break;

        case 'stake':
          fromUser = await User.findById(transaction.from);
          if (!fromUser || !fromUser.walletAddress) {
            throw new Error('Sender wallet address not found');
          }
          
          result = await this.createStake(
            fromUser.walletAddress,
            transaction.amount
          );
          break;

        case 'unstake':
          fromUser = await User.findById(transaction.from);
          if (!fromUser || !fromUser.walletAddress) {
            throw new Error('Sender wallet address not found');
          }
          
          result = await this.releaseStake(fromUser.walletAddress);
          break;

        default:
          throw new Error(`Unsupported transaction type: ${transaction.type}`);
      }

      // Update transaction with result
      if (result.success) {
        transaction.status = 'completed';
        transaction.transactionHash = result.transactionHash;
        transaction.blockNumber = result.blockNumber;
        transaction.gasUsed = result.gasUsed;
        transaction.processedAt = Date.now();
        
        // Update user balances
        if (fromUser) {
          fromUser.tokenBalance = await this.getBalance(fromUser.walletAddress);
          fromUser.stakedTokens = await this.getStakedAmount(fromUser.walletAddress);
          await fromUser.save();
        }
        
        if (toUser) {
          toUser.tokenBalance = await this.getBalance(toUser.walletAddress);
          await toUser.save();
        }
      } else {
        transaction.status = 'failed';
        transaction.error = result.error;
      }

      await transaction.save();
      return result;
    } catch (error) {
      console.error('Error processing transaction:', error);
      
      // Update transaction status to failed
      const transaction = await Transaction.findById(transactionId);
      if (transaction) {
        transaction.status = 'failed';
        transaction.error = error.message;
        await transaction.save();
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a redemption transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Result of transaction processing
   */
  async processRedemptionTransaction(transactionId) {
    try {
      await this.ensureInitialized();
      
      // Get transaction from database
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction status
      transaction.status = 'processing';
      await transaction.save();

      let result;
      let fromUser;

      // For redemption, we need to burn tokens from the user's wallet
      fromUser = await User.findById(transaction.from);
      if (!fromUser || !fromUser.walletAddress) {
        throw new Error('User wallet address not found');
      }
      
      // Burn tokens for redemption
      result = await this.burnTokens(
        fromUser.walletAddress,
        transaction.amount,
        'token_redemption'
      );

      // Update transaction with result
      if (result.success) {
        transaction.status = 'completed';
        transaction.transactionHash = result.transactionHash;
        transaction.blockNumber = result.blockNumber;
        transaction.gasUsed = result.gasUsed;
        transaction.processedAt = Date.now();
        
        // Update user balance
        fromUser.tokenBalance = await this.getBalance(fromUser.walletAddress);
        await fromUser.save();
      } else {
        transaction.status = 'failed';
        transaction.error = result.error;
      }

      await transaction.save();
      return result;
    } catch (error) {
      console.error('Error processing redemption transaction:', error);
      
      // Update transaction status to failed
      const transaction = await Transaction.findById(transactionId);
      if (transaction) {
        transaction.status = 'failed';
        transaction.error = error.message;
        await transaction.save();
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Handle unhandled promise rejections to prevent app crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the application
});

// Handle specific PollingBlockTracker errors
process.on('error', (error) => {
  if (error.message && error.message.includes('PollingBlockTracker')) {
    console.warn('PollingBlockTracker error caught:', error.message);
    // Don't crash the application
  } else {
    console.error('Uncaught error:', error);
  }
});

module.exports = new TokenService();
