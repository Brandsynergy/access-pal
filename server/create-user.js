#!/usr/bin/env node

/**
 * Admin Script: Create New ACCESS PAL User
 * 
 * Usage:
 *   node create-user.js <email> <password> <name> <phone>
 * 
 * Example:
 *   node create-user.js john@example.com SecurePass123 "John Doe" "+1234567890"
 */

import dotenv from 'dotenv';
import { connectDB } from './src/config/database.js';
import User from './src/models/User.js';
import { generateUserQRCode } from './src/utils/qrCodeGenerator.js';

// Load environment variables
dotenv.config();

const createUser = async (email, password, name, phoneNumber) => {
  try {
    console.log('\n🔧 ACCESS PAL - Admin User Creation');
    console.log('=====================================\n');

    // Connect to database
    console.log('📊 Connecting to database...');
    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.error('❌ Error: User already exists with email:', email);
      process.exit(1);
    }

    // Generate QR code
    console.log('🎨 Generating QR code...');
    const { qrCodeId, qrCodeImage, lastFourDigits } = await generateUserQRCode(email);

    // Create user
    console.log('👤 Creating user account...');
    const user = await User.create({
      email,
      password,
      name,
      phoneNumber,
      qrCodeId,
      qrCodeImage,
      lastFourDigits
    });

    console.log('\n✅ SUCCESS! User created successfully!\n');
    console.log('=====================================');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('📱 Phone:', user.phoneNumber);
    console.log('🆔 QR Code ID:', user.qrCodeId);
    console.log('🔐 Activation Code:', user.lastFourDigits);
    console.log('=====================================\n');

    console.log('📋 NEXT STEPS:');
    console.log('1. Download the QR code from the dashboard after user logs in');
    console.log('2. Print the QR code sticker');
    console.log('3. Write activation code on the back:', lastFourDigits);
    console.log('4. Email credentials to customer:\n');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Login:', process.env.CLIENT_URL || 'https://access-pal-1.onrender.com');
    console.log('   Activation Code:', lastFourDigits);
    console.log('\n✨ Done!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating user:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('\n❌ Error: Missing required arguments\n');
  console.log('Usage: node create-user.js <email> <password> <name> <phone>\n');
  console.log('Example:');
  console.log('  node create-user.js john@example.com SecurePass123 "John Doe" "+1234567890"\n');
  process.exit(1);
}

const [email, password, name, phoneNumber] = args;

// Validate email
if (!email.includes('@')) {
  console.error('❌ Error: Invalid email address');
  process.exit(1);
}

// Validate password
if (password.length < 6) {
  console.error('❌ Error: Password must be at least 6 characters');
  process.exit(1);
}

// Create the user
createUser(email, password, name, phoneNumber);
