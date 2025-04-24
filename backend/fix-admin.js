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

const fixAdmin = async () => {
  try {
    // Delete the admin if it exists
    const deletedAdmin = await User.findOneAndDelete({ email: 'ankonahamed@example.com' });
    
    if (deletedAdmin) {
      console.log('Previous admin user deleted successfully');
    } else {
      console.log('Admin user not found');
    }
    
    // Create new admin user - let the pre-save hook handle password hashing
    const admin = await User.create({
      name: 'Ankon Ahamed',
      email: 'ankonahamed@example.com',
      password: 'ankon10', // This will be hashed by the pre-save hook
      role: 'admin'
    });
    
    console.log(`New admin user created with ID: ${admin._id}`);
    console.log('Email: ankonahamed@example.com');
    console.log('Password: ankon10');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

fixAdmin();
