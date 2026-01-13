import express from 'express';
import { register, login, getProfile, regenerateQRCode } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/regenerate-qr', protect, regenerateQRCode);

export default router;
