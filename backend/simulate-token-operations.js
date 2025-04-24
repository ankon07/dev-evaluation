const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const simulateTokenOperations = async () => {
  try {
    const adminEmail = 'ankonahamed@example.com';
    
    console.log(`Simulating token operations for admin user: ${adminEmail}`);
    
    // Find the admin user
    const admin = await User.findOne({ email: adminEmail });
    
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
    
    // Simulate minting tokens to admin
    console.log('Simulating token minting...');
    const mintAmount = 100;
    
    // Update admin's token balance
    admin.tokenBalance = mintAmount;
    await admin.save();
    
    // Create a transaction record for the mint
    const mintTransaction = await Transaction.create({
      to: admin._id,
      amount: mintAmount,
      type: 'mint',
      reason: 'Initial token allocation',
      status: 'completed',
      transactionHash: '0x' + Math.random().toString(16).substring(2, 42),
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: Math.floor(Math.random() * 100000),
      createdAt: Date.now(),
      processedAt: Date.now()
    });
    
    console.log(`Minted ${mintAmount} tokens to admin`);
    console.log(`New token balance: ${admin.tokenBalance}`);
    console.log(`Mint transaction ID: ${mintTransaction._id}`);
    
    // Simulate staking tokens
    console.log('\nSimulating token staking...');
    const stakeAmount = 50;
    
    // Update admin's token balance and staked tokens
    admin.tokenBalance -= stakeAmount;
    admin.stakedTokens = stakeAmount;
    await admin.save();
    
    // Create a transaction record for the stake
    const stakeTransaction = await Transaction.create({
      from: admin._id,
      to: admin._id, // Adding to field to satisfy validation
      amount: stakeAmount,
      type: 'stake',
      reason: 'Token staking',
      status: 'completed',
      transactionHash: '0x' + Math.random().toString(16).substring(2, 42),
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: Math.floor(Math.random() * 100000),
      createdAt: Date.now(),
      processedAt: Date.now()
    });
    
    console.log(`Staked ${stakeAmount} tokens from admin`);
    console.log(`New token balance: ${admin.tokenBalance}`);
    console.log(`Staked tokens: ${admin.stakedTokens}`);
    console.log(`Stake transaction ID: ${stakeTransaction._id}`);
    
    // Get all transactions for the admin
    console.log('\nFetching all transactions for admin...');
    const transactions = await Transaction.find({
      $or: [
        { from: admin._id },
        { to: admin._id }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${transactions.length} transactions:`);
    transactions.forEach((tx, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log(`ID: ${tx._id}`);
      console.log(`Type: ${tx.type}`);
      console.log(`Amount: ${tx.amount}`);
      console.log(`Status: ${tx.status}`);
      console.log(`Created: ${tx.createdAt}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

simulateTokenOperations();
