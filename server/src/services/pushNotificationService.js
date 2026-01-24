import webpush from 'web-push';
import User from '../models/User.js';
import { logInfo, logError } from './errorLogger.js';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@mivado.co',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to homeowner when visitor scans QR
 */
export const sendVisitorNotification = async (qrCodeId, visitorInfo = {}) => {
  try {
    // Find user by QR code ID
    const user = await User.findOne({ where: { qrCodeId } });
    
    if (!user) {
      logError(new Error('User not found for QR code'), { qrCodeId });
      return { success: false, message: 'User not found' };
    }

    // Check if user has push subscription
    if (!user.pushSubscription) {
      console.log('⚠️ No push subscription for user:', user.email);
      return { success: false, message: 'No push subscription found' };
    }

    const subscription = JSON.parse(user.pushSubscription);

    const payload = JSON.stringify({
      title: '🔔 Visitor at Your Door!',
      body: 'Someone has scanned your QR code and wants to talk',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'visitor-call',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        url: '/dashboard',
        qrCodeId,
        timestamp: new Date().toISOString(),
        ...visitorInfo
      }
    });

    console.log('📡 Sending push notification to:', user.email);

    await webpush.sendNotification(subscription, payload);

    logInfo('Push notification sent', { 
      userId: user.id, 
      qrCodeId 
    });

    return { success: true, message: 'Push notification sent' };

  } catch (error) {
    // If subscription is invalid/expired, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('🗑️ Removing expired push subscription');
      const user = await User.findOne({ where: { qrCodeId } });
      if (user) {
        user.pushSubscription = null;
        await user.save();
      }
    }

    logError(error, { context: 'Send push notification', qrCodeId });
    return { success: false, message: error.message };
  }
};

/**
 * Subscribe user to push notifications
 */
export const subscribeToPush = async (userId, subscription) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    user.pushSubscription = JSON.stringify(subscription);
    await user.save();

    logInfo('User subscribed to push notifications', { userId });

    return { success: true, message: 'Subscribed successfully' };
  } catch (error) {
    logError(error, { context: 'Subscribe to push', userId });
    return { success: false, message: error.message };
  }
};

/**
 * Unsubscribe user from push notifications
 */
export const unsubscribeFromPush = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    user.pushSubscription = null;
    await user.save();

    logInfo('User unsubscribed from push notifications', { userId });

    return { success: true, message: 'Unsubscribed successfully' };
  } catch (error) {
    logError(error, { context: 'Unsubscribe from push', userId });
    return { success: false, message: error.message };
  }
};
