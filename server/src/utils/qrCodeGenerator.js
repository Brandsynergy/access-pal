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
    
    // Create canvas with space for branding only (NO activation code)
    const canvas = createCanvas(450, 470);
    const ctx = canvas.getContext('2d');
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 450, 470);
    
    // Draw QR code centered
    ctx.drawImage(qrImage, 25, 25, 400, 400);
    
    // Add branding text at bottom (NO activation code for security)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACCESS PAL', 225, 455);
    
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
 * Generate printable sticker with activation code on back/separate section
 * @param {string} qrCodeImage - Base64 QR code image (front)
 * @param {string} lastFourDigits - Activation code
 * @param {string} qrCodeId - QR code ID
 * @returns {Promise<string>} Base64 image of printable sticker sheet
 */
export const generatePrintableSticker = async (qrCodeImage, lastFourDigits, qrCodeId) => {
  try {
    // Create canvas for printable sheet (front and back side by side)
    const canvas = createCanvas(900, 470);
    const ctx = canvas.getContext('2d');
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 900, 470);
    
    // Draw dividing line
    ctx.strokeStyle = '#CCCCCC';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(450, 0);
    ctx.lineTo(450, 470);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // LEFT SIDE: Front of sticker (QR code)
    const qrImg = await loadImage(qrCodeImage);
    ctx.drawImage(qrImg, 0, 0, 450, 470);
    
    // RIGHT SIDE: Back of sticker (Activation code)
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(450, 0, 450, 470);
    
    // Add instructions
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BACK OF STICKER', 675, 80);
    ctx.fillText('(Fold here or print on reverse)', 675, 105);
    
    // Draw box around activation code
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(520, 150, 310, 180);
    
    // Add activation code
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('ACTIVATION CODE', 675, 190);
    
    ctx.font = 'bold 60px monospace';
    ctx.fillStyle = '#667eea';
    ctx.fillText(lastFourDigits.toUpperCase(), 675, 260);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Enter this code when first scanning', 675, 300);
    
    // Add QR ID reference at bottom
    ctx.font = '12px monospace';
    ctx.fillStyle = '#999999';
    ctx.fillText(`ID: ${qrCodeId}`, 675, 420);
    
    // Convert to base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Printable sticker generation error:', error);
    throw new Error('Failed to generate printable sticker');
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
