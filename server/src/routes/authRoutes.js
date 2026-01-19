import express from 'express';
import { register, login, getProfile, regenerateQRCode, generateSticker } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/generate-sticker', generateSticker);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/regenerate-qr', protect, regenerateQRCode);

export default router;
