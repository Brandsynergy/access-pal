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
  const [pendingOffer, setPendingOffer] = useState(null);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    console.log('🎬 CallContext initializing...');
    
    // Request browser notification permission
    requestNotificationPermission();

    // Setup WebRTC service callbacks for HOMEOWNER
    console.log('🏠 Setting up HOMEOWNER callbacks');
    
    webrtcService.onRemoteStream = (stream) => {
      console.log('📹 HOMEOWNER: Setting remote stream');
      setRemoteStream(stream);
      setCallState('in-call');
    };

    webrtcService.onCallEnded = () => {
      console.log('📞 HOMEOWNER: Call ended');
      handleCallEnd();
    };

    webrtcService.onError = (errorMessage) => {
      console.error('❌ HOMEOWNER: Call error:', errorMessage);
      setError(errorMessage);
      setCallState('ended');
    };

    webrtcService.onConnectionStateChange = (state) => {
      console.log('🔗 HOMEOWNER: Connection state:', state);
      setConnectionState(state);
      
      if (state === 'connected') {
        setCallState('in-call');
      } else if (state === 'failed' || state === 'disconnected') {
        handleCallEnd();
      }
    };

    // Initialize socket for homeowner to receive calls
    webrtcService.initSocket();

    // Wait for socket to connect, then join room
    const joinHomeownerRoom = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.qrCodeId) {
            console.log('🏠 Homeowner joining room:', user.qrCodeId);
            webrtcService.socket.emit('join-room', user.qrCodeId);
            
            // Confirm we're in the room
            setTimeout(() => {
              console.log('✅ Homeowner ready to receive calls in room:', user.qrCodeId);
            }, 500);
          } else {
            console.error('❌ No qrCodeId found for user');
          }
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
        }
      } else {
        console.error('❌ No user found in localStorage');
      }
    };

    // Join room when socket connects
    webrtcService.socket.on('connect', () => {
      console.log('✅ Socket connected:', webrtcService.socket.id);
      joinHomeownerRoom();
    });

    // Handle reconnection
    webrtcService.socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected, rejoining room');
      joinHomeownerRoom();
    });

    // If already connected, join immediately
    if (webrtcService.socket.connected) {
      console.log('✅ Socket already connected');
      joinHomeownerRoom();
    }

    // Listen for incoming visitor alerts
    webrtcService.socket.on('visitor-at-door', (data) => {
      console.log('🔔🔔🔔 VISITOR AT DOOR RECEIVED!', data);
      console.log('Current socket ID:', webrtcService.socket.id);
      console.log('Current rooms:', webrtcService.socket.rooms);
      
      setIncomingCall(data);
      setCallState('ringing');
      playRingtone();
      showBrowserNotification(data);
    });

    // Listen for offers from visitors
    webrtcService.socket.on('offer', (data) => {
      console.log('📞 Received offer from visitor, storing for when homeowner accepts');
      setPendingOffer(data.offer);
    });

    // Debug: Listen for user-joined events
    webrtcService.socket.on('user-joined', (data) => {
      console.log('👥 User joined room:', data);
    });

    return () => {
      // Cleanup on unmount
      console.log('🧹 CallContext cleanup');
      webrtcService.cleanup();
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  };

  // Show browser notification
  const showBrowserNotification = (data) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🔔 Someone is at your door!', {
        body: 'A visitor has scanned your QR code and is waiting.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'visitor-alert',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 30 seconds
      setTimeout(() => notification.close(), 30000);
    }
  };

  // Play ringtone (enhanced with repeated beeps)
  const playRingtone = () => {
    // Create audio context for ringtone
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
          
          oscillator.start();
          setTimeout(() => oscillator.stop(), 300);
        }, i * 500);
      }
    } catch (error) {
      console.log('Audio not available');
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    try {
      console.log('📞 Homeowner accepting call...');
      setCallState('calling');
      setError(null);

      if (!pendingOffer) {
        console.error('❌ No pending offer found!');
        setError('No incoming call found');
        setCallState('ended');
        return;
      }

      console.log('📞 Using pending offer to answer call');
      // Answer the call with the stored offer
      await webrtcService.answerCall(incomingCall.qrCodeId, pendingOffer);
      
      // Set local stream
      setLocalStream(webrtcService.localStream);
      console.log('✅ Call accepted, local stream set');

    } catch (error) {
      console.error('❌ Error accepting call:', error);
      setError('Failed to answer call: ' + error.message);
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
