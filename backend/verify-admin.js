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

const verifyAdmin = async () => {
  try {
    // Check for old admin
    const oldAdmin = await User.findOne({ email: 'ankon@example.com' });
    if (oldAdmin) {
      console.log('Old admin still exists:', oldAdmin.email);
    } else {
      console.log('Old admin (ankon@example.com) has been successfully deleted');
    }
    
    // Check for new admin
    const newAdmin = await User.findOne({ email: 'ankonahamed@example.com' });
    if (newAdmin) {
      console.log('New admin exists:', newAdmin.email);
      console.log('Admin ID:', newAdmin._id);
      console.log('Admin role:', newAdmin.role);
    } else {
      console.log('New admin (ankonahamed@example.com) not found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

verifyAdmin();
