import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QRActivation.css';
import { motion } from 'framer-motion';
import api from '../services/api';
import './QRActivation.css';

function QRActivation() {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(true);

  useEffect(() => {
    // Get user's location on mount
    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Location services not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setError('Please enable location services to activate your QR code');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) return;
    
    const newDigits = [...digits];
    newDigits[index] = value.toUpperCase();
    setDigits(newDigits);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleActivate = async () => {
    setError('');
    
    // Validate all digits entered
    if (digits.some(d => !d)) {
      setError('Please enter all 4 digits');
      return;
    }

    // Check location
    if (!location) {
      setError('Location required. Please enable location services and refresh.');
      return;
    }

    setLoading(true);

    try {
      const activationCode = digits.join('');
      const deviceFingerprint = generateDeviceFingerprint();

      const response = await api.post(`/api/qr/activate`, {
        qrCodeId,
        activationCode,
        latitude: location.latitude,
        longitude: location.longitude,
        deviceFingerprint
      });

      if (response.data.success) {
        // Activation successful! Redirect to visitor landing page
        navigate(`/visitor/${qrCodeId}`);
      }
    } catch (err) {
      console.error('Activation error:', err);
      setError(err.response?.data?.message || 'Invalid activation code. Please check the last 4 digits.');
      setLoading(false);
    }
  };

  const generateDeviceFingerprint = () => {
    const ua = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return btoa(`${ua}-${screen}-${timezone}`).substring(0, 50);
  };

  return (
    <div className="activation-page">
      <div className="activation-content">
        <motion.div
          className="activation-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="activation-icon">🔐</div>
          
          <h1>ACCESS PAL</h1>
          <p className="subtitle">Activate Your QR Code</p>

          <div className="activation-message">
            <p>🎉 First time setup!</p>
            <p>Enter the <strong>last 4 digits</strong> printed on the back of your QR code sticker.</p>
          </div>

          {gettingLocation && (
            <div className="location-status">
              <div className="spinner-small"></div>
              <p>Getting your location...</p>
            </div>
          )}

          {!gettingLocation && location && (
            <div className="location-status success">
              <p>📍 Location captured</p>
            </div>
          )}

          <div className="digit-inputs">
            {digits.map((digit, index) => (
              <input
                key={index}
                id={`digit-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="digit-input"
                disabled={loading || gettingLocation}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="activation-error">
              <p>❌ {error}</p>
            </div>
          )}

          <motion.button
            className="activate-btn"
            onClick={handleActivate}
            disabled={loading || gettingLocation || !location}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            {loading ? 'Activating...' : 'Activate QR Code'}
          </motion.button>

          <div className="activation-info">
            <p>🔒 This QR code will be locked to this location</p>
            <p className="info-note">Contact support if you need to move it</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default QRActivation;
