const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Drop the telegramId index
const dropIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dev-evaluation', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected');
    
    // Wait for the connection to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    // Find the users collection
    for (const collection of collections) {
      if (collection.name === 'users') {
        console.log('Found users collection, dropping telegramId index...');
        
        try {
          // Get all indexes
          const indexes = await db.collection('users').indexes();
          console.log('Indexes:', indexes);
          
          // Find and drop the telegramId index
          for (const index of indexes) {
            if (index.key && index.key.telegramId) {
              console.log('Found telegramId index, dropping...');
              await db.collection('users').dropIndex(index.name);
              console.log('Index dropped successfully');
            }
          }
        } catch (error) {
          console.error('Error getting or dropping index:', error);
        }
      }
    }
    
    console.log('Done');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error);
    process.exit(1);
  }
};

dropIndex();
