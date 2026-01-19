import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import './IncomingCall.css';

function IncomingCall() {
  const { incomingCall, acceptCall, rejectCall, callState } = useCall();
  const notificationShown = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (incomingCall && callState === 'ringing' && !notificationShown.current) {
      notificationShown.current = true;
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🔔 Visitor at Your Door!', {
          body: 'Someone has scanned your QR code and wants to talk',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'visitor-call',
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200]
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      // Play doorbell sound
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      }
    }

    // Reset when call ends
    if (!incomingCall || callState !== 'ringing') {
      notificationShown.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [incomingCall, callState]);

  if (!incomingCall || callState !== 'ringing') {
    return null;
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="incoming-call-overlay">
      {/* Doorbell sound */}
      <audio ref={audioRef} loop>
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Tv" type="audio/wav" />
      </audio>
      <div className="incoming-call-modal">
        <div className="call-animation">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
          <div className="doorbell-icon">🚪</div>
        </div>

        <h2 className="call-title">🔔 Someone is at your door!</h2>
        <p className="call-time">
          {formatTime(incomingCall.timestamp)}
        </p>
        <p className="call-subtitle">
          A visitor has scanned your QR code
        </p>

        <div className="call-actions">
          <button 
            className="btn-answer"
            onClick={acceptCall}
          >
            <span className="btn-icon">📹</span>
            <span className="btn-text">Answer</span>
          </button>

          <button 
            className="btn-decline"
            onClick={rejectCall}
          >
            <span className="btn-icon">📞</span>
            <span className="btn-text">Decline</span>
          </button>
        </div>

        <p className="call-hint">
          Answer to see and talk to your visitor
        </p>
      </div>
    </div>
  );
}

export default IncomingCall;
