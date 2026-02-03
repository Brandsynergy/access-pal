import express from 'express';
import { getPendingCall, clearPendingCall, getPendingCallsStats } from '../services/callStorage.js';

const router = express.Router();

// Get pending call for a QR code
router.get('/pending/:qrCodeId', (req, res) => {
  try {
    const { qrCodeId } = req.params;
    console.log(`📞 API: Fetching pending call for ${qrCodeId}`);
    
    const pendingCall = getPendingCall(qrCodeId);
    
    if (pendingCall) {
      console.log(`✅ API: Returning pending call`);
      res.json({
        success: true,
        data: pendingCall
      });
    } else {
      console.log(`❌ API: No pending call found`);
      res.json({
        success: false,
        message: 'No pending call'
      });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear pending call
router.delete('/pending/:qrCodeId', (req, res) => {
  try {
    const { qrCodeId } = req.params;
    console.log(`🗑️ API: Clearing pending call for ${qrCodeId}`);
    
    clearPendingCall(qrCodeId);
    
    res.json({
      success: true,
      message: 'Pending call cleared'
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get stats (for debugging)
router.get('/stats', (req, res) => {
  try {
    const stats = getPendingCallsStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
