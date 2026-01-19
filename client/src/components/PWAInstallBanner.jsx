import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';
import './PWAInstallBanner.css';

const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, installApp, requestNotificationPermission, notificationPermission } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState(localStorage.getItem('notif-dismissed') === 'true');

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setDismissed(true);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotifDismissed(true);
      localStorage.setItem('notif-dismissed', 'true');
    }
  };

  const handleDismissNotif = () => {
    setNotifDismissed(true);
    localStorage.setItem('notif-dismissed', 'true');
  };

  return (
    <>
      {/* Install App Banner */}
      <AnimatePresence>
        {isInstallable && !dismissed && !isInstalled && (
          <motion.div
            className="pwa-banner install-banner"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="banner-content">
              <div className="banner-icon">📱</div>
              <div className="banner-text">
                <h3>Add to Home Screen</h3>
                <p>Install ACCESS PAL for quick access and notifications</p>
              </div>
              <div className="banner-actions">
                <button onClick={handleInstall} className="btn-install">
                  Install
                </button>
                <button onClick={() => setDismissed(true)} className="btn-dismiss">
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enable Notifications Banner */}
      <AnimatePresence>
        {!notifDismissed && notificationPermission === 'default' && (
          <motion.div
            className="pwa-banner notif-banner"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="banner-content">
              <div className="banner-icon">🔔</div>
              <div className="banner-text">
                <h3>Enable Notifications</h3>
                <p>Get alerted when visitors scan your QR code</p>
              </div>
              <div className="banner-actions">
                <button onClick={handleEnableNotifications} className="btn-enable">
                  Enable
                </button>
                <button onClick={handleDismissNotif} className="btn-dismiss">
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions */}
      <AnimatePresence>
        {!isInstalled && !dismissed && /iPhone|iPad|iPod/.test(navigator.userAgent) && (
          <motion.div
            className="pwa-banner ios-banner"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="banner-content">
              <div className="banner-icon">🍎</div>
              <div className="banner-text">
                <h3>Add to Home Screen (iOS)</h3>
                <p>Tap the Share button <span className="share-icon">⎘</span> then "Add to Home Screen"</p>
              </div>
              <button onClick={() => setDismissed(true)} className="btn-dismiss">
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWAInstallBanner;
