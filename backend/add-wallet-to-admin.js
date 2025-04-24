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

const addWalletToAdmin = async () => {
  try {
    const email = 'ankonahamed@example.com';
    const walletAddress = '0x4742D78A5471c60a78251e6d7354522a7FB1640A';
    
    console.log(`Adding wallet address ${walletAddress} to admin user ${email}`);
    
    // Find the admin user
    const admin = await User.findOne({ email });
    
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }
    
    // Update the wallet address
    admin.walletAddress = walletAddress;
    await admin.save();
    
    console.log('Wallet address added successfully to admin user');
    console.log(`Admin ID: ${admin._id}`);
    console.log(`Admin email: ${admin.email}`);
    console.log(`Admin wallet address: ${admin.walletAddress}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

addWalletToAdmin();
