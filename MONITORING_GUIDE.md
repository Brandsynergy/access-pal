# ACCESS PAL - Production Monitoring Guide

## 🎯 Quick Health Check

**Public Endpoint:**
```
https://access-pal.onrender.com/api/monitoring/health
```

Returns:
- Server status
- Uptime
- Memory usage
- CPU information
- System load

## 📊 Monitoring Endpoints

### 1. Health Check (Public)
```bash
curl https://access-pal.onrender.com/api/monitoring/health
```

**What it shows:**
- ✅ Server is running
- 📈 Memory usage
- ⏱️ Uptime
- 💻 System resources

---

### 2. Error Logs (Protected - Requires Login)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://access-pal.onrender.com/api/monitoring/errors
```

**What it shows:**
- Recent errors (last 50 by default)
- Error severity levels
- Stack traces
- Context information

**Query Parameters:**
- `?limit=100` - Get more/fewer errors

---

### 3. System Statistics (Protected - Requires Login)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://access-pal.onrender.com/api/monitoring/stats
```

**What it shows:**
- Errors in last hour
- Errors in last 24 hours
- Total error count
- Errors by severity level
- Memory statistics

---

## 🚨 Error Severity Levels

1. **CRITICAL** 🚨 - Requires immediate attention
   - QR activation failures
   - Database errors
   - Authentication system failures

2. **ERROR** ❌ - Needs attention soon
   - Failed API requests
   - Invalid data
   - Processing failures

3. **WARN** ⚠️ - Monitor for patterns
   - Unusual activity
   - Deprecated features
   - Performance issues

4. **INFO** ℹ️ - Normal operations
   - QR activations
   - User logins
   - System events

---

## 📁 Log Files (On Server)

Logs are stored in: `server/logs/`

- `errors.log` - All errors, warnings, and critical issues
- `access.log` - All API requests with response times

**Automatic Cleanup:**
- Logs older than 7 days are automatically deleted
- Runs daily at midnight

---

## 🔍 How to Monitor

### Option 1: Manual Checks
Visit health endpoint periodically:
```bash
watch -n 60 'curl -s https://access-pal.onrender.com/api/monitoring/health | jq'
```

### Option 2: From Dashboard
1. Login to your ACCESS PAL dashboard
2. Open browser console (⌘ + ⌥ + J)
3. Run:
```javascript
fetch('/api/monitoring/health')
  .then(r => r.json())
  .then(console.log)
```

### Option 3: Automated Monitoring
Use a service like:
- UptimeRobot (free)
- Pingdom
- Better Uptime

Point them to: `https://access-pal.onrender.com/api/monitoring/health`

---

## 📈 What to Watch For

### Good Indicators ✅
- Health status: "healthy"
- Memory usage: < 80MB
- Uptime: increasing
- Load average: < 30

### Warning Signs ⚠️
- Multiple errors in last hour
- Memory usage climbing
- Server restarts (uptime resets)
- High load average (> 50)

### Critical Issues 🚨
- Health endpoint not responding
- CRITICAL errors in logs
- Memory usage > 200MB
- Frequent crashes

---

## 🛠️ Troubleshooting

### Server Not Responding
1. Check Render dashboard for deployments
2. Check health endpoint
3. Review error logs via Render console

### High Error Rate
1. Check `/api/monitoring/errors` for patterns
2. Look for common error messages
3. Check if related to specific feature

### Memory Issues
1. Check health endpoint memory stats
2. May need to restart service
3. Consider upgrading plan if consistent

---

## 📞 Emergency Contacts

**Production Issues:**
- Email: support@mivado.co
- Check: Render dashboard logs

**Current Status:**
- Backend: https://access-pal.onrender.com
- Frontend: https://access-pal-1.onrender.com
- Health: https://access-pal.onrender.com/api/monitoring/health

---

## ✅ Daily Checklist

- [ ] Check health endpoint
- [ ] Review error count (should be minimal)
- [ ] Verify uptime is increasing
- [ ] Check memory usage is stable
- [ ] Test a QR code scan

---

**Last Updated:** January 19, 2026  
**System Version:** 1.0.0
