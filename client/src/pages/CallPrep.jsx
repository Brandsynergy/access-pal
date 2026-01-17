import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CallPrep.css';

function CallPrep() {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checking, setChecking] = useState(true); // Start as checking
  const [error, setError] = useState(null);

  // Check permissions on mount
  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    try {
      // Check if permissions already granted
      const result = await navigator.permissions.query({ name: 'camera' });
      
      if (result.state === 'granted') {
        console.log('✅ Permissions already granted, proceeding to call');
        setPermissionGranted(true);
        // Go directly to call
        setTimeout(() => {
          navigate(`/call/${qrCodeId}`);
        }, 500);
        return;
      }
      
      console.log('⚠️ Permissions not granted yet, showing request button');
      setChecking(false);
    } catch (err) {
      // Permission API not supported or error, show button
      console.log('⚠️ Permission check not supported, showing button');
      setChecking(false);
    }
  };

  const checkPermissions = async () => {
    setChecking(true);
    setError(null);

    try {
      // Request permissions explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Permissions granted! Stop the stream and proceed
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);

      // Wait a moment then navigate to call
      setTimeout(() => {
        navigate(`/call/${qrCodeId}`);
      }, 1000);

    } catch (err) {
      console.error('Permission check failed:', err);
      setError('Please tap "Allow" when your browser asks for camera and microphone permissions');
      setChecking(false);
    }
  };

  return (
    <div className="call-prep-page">
      <div className="prep-content">
        <motion.div
          className="prep-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="prep-icon">
            {permissionGranted ? '✅' : '📹'}
          </div>

          <h1>ACCESS PAL</h1>
          <p className="subtitle">Video Doorbell</p>

          {!permissionGranted && !checking && (
            <>
              <div className="prep-message">
                <h2>📱 Permission Required</h2>
                <p>We need access to your camera and microphone to start the video call.</p>
                <p><strong>Please tap "Allow" when prompted</strong></p>
              </div>

              <motion.button
                className="prep-button"
                onClick={checkPermissions}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="btn-icon">🎥</span>
                <span className="btn-text">Grant Permissions & Start Call</span>
              </motion.button>

              {error && (
                <div className="prep-error">
                  <p>⚠️ {error}</p>
                  <p className="error-help">Make sure no other app is using your camera</p>
                </div>
              )}
            </>
          )}

          {checking && (
            <div className="prep-checking">
              <div className="spinner"></div>
              <p>Checking permissions...</p>
              <p className="help-text">Please tap "Allow" when your browser asks</p>
            </div>
          )}

          {permissionGranted && (
            <div className="prep-success">
              <div className="success-icon">✅</div>
              <h2>Permissions Granted!</h2>
              <p>Starting video call...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default CallPrep;
