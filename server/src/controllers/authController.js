import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateUserQRCode, generatePrintableSticker } from '../utils/qrCodeGenerator.js';

/**
 * Register a new user and generate their QR code
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, phoneNumber, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Generate QR code for the new user
    const { qrCodeId, qrCodeImage, lastFourDigits } = await generateUserQRCode(email);

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      phoneNumber,
      address,
      qrCodeId,
      qrCodeImage,
      lastFourDigits
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          address: user.address,
          qrCodeId: user.qrCodeId,
          qrCodeImage: user.qrCodeImage,
          lastFourDigits: user.lastFourDigits
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.message 
    });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          qrCodeId: user.qrCodeId,
          qrCodeImage: user.qrCodeImage
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: error.message 
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile', 
      error: error.message 
    });
  }
};

/**
 * Generate printable sticker with activation code on back
 */
export const generateSticker = async (req, res) => {
  try {
    const { qrCodeImage, lastFourDigits, qrCodeId } = req.body;

    if (!qrCodeImage || !lastFourDigits || !qrCodeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate printable sticker
    const printableSticker = await generatePrintableSticker(qrCodeImage, lastFourDigits, qrCodeId);

    res.json({
      success: true,
      message: 'Printable sticker generated',
      data: {
        printableSticker
      }
    });
  } catch (error) {
    console.error('Generate sticker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate printable sticker',
      error: error.message
    });
  }
};

/**
 * Regenerate QR code for user
 */
export const regenerateQRCode = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate new QR code
    const { qrCodeId, qrCodeImage, lastFourDigits } = await generateUserQRCode(user.id);

    // Update user - reset activation when regenerating
    user.qrCodeId = qrCodeId;
    user.qrCodeImage = qrCodeImage;
    user.lastFourDigits = lastFourDigits;
    user.isQrActivated = false; // Require reactivation
    user.activationDeviceFingerprint = null;
    user.activationLatitude = null;
    user.activationLongitude = null;
    user.activatedAt = null;
    await user.save();

    res.json({
      success: true,
      message: 'QR code regenerated successfully',
      data: {
        qrCodeId: user.qrCodeId,
        qrCodeImage: user.qrCodeImage
      }
    });
  } catch (error) {
    console.error('Regenerate QR code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to regenerate QR code', 
      error: error.message 
    });
  }
};
