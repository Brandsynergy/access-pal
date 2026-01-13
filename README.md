# ACCESS PAL - Smart Video Doorbell

A smart video doorbell/intercom system that lets you talk to visitors remotely using QR code technology.

## Features
- 📱 Works on all phones and computers (web-based)
- 🔒 Secure QR code visitor connection (no app needed for visitors)
- 📹 Real-time video and audio calls
- 👥 Call diversion to friends/family
- 📊 Surveillance and monitoring
- 🎨 Beautiful, user-friendly interface

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (free on Render)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `.env.example`)

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Deployment to Render

1. Push code to GitHub
2. Connect Render to your GitHub repo
3. Render will auto-deploy

## Project Structure
```
access-pal/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared code
└── database/        # Database schemas
```

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Real-time: Socket.io + WebRTC
- QR Codes: qrcode library
