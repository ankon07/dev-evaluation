const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const tokenService = require('./services/blockchain/tokenService');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkAdminBalance = async () => {
  try {
    const email = 'ankonahamed@example.com';
    
    console.log(`Checking token balance for admin user: ${email}`);
    
    // Find the admin user
    const admin = await User.findOne({ email });
    
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }
    
    console.log('Admin user found:');
    console.log(`Admin ID: ${admin._id}`);
    console.log(`Admin email: ${admin.email}`);
    console.log(`Admin wallet address: ${admin.walletAddress}`);
    
    if (!admin.walletAddress) {
      console.log('Admin user does not have a wallet address');
      process.exit(1);
    }
    
    // Get token balance
    console.log('Fetching token balance from blockchain...');
    const balance = await tokenService.getBalance(admin.walletAddress);
    console.log(`Token balance: ${balance}`);
    
    // Get staked amount
    console.log('Fetching staked amount from blockchain...');
    const stakedAmount = await tokenService.getStakedAmount(admin.walletAddress);
    console.log(`Staked amount: ${stakedAmount}`);
    
    // Update user's token balance and staked tokens in database
    admin.tokenBalance = balance;
    admin.stakedTokens = stakedAmount;
    await admin.save();
    console.log('Updated token balance and staked amount in database');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkAdminBalance();
