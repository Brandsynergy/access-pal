import { subscribeToPush, unsubscribeFromPush } from '../services/pushNotificationService.js';

/**
 * Subscribe to push notifications
 */
export const subscribe = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { subscription } = req.body;

    console.log('\n📨📨📨 PUSH SUBSCRIPTION REQUEST RECEIVED');
    console.log('🆔 User ID:', userId);
    console.log('📍 Subscription endpoint:', subscription?.endpoint?.substring(0, 50) + '...');

    if (!subscription || !subscription.endpoint) {
      console.error('❌ Invalid subscription object');
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription object'
      });
    }

    const result = await subscribeToPush(userId, subscription);
    
    if (result.success) {
      console.log('✅ Push subscription saved successfully for user:', userId);
    } else {
      console.error('❌ Failed to save push subscription:', result.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe',
      error: error.message
    });
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribe = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const result = await unsubscribeFromPush(userId);

    res.json(result);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe',
      error: error.message
    });
  }
};

/**
 * Get VAPID public key
 */
export const getVapidPublicKey = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        publicKey: process.env.VAPID_PUBLIC_KEY
      }
    });
  } catch (error) {
    console.error('Get VAPID key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VAPID key'
    });
  }
};
