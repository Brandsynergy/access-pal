import express from 'express';
import { healthCheck, getErrors, getSystemStats } from '../controllers/monitoringController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public health check
router.get('/health', healthCheck);

// Protected monitoring endpoints (require authentication)
router.get('/errors', protect, getErrors);
router.get('/stats', protect, getSystemStats);

export default router;
