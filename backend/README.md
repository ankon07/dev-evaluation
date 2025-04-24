# Dev Evaluation Blockchain Backend

This is the backend server for the Developer Evaluation and Reward System using blockchain technology.

## Overview

The backend provides a RESTful API for:
- User authentication and management
- Developer evaluations and rewards
- Blockchain token management
- Administrative functions

## Prerequisites

- Node.js (v16+)
- MongoDB
- Ethereum wallet and access to Sepolia testnet

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd dev-eval-blockchain/backend
   npm install
   ```
3. Configure environment variables in `.env` file

## Running the Server

To start the development server:

```
npm run dev
```

To start the production server:

```
npm start
```

## API Testing

The backend includes several test scripts to verify API functionality. These scripts use `curl` to make HTTP requests to the API endpoints.

### Available Test Scripts

1. **General API Tests** - Tests basic functionality like user registration, login, and profile management
   ```
   ./test-api.sh
   ```

2. **Admin API Tests** - Tests admin-specific endpoints like system configuration and user management
   ```
   ./test-admin-api.sh
   ```

3. **Evaluations API Tests** - Tests evaluation-related endpoints for creating and processing developer evaluations
   ```
   ./test-evaluations-api.sh
   ```

4. **Tokens API Tests** - Tests blockchain token-related endpoints for token transfers, staking, and rewards
   ```
   ./test-tokens-api.sh
   ```

### Running the Tests

1. Make sure the server is running:
   ```
   npm run dev
   ```

2. In a separate terminal, run any of the test scripts:
   ```
   cd dev-eval-blockchain/backend
   ./test-api.sh
   ```

3. The test scripts will output the results of each API call, showing success or failure.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update user password
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:resettoken` - Reset password with token
- `GET /api/auth/github` - GitHub OAuth login
- `GET /api/auth/github/callback` - GitHub OAuth callback

### Developers

- `GET /api/developers` - Get all developers (admin only)
- `GET /api/developers/stats` - Get developer statistics
- `GET /api/developers/transactions` - Get developer transactions
- `GET /api/developers/:id` - Get specific developer
- `PUT /api/developers/:id/profile` - Update developer profile
- `POST /api/developers/:id/skills` - Add developer skill
- `PUT /api/developers/:id/skills/:skillId` - Update developer skill
- `DELETE /api/developers/:id/skills/:skillId` - Remove developer skill
- `POST /api/developers/:id/wallet` - Connect wallet address

### Evaluations

- `GET /api/evaluations` - Get all evaluations (admin only)
- `GET /api/evaluations/:id` - Get specific evaluation
- `POST /api/evaluations` - Create new evaluation (admin only)
- `POST /api/evaluations/:id/process` - Process evaluation (admin only)
- `GET /api/evaluations/developer/:developerId` - Get developer evaluations
- `GET /api/evaluations/:id/metrics` - Get evaluation metrics
- `GET /api/evaluations/developer/:developerId/history` - Get evaluation history

### Tokens

- `GET /api/tokens/balance` - Get token balance
- `POST /api/tokens/transfer` - Transfer tokens
- `POST /api/tokens/stake` - Stake tokens
- `POST /api/tokens/unstake` - Unstake tokens
- `GET /api/tokens/transactions` - Get transaction history
- `GET /api/tokens/transactions/:id` - Get transaction status
- `POST /api/tokens/redeem` - Redeem tokens
- `GET /api/tokens/staking` - Get staking info

### Admin

- `GET /api/admin/config` - Get system configuration
- `PUT /api/admin/config` - Update system configuration
- `GET /api/admin/rules` - Get reward rules
- `PUT /api/admin/rules` - Update reward rules
- `POST /api/admin/sync` - Sync external data
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/reports` - Generate reports
- `GET /api/admin/logs` - Get audit logs
- `GET /api/admin/users` - Manage users
- `GET /api/admin/users/:id` - Get specific user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Blockchain Integration

The backend integrates with Ethereum blockchain using:
- Web3.js for blockchain interaction
- HDWalletProvider for wallet management
- Smart contracts for token management

The blockchain service is configured to connect to:
- Sepolia testnet for development
- Mumbai testnet for testing
- Polygon mainnet for production

## Troubleshooting

If you encounter blockchain connection issues, check:
1. Your Ethereum RPC URL in the `.env` file
2. Your private key or mnemonic
3. Network connectivity to the Ethereum network

For MongoDB connection issues, verify:
1. MongoDB connection string in the `.env` file
2. MongoDB service is running
3. Network connectivity to the MongoDB server
