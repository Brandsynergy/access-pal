import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import webrtcService from '../services/webrtc';
import { subscribeToPushNotifications } from '../services/pushNotifications';
import QRCodeDisplay from '../components/QRCodeDisplay';
import IncomingCall from '../components/IncomingCall';
import VideoCall from '../components/VideoCall';
import PWAInstallBanner from '../components/PWAInstallBanner';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [enablingNotifications, setEnablingNotifications] = useState(false);

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setNotificationPermission(currentPermission);
      
      // If already granted, subscribe to push immediately
      if (currentPermission === 'granted') {
        console.log('✅ Notification permission already granted, subscribing to push...');
        subscribeToPushNotifications().then(result => {
          if (result.success) {
            console.log('✅ Auto-subscribed to push notifications');
          } else {
            console.log('⚠️ Auto-subscribe failed:', result.message);
          }
        });
      } else if (currentPermission === 'default') {
        // Auto-request permission after 1 second
        setTimeout(() => {
          Notification.requestPermission().then(async (permission) => {
            console.log('Notification permission:', permission);
            setNotificationPermission(permission);
            
            if (permission === 'granted') {
              // Auto-subscribe if permission granted
              const result = await subscribeToPushNotifications();
              if (result.success) {
                console.log('✅ Auto-subscribed to push notifications');
              }
            }
          });
        }, 1000);
      }
    }

    // Monitor socket connection status
    if (webrtcService.socket) {
      setIsConnected(webrtcService.socket.connected);
      
      webrtcService.socket.on('connect', () => {
        console.log('✅ Dashboard: Socket connected');
        setIsConnected(true);
      });
      
      webrtcService.socket.on('disconnect', () => {
        console.log('❌ Dashboard: Socket disconnected');
        setIsConnected(false);
      });
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const requestNotifications = async () => {
    console.log('🔔 Notification button clicked');
    setEnablingNotifications(true);
    
    try {
      if ('Notification' in window) {
        console.log('📱 Current permission:', Notification.permission);
        
        const permission = await Notification.requestPermission();
        console.log('📱 Permission result:', permission);
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          console.log('✅ Permission granted, showing test notification');
          
          // Show test notification
          new Notification('✅ Notifications Enabled!', {
            body: 'You will now be alerted when visitors scan your QR code',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200]
          });
          
          // Subscribe to push notifications
          console.log('📨 Subscribing to push notifications...');
          const result = await subscribeToPushNotifications();
          
          if (result.success) {
            console.log('✅ Push notifications enabled!');
            alert('✅ Success! You will receive notifications when visitors scan your QR code.');
          } else {
            console.error('❌ Push subscription failed:', result.message);
            alert('⚠️ Browser notifications enabled, but push service failed: ' + result.message);
          }
        } else if (permission === 'denied') {
          console.warn('❌ Permission denied');
          alert('❌ Notifications blocked. Please enable them in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Find "Notifications"\n3. Select "Allow"\n4. Refresh the page');
        } else {
          console.warn('⚠️ Permission dismissed');
        }
      } else {
        console.error('❌ Notifications not supported');
        alert('Your browser does not support notifications.');
      }
    } catch (error) {
      console.error('❌ Notification error:', error);
      alert('Error: ' + error.message);
    } finally {
      setEnablingNotifications(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* PWA Install Banner */}
      <PWAInstallBanner />
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>🚪 ACCESS PAL</h1>
            <div className="user-info">
              <div className="connection-status">
                {isConnected ? (
                  <span className="status-badge connected">
                    🟢 Online & Ready
                  </span>
                ) : (
                  <span className="status-badge disconnected">
                    🔴 Connecting...
                  </span>
                )}
              </div>
              <span>👋 {user.name}</span>
              <motion.button
                className="btn btn-outline"
                onClick={handleLogout}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
          <div style={{
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            padding: '20px',
            margin: '20px auto',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>
              🔔 Enable Notifications
            </h3>
            <p style={{ color: '#856404', margin: '0 0 15px 0' }}>
              Get instant alerts when visitors scan your QR code!
            </p>
            <button 
              onClick={requestNotifications}
              disabled={enablingNotifications}
              style={{
                background: enablingNotifications ? '#cccccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: enablingNotifications ? 'not-allowed' : 'pointer',
                opacity: enablingNotifications ? 0.6 : 1
              }}
            >
              {enablingNotifications ? '⏳ Enabling...' : '🔔 Enable Notifications Now'}
            </button>
          </div>
        )}
        <QRCodeDisplay />
      </main>

      <footer className="dashboard-footer">
        <div className="container text-center">
          <p>ACCESS PAL - MEDIAD INNOVATION © 2026</p>
        </div>
      </footer>

      {/* Incoming Call Notification */}
      <IncomingCall />

      {/* Video Call Interface */}
      <VideoCall />
    </div>
  );
};

export default Dashboard;
