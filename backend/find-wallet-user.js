const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const findWalletUser = async () => {
  try {
    const walletAddress = '0x4742D78A5471c60a78251e6d7354522a7FB1640A';
    
    console.log(`Finding user with wallet address: ${walletAddress}`);
    
    // Find the user with this wallet address
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      console.log('No user found with this wallet address');
      process.exit(0);
    }
    
    console.log('User found with this wallet address:');
    console.log(`User ID: ${user._id}`);
    console.log(`User email: ${user.email}`);
    console.log(`User role: ${user.role}`);
    console.log(`User wallet address: ${user.walletAddress}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

findWalletUser();
