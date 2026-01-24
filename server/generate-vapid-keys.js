#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications
 * Run once and add keys to .env file
 */

import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Generated!\n');
console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:support@mivado.co\n');
console.log('✨ Done!\n');
