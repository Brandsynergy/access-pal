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
    console.log('\n\n🎬🎬🎬 CallContext initializing...');
    console.log('⏰ Current time:', new Date().toISOString());
    console.log('📋 Checking localStorage for pending call...');
    
    // CRITICAL: Check for pending incoming call from localStorage (from notification tap)
    const pendingCallStr = localStorage.getItem('pendingIncomingCall');
    const pendingOfferStr = localStorage.getItem('pendingOffer');
    
    console.log('💾 localStorage pendingIncomingCall:', pendingCallStr ? 'EXISTS' : 'EMPTY');
    console.log('💾 localStorage pendingOffer:', pendingOfferStr ? 'EXISTS' : 'EMPTY');
    
    if (pendingCallStr) {
      try {
        const pendingCall = JSON.parse(pendingCallStr);
        console.log('📑 Parsed pendingCall:', JSON.stringify(pendingCall));
        
        const callAge = Date.now() - new Date(pendingCall.timestamp).getTime();
        console.log('⏱️ Call age (ms):', callAge, '(max 120000)');
        
        // Only restore if call is less than 2 minutes old
        if (callAge < 120000) {
          console.log('\n🚨🚨🚨 RESTORING PENDING CALL FROM LOCALSTORAGE!');
          console.log('📞 Setting incomingCall:', pendingCall);
          console.log('📞 Setting callState: ringing');
          console.log('🔔 Playing ringtone...');
          
          setIncomingCall(pendingCall);
          setCallState('ringing');
          playRingtone();
          
          // CRITICAL: Also restore the pending offer if it exists
          if (pendingOfferStr) {
            try {
              const offer = JSON.parse(pendingOfferStr);
              console.log('\n🚨🚨🚨 RESTORING PENDING OFFER FROM LOCALSTORAGE!');
              console.log('📦 Offer SDP type:', offer?.type);
              console.log('📦 Offer SDP length:', offer?.sdp?.length);
              setPendingOffer(offer);
              console.log('✅ Pending offer restored successfully');
            } catch (error) {
              console.error('❌ Error parsing pending offer:', error);
            }
          } else {
            console.warn('⚠️⚠️⚠️ NO PENDING OFFER IN LOCALSTORAGE! Answer may fail!');
          }
          
          console.log('\n✅✅✅ RESTORATION COMPLETE!');
          console.log('📄 Final state:');
          console.log('  - incomingCall:', !!pendingCall);
          console.log('  - callState: ringing');
          console.log('  - pendingOffer:', !!pendingOfferStr);
          console.log('\n');
        } else {
          console.log('⚠️ Pending call too old (' + Math.round(callAge/1000) + 's), clearing');
          localStorage.removeItem('pendingIncomingCall');
          localStorage.removeItem('pendingOffer');
        }
      } catch (error) {
        console.error('❌ Error restoring pending call:', error);
        console.error('Stack:', error.stack);
        localStorage.removeItem('pendingIncomingCall');
        localStorage.removeItem('pendingOffer');
      }
    } else {
      console.log('💭 No pending call in localStorage - normal dashboard load');
    }
    
    console.log('🎬 CallContext initialization phase complete\n\n');
    
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
            console.log('\n🏠 HOMEOWNER JOINING ROOM:', user.qrCodeId);
            console.log('🆔 Socket ID:', webrtcService.socket.id);
            console.log('⏰ Join time:', new Date().toISOString());
            webrtcService.socket.emit('join-room', user.qrCodeId);
            
            // Confirm we're in the room
            setTimeout(() => {
              console.log('\n✅ Homeowner ready to receive calls in room:', user.qrCodeId);
              console.log('🔍 Test: Emitting test-visitor-alert to verify room connection\n');
            }, 500);
          } else {
            console.error('\n❌ No qrCodeId found for user\n');
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
      console.log('\n✅ Socket connected:', webrtcService.socket.id);
      console.log('⏰ Connection time:', new Date().toISOString());
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

    // Listen for incoming visitor alerts - ONCE only to prevent duplicates
    console.log('🎯 CallContext: Setting up visitor-at-door listener');
    
    // Remove any existing listener first
    webrtcService.socket.off('visitor-at-door');
    
    webrtcService.socket.on('visitor-at-door', (data) => {
      console.log('\n\n🔔🔔🔔 VISITOR AT DOOR RECEIVED IN CALLCONTEXT!');
      console.log('📍 Data:', JSON.stringify(data));
      console.log('🆔 Current socket ID:', webrtcService.socket.id);
      console.log('⏰ Current time:', new Date().toISOString());
      console.log('📱 Notification permission:', Notification.permission);
      console.log('\n');
      
      // CRITICAL: Store in localStorage so it persists when Safari opens from notification
      const callData = {
        ...data,
        timestamp: new Date().toISOString()
      };
      console.log('💾 STORING TO LOCALSTORAGE:');
      console.log('  - Key: pendingIncomingCall');
      console.log('  - Value:', JSON.stringify(callData));
      localStorage.setItem('pendingIncomingCall', JSON.stringify(callData));
      console.log('✅ Stored pendingIncomingCall to localStorage');
      
      setIncomingCall(data);
      setCallState('ringing');
      playRingtone();
      // DON'T show browser notification here - push notification already sent from server!
    });

    // Listen for offers from visitors
    webrtcService.socket.on('offer', (data) => {
      console.log('\n📞📞📞 OFFER RECEIVED FROM VISITOR!');
      console.log('📦 Offer SDP type:', data.offer?.type);
      console.log('📦 Offer SDP length:', data.offer?.sdp?.length);
      console.log('🎯 Room:', data.room);
      
      console.log('💾 STORING OFFER TO LOCALSTORAGE:');
      console.log('  - Key: pendingOffer');
      console.log('  - Offer type:', data.offer?.type);
      localStorage.setItem('pendingOffer', JSON.stringify(data.offer));
      console.log('✅ Stored pendingOffer to localStorage\n');
      
      setPendingOffer(data.offer);
      console.log('✅ Set pendingOffer in state\n');
    });

    // Debug: Listen for user-joined events
    webrtcService.socket.on('user-joined', (data) => {
      console.log('👥 User joined room:', data);
    });

    return () => {
      // Cleanup on unmount
      console.log('🧹 CallContext cleanup');
      // Remove all socket listeners
      if (webrtcService.socket) {
        webrtcService.socket.off('visitor-at-door');
        webrtcService.socket.off('offer');
        webrtcService.socket.off('user-joined');
        webrtcService.socket.off('connect');
        webrtcService.socket.off('reconnect');
      }
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
      // Clear pending call and offer from localStorage
      localStorage.removeItem('pendingIncomingCall');
      localStorage.removeItem('pendingOffer');
      
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
    // Clear pending call and offer from localStorage
    localStorage.removeItem('pendingIncomingCall');
    localStorage.removeItem('pendingOffer');
    
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
    // Clear pending call and offer from localStorage
    localStorage.removeItem('pendingIncomingCall');
    localStorage.removeItem('pendingOffer');
    
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
