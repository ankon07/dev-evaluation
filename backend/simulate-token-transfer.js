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

const simulateTokenTransfer = async () => {
  try {
    const adminEmail = 'ankonahamed@example.com';
    const recipientEmail = 'cr7@emample.com'; // The developer user
    
    console.log(`Simulating token transfer from admin (${adminEmail}) to developer (${recipientEmail})`);
    
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
    console.log(`Admin token balance: ${admin.tokenBalance}`);
    
    // Find the recipient user
    const recipient = await User.findOne({ email: recipientEmail });
    
    if (!recipient) {
      console.log('Recipient user not found');
      process.exit(1);
    }
    
    console.log('\nRecipient user found:');
    console.log(`Recipient ID: ${recipient._id}`);
    console.log(`Recipient email: ${recipient.email}`);
    console.log(`Recipient wallet address: ${recipient.walletAddress}`);
    console.log(`Recipient token balance: ${recipient.tokenBalance}`);
    
    // Simulate token transfer
    console.log('\nSimulating token transfer...');
    const transferAmount = 20;
    
    // Check if admin has enough tokens
    if (admin.tokenBalance < transferAmount) {
      console.log(`Admin does not have enough tokens. Current balance: ${admin.tokenBalance}, Transfer amount: ${transferAmount}`);
      process.exit(1);
    }
    
    // Update token balances
    admin.tokenBalance -= transferAmount;
    recipient.tokenBalance = (parseFloat(recipient.tokenBalance) || 0) + transferAmount;
    
    await admin.save();
    await recipient.save();
    
    // Create a transaction record for the transfer
    const transferTransaction = await Transaction.create({
      from: admin._id,
      to: recipient._id,
      amount: transferAmount,
      type: 'transfer',
      reason: 'Token transfer to developer',
      status: 'completed',
      transactionHash: '0x' + Math.random().toString(16).substring(2, 42),
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: Math.floor(Math.random() * 100000),
      createdAt: Date.now(),
      processedAt: Date.now()
    });
    
    console.log(`Transferred ${transferAmount} tokens from admin to recipient`);
    console.log(`Admin new token balance: ${admin.tokenBalance}`);
    console.log(`Recipient new token balance: ${recipient.tokenBalance}`);
    console.log(`Transfer transaction ID: ${transferTransaction._id}`);
    
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

simulateTokenTransfer();
