import express from 'express';
import { subscribe, unsubscribe, getVapidPublicKey } from '../controllers/pushController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get VAPID public key (public route)
router.get('/vapid-public-key', getVapidPublicKey);

// Subscribe to push notifications (protected)
router.post('/subscribe', protect, subscribe);

// Unsubscribe from push notifications (protected)
router.post('/unsubscribe', protect, unsubscribe);

export default router;
