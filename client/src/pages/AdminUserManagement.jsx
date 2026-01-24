import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import './AdminUserManagement.css';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [regeneratingUserId, setRegeneratingUserId] = useState(null);

  const ADMIN_KEY = 'ACCESS-PAL-ADMIN-2026';

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminKey === ADMIN_KEY) {
      setIsAuthenticated(true);
      setError('');
      fetchAllUsers();
    } else {
      setError('Invalid admin key');
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // We'll need to add an admin endpoint to list users
      const response = await api.get('/auth/admin/users');
      setUsers(response.data.data.users || []);
    } catch (err) {
      setError('Failed to fetch users. Using search instead.');
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async (email) => {
    if (!email) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/auth/admin/user/${email}`);
      if (response.data.success) {
        setUsers([response.data.data.user]);
      } else {
        setError('User not found');
        setUsers([]);
      }
    } catch (err) {
      setError('User not found');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQR = async (userId, userEmail) => {
    if (!confirm(`Regenerate QR code for ${userEmail}?\n\nThis will:\n- Deactivate the current QR code\n- Generate a new QR code\n- Require re-activation at their location\n\nContinue?`)) {
      return;
    }

    setRegeneratingUserId(userId);
    setError('');

    try {
      const response = await api.post('/auth/admin/regenerate-qr', { userId });
      
      if (response.data.success) {
        const { qrCodeId, lastFourDigits } = response.data.data;
        alert(`QR code regenerated successfully!

QR Code ID: ${qrCodeId}
🔐 Activation Code: ${lastFourDigits}

IMPORTANT: Write the activation code (${lastFourDigits}) on the back of the QR code sticker.
The homeowner will need this code to activate the QR at their location.`);
        
        // Refresh user data
        if (searchEmail) {
          searchUser(searchEmail);
        } else {
          fetchAllUsers();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate QR code');
    } finally {
      setRegeneratingUserId(null);
    }
  };

  const downloadQRCode = async (qrCodeImage, qrCodeId) => {
    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeImage);
      const blob = await response.blob();
      
      // Create object URL from blob
      const url = URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `ACCESS-PAL-${qrCodeId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download QR code. Please try regenerating.');
      console.error('Download error:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-user-management-page">
        <motion.div 
          className="admin-auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="admin-icon">🔐</div>
          <h1>ACCESS PAL</h1>
          <h2>User Management</h2>
          
          <form onSubmit={handleAdminAuth}>
            <div className="form-group">
              <label>Admin Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="auth-btn">
              Authenticate
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-user-management-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>🔧 User Management</h1>
          <p>Search and manage existing homeowners</p>
        </div>

        <div className="search-section">
          <h3>🔍 Search User</h3>
          <div className="search-box">
            <input
              type="email"
              placeholder="Enter homeowner email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUser(searchEmail)}
            />
            <button onClick={() => searchUser(searchEmail)} disabled={loading}>
              {loading ? '🔄 Searching...' : '🔍 Search'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            ❌ {error}
          </div>
        )}

        {loading && users.length === 0 && (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        )}

        <div className="users-list">
          {users.map((user) => (
            <motion.div
              key={user.id}
              className="user-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="user-info">
                <h3>{user.name}</h3>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phoneNumber}</p>
                <p><strong>QR Code ID:</strong> {user.qrCodeId}</p>
                {user.lastFourDigits && (
                  <p><strong>🔐 Activation Code:</strong> 
                    <span style={{ fontFamily: 'monospace', fontSize: '1.2em', color: '#667eea', fontWeight: 'bold' }}>
                      {user.lastFourDigits}
                    </span>
                  </p>
                )}
                <p><strong>Status:</strong>
                  <span className={`status ${user.isQrActivated ? 'activated' : 'not-activated'}`}>
                    {user.isQrActivated ? ' ✅ Activated' : ' ⚠️ Not Activated'}
                  </span>
                </p>
                {user.isQrActivated && (
                  <p><strong>Scan Count:</strong> {user.scanCount || 0}</p>
                )}
              </div>

              <div className="user-actions">
                <button
                  onClick={() => handleRegenerateQR(user.id, user.email)}
                  disabled={regeneratingUserId === user.id}
                  className="btn-regenerate"
                >
                  {regeneratingUserId === user.id ? '🔄 Regenerating...' : '🔄 Regenerate QR Code'}
                </button>
                
                <button
                  onClick={() => downloadQRCode(user.qrCodeImage, user.qrCodeId)}
                  className="btn-download"
                >
                  📥 Download Current QR
                </button>
              </div>

              <div className="qr-preview-small">
                <img src={user.qrCodeImage} alt="QR Code" />
              </div>
            </motion.div>
          ))}
        </div>

        {users.length === 0 && !loading && !error && (
          <div className="empty-state">
            <p>🔍 Enter an email address to search for a homeowner</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUserManagement;
