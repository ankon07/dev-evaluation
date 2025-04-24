# DevToken Smart Contracts

This directory contains the smart contracts for the Developer Evaluation and Reward System, including deployment scripts and tests.

## Overview

The main contract is `DevToken.sol`, which is an ERC20 token with additional features:

- **Role-based access control**: Different roles for minting, pausing, and administration
- **Staking functionality**: Developers can stake tokens to earn rewards
- **Vesting functionality**: Tokens can be vested over time with a cliff period
- **Pausable**: The contract can be paused in case of emergencies

## Prerequisites

- Node.js (v14+)
- An Ethereum wallet with a private key
- Some ETH on the Sepolia testnet for gas fees
- Infura or Alchemy API key for Sepolia RPC URL

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

3. Fill in your `.env` file with the required values:
   ```
   # Network RPC URLs
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY

   # Private key for deployment (without 0x prefix)
   PRIVATE_KEY=your_wallet_private_key_here

   # API Keys for verification and gas reporting
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

   # Gas Reporter
   REPORT_GAS=true
   ```

## Compiling Contracts

Compile the contracts using Hardhat:

```
npm run compile
```

## Running Tests

Run the tests to ensure everything is working correctly:

```
npm test
```

This will run all tests in the `test` directory, including:
- Basic functionality tests (`DevToken.test.js`)
- Time-dependent feature tests (`DevToken.time.test.js`)

## Deploying to Sepolia Testnet

To deploy the contracts to the Sepolia testnet:

1. Make sure your `.env` file is properly configured with your Sepolia RPC URL and private key.

2. Run the deployment script:
   ```
   npm run deploy:sepolia
   ```

3. The script will output the contract address and other deployment information. Save this information for future reference.

## Verifying on Etherscan

After deployment, you can verify the contract on Etherscan:

1. Set the `CONTRACT_ADDRESS` in your `.env` file to the deployed contract address.

2. Run the verification script:
   ```
   npm run verify:sepolia
   ```

Alternatively, you can use the Hardhat verify command directly:

```
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## Local Development

For local development and testing:

1. Start a local Hardhat node:
   ```
   npm run node
   ```

2. In a separate terminal, deploy to the local node:
   ```
   npm run deploy:local
   ```

## Contract Interaction

### Interactive Script

The project includes an interactive script to easily interact with the deployed contract:

```
# For Sepolia testnet
npm run interact:sepolia

# For local development
npm run interact:local
```

This script provides an interactive menu with the following options:
- Mint tokens
- Transfer tokens
- Create stake
- Release stake
- Create vesting schedule
- Grant role
- Pause/Unpause contract
- Check account balance

### Manual Interaction via Hardhat Console

You can also interact with the contract using the Hardhat console:

```
npx hardhat console --network sepolia
```

Example commands:

```javascript
// Get the contract instance
const DevToken = await ethers.getContractFactory("DevToken");
const devToken = await DevToken.attach("YOUR_CONTRACT_ADDRESS");

// Get token information
const name = await devToken.name();
const symbol = await devToken.symbol();
const totalSupply = await devToken.totalSupply();

// Mint tokens (if you have the MINTER_ROLE)
const [signer] = await ethers.getSigners();
await devToken.mint(signer.address, ethers.parseEther("100"), "Initial allocation");

// Check balance
const balance = await devToken.balanceOf(signer.address);
console.log("Balance:", ethers.formatEther(balance));
```

## Gas Usage Optimization

To analyze gas usage and optimize the contracts:

```
REPORT_GAS=true npx hardhat test
```

This will generate a `gas-report.txt` file with detailed gas usage information.

## Security Considerations

- The contract uses OpenZeppelin's secure implementations for ERC20, AccessControl, and Pausable.
- Role-based access control ensures only authorized addresses can mint tokens or create vesting schedules.
- The contract has been thoroughly tested, but a professional audit is recommended before mainnet deployment.
