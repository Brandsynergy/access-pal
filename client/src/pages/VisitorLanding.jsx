import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './VisitorLanding.css';

function VisitorLanding() {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const [isRestrictedBrowser, setIsRestrictedBrowser] = useState(false);

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
  }, []);

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
          <div className="message">
            <p>👋 Welcome!</p>
            <p>You're about to connect with the homeowner via video call.</p>
          </div>

          {/* Warning for restricted browsers */}
          {isRestrictedBrowser && (
            <div className="browser-warning">
              <h3>⚠️ Important!</h3>
              <p><strong>Please open this page in your Chrome browser</strong></p>
              <ol>
                <li>Tap the menu (⋮) at the top</li>
                <li>Select "Open in Chrome" or "Open in Browser"</li>
              </ol>
              <p className="warning-note">Video calls don't work in Google Lens or in-app browsers</p>
            </div>
          )}

          {/* Big Call Button */}
          <motion.button
            className="start-call-btn"
            onClick={handleStartCall}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">📞</span>
            <span className="btn-text">Start Video Call</span>
          </motion.button>

          {/* Info */}
          <div className="info-note">
            <p>🎥 Please allow camera and microphone access</p>
            <p>🔒 Your privacy is protected</p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="landing-footer">
          <p>Powered by ACCESS PAL</p>
        </div>
      </div>
    </div>
  );
}

export default VisitorLanding;
