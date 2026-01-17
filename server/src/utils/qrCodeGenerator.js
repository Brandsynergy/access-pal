import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique QR code for a user
 * @param {string} userId - User's unique ID
 * @returns {Promise<Object>} QR code data and image
 */
export const generateUserQRCode = async (userId) => {
  try {
    // Create unique QR code ID
    const qrCodeId = `AP-${uuidv4()}`;
    
    // Create the visitor landing page URL (they tap button to start call)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const visitorCallUrl = `${clientUrl}/visitor/${qrCodeId}`;
    
    // The QR code will encode the direct call URL
    const qrString = visitorCallUrl;
    
    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 1,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 400
    });
    
    // Extract last 4 characters for activation security
    const lastFourDigits = qrCodeId.slice(-4);
    
    return {
      qrCodeId,
      qrCodeImage,
      visitorCallUrl: qrString,
      lastFourDigits
    };
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate visitor access URL
 * @param {string} qrCodeId - QR code ID
 * @param {string} baseUrl - Base URL of the application
 * @returns {string} Visitor access URL
 */
export const generateVisitorUrl = (qrCodeId, baseUrl) => {
  return `${baseUrl}/visit/${qrCodeId}`;
};
