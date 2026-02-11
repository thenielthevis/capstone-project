const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

app.use((req, res, next) => {
    try {
        const ip = req.ip || req.get('x-forwarded-for') || req.connection?.remoteAddress || 'unknown';
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
const reportRoutes = require('./routes/reportRoutes');
const historyRoutes = require('./routes/historyRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const healthCheckupRoutes = require('./routes/healthCheckupRoutes');
const moodCheckinRoutes = require('./routes/moodCheckinRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : true)
        : true,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma'],
    credentials: true,
};
app.use(cors(corsOptions));
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
app.use('/api/reports', reportRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/health-checkups', healthCheckupRoutes);
app.use('/api/mood-checkins', moodCheckinRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
console.log('[APP] Registered /api/leaderboard routes');
console.log('[APP] Registered /api/admin routes');
console.log('[APP] Registered /api/gemini routes');
console.log('[APP] Registered /api/assessment routes');
console.log('[APP] Registered /api/health-checkups routes');
console.log('[APP] Registered /api/mood-checkins routes');
console.log('[APP] Registered /api/feedback routes');
console.log('[APP] Registered /api/reports routes');

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
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.stack);

    const statusCode = err.status || 500;
    const isDev = process.env.NODE_ENV === 'development';

    res.status(statusCode).json({
        status: 'error',
        message: statusCode === 500 && !isDev ? 'Internal server error' : err.message,
        ...(isDev && { stack: err.stack, error: err })
    });
});

module.exports = app;