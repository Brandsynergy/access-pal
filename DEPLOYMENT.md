# ACCESS PAL - Deployment Guide (Render)

## Quick Setup (5 Minutes)

### Step 1: Prepare Your Code

1. **Create a GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ACCESS PAL"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

### Step 2: Set Up Database on Render

1. Go to https://render.com and sign in
2. Click "New +" → "PostgreSQL"
3. Fill in:
   - Name: `access-pal-db`
   - Database: `accesspal`
   - User: `accesspal_user`
   - Region: Choose closest to you
   - Plan: **Free**
4. Click "Create Database"
5. **Copy the "Internal Database URL"** (you'll need this)

### Step 3: Deploy Backend (Server)

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Fill in:
   - Name: `access-pal-server`
   - Root Directory: `server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**
4. Click "Advanced" and add Environment Variables:
   - `DATABASE_URL` = (paste the Internal Database URL from Step 2)
   - `JWT_SECRET` = (any random string, e.g., `my-super-secret-jwt-key-12345`)
   - `SESSION_SECRET` = (another random string)
   - `CLIENT_URL` = `https://access-pal.onrender.com` (we'll create this next)
   - `CORS_ORIGIN` = `https://access-pal.onrender.com`
   - `NODE_ENV` = `production`
5. Click "Create Web Service"
6. **Copy the service URL** (e.g., `https://access-pal-server.onrender.com`)

### Step 4: Deploy Frontend (Client)

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Fill in:
   - Name: `access-pal`
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Click "Advanced" and add Environment Variable:
   - `VITE_API_URL` = (paste your backend URL from Step 3 + `/api`)
     - Example: `https://access-pal-server.onrender.com/api`
5. Click "Create Static Site"

### Step 5: Update Backend URL

1. Go back to your backend service settings
2. Update the `CLIENT_URL` and `CORS_ORIGIN` environment variables with your actual frontend URL
3. The service will automatically redeploy

## Done! 🎉

Your app is now live at:
- **Frontend**: https://access-pal.onrender.com
- **Backend**: https://access-pal-server.onrender.com

## Important Notes

⚠️ **Free tier limitations**:
- Services may sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds
- Upgrade to paid plan ($7/month per service) for always-on

## Testing Your App

1. Open your frontend URL
2. Create an account
3. You'll immediately see your unique QR code!
4. Download, print, or share it

## Need Help?

Check the logs in Render dashboard if something goes wrong.
