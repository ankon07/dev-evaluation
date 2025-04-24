# DevToken Smart Contract Testing Guide

This guide provides comprehensive instructions for testing the DevToken smart contract, both locally and on the Sepolia testnet.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Automated Testing](#automated-testing)
3. [Local Blockchain Testing](#local-blockchain-testing)
4. [Sepolia Testnet Deployment and Testing](#sepolia-testnet-deployment-and-testing)
5. [Contract Verification](#contract-verification)
6. [Interactive Testing](#interactive-testing)
7. [Troubleshooting](#troubleshooting)

## Environment Setup

Before you begin testing, you need to set up your environment:

1. **Install Dependencies**:
   ```bash
   cd dev-eval-blockchain/smart-contracts
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** with your specific configuration:
   ```
   # For local testing, you don't need to modify these
   # For Sepolia testing, add your specific values:
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
   PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
   ETHERSCAN_API_KEY=your_etherscan_api_key
   REPORT_GAS=true
   ```

## Automated Testing

Hardhat provides a robust testing framework. We've created two test files:
- `DevToken.test.js`: Tests basic functionality
- `DevToken.time.test.js`: Tests time-dependent features like staking and vesting

### Running All Tests

```bash
npm test
```

This command will run all tests in the `test` directory.

### Running Specific Tests

```bash
npx hardhat test test/DevToken.test.js
npx hardhat test test/DevToken.time.test.js
```

### Test Coverage

To generate a test coverage report:

```bash
npx hardhat coverage
```

This will create a detailed report showing which parts of the contract are covered by tests.

## Local Blockchain Testing

Testing on a local blockchain allows you to interact with the contract in a controlled environment.

### Start a Local Blockchain Node

```bash
npm run node
```

This starts a local Hardhat node with predefined accounts loaded with ETH.

### Deploy to Local Blockchain

In a new terminal:

```bash
npm run deploy:local
```

This will deploy the DevToken contract to your local blockchain. Note the contract address that is output.

### Interact with Locally Deployed Contract

```bash
# Set the CONTRACT_ADDRESS in your .env file to the address from the deployment
# Then run:
npm run interact:local
```

This launches an interactive CLI where you can:
- Mint tokens
- Transfer tokens
- Create stakes
- Release stakes
- Create vesting schedules
- Grant roles
- Pause/unpause the contract
- Check balances

## Sepolia Testnet Deployment and Testing

Testing on Sepolia provides a more realistic environment closer to mainnet.

### Prerequisites

1. **Get Sepolia ETH**: You need Sepolia ETH to pay for gas. Get it from a faucet like:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. **Infura or Alchemy API Key**: Sign up for [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/) to get an API key for Sepolia.

3. **Update your `.env` file** with:
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
   PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
   ```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

This will:
1. Compile the contract
2. Deploy it to Sepolia
3. Output the contract address and transaction details
4. Wait for confirmations

Save the contract address for the next steps.

## Contract Verification

Verifying your contract on Etherscan allows others to inspect your code and interact with it through the Etherscan interface.

### Update Environment Variables

Add the deployed contract address to your `.env` file:

```
CONTRACT_ADDRESS=your_deployed_contract_address
```

### Verify the Contract

```bash
npm run verify:sepolia
```

This will submit your contract source code to Etherscan for verification.

### Manual Verification (if needed)

If the automatic verification fails:

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## Interactive Testing

After deployment, you can interact with your contract using our interactive script or directly through Etherscan.

### Using the Interactive Script

```bash
npm run interact:sepolia
```

This provides the same interface as the local interaction script but connects to your contract on Sepolia.

### Using Etherscan

1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Search for your contract address
3. Go to the "Contract" tab
4. Click on "Write Contract" to interact with your contract functions
5. Connect your wallet (MetaMask) to execute transactions

### Using Hardhat Console

For more advanced interactions:

```bash
npx hardhat console --network sepolia
```

Then you can interact with your contract programmatically:

```javascript
// Get the contract instance
const DevToken = await ethers.getContractFactory("DevToken");
const devToken = await DevToken.attach("YOUR_CONTRACT_ADDRESS");

// Get token information
const name = await devToken.name();
console.log("Token name:", name);

// Mint tokens (if you have the MINTER_ROLE)
const [signer] = await ethers.getSigners();
await devToken.mint(signer.address, ethers.parseEther("100"), "Testing");

// Check balance
const balance = await devToken.balanceOf(signer.address);
console.log("Balance:", ethers.formatEther(balance));
```

## Testing Specific Features

### Testing Staking

1. Mint tokens to your account
2. Create a stake using the `createStake` function
3. Wait for some time (in a real environment) or use time manipulation in tests
4. Release the stake using `releaseStake`
5. Verify you received your staked tokens plus rewards

### Testing Vesting

1. Mint tokens to your account
2. Create a vesting schedule for another account using `createVestingSchedule`
3. Wait until after the cliff period
4. From the beneficiary account, call `releaseVestedTokens`
5. Verify the correct amount was released

### Testing Role-Based Access Control

1. Try to mint tokens from an account without the MINTER_ROLE (should fail)
2. Grant the MINTER_ROLE to another account
3. Try to mint tokens from that account (should succeed)
4. Try to pause the contract from an account without the PAUSER_ROLE (should fail)

## Troubleshooting

### Common Issues

1. **Insufficient Funds**: Make sure your account has enough Sepolia ETH for gas fees.

2. **Nonce Too High**: If you get a "nonce too high" error, your transaction count might be out of sync. Reset your account in MetaMask or use:
   ```javascript
   await ethers.provider.send("hardhat_reset")
   ```

3. **Gas Estimation Failed**: This often means your transaction would revert. Check that you're calling functions correctly and have the right permissions.

4. **Contract Verification Failed**: Make sure your contract doesn't use libraries or complex inheritance that might cause verification issues.

### Getting Help

If you encounter issues:

1. Check the Hardhat documentation: https://hardhat.org/docs
2. Look for similar issues on the Hardhat GitHub repository
3. Check the OpenZeppelin forums for issues related to the contract components

## Gas Optimization

To analyze gas usage and optimize your contract:

```bash
REPORT_GAS=true npx hardhat test
```

This will generate a `gas-report.txt` file with detailed gas usage information for each function.
