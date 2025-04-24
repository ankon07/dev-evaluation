const express = require('express');
const router = express.Router();
const { register, login, getMe, updateDetails, updatePassword, forgotPassword, resetPassword, githubAuth, githubCallback } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

module.exports = router;
