import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './VisitorLanding.css';

function VisitorLanding() {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();

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
