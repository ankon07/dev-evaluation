const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
// const xss = require('xss-clean'); // Commented out due to compatibility issues
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const errorHandler = require('./middleware/error');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Security middleware
app.use(helmet()); // Set security headers
// app.use(xss()); // Prevent XSS attacks - commented out due to compatibility issues
app.use(mongoSanitize()); // Sanitize data
app.use(hpp()); // Prevent HTTP param pollution

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Enable CORS
app.use(cors());

// Import routes
const authRoutes = require('./routes/auth');
const developerRoutes = require('./routes/developers');
const evaluationRoutes = require('./routes/evaluations');
const tokenRoutes = require('./routes/tokens');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/admin', adminRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Initialize services
const tokenService = require('./services/blockchain/tokenService');
const githubService = require('./services/github/githubService');
const jiloService = require('./services/jilo/jiloService');
const cicdService = require('./services/cicd/cicdService');
const codeQualityService = require('./services/codeQuality/codeQualityService');

// Initialize services if needed
jiloService.initialize();
cicdService.initialize();
codeQualityService.initialize();

// Start MongoDB Memory Server and connect
let mongoServer;
let server;

async function startServer() {
  try {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log(`MongoDB Memory Server started at ${mongoUri}`);

    // Connect to MongoDB Memory Server
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Memory Server');

    // Start Express server
    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      // Close server & exit process
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });

    return { app, server, mongoServer };
  } catch (error) {
    console.error('Error starting server:', error);
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(1);
  }
}

async function stopServer() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

// If this file is run directly, start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, stopServer };
