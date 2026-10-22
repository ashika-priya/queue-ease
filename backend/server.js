const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket/socketHandler');
const { seedDatabase } = require('./src/seed/seedData');
const User = require('./src/models/User');

const authRoutes = require('./src/routes/authRoutes');
const orgRoutes = require('./src/routes/orgRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

// CORS origin: locked to CLIENT_URL in production, open in development
const corsOrigin = isProduction ? CLIENT_URL : '*';

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

initSocket(io);

// Express Middlewares
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for diagnostic tracing
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date(), app: 'Queue Ease Server' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is currently empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Seeding initial demonstration data...');
      await seedDatabase();
    }

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  Queue Ease Server running on http://localhost:${PORT}`);
      console.log(`  Socket.IO real-time engine active`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  CORS allowed origin: ${corsOrigin}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start Queue Ease Server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };