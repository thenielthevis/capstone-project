const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Simple request logger for debugging network issues
app.use((req, res, next) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} from ${ip}`);
  } catch (e) {
    // no-op
  }
  next();
});

//Routers
const userRoutes = require('./routes/userRoutes');
const predictRoutes = require('./routes/predictRoutes');
const geoRoutes = require('./routes/geoRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const geoSessionRoutes = require('./routes/geoSessionRoutes');
const foodLogRoutes = require('./routes/foodLogRoutes');
const programRoutes = require('./routes/programRoutes');
const programSessionRoutes = require('./routes/programSessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

// During development allow all origins so phones/emulators can reach the server.
// In production restrict this to a known list.
app.use(
  cors({
    origin: true, // reflect request origin — permissive for dev
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Use Routes
console.log('[APP] Registering routes...');
app.use('/api/users', userRoutes);
console.log('[APP] Registered /api/users routes');
app.use('/api/predict', predictRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/geo-sessions', geoSessionRoutes);
app.use('/api/food-logs', foodLogRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/program-sessions', programSessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
console.log('[APP] Registered /api/admin routes');
console.log('[APP] Registered /api/gemini routes');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Capstone API Server Running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl} - Route not found`);
  console.log(`[404] Available routes: /api/users, /api/predict, /api/geo, /api/workouts, /api/workout-sessions, /api/geo-sessions, /api/food-logs, /api/programs, /api/admin`);
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;