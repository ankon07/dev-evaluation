# Developer Evaluation and Reward System

A comprehensive blockchain-based system for evaluating developer performance and distributing rewards transparently.

## Overview

The Developer Evaluation and Reward System is designed to automatically evaluate developer performance based on a wide range of quantifiable and qualitative metrics from GitHub, task management systems, CI/CD pipelines, and code quality tools. Developers are rewarded with blockchain tokens for successfully completing tasks, achieving performance milestones, contributing to code quality, and collaborating effectively.

## Features

- **Data Integration**: Connect to GitHub, task management systems, CI/CD tools, and code quality platforms
- **Evaluation Engine**: Process integrated data to calculate performance metrics per developer
- **Blockchain & Token Module**: Secure reward distribution using blockchain technology
- **Developer Wallet & Interface**: User-friendly dashboard for developers to track performance and rewards
- **Admin & HR Integration**: Administrative interface for system configuration and reporting

## Tech Stack

### Frontend
- React.js
- Material-UI
- Chart.js for data visualization
- React Router for navigation
- Formik & Yup for form handling and validation

### Backend
- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Axios for API requests

### Blockchain
- Ethereum/Polygon smart contracts
- Web3.js for blockchain interaction
- Truffle for smart contract development and deployment

## Project Structure

```
dev-eval-blockchain/
├── backend/                 # Node.js backend API
│   ├── config/              # Configuration files
│   ├── controllers/         # API controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── services/            # Service integrations
│   └── utils/               # Utility functions
├── frontend/                # React frontend
│   ├── public/              # Static files
│   └── src/                 # Source code
│       ├── assets/          # Images and other assets
│       ├── components/      # React components
│       ├── contexts/        # React contexts
│       └── utils/           # Utility functions
├── smart-contracts/         # Blockchain smart contracts
│   ├── contracts/           # Solidity contracts
│   ├── migrations/          # Truffle migrations
│   └── test/                # Contract tests
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Truffle Suite
- MetaMask or similar Ethereum wallet

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/dev-eval-blockchain.git
   cd dev-eval-blockchain
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your configuration
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Install smart contract dependencies:
   ```
   cd ../smart-contracts
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Deploy smart contracts (if needed):
   ```
   cd smart-contracts
   truffle migrate --network development
   ```

## Configuration

### Backend Configuration

Create a `.env` file in the backend directory with the following variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/dev-eval
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# GitHub Integration
GITHUB_API_KEY=your_github_api_key
GITHUB_ORG=your_github_organization

# Blockchain Configuration
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x...
ADMIN_WALLET_ADDRESS=0x...
ADMIN_WALLET_PRIVATE_KEY=your_private_key
```

### Smart Contract Configuration

Update `truffle-config.js` with your network configuration:

```javascript
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    polygon: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, process.env.POLYGON_RPC_URL),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },
  compilers: {
    solc: {
      version: "0.8.17",
    }
  }
};
```

## Usage

### Admin Interface

1. Login with admin credentials
2. Access the admin dashboard at `/admin`
3. Configure system settings, manage users, and view reports

### Developer Interface

1. Login with developer credentials
2. View your performance metrics and rewards on the dashboard
3. Access your wallet to view token balance and transaction history

## Documentation

For more detailed documentation, please refer to the following:

- [Architecture Overview](docs/architecture.md)
- [Implementation Summary](docs/implementation-summary.md)
- [API Documentation](docs/api-docs.md)
- [Smart Contract Documentation](docs/smart-contracts.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract templates
- [Material-UI](https://mui.com/) for the React component library
- [Chart.js](https://www.chartjs.org/) for data visualization
