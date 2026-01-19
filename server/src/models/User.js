import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  qrCodeId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  qrCodeImage: {
    type: DataTypes.TEXT, // Base64 encoded QR code
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  deviceToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Activation security fields
  lastFourDigits: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  isQrActivated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activationDeviceFingerprint: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activationLatitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  activationLongitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  activatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scanCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastScannedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default User;
