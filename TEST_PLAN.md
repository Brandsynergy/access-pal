# ACCESS PAL - Complete Test Plan

## 🎯 Expected Flow

1. **Homeowner receives QR Code** → Activates with 4-digit code
2. **Homeowner prints & mails QR Code** → Sticks it on door
3. **Courier/Visitor scans QR Code** → Triggers push notification
4. **Homeowner sees notification on lock screen** → Taps ACCESS PAL icon
5. **Homeowner answers call** → Video interaction begins

---

## ✅ Test Checklist

### Phase 1: Setup (ONE TIME ONLY)
- [ ] Homeowner opens ACCESS PAL on phone
- [ ] PWA installs to home screen
- [ ] Browser asks for notification permission → **Allow**
- [ ] Dashboard shows "🟢 Online & Ready"
- [ ] Homeowner **closes app completely** (swipe away)

### Phase 2: Visitor Scans QR Code
- [ ] Visitor scans QR code with phone camera
- [ ] Visitor page opens and shows "Start Video Call" button
- [ ] Visitor clicks "Start Video Call"

### Phase 3: Push Notification (CRITICAL)
- [ ] **Homeowner phone shows notification on lock screen**
- [ ] Notification says: "ACCESS PAL - Visitor at Your Door!"
- [ ] Notification body: "Someone has scanned your QR code. Tap to answer."
- [ ] Phone vibrates (pattern: 200, 100, 200, 100, 200)

### Phase 4: Answer Call
- [ ] Homeowner **taps notification**
- [ ] ACCESS PAL opens **directly to dashboard**
- [ ] **No login required** (already logged in)
- [ ] Incoming call dialog appears
- [ ] Homeowner clicks "Accept"
- [ ] Video call starts

### Phase 5: During Call
- [ ] Both parties can see/hear each other
- [ ] Video and audio quality is good
- [ ] Can toggle camera/mic
- [ ] Can end call

---

## 🐛 Troubleshooting

### No notification appears
1. Check homeowner phone notification settings
2. Go to phone Settings → Notifications → ACCESS PAL → Ensure "Allow Notifications" is ON
3. Open ACCESS PAL dashboard → Hard refresh (force reload)
4. Check browser console for push logs
5. Ensure homeowner clicked "Enable Notifications" at least once

### "Sign in required" message
- This should NOT happen anymore
- Token expires after 30 days
- If it happens, it's a bug - report immediately

### Notification appears but app doesn't open
- Check if ACCESS PAL is installed as PWA (home screen icon)
- Try tapping notification again
- Check browser console for errors

---

## 📝 Test with YOUR QR Codes

**nnamdionye@gmail.com QR Code:**
`AP-61cd2043-2ab0-4f22-8a3e-67cbe3e73281`

**Visitor URL:**
`https://access-pal.onrender.com/visit/AP-61cd2043-2ab0-4f22-8a3e-67cbe3e73281`

---

## ⚙️ Technical Details

**Push Notification Stack:**
- ✅ Web Push API (VAPID keys configured)
- ✅ Service Worker (v3) - handles push events
- ✅ Auto-subscribe on dashboard load (if permission granted)
- ✅ Push sent via backend when visitor-alert event fires
- ✅ Notification displayed on lock screen

**Persistent Login:**
- ✅ JWT token valid for 30 days
- ✅ Auto-restore from localStorage
- ✅ No re-login required

**WebRTC Signaling:**
- ✅ Socket.IO for real-time communication
- ✅ visitor-alert event triggers push
- ✅ offer/answer/ice-candidate exchange
