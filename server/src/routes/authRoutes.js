import express from 'express';
import { register, login, getProfile, regenerateQRCode, generateSticker, getUserByEmail, adminRegenerateQR } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/generate-sticker', generateSticker);

// Admin routes (public but should be secured with admin key on frontend)
router.get('/admin/user/:email', getUserByEmail);
router.post('/admin/regenerate-qr', adminRegenerateQR);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/regenerate-qr', protect, regenerateQRCode);

export default router;
