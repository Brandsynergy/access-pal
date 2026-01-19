import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import './VisitorLanding.css';

function VisitorLanding() {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const [isRestrictedBrowser, setIsRestrictedBrowser] = useState(false);
  const [checkingActivation, setCheckingActivation] = useState(true);
  const [activationError, setActivationError] = useState('');

  useEffect(() => {
    // Detect if running in restricted browser (Google Lens, Facebook, Instagram, etc.)
    const userAgent = navigator.userAgent || '';
    const isInApp = userAgent.includes('wv') || // WebView
                    userAgent.includes('Instagram') ||
                    userAgent.includes('FBAN') || // Facebook
                    userAgent.includes('FBAV') ||
                    !navigator.mediaDevices || // No media devices API
                    (window.location !== window.parent.location); // In iframe
    
    setIsRestrictedBrowser(isInApp);
    
    if (isInApp) {
      console.log('⚠️ Detected restricted browser/WebView');
    }

    // Check activation status
    checkActivationStatus();
  }, []);

  const checkActivationStatus = async () => {
    console.log('🔍 Checking activation status for:', qrCodeId);
    
    // First check if activated without location (faster)
    try {
      const response = await api.get(`/qr/check/${qrCodeId}`);
      console.log('✅ Activation check response:', response.data);

      if (response.data.success) {
        const { data } = response.data;

        // Not activated - redirect to activation page
        if (!data.isActivated) {
          console.log('⚠️ QR not activated, redirecting to activation page');
          navigate(`/activate/${qrCodeId}`);
          return;
        }

        // QR is activated, now check location
        console.log('✅ QR is activated, checking location...');
        checkLocation();
      } else {
        console.error('❌ Activation check failed:', response.data);
        setActivationError(response.data.message || 'Unable to verify QR code.');
        setCheckingActivation(false);
      }
    } catch (err) {
      console.error('❌ Activation check error:', err);
      // If check fails, allow access (fail open for better UX)
      setCheckingActivation(false);
    }
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      console.log('⚠️ Geolocation not supported, allowing access');
      setCheckingActivation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('📍 Location obtained:', latitude, longitude);

          const response = await api.get(`/qr/check/${qrCodeId}?latitude=${latitude}&longitude=${longitude}`);

          if (response.data.success && response.data.data.locationValid === false) {
            console.log('❌ Location invalid');
            setActivationError(response.data.data.message || 'This QR code is registered at a different location.');
          } else {
            console.log('✅ Location valid, access granted');
          }
        } catch (err) {
          console.error('Location validation error:', err);
        } finally {
          setCheckingActivation(false);
        }
      },
      (error) => {
        console.error('Location error:', error.message);
        // If location fails, still allow access
        setCheckingActivation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleStartCall = () => {
    // Go directly to call - simpler is better
    const callUrl = `/call/${qrCodeId}`;
    console.log('🚀 Starting call directly:', callUrl);
    window.location.href = callUrl;
  };

  return (
    <div className="visitor-landing-page">
      <div className="landing-content">
        <motion.div
          className="welcome-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon */}
          <div className="doorbell-icon">
            🚪
          </div>

          {/* Title */}
          <h1>ACCESS PAL</h1>
          <p className="subtitle">Video Doorbell</p>

          {/* Message */}
          {checkingActivation ? (
            <div className="message">
              <div className="spinner-small" style={{ margin: '20px auto' }}></div>
              <p>Verifying QR code...</p>
            </div>
          ) : activationError ? (
            <div className="activation-error">
              <h3>❌ Access Denied</h3>
              <p>{activationError}</p>
              <p className="error-note">Please contact the homeowner for assistance.</p>
            </div>
          ) : (
            <div className="message">
              <p>👋 Welcome!</p>
              <p>You're about to connect with the homeowner via video call.</p>
            </div>
          )}

          {/* Warning for restricted browsers */}
          {isRestrictedBrowser && (
            <div className="browser-warning">
              <h3>⚠️ Important - Android Users!</h3>
              <p><strong>Google Lens browser doesn't support video calls</strong></p>
              <p><strong>Please share/open in Firefox or Chrome:</strong></p>
              <ol>
                <li>Tap the <strong>Share</strong> button</li>
                <li>Select <strong>"Firefox"</strong> (recommended) or <strong>"Chrome"</strong></li>
              </ol>
              <p className="warning-tip">👉 <strong>Firefox works best on Android!</strong></p>
              <p className="warning-note">Or tap menu (⋮) → "Open in browser"</p>
            </div>
          )}

          {/* Big Call Button */}
          {!activationError && (
            <motion.button
              className="start-call-btn"
              onClick={handleStartCall}
              disabled={checkingActivation}
              whileHover={{ scale: checkingActivation ? 1 : 1.05 }}
              whileTap={{ scale: checkingActivation ? 1 : 0.95 }}
            >
              <span className="btn-icon">📞</span>
              <span className="btn-text">Start Video Call</span>
            </motion.button>
          )}

          {/* Info */}
          <div className="info-note">
            <p>🎥 Please allow camera and microphone access</p>
            <p>🔒 Your privacy is protected</p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="landing-footer">
          <p>ACCESS PAL - MEDIAD INNOVATION © 2026</p>
        </div>
      </div>
    </div>
  );
}

export default VisitorLanding;
