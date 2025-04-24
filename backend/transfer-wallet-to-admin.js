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

const transferWalletToAdmin = async () => {
  try {
    const walletAddress = '0x4742D78A5471c60a78251e6d7354522a7FB1640A';
    const developerEmail = 'cr7@emample.com';
    const adminEmail = 'ankonahamed@example.com';
    
    console.log(`Transferring wallet address ${walletAddress} from ${developerEmail} to ${adminEmail}`);
    
    // Find the developer user
    const developer = await User.findOne({ email: developerEmail });
    
    if (!developer) {
      console.log('Developer user not found');
      process.exit(1);
    }
    
    // Find the admin user
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }
    
    // Remove wallet address from developer
    developer.walletAddress = undefined;
    await developer.save();
    console.log('Wallet address removed from developer user');
    
    // Add wallet address to admin
    admin.walletAddress = walletAddress;
    await admin.save();
    console.log('Wallet address added to admin user');
    
    console.log('Wallet transfer completed successfully');
    console.log(`Admin ID: ${admin._id}`);
    console.log(`Admin email: ${admin.email}`);
    console.log(`Admin wallet address: ${admin.walletAddress}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

transferWalletToAdmin();
