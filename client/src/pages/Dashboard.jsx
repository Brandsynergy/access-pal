import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import QRCodeDisplay from '../components/QRCodeDisplay';
import IncomingCall from '../components/IncomingCall';
import VideoCall from '../components/VideoCall';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>🚪 ACCESS PAL</h1>
            <div className="user-info">
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
          <p>© 2026 ACCESS PAL - Smart Video Doorbell</p>
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
