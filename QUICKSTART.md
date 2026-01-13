# ⚡ ACCESS PAL - Quick Start Checklist

## ✅ Before You Start

- [ ] Node.js installed (check: `node --version`)
- [ ] You have a database URL (free from Render.com or local PostgreSQL)

## 🚀 First Time Setup (Run Once)

```bash
# 1. Install all dependencies (in access-pal folder)
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 2. Set up your database URL in .env file
# Open .env and change DATABASE_URL to your database

# 3. Start the app
npm run dev
```

## 💻 Running the App (Every Time)

From the `access-pal` folder:

```bash
npm run dev
```

Then open: **http://localhost:3000**

## 📝 What You'll Do

1. **Register** - Create your account
2. **See Your QR Code** - Appears instantly!
3. **Download/Print** - Use the buttons to save it
4. **Share** - Place QR code at your door

## 🌐 Deploy to Production

When ready to deploy:

1. Create a GitHub repo
2. Push your code
3. Follow steps in `DEPLOYMENT.md`
4. Deploy to Render (free)

## 🆘 Quick Troubleshooting

**App won't start?**
- Check if ports 3000 and 5000 are free
- Make sure database URL is correct in `.env`

**Can't see QR code?**
- Check browser console for errors (F12)
- Make sure you registered successfully

**Database error?**
- Get a free database from Render.com
- Update DATABASE_URL in `.env`

## 📂 Important Files

- `.env` - Your local settings (database, secrets)
- `GETTING_STARTED.md` - Detailed setup guide
- `DEPLOYMENT.md` - How to deploy online
- `README.md` - Project overview

## 🎯 Your First Goal

✅ See this screen in your browser:
- Beautiful registration page at http://localhost:3000
- Create account → Instant QR code appears!

---

**That's it! You're ready to use ACCESS PAL! 🎉**
