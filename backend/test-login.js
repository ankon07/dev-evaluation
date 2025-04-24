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

const testLogin = async () => {
  try {
    const email = 'ankonahamed@example.com';
    const password = 'ankon10';
    
    console.log(`Testing login with email: ${email} and password: ${password}`);
    
    // Find the user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User found in database');
    
    // Test password match
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      console.log('Password match successful!');
      console.log('Login would be successful with these credentials');
    } else {
      console.log('Password match failed');
      console.log('Login would fail with these credentials');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

testLogin();
