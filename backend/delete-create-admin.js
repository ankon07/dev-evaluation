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

const deleteAndCreateAdmin = async () => {
  try {
    // Delete the previous admin if it exists
    const deletedAdmin = await User.findOneAndDelete({ email: 'ankon@example.com' });
    
    if (deletedAdmin) {
      console.log('Previous admin user deleted successfully');
    } else {
      console.log('Previous admin user not found');
    }
    
    // Check if new admin already exists
    const adminExists = await User.findOne({ email: 'ankonahamed@example.com' });
    
    if (adminExists) {
      console.log('Admin user with email ankonahamed@example.com already exists');
      process.exit(0);
    }
    
    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('ankon10', salt);
    
    const admin = await User.create({
      name: 'Ankon Ahamed',
      email: 'ankonahamed@example.com',
      password: hashedPassword,
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

deleteAndCreateAdmin();
