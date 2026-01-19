# ACCESS PAL - Admin Guide

## 🔐 Creating New User Accounts

As the administrator, you have exclusive control over user creation.

---

## 📝 Command Line Method (Recommended)

### Step 1: Navigate to Server Directory
```bash
cd /Users/mediad/access-pal/server
```

### Step 2: Create User Account
```bash
node create-user.js <email> <password> <name> <phone>
```

### Example:
```bash
node create-user.js john@example.com SecurePass123 "John Doe" "+1234567890"
```

### Output:
The script will:
- ✅ Create the user account
- 🎨 Generate unique QR code
- 🔐 Generate activation code (last 4 digits)
- 📧 Show you all credentials to email the customer

---

## 📋 Process Flow

### 1. Customer Contacts You
- Email: support@mivado.co
- They request ACCESS PAL QR code

### 2. Create Their Account
```bash
cd /Users/mediad/access-pal/server
node create-user.js customer@email.com TempPass123 "Customer Name" "+1234567890"
```

### 3. Send Welcome Email
```
Subject: Your ACCESS PAL Video Doorbell Account

Hello [Customer Name],

Your ACCESS PAL account is ready!

Login URL: https://access-pal-1.onrender.com
Email: customer@email.com  
Password: TempPass123
Activation Code: [4-digit code from script output]

SETUP INSTRUCTIONS:
1. Login at the URL above
2. Download your QR code from the dashboard
3. Stick it on your door
4. Scan it with your phone and enter the activation code
5. Start using your video doorbell!

Support: support@mivado.co

Welcome to ACCESS PAL!
```

### 4. Customer Workflow
- They login
- Download QR code from dashboard
- Stick on door
- First scan → Enter activation code
- QR code locks to that location
- Ready to use!

---

## 🗄️ Database Access (Alternative Method)

### Using SQLite Direct Access:
```bash
cd /Users/mediad/access-pal/server
sqlite3 database.sqlite
```

```sql
-- View all users
SELECT email, name, qrCodeId, lastFourDigits, isQrActivated FROM Users;

-- Check specific user
SELECT * FROM Users WHERE email = 'customer@email.com';

-- Delete user (if needed)
DELETE FROM Users WHERE email = 'customer@email.com';
```

---

## 📊 Monitoring Users

### Check All Users:
```bash
cd /Users/mediad/access-pal/server
sqlite3 database.sqlite "SELECT email, name, isQrActivated, scanCount FROM Users;"
```

### Check Activation Status:
```bash
sqlite3 database.sqlite "SELECT email, isQrActivated, activatedAt, scanCount FROM Users WHERE email='customer@email.com';"
```

---

## 🔧 Troubleshooting

### User Can't Login
1. Verify account exists:
   ```bash
   sqlite3 database.sqlite "SELECT * FROM Users WHERE email='their@email.com';"
   ```
2. Check password is correct
3. Verify frontend URL: https://access-pal-1.onrender.com

### User Can't Activate QR Code
1. Check they have the correct 4-digit code
2. Verify location services enabled
3. Check activation status:
   ```bash
   sqlite3 database.sqlite "SELECT isQrActivated, lastFourDigits FROM Users WHERE email='their@email.com';"
   ```

### Reset Activation (Move QR Code)
```bash
sqlite3 database.sqlite "UPDATE Users SET isQrActivated=0, activationLatitude=NULL, activationLongitude=NULL WHERE email='their@email.com';"
```

---

## 📈 System Health Check

```bash
# Check backend
curl https://access-pal.onrender.com/api/monitoring/health

# Check database size
ls -lh /Users/mediad/access-pal/server/database.sqlite

# View recent errors (requires login token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://access-pal.onrender.com/api/monitoring/errors
```

---

## 🚀 Production Deployment

Your system auto-deploys via Render when you push to GitHub:
```bash
cd /Users/mediad/access-pal
git add .
git commit -m "Your changes"
git push origin main
```

Monitor deployment at: https://dashboard.render.com

---

## 💡 Tips

1. **Use strong passwords** for customers (min 8 characters)
2. **Save credentials** before emailing customer
3. **Test login** before sending to customer
4. **Keep activation codes** secure (they're on QR sticker back)
5. **Monitor via health endpoint** regularly

---

## 📞 Admin Contacts

**Your Support Email:** support@mivado.co  
**System Health:** https://access-pal.onrender.com/api/monitoring/health  
**Frontend:** https://access-pal-1.onrender.com  
**Backend:** https://access-pal.onrender.com

---

**Last Updated:** January 19, 2026
