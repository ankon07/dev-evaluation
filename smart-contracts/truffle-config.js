/**
 * Truffle configuration file
 * 
 * For detailed explanation: https://trufflesuite.com/docs/truffle/reference/configuration
 */

require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Create .env file with these variables for production deployment
// const MNEMONIC = process.env.MNEMONIC || "";
// const INFURA_API_KEY = process.env.INFURA_API_KEY || "";

module.exports = {
  /**
   * Networks define how you connect to your ethereum client
   */
  networks: {
    // Development network for local testing
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
    },
    
    // Polygon Mumbai testnet
    mumbai: {
      // provider: () => new HDWalletProvider(MNEMONIC, `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`),
      // network_id: 80001,
      // confirmations: 2,
      // timeoutBlocks: 200,
      // skipDryRun: true
    },
    
    // Polygon mainnet
    polygon: {
      // provider: () => new HDWalletProvider(MNEMONIC, `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`),
      // network_id: 137,
      // confirmations: 2,
      // timeoutBlocks: 200,
      // skipDryRun: true
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.19",    // Fetch exact version from solc-bin
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  },

  // Plugins
  plugins: [
    'truffle-plugin-verify'
  ],

  // API keys for contract verification
  api_keys: {
    // polygonscan: process.env.POLYGONSCAN_API_KEY
  }
};
