import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import webrtcService from '../services/webrtc';
import QRCodeDisplay from '../components/QRCodeDisplay';
import IncomingCall from '../components/IncomingCall';
import VideoCall from '../components/VideoCall';
import PWAInstallBanner from '../components/PWAInstallBanner';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Monitor socket connection status
    if (webrtcService.socket) {
      setIsConnected(webrtcService.socket.connected);
      
      webrtcService.socket.on('connect', () => {
        console.log('✅ Dashboard: Socket connected');
        setIsConnected(true);
      });
      
      webrtcService.socket.on('disconnect', () => {
        console.log('❌ Dashboard: Socket disconnected');
        setIsConnected(false);
      });
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* PWA Install Banner */}
      <PWAInstallBanner />
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>🚪 ACCESS PAL</h1>
            <div className="user-info">
              <div className="connection-status">
                {isConnected ? (
                  <span className="status-badge connected">
                    🟢 Online & Ready
                  </span>
                ) : (
                  <span className="status-badge disconnected">
                    🔴 Connecting...
                  </span>
                )}
              </div>
              <span>👋 {user.name}</span>
              <motion.button
                className="btn btn-outline"
                onClick={handleLogout}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <QRCodeDisplay />
      </main>

      <footer className="dashboard-footer">
        <div className="container text-center">
          <p>ACCESS PAL - MEDIAD INNOVATION © 2026</p>
        </div>
      </footer>

      {/* Incoming Call Notification */}
      <IncomingCall />

      {/* Video Call Interface */}
      <VideoCall />
    </div>
  );
};

export default Dashboard;
