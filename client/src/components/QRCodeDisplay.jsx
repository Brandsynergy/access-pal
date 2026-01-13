import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './QRCodeDisplay.css';

const QRCodeDisplay = () => {
  const { user, regenerateQRCode } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    
    // Create download link
    const link = document.createElement('a');
    link.href = user.qrCodeImage;
    link.download = `ACCESS-PAL-${user.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setDownloading(false), 1000);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Are you sure? Your old QR code will no longer work.')) {
      return;
    }
    
    setRegenerating(true);
    const result = await regenerateQRCode();
    
    if (result.success) {
      alert('QR code regenerated successfully!');
    } else {
      alert(result.message);
    }
    
    setRegenerating(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ACCESS PAL QR Code - ${user.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              padding: 40px;
            }
            h1 {
              margin-bottom: 20px;
              color: #2563eb;
            }
            img {
              max-width: 400px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
            }
            p {
              margin-top: 20px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <h1>ACCESS PAL - ${user.name}</h1>
          <img src="${user.qrCodeImage}" alt="QR Code" />
          <p>Scan this code to connect with me at my door</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <motion.div 
      className="qr-display-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="qr-display-card">
        <div className="qr-header">
          <h2>Your Personal QR Code</h2>
          <p>Visitors scan this code to reach you</p>
        </div>

        <motion.div 
          className="qr-code-wrapper"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <img 
            src={user.qrCodeImage} 
            alt="Your ACCESS PAL QR Code" 
            className="qr-code-image"
          />
          <div className="qr-glow"></div>
        </motion.div>

        <div className="qr-info">
          <div className="info-item">
            <span className="info-label">QR Code ID:</span>
            <span className="info-value">{user.qrCodeId}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Linked to:</span>
            <span className="info-value">{user.email}</span>
          </div>
        </div>

        <div className="qr-actions">
          <motion.button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading}
            whileTap={{ scale: 0.95 }}
          >
            {downloading ? '⬇️ Downloading...' : '📥 Download QR Code'}
          </motion.button>

          <motion.button
            className="btn btn-outline"
            onClick={handlePrint}
            whileTap={{ scale: 0.95 }}
          >
            🖨️ Print QR Code
          </motion.button>

          <motion.button
            className="btn btn-secondary"
            onClick={handleRegenerate}
            disabled={regenerating}
            whileTap={{ scale: 0.95 }}
          >
            {regenerating ? '🔄 Regenerating...' : '🔄 Regenerate QR'}
          </motion.button>
        </div>

        <div className="qr-instructions">
          <h3>How to Use:</h3>
          <ol>
            <li>Print or display this QR code at your door</li>
            <li>Visitors scan it with their phone camera</li>
            <li>You receive an instant video call notification</li>
            <li>Answer from anywhere in the world!</li>
          </ol>
        </div>
      </div>
    </motion.div>
  );
};

export default QRCodeDisplay;
