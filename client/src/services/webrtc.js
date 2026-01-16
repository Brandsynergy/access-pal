import { io } from 'socket.io-client';

const STUN_SERVER = 'stun:stun.l.google.com:19302';
// Remove /api from the URL for Socket.IO connection
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const API_URL = SOCKET_URL;

class WebRTCService {
  constructor() {
    this.socket = null;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.qrCodeId = null;
    this.userType = null; // 'visitor' or 'homeowner'
    
    // Callbacks
    this.onRemoteStream = null;
    this.onCallEnded = null;
    this.onError = null;
    this.onConnectionStateChange = null;
  }

  // Initialize socket connection
  initSocket() {
    if (this.socket) return this.socket;
    
    this.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      // Keep connection alive
      pingInterval: 5000,
      pingTimeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      // Only trigger error if it's not a deliberate disconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.warn('⚠️ Unexpected disconnect during call');
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (this.onError) this.onError(error);
    });

    return this.socket;
  }

  // Initialize WebRTC peer connection
  initPeerConnection() {
    const configuration = {
      iceServers: [{ urls: STUN_SERVER }]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          room: this.qrCodeId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);
      console.log('📹 Track readyState:', event.track.readyState);
      console.log('📹 Track enabled:', event.track.enabled);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        console.log('🆕 Created new MediaStream for remote tracks');
      }
      this.remoteStream.addTrack(event.track);
      console.log(`✅ Added ${event.track.kind} track. Total tracks:`, this.remoteStream.getTracks().length);
      
      // Monitor track state
      event.track.onended = () => {
        console.log(`⚠️ Track ${event.track.kind} ended`);
      };
      
      event.track.onmute = () => {
        console.log(`🔇 Track ${event.track.kind} muted`);
      };
      
      event.track.onunmute = () => {
        console.log(`🔊 Track ${event.track.kind} unmuted`);
      };
      
      // Call the callback every time we get a track
      // The UI will update when it sees a stream with tracks
      if (this.onRemoteStream) {
        console.log('📡 Calling onRemoteStream callback with stream having', this.remoteStream.getTracks().length, 'tracks');
        this.onRemoteStream(this.remoteStream);
      } else {
        console.warn('⚠️ onRemoteStream callback not set!');
      }
    };

    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }

      if (this.peerConnection.connectionState === 'failed') {
        this.handleConnectionFailure();
      }
    };

    return this.peerConnection;
  }

  // Get local media stream (camera + microphone)
  async getLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      console.log('✅ Got local stream');
      return this.localStream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      if (this.onError) {
        this.onError('Unable to access camera/microphone. Please grant permissions.');
      }
      throw error;
    }
  }

  // Visitor initiates call
  async startCall(qrCodeId) {
    try {
      this.qrCodeId = qrCodeId;
      this.userType = 'visitor';

      // Initialize socket and peer connection
      this.initSocket();
      this.initPeerConnection();

      // Get local media
      await this.getLocalStream();

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Join room
      this.socket.emit('join-room', qrCodeId);

      // Set up listeners FIRST before sending anything
      console.log('👂 VISITOR: Setting up answer and ICE candidate listeners');
      
      // Remove any existing listeners to prevent duplicates
      this.socket.off('answer');
      this.socket.off('ice-candidate');
      
      // Listen for answer from homeowner
      // Use 'on' instead of 'once' to handle potential multiple events
      this.socket.on('answer', async (data) => {
        console.log('📞📞📞 VISITOR: Received answer from homeowner!');
        console.log('Answer data:', data);
        
        // Check if we already have a remote description to avoid setting it twice
        if (this.peerConnection.remoteDescription) {
          console.log('⚠️ VISITOR: Remote description already set, ignoring duplicate answer');
          return;
        }
        
        try {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('✅ VISITOR: Successfully set remote description from answer');
          console.log('🔗 VISITOR: PeerConnection state:', this.peerConnection.connectionState);
          console.log('🔗 VISITOR: Signaling state:', this.peerConnection.signalingState);
        } catch (error) {
          console.error('❌ VISITOR: Error setting remote description:', error);
          if (this.onError) this.onError(error.message);
        }
      });

      // Listen for ICE candidates
      this.socket.on('ice-candidate', async (data) => {
        if (data.candidate && this.peerConnection) {
          console.log('🧊 VISITOR: Received ICE candidate');
          try {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
            console.log('✅ VISITOR: Added ICE candidate');
          } catch (error) {
            console.error('❌ VISITOR: Error adding ICE candidate:', error);
          }
        } else if (!this.peerConnection) {
          console.warn('⚠️ VISITOR: Received ICE candidate but peer connection is null');
        }
      });

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('offer', {
        room: qrCodeId,
        offer: offer
      });

      console.log('📤 VISITOR: Sent offer to homeowner');

      // Wait a moment to ensure offer is sent, then alert homeowner
      setTimeout(() => {
        console.log('🔔 VISITOR: Sending visitor alert to homeowner...');
        this.socket.emit('visitor-alert', { 
          qrCodeId,
          timestamp: new Date().toISOString()
        });
      }, 500); // Short delay to ensure offer is sent first

    } catch (error) {
      console.error('❌ Error starting call:', error);
      if (this.onError) this.onError(error.message);
      throw error;
    }
  }

  // Homeowner answers call
  async answerCall(qrCodeId, offer) {
    try {
      this.qrCodeId = qrCodeId;
      this.userType = 'homeowner';

      // Initialize peer connection if not exists
      if (!this.peerConnection) {
        this.initPeerConnection();
      }

      // Get local media
      await this.getLocalStream();

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Set remote description (visitor's offer)
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer back to visitor
      this.socket.emit('answer', {
        room: qrCodeId,
        answer: answer
      });

      // Listen for ICE candidates
      this.socket.on('ice-candidate', async (data) => {
        if (data.candidate && this.peerConnection) {
          console.log('🧊 HOMEOWNER: Received ICE candidate');
          try {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
            console.log('✅ HOMEOWNER: Added ICE candidate');
          } catch (error) {
            console.error('❌ HOMEOWNER: Error adding ICE candidate:', error);
          }
        } else if (!this.peerConnection) {
          console.warn('⚠️ HOMEOWNER: Received ICE candidate but peer connection is null');
        }
      });

      console.log('📤 Sent answer to visitor');

    } catch (error) {
      console.error('❌ Error answering call:', error);
      if (this.onError) this.onError(error.message);
      throw error;
    }
  }

  // Setup socket listeners for homeowner
  setupHomeownerListeners() {
    if (!this.socket) {
      this.initSocket();
    }

    // Listen for offers from visitors
    this.socket.on('offer', async (data) => {
      console.log('📞 Received offer from visitor');
      // Store offer for when homeowner accepts
      this.pendingOffer = data.offer;
      this.qrCodeId = data.room;
    });
  }

  // Mute/unmute audio
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Mute/unmute video
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // End call
  endCall() {
    console.log('📞 Ending call...');

    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Emit call ended event
    if (this.socket) {
      this.socket.emit('call-ended', { room: this.qrCodeId });
    }

    // Reset streams
    this.localStream = null;
    this.remoteStream = null;

    if (this.onCallEnded) {
      this.onCallEnded();
    }
  }

  // Handle connection failure
  handleConnectionFailure() {
    console.error('❌ Connection failed');
    if (this.onError) {
      this.onError('Connection failed. Please try again.');
    }
    this.endCall();
  }

  // Cleanup
  cleanup() {
    this.endCall();
    
    // Remove all socket listeners before disconnecting
    if (this.socket) {
      this.socket.off('answer');
      this.socket.off('ice-candidate');
      this.socket.off('offer');
      this.socket.off('call-ended');
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
export default webrtcService;
