import { createContext, useContext, useState, useEffect } from 'react';
import webrtcService from '../services/webrtc';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, in-call, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    // Setup WebRTC service callbacks
    webrtcService.onRemoteStream = (stream) => {
      console.log('📹 Setting remote stream');
      setRemoteStream(stream);
      setCallState('in-call');
    };

    webrtcService.onCallEnded = () => {
      console.log('📞 Call ended');
      handleCallEnd();
    };

    webrtcService.onError = (errorMessage) => {
      console.error('❌ Call error:', errorMessage);
      setError(errorMessage);
      setCallState('ended');
    };

    webrtcService.onConnectionStateChange = (state) => {
      console.log('🔗 Connection state:', state);
      setConnectionState(state);
      
      if (state === 'connected') {
        setCallState('in-call');
      } else if (state === 'failed' || state === 'disconnected') {
        handleCallEnd();
      }
    };

    // Initialize socket for homeowner to receive calls
    webrtcService.initSocket();

    // Listen for incoming visitor alerts
    webrtcService.socket.on('visitor-at-door', (data) => {
      console.log('🔔 Visitor at door!', data);
      setIncomingCall(data);
      setCallState('ringing');
      playRingtone();
    });

    return () => {
      // Cleanup on unmount
      webrtcService.cleanup();
    };
  }, []);

  // Play ringtone (simple beep)
  const playRingtone = () => {
    // Create audio context for ringtone
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    } catch (error) {
      console.log('Audio not available');
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    try {
      setCallState('calling');
      setError(null);

      // Join the room
      webrtcService.socket.emit('join-room', incomingCall.qrCodeId);

      // Wait for visitor's offer
      webrtcService.socket.once('offer', async (data) => {
        await webrtcService.answerCall(incomingCall.qrCodeId, data.offer);
        
        // Set local stream
        setLocalStream(webrtcService.localStream);
      });

    } catch (error) {
      console.error('Error accepting call:', error);
      setError('Failed to answer call');
      setCallState('ended');
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (incomingCall) {
      webrtcService.socket.emit('call-rejected', {
        room: incomingCall.qrCodeId
      });
    }
    setIncomingCall(null);
    setCallState('idle');
  };

  // End active call
  const endCall = () => {
    webrtcService.endCall();
    handleCallEnd();
  };

  // Handle call end cleanup
  const handleCallEnd = () => {
    setCallState('ended');
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setConnectionState('new');
    setIsMuted(false);
    setIsVideoOff(false);
    
    // Reset to idle after a moment
    setTimeout(() => {
      setCallState('idle');
      setError(null);
    }, 2000);
  };

  // Toggle audio mute
  const toggleMute = () => {
    const newMuteState = !isMuted;
    webrtcService.toggleAudio(!newMuteState);
    setIsMuted(newMuteState);
  };

  // Toggle video
  const toggleVideo = () => {
    const newVideoState = !isVideoOff;
    webrtcService.toggleVideo(!newVideoState);
    setIsVideoOff(newVideoState);
  };

  const value = {
    callState,
    localStream,
    remoteStream,
    incomingCall,
    error,
    connectionState,
    isMuted,
    isVideoOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    setCallState,
    setLocalStream,
    setError
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export default CallContext;
