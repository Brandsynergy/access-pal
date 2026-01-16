import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import webrtcService from '../services/webrtc';
import './VisitorCall.css';

function VisitorCall() {
  const { qrCodeId } = useParams();
  const [callState, setCallState] = useState('requesting-permission'); // requesting-permission, connecting, connected, ended, error
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // Auto-initiate call when component mounts
    initiateCall();

    return () => {
      // Cleanup on unmount
      webrtcService.cleanup();
    };
  }, [qrCodeId]);

  useEffect(() => {
    // Update local video element when stream changes
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    // Update remote video element when stream changes
    if (remoteVideoRef.current && remoteStream) {
      console.log('📺 Setting remote video srcObject');
      remoteVideoRef.current.srcObject = remoteStream;
      // Force state to connected when we have a remote stream
      if (callState === 'connecting') {
        console.log('🔄 Forcing state change to connected');
        setCallState('connected');
      }
    }
  }, [remoteStream, callState]);

  const initiateCall = async () => {
    try {
      setCallState('requesting-permission');
      
      // Setup callbacks
      webrtcService.onRemoteStream = (stream) => {
        console.log('📹 Received homeowner stream');
        console.log('Stream tracks:', stream.getTracks().length);
        setRemoteStream(stream);
        setCallState('connected');
        console.log('✅ Call state set to connected');
      };

      webrtcService.onError = (errorMessage) => {
        console.error('❌ Call error:', errorMessage);
        setError(errorMessage);
        setCallState('error');
      };

      webrtcService.onCallEnded = () => {
        setCallState('ended');
      };

      webrtcService.onConnectionStateChange = (state) => {
        console.log('🔗 VISITOR Connection state changed to:', state);
        if (state === 'connected') {
          console.log('✅ VISITOR: Setting call state to CONNECTED');
          setCallState('connected');
        } else if (state === 'connecting') {
          console.log('⏳ VISITOR: Setting call state to CONNECTING');
          setCallState('connecting');
        } else if (state === 'failed') {
          console.error('❌ VISITOR: Connection failed');
          setError('Connection failed. Please try again.');
          setCallState('error');
        }
      };

      // Start the call
      setCallState('connecting');
      await webrtcService.startCall(qrCodeId);
      
      // Set local stream
      setLocalStream(webrtcService.localStream);
      
    } catch (error) {
      console.error('Failed to initiate call:', error);
      setError(error.message || 'Failed to access camera/microphone');
      setCallState('error');
    }
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    setCallState('ended');
  };

  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    webrtcService.toggleAudio(!newMuteState);
    setIsMuted(newMuteState);
  };

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOff;
    webrtcService.toggleVideo(!newVideoState);
    setIsVideoOff(newVideoState);
  };

  const renderContent = () => {
    switch (callState) {
      case 'requesting-permission':
        return (
          <div className="call-status">
            <div className="spinner"></div>
            <h2>📹 Requesting Camera Access</h2>
            <p>Please allow camera and microphone permissions</p>
          </div>
        );

      case 'connecting':
        return (
          <div className="call-status">
            <div className="spinner"></div>
            <h2>📞 Calling...</h2>
            <p>Connecting to homeowner</p>
            <div className="video-preview">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video-preview"
              />
              <p className="video-label">You</p>
            </div>
          </div>
        );

      case 'connected':
        return (
          <div className="video-call-container">
            {/* Remote video (homeowner) - large */}
            <div className="remote-video-wrapper">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />
              <div className="video-label">Homeowner</div>
            </div>

            {/* Local video (visitor) - small overlay */}
            <div className="local-video-wrapper">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video"
              />
              <div className="video-label-small">You</div>
            </div>

            {/* Call controls */}
            <div className="call-controls">
              <button
                className={`control-btn ${isMuted ? 'muted' : ''}`}
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              
              <button
                className="control-btn end-call"
                onClick={handleEndCall}
                title="End Call"
              >
                📞
              </button>
              
              <button
                className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
                onClick={handleToggleVideo}
                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {isVideoOff ? '📹' : '🎥'}
              </button>
            </div>
          </div>
        );

      case 'ended':
        return (
          <div className="call-status">
            <h2>📞 Call Ended</h2>
            <p>Thank you for using ACCESS PAL</p>
            <button onClick={() => window.close()} className="close-btn">
              Close Window
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="call-status error">
            <h2>❌ Error</h2>
            <p>{error || 'Something went wrong'}</p>
            <button onClick={initiateCall} className="retry-btn">
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="visitor-call-page">
      <div className="header">
        <h1>🚪 ACCESS PAL</h1>
        <p className="subtitle">Video Doorbell</p>
      </div>
      {/* DEBUG: Show current state */}
      <div style={{position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', zIndex: 9999}}>
        State: {callState} | Remote: {remoteStream ? remoteStream.getTracks().length + ' tracks' : 'none'}
      </div>
      {renderContent()}
    </div>
  );
}

export default VisitorCall;
