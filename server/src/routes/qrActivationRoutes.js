import express from 'express';
import { activateQR, checkActivation, getActivationDetails } from '../controllers/qrActivationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes (for visitors)
router.post('/activate', activateQR);
router.get('/check/:qrCodeId', checkActivation);

// Protected routes (for homeowners)
router.get('/details', protect, getActivationDetails);

export default router;
