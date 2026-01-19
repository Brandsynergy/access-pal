import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import './AdminPanel.css';

function AdminPanel() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const ADMIN_KEY = 'ACCESS-PAL-ADMIN-2026'; // Change this secret key!

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminKey === ADMIN_KEY) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid admin key');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const response = await api.post('/auth/register', formData);

      if (response.data.success) {
        const user = response.data.data.user;
        setSuccess({
          email: user.email,
          name: user.name,
          qrCodeId: user.qrCodeId,
          qrCodeImage: user.qrCodeImage,
          password: formData.password,
          loginUrl: window.location.origin + '/login'
        });
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          name: '',
          phoneNumber: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadQRCode = () => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = success.qrCodeImage;
    link.download = `ACCESS-PAL-${success.qrCodeId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel-page">
        <motion.div 
          className="admin-auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="admin-icon">🔐</div>
          <h1>ACCESS PAL</h1>
          <h2>Admin Panel</h2>
          
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
    <div className="admin-panel-page">
      <div className="admin-panel-container">
        <div className="admin-header">
          <h1>🔧 ACCESS PAL Admin Panel</h1>
          <p>Create new user accounts</p>
        </div>

        {!success ? (
          <motion.div 
            className="create-user-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2>Create New User</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="customer@example.com"
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min 6 characters"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="+1234567890"
                />
              </div>

              {error && (
                <div className="error-box">
                  ❌ {error}
                </div>
              )}

              <button 
                type="submit" 
                className="create-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : '✨ Create User Account'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            className="success-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-icon">✅</div>
            <h2>User Created Successfully!</h2>
            
            <div className="credentials-box">
              <h3>📧 Login Credentials to Email:</h3>
              
              <div className="credential-item">
                <label>Email:</label>
                <div className="credential-value">
                  {success.email}
                  <button onClick={() => copyToClipboard(success.email)}>📋</button>
                </div>
              </div>

              <div className="credential-item">
                <label>Password:</label>
                <div className="credential-value">
                  {success.password}
                  <button onClick={() => copyToClipboard(success.password)}>📋</button>
                </div>
              </div>

              <div className="credential-item">
                <label>Login URL:</label>
                <div className="credential-value">
                  {success.loginUrl}
                  <button onClick={() => copyToClipboard(success.loginUrl)}>📋</button>
                </div>
              </div>
            </div>

            <div className="qr-preview">
              <h3>📦 QR Code Sticker - Physical Mail Only:</h3>
              <img src={success.qrCodeImage} alt="QR Code" />
              <button 
                onClick={downloadQRCode}
                className="download-qr-btn"
              >
                ⬇️ Download QR Code Sticker
              </button>
              <p className="qr-warning">⚠️ Print and mail this physical sticker to customer</p>
              <p className="qr-note">QR Code ID: {success.qrCodeId}</p>
            </div>

            <div className="next-steps">
              <h3>📋 Next Steps:</h3>
              <ol>
                <li>✉️ Email login credentials (email, password, URL) to: {success.email}</li>
                <li>⬇️ Download QR code sticker using button above</li>
                <li>🖨️ Print the QR code sticker on adhesive paper</li>
                <li>📮 Physically mail sticker to customer's address</li>
                <li>🏠 Customer receives sticker, applies to door/wall</li>
                <li>📱 Customer activates at location (first scan only)</li>
              </ol>
              <p className="security-note">🔒 <strong>Security:</strong> Never send QR code image digitally. Physical mail only prevents unauthorized copies.</p>
            </div>

            <button 
              onClick={() => setSuccess(null)}
              className="create-another-btn"
            >
              ➕ Create Another User
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
