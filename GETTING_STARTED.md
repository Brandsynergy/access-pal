# 🚀 Getting Started with ACCESS PAL

This guide will help you run ACCESS PAL on your computer in **simple steps**.

## What You Need (Prerequisites)

1. **Node.js** (version 18 or higher)
   - Check if you have it: Open Terminal and type `node --version`
   - If you don't have it, download from: https://nodejs.org/

2. **PostgreSQL Database**
   - **Easy Option**: Use a free cloud database (recommended)
     - Go to https://render.com
     - Create a free PostgreSQL database
     - Copy the database URL
   - **Or**: Install PostgreSQL locally (more complex)

## Step 1: Install Dependencies

Open Terminal in the `access-pal` folder and run:

```bash
npm install
```

This installs the main tools. Now install for both server and client:

```bash
cd server
npm install
cd ../client
npm install
cd ..
```

## Step 2: Set Up Your Database

### Option A: Using Render (Recommended - Free & Easy)

1. Go to https://render.com and sign up
2. Click "New +" → "PostgreSQL"
3. Name it `access-pal-db`, select Free plan
4. Click "Create Database"
5. Copy the "Internal Database URL"
6. Open the `.env` file in the `access-pal` folder
7. Replace the `DATABASE_URL` line with your copied URL

### Option B: Using Local PostgreSQL

If you have PostgreSQL installed locally:
```bash
# Create the database
psql postgres
CREATE DATABASE accesspal;
\q
```

The `.env` file is already set up for local database.

## Step 3: Start the Application

Open Terminal in the `access-pal` folder and run:

```bash
npm run dev
```

This starts both the backend and frontend!

You should see:
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000

## Step 4: Open the App

1. Open your web browser
2. Go to: **http://localhost:3000**
3. You'll see the ACCESS PAL registration page!

## Step 5: Create Your Account

1. Fill in your name, email, and password
2. Click "Create Account & Get QR Code"
3. 🎉 **You'll immediately see your unique QR code!**

## What You Can Do Now

✅ **Download your QR code** - Click the download button  
✅ **Print your QR code** - Click the print button  
✅ **Regenerate QR code** - If you need a new one  

## Common Issues & Solutions

### "Cannot connect to database"
- Make sure your DATABASE_URL in `.env` is correct
- If using Render, make sure you copied the complete URL

### "Port 5000 already in use"
- Another app is using port 5000
- Change PORT in `.env` to 5001 or another number

### "Module not found"
- Run `npm install` again in the root, server, and client folders

### Page won't load
- Make sure both servers are running (you should see both in Terminal)
- Try refreshing your browser
- Check http://localhost:5000 - should show "ACCESS PAL API Server"

## Next Steps

Once your app works locally, you can:
1. Deploy to Render (see `DEPLOYMENT.md`)
2. Use it from anywhere in the world!
3. Share your QR code with visitors

## Need More Help?

- Check the main `README.md` file
- Look at the deployment guide in `DEPLOYMENT.md`
- Make sure all files are in the right folders

---

**Remember**: This is for local development. To use it as a real doorbell, you'll need to deploy it (see DEPLOYMENT.md)!
