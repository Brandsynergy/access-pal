import api from './api';

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
  try {
    console.log('🔔 Subscribing to push notifications...');

    // Check if service worker and push manager are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('❌ Push notifications not supported');
      return { success: false, message: 'Push notifications not supported in this browser' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready');

    // Get existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('✅ Already subscribed to push');
    } else {
      // Get VAPID public key from server
      const vapidResponse = await api.get('/push/vapid-public-key');
      const vapidPublicKey = vapidResponse.data.data.publicKey;
      console.log('🔑 Got VAPID public key');

      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      console.log('✅ Subscribed to push');
    }

    // Send subscription to server
    const token = localStorage.getItem('token');
    const response = await api.post('/push/subscribe', 
      { subscription },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      console.log('✅ Push subscription saved to server');
      return { success: true, message: 'Subscribed to push notifications' };
    } else {
      console.error('❌ Failed to save push subscription:', response.data.message);
      return { success: false, message: response.data.message };
    }

  } catch (error) {
    console.error('❌ Push subscription error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) {
      return { success: false, message: 'Service worker not supported' };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push');

      // Notify server
      const token = localStorage.getItem('token');
      await api.post('/push/unsubscribe', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    return { success: true, message: 'Unsubscribed successfully' };
  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    return { success: false, message: error.message };
  }
}
