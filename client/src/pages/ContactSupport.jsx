import { motion } from 'framer-motion';
import './ContactSupport.css';

function ContactSupport() {
  return (
    <div className="contact-support-page">
      <motion.div 
        className="support-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="support-icon">🔐</div>
        
        <h1>ACCESS PAL</h1>
        <p className="subtitle">Secure Video Doorbell System</p>
        
        <div className="support-message">
          <h2>🎯 Account Access</h2>
          <p>
            ACCESS PAL accounts are created exclusively by our team for security and quality assurance.
          </p>
        </div>

        <div className="info-box">
          <h3>📦 To Get ACCESS PAL:</h3>
          <ol>
            <li>Purchase your ACCESS PAL QR code from us</li>
            <li>We'll create your account and generate your unique QR code</li>
            <li>Receive your login credentials and QR code sticker via email</li>
            <li>Activate and start using your video doorbell</li>
          </ol>
        </div>

        <div className="contact-box">
          <h3>📧 Contact Us</h3>
          <p>For purchases, support, or account access:</p>
          <a href="mailto:support@mivado.co" className="contact-email">
            support@mivado.co
          </a>
          <p className="response-time">We typically respond within 24-48 hours</p>
        </div>

        <div className="login-box">
          <p>Already have an account?</p>
          <a href="/login" className="login-link">
            → Login Here
          </a>
        </div>

        <div className="features">
          <h3>✨ Why ACCESS PAL?</h3>
          <div className="feature-grid">
            <div className="feature">🔒 Secure & Non-transferable</div>
            <div className="feature">📍 Location-locked</div>
            <div className="feature">🌍 Works Anywhere</div>
            <div className="feature">📱 No Installation Required</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ContactSupport;
