import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './QRCodeDisplay.css';

const QRCodeDisplay = () => {
  const { user, regenerateQRCode } = useAuth();
  const [regenerating, setRegenerating] = useState(false);
  const [activationDetails, setActivationDetails] = useState(null);
  const [loadingActivation, setLoadingActivation] = useState(true);

  const handleRegenerate = async () => {
    if (!window.confirm('Are you sure? Your old QR code will no longer work and will need to be reactivated.')) {
      return;
    }
    
    setRegenerating(true);
    const result = await regenerateQRCode();
    
    if (result.success) {
      alert('QR code regenerated successfully! You will need to activate it again.');
      // Refetch activation details
      fetchActivationDetails();
    } else {
      alert(result.message);
    }
    
    setRegenerating(false);
  };

  useEffect(() => {
    fetchActivationDetails();
  }, []);

  const fetchActivationDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/qr/details', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setActivationDetails(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching activation details:', err);
    } finally {
      setLoadingActivation(false);
    }
  };


  return (
    <motion.div 
      className="qr-display-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="qr-display-card">
        <div className="qr-header">
          <h2>Your Personal QR Code</h2>
          <p>Visitors scan this code to reach you</p>
        </div>

        <motion.div 
          className="qr-code-wrapper"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <img 
            src={user.qrCodeImage} 
            alt="Your ACCESS PAL QR Code" 
            className="qr-code-image"
          />
          <div className="qr-glow"></div>
        </motion.div>

        <div className="qr-info">
          <div className="info-item">
            <span className="info-label">QR Code ID:</span>
            <span className="info-value">{user.qrCodeId}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Linked to:</span>
            <span className="info-value">{user.email}</span>
          </div>
          {!loadingActivation && activationDetails && (
            <>
              <div className="info-item">
                <span className="info-label">Activation Code:</span>
                <span className="info-value activation-code">{activationDetails.lastFourDigits}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`info-value status-badge ${activationDetails.isActivated ? 'activated' : 'not-activated'}`}>
                  {activationDetails.isActivated ? '✅ Activated' : '⚠️ Not Activated'}
                </span>
              </div>
              {activationDetails.isActivated && (
                <>
                  <div className="info-item">
                    <span className="info-label">Scans:</span>
                    <span className="info-value">{activationDetails.scanCount || 0} scans</span>
                  </div>
                  {activationDetails.lastScannedAt && (
                    <div className="info-item">
                      <span className="info-label">Last Scanned:</span>
                      <span className="info-value">{new Date(activationDetails.lastScannedAt).toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="security-notice">
          <h3>🔒 Security Notice</h3>
          <p>For your security, QR codes cannot be downloaded or printed from this dashboard.</p>
          <p>Your physical QR code sticker was mailed to you during account setup.</p>
          <p>If you need a replacement sticker, contact support at <strong>support@mivado.co</strong></p>
        </div>

        <div className="qr-actions">
          <motion.button
            className="btn btn-secondary"
            onClick={handleRegenerate}
            disabled={regenerating}
            whileTap={{ scale: 0.95 }}
          >
            {regenerating ? '🔄 Regenerating...' : '🔄 Regenerate QR'}
          </motion.button>
        </div>

        <div className="qr-instructions">
          <h3>How to Use:</h3>
          <ol>
            <li>Your QR code sticker will arrive with the activation code <span style={{ background: 'white', color: '#667eea', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>{activationDetails?.lastFourDigits || 'XXXX'}</span> printed on the back</li>
            <li>Stick the QR code on your door or wall at the entrance</li>
            <li><strong>First time:</strong> Scan your own QR code and enter the 4-digit code from the back to activate it</li>
            <li>QR code locks to that location (≈ 1 mile radius)</li>
            <li><strong>After activation:</strong> Visitors scan and video call works automatically!</li>
          </ol>
        </div>
        
        {/* Mobile Visitor Instructions */}
        <div className="visitor-instructions">
          <h3>📱 For Visitors:</h3>
          <div className="instruction-steps">
            <div className="step">1️⃣ Scan QR Code</div>
            <div className="step">2️⃣ Share to Firefox (Android) or Safari (iPhone)</div>
            <div className="step">3️⃣ Tap "Start Video Call"</div>
          </div>
          <p className="android-tip">👉 <strong>Android users:</strong> Firefox works best!</p>
        </div>
      </div>
    </motion.div>
  );
};

export default QRCodeDisplay;
