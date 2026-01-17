import User from '../models/User.js';

// Haversine formula to calculate distance between two coordinates in miles
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Activate QR code
export const activateQR = async (req, res) => {
  try {
    const { qrCodeId, activationCode, latitude, longitude, deviceFingerprint } = req.body;

    // Validate required fields
    if (!qrCodeId || !activationCode || !latitude || !longitude || !deviceFingerprint) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Find user by QR code ID
    const user = await User.findOne({ where: { qrCodeId } });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid QR code' 
      });
    }

    // Verify activation code (last 4 digits)
    if (user.lastFourDigits !== activationCode.toUpperCase()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid activation code. Please check the last 4 digits on the back of your QR code sticker.' 
      });
    }

    // Check if already activated
    if (user.isQrActivated) {
      return res.status(400).json({ 
        success: false, 
        message: 'This QR code is already activated at another location.' 
      });
    }

    // Activate the QR code
    user.isQrActivated = true;
    user.activationDeviceFingerprint = deviceFingerprint;
    user.activationLatitude = latitude;
    user.activationLongitude = longitude;
    user.activatedAt = new Date();
    user.scanCount = 0;

    await user.save();

    res.json({ 
      success: true, 
      message: 'QR code activated successfully!',
      data: {
        activatedAt: user.activatedAt,
        location: {
          latitude: user.activationLatitude,
          longitude: user.activationLongitude
        }
      }
    });

  } catch (error) {
    console.error('Error activating QR code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during activation' 
    });
  }
};

// Check activation status and validate location
export const checkActivation = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const { latitude, longitude } = req.query;

    // Find user by QR code ID
    const user = await User.findOne({ where: { qrCodeId } });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid QR code' 
      });
    }

    // If not activated, return status
    if (!user.isQrActivated) {
      return res.json({ 
        success: true,
        data: {
          isActivated: false,
          requiresActivation: true,
          lastFourDigits: user.lastFourDigits
        }
      });
    }

    // If activated, validate location (if location provided)
    if (latitude && longitude) {
      const distance = calculateDistance(
        user.activationLatitude,
        user.activationLongitude,
        parseFloat(latitude),
        parseFloat(longitude)
      );

      // 1 mile radius restriction
      if (distance > 1) {
        return res.json({ 
          success: false,
          data: {
            isActivated: true,
            locationValid: false,
            distance: distance.toFixed(2),
            message: 'This QR code is registered at a different location. Please contact the owner for assistance.'
          }
        });
      }

      // Update scan count and last scanned timestamp
      user.scanCount = (user.scanCount || 0) + 1;
      user.lastScannedAt = new Date();
      await user.save();
    }

    // Valid activation and location
    res.json({ 
      success: true,
      data: {
        isActivated: true,
        locationValid: true,
        activatedAt: user.activatedAt,
        scanCount: user.scanCount,
        homeownerName: user.name,
        homeownerEmail: user.email
      }
    });

  } catch (error) {
    console.error('Error checking activation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error checking activation' 
    });
  }
};

// Get activation details for dashboard (homeowner only)
export const getActivationDetails = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      data: {
        isActivated: user.isQrActivated,
        activatedAt: user.activatedAt,
        scanCount: user.scanCount || 0,
        lastScannedAt: user.lastScannedAt,
        location: user.isQrActivated ? {
          latitude: user.activationLatitude,
          longitude: user.activationLongitude
        } : null,
        lastFourDigits: user.lastFourDigits
      }
    });

  } catch (error) {
    console.error('Error fetching activation details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching activation details' 
    });
  }
};
