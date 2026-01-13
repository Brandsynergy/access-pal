import { useCall } from '../context/CallContext';
import './IncomingCall.css';

function IncomingCall() {
  const { incomingCall, acceptCall, rejectCall, callState } = useCall();

  if (!incomingCall || callState !== 'ringing') {
    return null;
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="incoming-call-overlay">
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
