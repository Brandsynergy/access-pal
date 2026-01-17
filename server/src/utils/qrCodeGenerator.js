import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { createCanvas, loadImage } from 'canvas';

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
    
    // Extract last 4 characters for activation security
    const lastFourDigits = qrCodeId.slice(-4);
    
    // Generate base QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 1,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 400
    });
    
    // Load QR code into canvas
    const qrImage = await loadImage(qrBuffer);
    
    // Create canvas with extra space for text
    const canvas = createCanvas(450, 500);
    const ctx = canvas.getContext('2d');
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 450, 500);
    
    // Draw QR code centered
    ctx.drawImage(qrImage, 25, 25, 400, 400);
    
    // Add text at bottom
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACCESS PAL', 225, 450);
    
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#667eea';
    ctx.fillText(`Code: ${lastFourDigits}`, 225, 480);
    
    // Convert canvas to base64
    const qrCodeImage = canvas.toDataURL('image/png');
    
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
