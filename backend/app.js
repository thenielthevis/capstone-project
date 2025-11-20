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
    console.log(`[request] ${new Date().toISOString()} ${req.method} ${req.originalUrl} from ${ip}`);
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
const workoutSessionRoutes = require('./routes/workoutSessionRoutes');
const geoSessionRoutes = require('./routes/geoSessionRoutes');

// During development allow all origins so phones/emulators can reach the server.
// In production restrict this to a known list.
app.use(
  cors({
    origin: true, // reflect request origin — permissive for dev
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/workout-sessions', workoutSessionRoutes);
app.use('/api/geo-sessions', geoSessionRoutes);

module.exports = app;