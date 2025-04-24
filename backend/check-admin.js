const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Load User model
const User = require('./models/User');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkAdmin = async () => {
  try {
    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database');
      process.exit(0);
    }
    
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach((admin, index) => {
      console.log(`\nAdmin #${index + 1}:`);
      console.log(`ID: ${admin._id}`);
      console.log(`Name: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Created At: ${admin.createdAt}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking admin users:', err);
    process.exit(1);
  }
};

checkAdmin();
