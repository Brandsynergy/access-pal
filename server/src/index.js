import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ACCESS PAL API Server',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);

// WebRTC signaling via Socket.IO
io.on('connection', (socket) => {
  console.log('\n✅ New client connected:', socket.id);

  // Join room based on QR code ID
  socket.on('join-room', (qrCodeId) => {
    socket.join(qrCodeId);
    console.log(`\n🏠 Socket ${socket.id} joined room: ${qrCodeId}`);
    
    // Get all sockets in this room
    const room = io.sockets.adapter.rooms.get(qrCodeId);
    const socketsInRoom = room ? Array.from(room) : [];
    console.log(`👥 Total sockets in room ${qrCodeId}:`, socketsInRoom.length);
    console.log('📝 Socket IDs in room:', socketsInRoom);
    
    // Notify room members
    socket.to(qrCodeId).emit('user-joined', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    console.log(`\n📤 Forwarding offer to room: ${data.room}`);
    const room = io.sockets.adapter.rooms.get(data.room);
    console.log(`👥 Sockets in room:`, room ? Array.from(room) : 'Room not found');
    socket.to(data.room).emit('offer', data);
  });

  socket.on('answer', (data) => {
    console.log(`\n📤📤📤 FORWARDING ANSWER TO ROOM: ${data.room}`);
    const room = io.sockets.adapter.rooms.get(data.room);
    if (room) {
      const socketsInRoom = Array.from(room);
      console.log(`✅ Room exists with ${socketsInRoom.length} socket(s)`);
      console.log(`📝 Socket IDs in room:`, socketsInRoom);
      console.log(`📤 Sending answer to OTHER sockets in room (excluding sender ${socket.id})`);
    } else {
      console.log(`❌ WARNING: Room ${data.room} does NOT exist!`);
    }
    socket.to(data.room).emit('answer', data);
    console.log(`✅ Answer emitted to room\n`);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', data);
  });

  // Visitor notification - CRITICAL!
  socket.on('visitor-alert', (data) => {
    console.log(`\n\n🔔🔔🔔 VISITOR ALERT RECEIVED!`);
    console.log(`📍 QR Code ID: ${data.qrCodeId}`);
    console.log(`⏰ Timestamp: ${data.timestamp}`);
    
    // Check room status
    const room = io.sockets.adapter.rooms.get(data.qrCodeId);
    if (room) {
      const socketsInRoom = Array.from(room);
      console.log(`✅ Room EXISTS with ${socketsInRoom.length} socket(s)`);
      console.log(`📝 Socket IDs:`, socketsInRoom);
      
      // Emit to entire room including sender
      io.to(data.qrCodeId).emit('visitor-at-door', data);
      console.log(`✅ Emitted 'visitor-at-door' event to room`);
    } else {
      console.log(`❌ WARNING: Room ${data.qrCodeId} does NOT exist!`);
      console.log(`❌ No homeowner connected to receive this call`);
      
      // Still try to emit in case room tracking is off
      io.to(data.qrCodeId).emit('visitor-at-door', data);
    }
    console.log(`\n`);
  });

  // Call lifecycle events
  socket.on('call-accepted', (data) => {
    console.log(`\n✅ Call accepted in room: ${data.room}`);
    socket.to(data.room).emit('call-accepted', data);
  });

  socket.on('call-rejected', (data) => {
    console.log(`\n❌ Call rejected in room: ${data.room}`);
    socket.to(data.room).emit('call-rejected', data);
  });

  socket.on('call-ended', (data) => {
    console.log(`\n📞 Call ended in room: ${data.room}`);
    socket.to(data.room).emit('call-ended', data);
  });

  // User status
  socket.on('user-online', (data) => {
    socket.join(`user-${data.userId}`);
    console.log(`\n🟢 User ${data.userId} is online`);
  });

  socket.on('user-offline', (data) => {
    socket.leave(`user-${data.userId}`);
    console.log(`\n🔴 User ${data.userId} went offline`);
  });

  socket.on('disconnect', () => {
    console.log('\n❌ Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 ACCESS PAL Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
