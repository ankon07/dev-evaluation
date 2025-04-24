const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const updateAdminPassword = async () => {
  try {
    // Find admin user
    const admin = await User.findOne({ email: 'admin@example.com', role: 'admin' }).select('+password');
    
    if (!admin) {
      console.log('Admin user not found');
      process.exit(0);
    }
    
    console.log(`Found admin user with ID: ${admin._id}`);
    
    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Admin password updated successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error updating admin password:', err);
    process.exit(1);
  }
};

updateAdminPassword();
