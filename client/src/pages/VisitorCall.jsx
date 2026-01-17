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
    // Setup callbacks FIRST before anything else
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

    // Now initiate the call
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
      console.log('📺 Remote stream has', remoteStream.getTracks().length, 'tracks');
      console.log('📺 Video element:', remoteVideoRef.current);
      console.log('📺 Video tracks:', remoteStream.getVideoTracks());
      console.log('📺 Audio tracks:', remoteStream.getAudioTracks());
      
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force play after setting srcObject
      remoteVideoRef.current.play().catch(err => {
        console.error('❌ Error playing remote video:', err);
      });
      
      // Check video track state
      const videoTrack = remoteStream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('🎬 Video track readyState:', videoTrack.readyState);
        console.log('🎬 Video track enabled:', videoTrack.enabled);
        console.log('🎬 Video track muted:', videoTrack.muted);
      }
    }
  }, [remoteStream]);

  // Separate effect to monitor remote stream tracks and transition state
  useEffect(() => {
    if (remoteStream && remoteStream.getTracks().length > 0) {
      console.log('✅ Remote stream has tracks:', remoteStream.getTracks().length);
      if (callState === 'connecting') {
        console.log('🔄 Transitioning from connecting to connected');
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          setCallState('connected');
        }, 100);
      }
    }
  }, [remoteStream, callState]);

  // Re-attach remote stream when video element appears after state change
  useEffect(() => {
    if (callState === 'connected' && remoteVideoRef.current && remoteStream) {
      console.log('🔄 Re-attaching remote stream after connected state');
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => {
        console.error('❌ Error auto-playing video:', err);
      });
    }
  }, [callState]);

  const initiateCall = async () => {
    try {
      setCallState('requesting-permission');
      
      // Callbacks are now set up in useEffect before this runs
      // Start the call
      setCallState('connecting');
      await webrtcService.startCall(qrCodeId);
      
      // Set local stream
      setLocalStream(webrtcService.localStream);
      
    } catch (error) {
      console.error('Failed to initiate call:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Show detailed error to user
      let errorMsg = error.message || 'Failed to access camera/microphone';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Camera/microphone access denied. Please check your browser settings.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Camera is being used by another app. Please close other camera apps.';
      }
      
      setError(errorMsg);
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
        const isPermissionError = error && (error.includes('Permission') || error.includes('permission') || error.includes('denied') || error.includes('camera') || error.includes('microphone'));
        
        return (
          <div className="call-status error">
            <h2>❌ {isPermissionError ? 'Permission Denied' : 'Error'}</h2>
            <p>{error || 'Something went wrong'}</p>
            
            {isPermissionError && (
              <div className="permission-help">
                <h3>📱 How to Fix:</h3>
                <ol>
                  <li>Tap the 🔒 <strong>lock icon</strong> or <strong>ⓘ</strong> in your browser address bar</li>
                  <li>Find <strong>"Permissions"</strong> or <strong>"Site settings"</strong></li>
                  <li>Allow <strong>Camera</strong> and <strong>Microphone</strong></li>
                  <li>Tap <strong>"Try Again"</strong> below</li>
                </ol>
              </div>
            )}
            
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
      {renderContent()}
    </div>
  );
}

export default VisitorCall;
