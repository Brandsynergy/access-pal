import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import './VideoCall.css';

function VideoCall() {
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    endCall
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState !== 'in-call' && callState !== 'calling') {
    return null;
  }

  return (
    <div className="video-call-overlay">
      <div className="video-call-container-homeowner">
        {callState === 'calling' ? (
          <div className="connecting-state">
            <div className="connecting-spinner"></div>
            <h2>📞 Connecting...</h2>
            <p>Setting up video call</p>
          </div>
        ) : (
          <>
            {/* Remote video (visitor) - large */}
            <div className="remote-video-container">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video-homeowner"
              />
              <div className="video-label-overlay">Visitor at Your Door</div>
            </div>

            {/* Local video (homeowner) - small overlay */}
            <div className="local-video-container">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video-homeowner"
              />
              <div className="video-label-small-overlay">You</div>
            </div>

            {/* Call controls */}
            <div className="call-controls-homeowner">
              <button
                className={`control-button ${isMuted ? 'active' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                className="control-button end-call-btn"
                onClick={endCall}
                title="End Call"
              >
                📞
              </button>

              <button
                className={`control-button ${isVideoOff ? 'active' : ''}`}
                onClick={toggleVideo}
                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {isVideoOff ? '📹' : '🎥'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VideoCall;
