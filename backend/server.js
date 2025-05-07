const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
// const xss = require('xss-clean'); // Commented out due to compatibility issues with newer Node.js versions
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Enable trust proxy with specific configuration
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Security middleware
app.use(helmet()); // Set security headers
// app.use(xss()); // Prevent XSS attacks - commented out due to compatibility issues
// app.use(mongoSanitize()); // Sanitize data - commented out due to compatibility issues
app.use(hpp()); // Prevent HTTP param pollution

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Enable CORS with specific options
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dev-evaluation', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const developerRoutes = require('./routes/developers');
const evaluationRoutes = require('./routes/evaluations');
const tokenRoutes = require('./routes/tokens');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const redemptionRoutes = require('./routes/redemptions');
const githubRoutes = require('./routes/github');

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api', githubRoutes);

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

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
