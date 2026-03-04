const express = require('express');
const User = require('../models/userModel');
const FoodLog = require('../models/foodLogModel');
const GeoSession = require('../models/geoSessionModel');
const GeoActivity = require('../models/geoActivityModel');
const HealthCheckup = require('../models/healthCheckupModel');
const MoodCheckin = require('../models/moodCheckinModel');
const jwt = require('jsonwebtoken');

const router = express.Router();

console.log('[Admin Routes] Loading admin routes module...');

// ============= UNPROTECTED TEST ENDPOINT =============
router.get('/test', (req, res) => {
    console.log('✅ [ADMIN TEST] GET /test endpoint hit!');
    res.json({ 
        message: 'Admin routes are loaded and working!',
        timestamp: new Date().toISOString()
    });
});

// ============= AUTH MIDDLEWARE =============
const checkAuth = (req, res, next) => {
    console.log('\n=== [ADMIN AUTH] Starting auth check ===');
    console.log('[ADMIN AUTH] Path:', req.path);
    try {
        const authHeader = req.header('Authorization');
        console.log('[ADMIN AUTH] Authorization header:', authHeader ? `Present (${authHeader.length} chars)` : 'MISSING!');
        
        if (!authHeader) {
            console.log('[ADMIN AUTH] ✗ Authorization header is missing!');
            return res.status(401).json({ message: 'No Authorization header' });
        }
        
        const token = authHeader.replace('Bearer ', '');
        console.log('[ADMIN AUTH] Token extracted:', token ? `${token.substring(0, 20)}...` : 'EMPTY!');
        
        if (!token) {
            console.log('[ADMIN AUTH] ✗ Token is empty!');
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[ADMIN AUTH] ✓ Token verified! Decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });
        
        if (!decoded.role) {
            console.log('[ADMIN AUTH] ✗ Token has no role field!');
            return res.status(403).json({ message: 'Token missing role' });
        }
        
        if (decoded.role !== 'admin') {
            console.log('[ADMIN AUTH] ✗ User role is NOT admin, it is:', decoded.role);
            return res.status(403).json({ message: `Access denied. Your role: ${decoded.role}` });
        }

        console.log('[ADMIN AUTH] ✓✓✓ Admin verified! Proceeding...\n');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[ADMIN AUTH] ✗ JWT Error:', error.message);
        console.log('[ADMIN AUTH] Error details:', { name: error.name, code: error.code });
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

// ============= PROTECTED ENDPOINTS =============

// Simple test endpoint to verify auth works
router.get('/stats-test', (req, res) => {
    console.log('[ADMIN] GET /stats-test (NO AUTH)');
    res.json({ 
        message: 'Stats test endpoint works!',
        timestamp: new Date().toISOString()
    });
});

// Get dashboard stats
router.get('/stats', checkAuth, async (req, res) => {
    console.log('[ADMIN STATS] Route handler hit!');
    console.log('[ADMIN STATS] Request user:', req.user);
    try {
        const totalUsers = await User.countDocuments(); // Count ALL users regardless of role
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const regularUsers = await User.countDocuments({ role: 'user' });
        
        console.log('[ADMIN STATS] ✓ Counts - Total:', totalUsers, 'Admins:', totalAdmins, 'Regular:', regularUsers);
        
        res.json({
            totalUsers,
            totalAdmins,
        });
    } catch (error) {
        console.error('[ADMIN STATS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

// Create new admin
router.post('/create-admin', checkAuth, async (req, res) => {
    console.log('[ADMIN] POST /create-admin');
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const admin = new User({
            username,
            email,
            password,
            role: 'admin',
            verified: true,
        });

        await admin.save();

        console.log('[ADMIN CREATE] ✓ Admin created:', email);

        res.status(201).json({
            message: 'Admin created',
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            }
        });
    } catch (error) {
        console.error('[ADMIN CREATE] ✗ Error:', error.message);
        res.status(500).json({ message: 'Error creating admin', error: error.message });
    }
});

// Search users - MUST come before /users/:userId
router.get('/users/search', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /users/search - Query:', req.query.q);
    try {
        const { q } = req.query;
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: 'Search query required' });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        })
        .select('-password')
        .limit(20);

        console.log('[ADMIN SEARCH] ✓ Found', users.length, 'users');

        res.json({ users });
    } catch (error) {
        console.error('[ADMIN SEARCH] ✗ Error:', error.message);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
});

// Get all users
router.get('/users', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /users - Query:', req.query);
    try {
        const { role, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        if (role) filter.role = role;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 10);
        const skip = (pageNum - 1) * limitNum;
        
        console.log('[ADMIN USERS] Filter:', filter, 'Page:', pageNum, 'Limit:', limitNum, 'Skip:', skip);
        
        const users = await User.find(filter)
            .select('-password')
            .sort({ registeredDate: -1 })
            .skip(skip)
            .limit(limitNum);
        
        const total = await User.countDocuments(filter);
        console.log('[ADMIN USERS] ✓ Found', users.length, 'users (total:', total + ')');

        res.json({
            users,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            }
        });
    } catch (error) {
        console.error('[ADMIN USERS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get user by ID
router.get('/users/:userId', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /users/:userId -', req.params.userId);
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('[ADMIN GET USER] ✓ User found:', userId);

        res.json(user);
    } catch (error) {
        console.error('[ADMIN GET USER] ✗ Error:', error.message);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Update user
router.put('/users/:userId', checkAuth, async (req, res) => {
    console.log('[ADMIN] PUT /users/:userId -', req.params.userId);
    try {
        const { userId } = req.params;
        const { username, email, role, verified } = req.body;

        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (verified !== undefined) updateData.verified = verified;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('[ADMIN UPDATE] ✓ User updated:', userId);

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('[ADMIN UPDATE] ✗ Error:', error.message);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

// Delete user
router.delete('/users/:userId', checkAuth, async (req, res) => {
    console.log('[ADMIN] DELETE /users/:userId -', req.params.userId);
    try {
        const { userId } = req.params;

        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('[ADMIN DELETE] ✓ User deleted:', userId);

        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('[ADMIN DELETE] ✗ Error:', error.message);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// ============= GEO ACTIVITY ENDPOINTS =============
const GeoActivity = require('../models/geoActivityModel');
const GeoSession = require('../models/geoSessionModel');

// Get geo activities statistics
router.get('/geo-activities/stats', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /geo-activities/stats');
    try {
        const totalActivities = await GeoActivity.countDocuments();
        const totalSessions = await GeoSession.countDocuments();
        const totalUsers = await GeoSession.distinct('user_id').then(users => users.length);
        
        // Get sessions from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSessions = await GeoSession.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Get most active users
        const topUsers = await GeoSession.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    sessionCount: { $sum: 1 },
                    totalDistance: { $sum: '$distance_km' },
                    totalCalories: { $sum: '$calories_burned' }
                }
            },
            {
                $sort: { sessionCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    sessionCount: 1,
                    totalDistance: { $round: ['$totalDistance', 2] },
                    totalCalories: { $round: ['$totalCalories', 0] }
                }
            }
        ]);

        // Get most popular activities
        const topActivities = await GeoSession.aggregate([
            {
                $group: {
                    _id: '$activity_type',
                    sessionCount: { $sum: 1 },
                    totalDistance: { $sum: '$distance_km' },
                    totalCalories: { $sum: '$calories_burned' }
                }
            },
            {
                $sort: { sessionCount: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'geoactivities',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'activity'
                }
            },
            {
                $unwind: '$activity'
            },
            {
                $project: {
                    activityName: '$activity.name',
                    sessionCount: 1,
                    totalDistance: { $round: ['$totalDistance', 2] },
                    totalCalories: { $round: ['$totalCalories', 0] }
                }
            }
        ]);

        console.log('[ADMIN GEO STATS] ✓ Stats retrieved');

        res.json({
            totalActivities,
            totalSessions,
            totalUsers,
            recentSessions,
            averageSessionsPerUser: totalUsers > 0 ? (totalSessions / totalUsers).toFixed(2) : '0',
            topUsers,
            topActivities
        });
    } catch (error) {
        console.error('[ADMIN GEO STATS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch geo activity statistics', error: error.message });
    }
});

// Get all geo activities
router.get('/geo-activities', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /geo-activities - Query:', req.query);
    try {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const activities = await GeoActivity.find()
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await GeoActivity.countDocuments();

        console.log('[ADMIN GEO ACTIVITIES] ✓ Found', activities.length, 'activities (total:', totalCount + ')');

        res.json({
            message: 'Geo activities retrieved successfully',
            activities,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN GEO ACTIVITIES] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch geo activities', error: error.message });
    }
});

// Get all geo sessions
router.get('/geo-sessions', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /geo-sessions - Query:', req.query);
    try {
        const { 
            page = 1, 
            limit = 20, 
            startDate, 
            endDate,
            userId,
            activityType,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Filter by specific user if provided
        if (userId) {
            query.user_id = userId;
        }

        // Filter by activity type if provided
        if (activityType) {
            query.activity_type = activityType;
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[ADMIN GEO SESSIONS] Query:', JSON.stringify(query));

        const sessions = await GeoSession.find(query)
            .populate('user_id', 'username email profilePicture')
            .populate('activity_type', 'name description icon met')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await GeoSession.countDocuments(query);

        console.log('[ADMIN GEO SESSIONS] ✓ Found', sessions.length, 'sessions (total:', totalCount + ')');

        res.json({
            message: 'Geo sessions retrieved successfully',
            sessions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN GEO SESSIONS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch geo sessions', error: error.message });
    }
});

// Delete a geo session
router.delete('/geo-sessions/:sessionId', checkAuth, async (req, res) => {
    console.log('[ADMIN] DELETE /geo-sessions/:sessionId -', req.params.sessionId);
    try {
        const { sessionId } = req.params;

        const session = await GeoSession.findByIdAndDelete(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Geo session not found' });
        }

        console.log('[ADMIN DELETE GEO SESSION] ✓ Geo session deleted:', sessionId);

        res.json({ message: 'Geo session deleted successfully' });
    } catch (error) {
        console.error('[ADMIN DELETE GEO SESSION] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to delete geo session', error: error.message });
    }
});

// Delete a geo activity
router.delete('/geo-activities/:activityId', checkAuth, async (req, res) => {
    console.log('[ADMIN] DELETE /geo-activities/:activityId -', req.params.activityId);
    try {
        const { activityId } = req.params;

        const activity = await GeoActivity.findByIdAndDelete(activityId);

        if (!activity) {
            return res.status(404).json({ message: 'Geo activity not found' });
        }

        console.log('[ADMIN DELETE GEO ACTIVITY] ✓ Geo activity deleted:', activityId);

        res.json({ message: 'Geo activity deleted successfully' });
    } catch (error) {
        console.error('[ADMIN DELETE GEO ACTIVITY] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to delete geo activity', error: error.message });
    }
});

// ============= FOOD LOG ENDPOINTS =============
// CRITICAL: /foodlogs/stats MUST come BEFORE /foodlogs and /foodlogs/:foodLogId

// Get food log statistics
router.get('/foodlogs/stats', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /foodlogs/stats');
    try {
        const totalFoodLogs = await FoodLog.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        
        // Get logs from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentLogs = await FoodLog.countDocuments({
            analyzedAt: { $gte: sevenDaysAgo }
        });

        // Get most active users
        const topUsers = await FoodLog.aggregate([
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    logCount: '$count'
                }
            }
        ]);

        // Get most logged foods
        const topFoods = await FoodLog.aggregate([
            {
                $group: {
                    _id: '$foodName',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    foodName: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        console.log('[ADMIN FOODLOG STATS] ✓ Stats retrieved');

        res.json({
            totalFoodLogs,
            totalUsers,
            recentLogs,
            averageLogsPerUser: totalUsers > 0 ? (totalFoodLogs / totalUsers).toFixed(2) : '0',
            topUsers,
            topFoods
        });
    } catch (error) {
        console.error('[ADMIN FOODLOG STATS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch food log statistics', error: error.message });
    }
});

// Get all food logs
router.get('/foodlogs', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /foodlogs - Query:', req.query);
    try {
        const { 
            page = 1, 
            limit = 20, 
            startDate, 
            endDate,
            searchQuery,
            userId,
            sortBy = 'analyzedAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Filter by specific user if provided
        if (userId) {
            query.userId = userId;
        }

        // Date range filter
        if (startDate || endDate) {
            query.analyzedAt = {};
            if (startDate) query.analyzedAt.$gte = new Date(startDate);
            if (endDate) query.analyzedAt.$lte = new Date(endDate);
        }

        // Search filter
        if (searchQuery) {
            query.$or = [
                { foodName: { $regex: searchQuery, $options: 'i' } },
                { dishName: { $regex: searchQuery, $options: 'i' } },
                { 'brandedProduct.brandName': { $regex: searchQuery, $options: 'i' } },
                { 'brandedProduct.productName': { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[ADMIN FOODLOGS] Query:', JSON.stringify(query));

        const foodLogs = await FoodLog.find(query)
            .populate('userId', 'username email profilePicture')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await FoodLog.countDocuments(query);

        console.log('[ADMIN FOODLOGS] ✓ Found', foodLogs.length, 'food logs (total:', totalCount + ')');

        res.json({
            message: 'Food logs retrieved successfully',
            foodLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN FOODLOGS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch food logs', error: error.message });
    }
});

// Delete a food log
router.delete('/foodlogs/:foodLogId', checkAuth, async (req, res) => {
    console.log('[ADMIN] DELETE /foodlogs/:foodLogId -', req.params.foodLogId);
    try {
        const { foodLogId } = req.params;

        const foodLog = await FoodLog.findByIdAndDelete(foodLogId);

        if (!foodLog) {
            return res.status(404).json({ message: 'Food log not found' });
        }

        console.log('[ADMIN DELETE FOODLOG] ✓ Food log deleted:', foodLogId);

        res.json({ message: 'Food log deleted successfully' });
    } catch (error) {
        console.error('[ADMIN DELETE FOODLOG] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to delete food log', error: error.message });
    }
});

// ============= PROGRAM ENDPOINTS =============
const Program = require('../models/programModel');

// Get program statistics
router.get('/programs/stats', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /programs/stats');
    try {
        const totalPrograms = await Program.countDocuments();
        
        // Get unique program creators
        const programCreators = await Program.distinct('user_id');
        const totalCreators = programCreators.length;
        
        // Get programs from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPrograms = await Program.countDocuments({
            created_at: { $gte: sevenDaysAgo }
        });

        // Get top program creators
        const topCreators = await Program.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    programCount: { $sum: 1 }
                }
            },
            {
                $sort: { programCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    programCount: 1
                }
            }
        ]);

        // Get average workouts and activities per program
        const programStats = await Program.aggregate([
            {
                $project: {
                    workoutCount: { $size: '$workouts' },
                    activityCount: { $size: '$geo_activities' }
                }
            },
            {
                $group: {
                    _id: null,
                    avgWorkouts: { $avg: '$workoutCount' },
                    avgActivities: { $avg: '$activityCount' }
                }
            }
        ]);

        console.log('[ADMIN PROGRAM STATS] ✓ Stats retrieved');

        res.json({
            totalPrograms,
            totalCreators,
            recentPrograms,
            averageProgramsPerCreator: totalCreators > 0 ? (totalPrograms / totalCreators).toFixed(2) : '0',
            topCreators,
            avgWorkoutsPerProgram: programStats[0]?.avgWorkouts?.toFixed(2) || '0',
            avgActivitiesPerProgram: programStats[0]?.avgActivities?.toFixed(2) || '0'
        });
    } catch (error) {
        console.error('[ADMIN PROGRAM STATS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch program statistics', error: error.message });
    }
});

// Get all programs
router.get('/programs', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /programs - Query:', req.query);
    try {
        const { 
            page = 1, 
            limit = 20, 
            userId,
            searchQuery,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Filter by specific user if provided
        if (userId) {
            query.user_id = userId;
        }

        // Search filter
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[ADMIN PROGRAMS] Query:', JSON.stringify(query));

        const programs = await Program.find(query)
            .populate('user_id', 'username email profilePicture')
            .populate('workouts.workout_id', 'name type category')
            .populate('geo_activities.activity_id', 'name description')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Program.countDocuments(query);

        console.log('[ADMIN PROGRAMS] ✓ Found', programs.length, 'programs (total:', totalCount + ')');

        res.json({
            message: 'Programs retrieved successfully',
            programs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN PROGRAMS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch programs', error: error.message });
    }
});

// Create a new program
router.post('/programs', checkAuth, async (req, res) => {
    console.log('[ADMIN] POST /programs');
    try {
        const {
            user_id,
            group_id,
            name,
            description,
            workouts,
            geo_activities
        } = req.body;

        if (!user_id || !name) {
            return res.status(400).json({ message: 'User ID and name are required' });
        }

        const program = new Program({
            user_id,
            group_id,
            name,
            description,
            workouts: workouts || [],
            geo_activities: geo_activities || []
        });

        await program.save();

        // Populate the program before returning
        const populatedProgram = await Program.findById(program._id)
            .populate('user_id', 'username email profilePicture')
            .populate('workouts.workout_id', 'name type category')
            .populate('geo_activities.activity_id', 'name description');

        console.log('[ADMIN CREATE PROGRAM] ✓ Program created:', program._id);

        res.status(201).json({
            message: 'Program created successfully',
            program: populatedProgram
        });
    } catch (error) {
        console.error('[ADMIN CREATE PROGRAM] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to create program', error: error.message });
    }
});

// Update a program
router.put('/programs/:programId', checkAuth, async (req, res) => {
    console.log('[ADMIN] PUT /programs/:programId -', req.params.programId);
    try {
        const { programId } = req.params;
        const updateData = req.body;

        const program = await Program.findByIdAndUpdate(
            programId,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('user_id', 'username email profilePicture')
        .populate('workouts.workout_id', 'name type category')
        .populate('geo_activities.activity_id', 'name description');

        if (!program) {
            return res.status(404).json({ message: 'Program not found' });
        }

        console.log('[ADMIN UPDATE PROGRAM] ✓ Program updated:', programId);

        res.json({
            message: 'Program updated successfully',
            program
        });
    } catch (error) {
        console.error('[ADMIN UPDATE PROGRAM] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to update program', error: error.message });
    }
});

// Delete a program
router.delete('/programs/:programId', checkAuth, async (req, res) => {
    console.log('[ADMIN] DELETE /programs/:programId -', req.params.programId);
    try {
        const { programId } = req.params;

        const program = await Program.findByIdAndDelete(programId);

        if (!program) {
            return res.status(404).json({ message: 'Program not found' });
        }

        console.log('[ADMIN DELETE PROGRAM] ✓ Program deleted:', programId);

        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('[ADMIN DELETE PROGRAM] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to delete program', error: error.message });
    }
});

// ============= WORKOUT ENDPOINTS =============
// Create a new workout
const upload = require('../middleware/multer');
const { uploadWorkoutAnimation } = require('../utils/cloudinary');

router.post('/workouts', checkAuth, upload.single('animation'), async (req, res) => {
    console.log('[ADMIN] POST /workouts - Creating new workout');
    try {
        const { category, type, name, description, equipment_needed } = req.body;
        
        console.log('[ADMIN CREATE WORKOUT] Body:', { category, type, name, description, equipment_needed });
        console.log('[ADMIN CREATE WORKOUT] File:', req.file ? 'Present' : 'None');

        if (!category || !type || !name) {
            return res.status(400).json({ message: 'Category, type, and name are required' });
        }

        let animationUrl = '';

        // Upload animation if provided
        if (req.file) {
            console.log('[ADMIN CREATE WORKOUT] Uploading animation...');
            const uploadResult = await uploadWorkoutAnimation(req.file.buffer);
            animationUrl = uploadResult.secure_url;
            console.log('[ADMIN CREATE WORKOUT] Animation uploaded:', animationUrl);
        }

        const Workout = require('../models/workoutModel');
        const newWorkout = new Workout({
            category,
            type,
            name,
            description: description || '',
            equipment_needed: equipment_needed || '',
            animation_url: animationUrl,
        });

        const savedWorkout = await newWorkout.save();
        console.log('[ADMIN CREATE WORKOUT] ✓ Workout created:', savedWorkout._id);

        res.status(201).json({
            message: 'Workout created successfully',
            workout: savedWorkout
        });
    } catch (error) {
        console.error('[ADMIN CREATE WORKOUT] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to create workout', error: error.message });
    }
});

// Get workout statistics
router.get('/workouts/stats', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /workouts/stats');
    try {
        const totalWorkouts = await require('../models/workoutModel').countDocuments();
        const bodyweightWorkouts = await require('../models/workoutModel').countDocuments({ category: 'bodyweight' });
        const equipmentWorkouts = await require('../models/workoutModel').countDocuments({ category: 'equipment' });
        
        // Get workouts by type
        const workoutsByType = await require('../models/workoutModel').aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $project: {
                    type: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get workouts by category
        const workoutsByCategory = await require('../models/workoutModel').aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        console.log('[ADMIN WORKOUT STATS] ✓ Stats retrieved');

        res.json({
            totalWorkouts,
            bodyweightWorkouts,
            equipmentWorkouts,
            workoutsByType,
            workoutsByCategory
        });
    } catch (error) {
        console.error('[ADMIN WORKOUT STATS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch workout statistics', error: error.message });
    }
});

// Get all workouts
router.get('/workouts', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /workouts - Query:', req.query);
    try {
        const { 
            page = 1, 
            limit = 20, 
            category,
            type,
            searchQuery,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Filter by category if provided
        if (category) {
            query.category = category;
        }

        // Filter by type if provided
        if (type) {
            query.type = type;
        }

        // Search filter
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { equipment_needed: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[ADMIN WORKOUTS] Query:', JSON.stringify(query));

        const Workout = require('../models/workoutModel');
        const workouts = await Workout.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Workout.countDocuments(query);

        console.log('[ADMIN WORKOUTS] ✓ Found', workouts.length, 'workouts (total:', totalCount + ')');

        res.json({
            message: 'Workouts retrieved successfully',
            workouts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN WORKOUTS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch workouts', error: error.message });
    }
});

// Get a single workout by ID
router.get('/workouts/:workoutId', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /workouts/:workoutId -', req.params.workoutId);
    try {
        const { workoutId } = req.params;

        const Workout = require('../models/workoutModel');
        const workout = await Workout.findById(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        console.log('[ADMIN GET WORKOUT] ✓ Workout found:', workoutId);

        res.json({
            message: 'Workout retrieved successfully',
            workout
        });
    } catch (error) {
        console.error('[ADMIN GET WORKOUT] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch workout', error: error.message });
    }
});

// Update a workout
router.patch('/workouts/:workoutId', checkAuth, upload.single('animation'), async (req, res) => {
    console.log('[ADMIN] PATCH /workouts/:workoutId -', req.params.workoutId);
    try {
        const { workoutId } = req.params;
        const { category, type, name, description, equipment_needed } = req.body;

        console.log('[ADMIN UPDATE WORKOUT] Body:', { category, type, name, description, equipment_needed });
        console.log('[ADMIN UPDATE WORKOUT] File:', req.file ? 'Present' : 'None');

        const Workout = require('../models/workoutModel');
        const workout = await Workout.findById(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Upload new animation if provided
        if (req.file) {
            console.log('[ADMIN UPDATE WORKOUT] Uploading new animation...');
            const uploadResult = await uploadWorkoutAnimation(req.file.buffer);
            workout.animation_url = uploadResult.secure_url;
            console.log('[ADMIN UPDATE WORKOUT] Animation uploaded:', workout.animation_url);
        }

        // Update fields
        if (category !== undefined) workout.category = category;
        if (type !== undefined) workout.type = type;
        if (name !== undefined) workout.name = name;
        if (description !== undefined) workout.description = description;
        if (equipment_needed !== undefined) workout.equipment_needed = equipment_needed;

        const updatedWorkout = await workout.save();
        console.log('[ADMIN UPDATE WORKOUT] ✓ Workout updated:', workoutId);

        res.json({
            message: 'Workout updated successfully',
            workout: updatedWorkout
        });
    } catch (error) {
        console.error('[ADMIN UPDATE WORKOUT] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to update workout', error: error.message });
    }
});

// Delete a workout
router.delete('/workouts/:workoutId', checkAuth, async (req, res) => {
    console.log('[ADMIN] DELETE /workouts/:workoutId -', req.params.workoutId);
    try {
        const { workoutId } = req.params;

        const Workout = require('../models/workoutModel');
        const workout = await Workout.findByIdAndDelete(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        console.log('[ADMIN DELETE WORKOUT] ✓ Workout deleted:', workoutId);

        res.json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('[ADMIN DELETE WORKOUT] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to delete workout', error: error.message });
    }
});

// ============= ACHIEVEMENT ENDPOINTS =============
const Achievement = require('../models/achievementModel');
const UserAchievement = require('../models/userAchievementModel');

// Get achievement statistics
router.get('/achievements/stats', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /achievements/stats');
    try {
        const totalAchievements = await Achievement.countDocuments();
        const activeAchievements = await Achievement.countDocuments({ is_active: true });
        const totalUserAchievements = await UserAchievement.countDocuments();
        const completedAchievements = await UserAchievement.countDocuments({ completed: true });
        
        // Get achievements by category
        const achievementsByCategory = await Achievement.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get achievements by tier
        const achievementsByTier = await Achievement.aggregate([
            {
                $group: {
                    _id: '$tier',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    tier: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Get top achievers
        const topAchievers = await UserAchievement.aggregate([
            {
                $match: { completed: true }
            },
            {
                $group: {
                    _id: '$user_id',
                    achievementCount: { $sum: 1 }
                }
            },
            {
                $sort: { achievementCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    achievementCount: 1
                }
            }
        ]);

        // Get most earned achievements
        const mostEarnedAchievements = await UserAchievement.aggregate([
            {
                $match: { completed: true }
            },
            {
                $group: {
                    _id: '$achievement_id',
                    earnedCount: { $sum: 1 }
                }
            },
            {
                $sort: { earnedCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'achievements',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'achievement'
                }
            },
            {
                $unwind: '$achievement'
            },
            {
                $project: {
                    achievementId: '$_id',
                    name: '$achievement.name',
                    category: '$achievement.category',
                    tier: '$achievement.tier',
                    earnedCount: 1
                }
            }
        ]);

        console.log('[ADMIN ACHIEVEMENT STATS] ✓ Stats retrieved');

        res.json({
            totalAchievements,
            activeAchievements,
            totalUserAchievements,
            completedAchievements,
            completionRate: totalUserAchievements > 0 ? ((completedAchievements / totalUserAchievements) * 100).toFixed(2) + '%' : '0%',
            achievementsByCategory,
            achievementsByTier,
            topAchievers,
            mostEarnedAchievements
        });
    } catch (error) {
        console.error('[ADMIN ACHIEVEMENT STATS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch achievement statistics', error: error.message });
    }
});

// Get all achievements
router.get('/achievements', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /achievements - Query:', req.query);
    try {
        const { 
            page = 1, 
            limit = 20, 
            category,
            tier,
            isActive,
            searchQuery,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Filter by category if provided
        if (category) {
            query.category = category;
        }

        // Filter by tier if provided
        if (tier) {
            query.tier = tier;
        }

        // Filter by active status if provided
        if (isActive !== undefined) {
            query.is_active = isActive === 'true';
        }

        // Search filter
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        console.log('[ADMIN ACHIEVEMENTS] Query:', JSON.stringify(query));

        const achievements = await Achievement.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Achievement.countDocuments(query);

        // For each achievement, get the count of users who earned it
        const achievementsWithStats = await Promise.all(achievements.map(async (achievement) => {
            const earnedCount = await UserAchievement.countDocuments({ 
                achievement_id: achievement._id, 
                completed: true 
            });
            return {
                ...achievement.toObject(),
                earnedCount
            };
        }));

        console.log('[ADMIN ACHIEVEMENTS] ✓ Found', achievements.length, 'achievements (total:', totalCount + ')');

        res.json({
            message: 'Achievements retrieved successfully',
            achievements: achievementsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN ACHIEVEMENTS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch achievements', error: error.message });
    }
});

// Create a new achievement
router.post('/achievements', checkAuth, async (req, res) => {
    console.log('[ADMIN] POST /achievements');
    try {
        const {
            name,
            description,
            category,
            icon,
            badge_image,
            criteria,
            points,
            tier,
            is_active
        } = req.body;

        if (!name || !description || !category || !criteria) {
            return res.status(400).json({ message: 'Name, description, category, and criteria are required' });
        }

        const achievement = new Achievement({
            name,
            description,
            category,
            icon,
            badge_image,
            criteria,
            points,
            tier,
            is_active
        });

        await achievement.save();

        console.log('[ADMIN CREATE ACHIEVEMENT] ✓ Achievement created:', achievement._id);

        res.status(201).json({
            message: 'Achievement created successfully',
            achievement
        });
    } catch (error) {
        console.error('[ADMIN CREATE ACHIEVEMENT] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to create achievement', error: error.message });
    }
});

// Update an achievement
router.put('/achievements/:achievementId', checkAuth, async (req, res) => {
    console.log('[ADMIN] PUT /achievements/:achievementId -', req.params.achievementId);
    try {
        const { achievementId } = req.params;
        const updateData = req.body;

        const achievement = await Achievement.findByIdAndUpdate(
            achievementId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        console.log('[ADMIN UPDATE ACHIEVEMENT] ✓ Achievement updated:', achievementId);

        res.json({
            message: 'Achievement updated successfully',
            achievement
        });
    } catch (error) {
        console.error('[ADMIN UPDATE ACHIEVEMENT] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to update achievement', error: error.message });
    }
});

// Delete an achievement
router.delete('/achievements/:achievementId', checkAuth, async (req, res) => {
    console.log('[ADMIN] DELETE /achievements/:achievementId -', req.params.achievementId);
    try {
        const { achievementId } = req.params;

        const achievement = await Achievement.findByIdAndDelete(achievementId);

        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        // Also delete all user achievements for this achievement
        await UserAchievement.deleteMany({ achievement_id: achievementId });

        console.log('[ADMIN DELETE ACHIEVEMENT] ✓ Achievement deleted:', achievementId);

        res.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error('[ADMIN DELETE ACHIEVEMENT] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to delete achievement', error: error.message });
    }
});

// Get user achievements (all users)
router.get('/user-achievements', checkAuth, async (req, res) => {
    console.log('[ADMIN] GET /user-achievements - Query:', req.query);
    try {
        const { 
            page = 1, 
            limit = 20, 
            userId,
            achievementId,
            completed,
            sortBy = 'updated_at',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        if (userId) query.user_id = userId;
        if (achievementId) query.achievement_id = achievementId;
        if (completed !== undefined) query.completed = completed === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const userAchievements = await UserAchievement.find(query)
            .populate('user_id', 'username email profilePicture')
            .populate('achievement_id')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await UserAchievement.countDocuments(query);

        console.log('[ADMIN USER ACHIEVEMENTS] ✓ Found', userAchievements.length, 'user achievements (total:', totalCount + ')');

        res.json({
            message: 'User achievements retrieved successfully',
            userAchievements,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN USER ACHIEVEMENTS] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch user achievements', error: error.message });
    }
});

// ============= COMPREHENSIVE DASHBOARD CATEGORIES =============
router.get('/dashboard-categories', checkAuth, async (req, res) => {
    console.log('[ADMIN DASHBOARD CATEGORIES] Route handler hit!');
    try {
        // ---- 1. Users by Age Bracket ----
        const usersByAgeBracket = await User.aggregate([
            { $match: { role: 'user', age: { $exists: true, $ne: null } } },
            {
                $bucket: {
                    groupBy: '$age',
                    boundaries: [0, 18, 25, 35, 45, 55, 65, 120],
                    default: 'Unknown',
                    output: { count: { $sum: 1 } }
                }
            },
            {
                $project: {
                    _id: 0,
                    bracket: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 0] }, then: 'Under 18' },
                                { case: { $eq: ['$_id', 18] }, then: '18-24' },
                                { case: { $eq: ['$_id', 25] }, then: '25-34' },
                                { case: { $eq: ['$_id', 35] }, then: '35-44' },
                                { case: { $eq: ['$_id', 45] }, then: '45-54' },
                                { case: { $eq: ['$_id', 55] }, then: '55-64' },
                                { case: { $eq: ['$_id', 65] }, then: '65+' },
                            ],
                            default: 'Unknown'
                        }
                    },
                    count: 1
                }
            },
            { $sort: { bracket: 1 } }
        ]);

        // ---- 2. Users by Gender ----
        const usersByGender = await User.aggregate([
            { $match: { role: 'user' } },
            {
                $group: {
                    _id: { $ifNull: ['$gender', 'unspecified'] },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    gender: '$_id',
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ---- 3. Most Predicted Diseases ----
        const mostPredictedDiseases = await User.aggregate([
            { $match: { role: 'user', 'lastPrediction.disease': { $exists: true, $ne: null } } },
            { $unwind: '$lastPrediction.disease' },
            {
                $group: {
                    _id: '$lastPrediction.disease',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 15 },
            {
                $project: {
                    _id: 0,
                    disease: '$_id',
                    count: 1
                }
            }
        ]);

        // ---- 4. Most Popular Foods (from food logs) ----
        const mostPopularFoods = await FoodLog.aggregate([
            {
                $group: {
                    _id: '$foodName',
                    count: { $sum: 1 },
                    avgCalories: { $avg: '$calories' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 15 },
            {
                $project: {
                    _id: 0,
                    foodName: '$_id',
                    count: 1,
                    avgCalories: { $round: ['$avgCalories', 0] }
                }
            }
        ]);

        // ---- 5. Most Popular Geo Activities (from sessions) ----
        const mostPopularActivities = await GeoSession.aggregate([
            {
                $group: {
                    _id: '$activity_type',
                    sessionCount: { $sum: 1 },
                    totalDistance: { $sum: '$distance_km' },
                    totalCalories: { $sum: '$calories_burned' },
                    avgDistance: { $avg: '$distance_km' }
                }
            },
            { $sort: { sessionCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'geoactivities',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'activity'
                }
            },
            { $unwind: { path: '$activity', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    activityName: { $ifNull: ['$activity.name', 'Unknown'] },
                    activityType: { $ifNull: ['$activity.type', 'Unknown'] },
                    sessionCount: 1,
                    totalDistance: { $round: ['$totalDistance', 2] },
                    totalCalories: { $round: ['$totalCalories', 0] },
                    avgDistance: { $round: ['$avgDistance', 2] }
                }
            }
        ]);

        // ---- 6. Top Users by kcal Burned (from geo sessions) ----
        const mostKcalBurned = await GeoSession.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    totalCaloriesBurned: { $sum: '$calories_burned' },
                    totalSessions: { $sum: 1 },
                    totalDistance: { $sum: '$distance_km' }
                }
            },
            { $sort: { totalCaloriesBurned: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    profilePicture: '$user.profilePicture',
                    totalCaloriesBurned: { $round: ['$totalCaloriesBurned', 0] },
                    totalSessions: 1,
                    totalDistance: { $round: ['$totalDistance', 2] }
                }
            }
        ]);

        // ---- 7. Top Users by kcal Consumed (from food logs) ----
        const mostKcalConsumed = await FoodLog.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalCaloriesConsumed: { $sum: '$calories' },
                    totalLogs: { $sum: 1 },
                    avgCaloriesPerMeal: { $avg: '$calories' }
                }
            },
            { $sort: { totalCaloriesConsumed: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    username: '$user.username',
                    email: '$user.email',
                    profilePicture: '$user.profilePicture',
                    totalCaloriesConsumed: { $round: ['$totalCaloriesConsumed', 0] },
                    totalLogs: 1,
                    avgCaloriesPerMeal: { $round: ['$avgCaloriesPerMeal', 0] }
                }
            }
        ]);

        // ---- 8. Most Daily Water Intake (from user profile) ----
        const mostDailyWaterIntake = await User.aggregate([
            { $match: { role: 'user', 'dietaryProfile.dailyWaterIntake': { $exists: true, $gt: 0 } } },
            { $sort: { 'dietaryProfile.dailyWaterIntake': -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    username: 1,
                    email: 1,
                    profilePicture: 1,
                    dailyWaterIntake: '$dietaryProfile.dailyWaterIntake'
                }
            }
        ]);

        // ---- 9. Water Intake Distribution (from health checkups) ----
        const waterIntakeDistribution = await HealthCheckup.aggregate([
            { $match: { 'water.amount': { $exists: true, $gt: 0 } } },
            {
                $bucket: {
                    groupBy: '$water.amount',
                    boundaries: [0, 500, 1000, 1500, 2000, 2500, 3000, 5000, 10000],
                    default: '10000+',
                    output: { count: { $sum: 1 } }
                }
            },
            {
                $project: {
                    _id: 0,
                    range: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 0] }, then: '0-500ml' },
                                { case: { $eq: ['$_id', 500] }, then: '500-1000ml' },
                                { case: { $eq: ['$_id', 1000] }, then: '1000-1500ml' },
                                { case: { $eq: ['$_id', 1500] }, then: '1500-2000ml' },
                                { case: { $eq: ['$_id', 2000] }, then: '2000-2500ml' },
                                { case: { $eq: ['$_id', 2500] }, then: '2500-3000ml' },
                                { case: { $eq: ['$_id', 3000] }, then: '3000-5000ml' },
                                { case: { $eq: ['$_id', 5000] }, then: '5000-10000ml' },
                            ],
                            default: '10000+ml'
                        }
                    },
                    count: 1
                }
            }
        ]);

        // ---- 10. Users by BMI Category ----
        const usersByBMI = await User.aggregate([
            { $match: { role: 'user', 'physicalMetrics.bmi': { $exists: true, $gt: 0 } } },
            {
                $bucket: {
                    groupBy: '$physicalMetrics.bmi',
                    boundaries: [0, 18.5, 25, 30, 35, 40, 100],
                    default: 'Unknown',
                    output: { count: { $sum: 1 } }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 0] }, then: 'Underweight (<18.5)' },
                                { case: { $eq: ['$_id', 18.5] }, then: 'Normal (18.5-24.9)' },
                                { case: { $eq: ['$_id', 25] }, then: 'Overweight (25-29.9)' },
                                { case: { $eq: ['$_id', 30] }, then: 'Obese I (30-34.9)' },
                                { case: { $eq: ['$_id', 35] }, then: 'Obese II (35-39.9)' },
                                { case: { $eq: ['$_id', 40] }, then: 'Obese III (40+)' },
                            ],
                            default: 'Unknown'
                        }
                    },
                    count: 1
                }
            }
        ]);

        // ---- 11. Users by Activity Level ----
        const usersByActivityLevel = await User.aggregate([
            { $match: { role: 'user', 'lifestyle.activityLevel': { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$lifestyle.activityLevel',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    activityLevel: '$_id',
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ---- 12. Users by Blood Type ----
        const usersByBloodType = await User.aggregate([
            { $match: { role: 'user', 'healthProfile.bloodType': { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$healthProfile.bloodType',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    bloodType: '$_id',
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ---- 13. Users by Stress Level ----
        const usersByStressLevel = await User.aggregate([
            { $match: { role: 'user', 'riskFactors.stressLevel': { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$riskFactors.stressLevel',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    stressLevel: '$_id',
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ---- 14. Average Sleep Hours Distribution ----
        const sleepDistribution = await User.aggregate([
            { $match: { role: 'user', 'lifestyle.sleepHours': { $exists: true, $gt: 0 } } },
            {
                $bucket: {
                    groupBy: '$lifestyle.sleepHours',
                    boundaries: [0, 4, 5, 6, 7, 8, 9, 10, 24],
                    default: 'Unknown',
                    output: { count: { $sum: 1 } }
                }
            },
            {
                $project: {
                    _id: 0,
                    range: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 0] }, then: '<4 hrs' },
                                { case: { $eq: ['$_id', 4] }, then: '4-5 hrs' },
                                { case: { $eq: ['$_id', 5] }, then: '5-6 hrs' },
                                { case: { $eq: ['$_id', 6] }, then: '6-7 hrs' },
                                { case: { $eq: ['$_id', 7] }, then: '7-8 hrs' },
                                { case: { $eq: ['$_id', 8] }, then: '8-9 hrs' },
                                { case: { $eq: ['$_id', 9] }, then: '9-10 hrs' },
                                { case: { $eq: ['$_id', 10] }, then: '10+ hrs' },
                            ],
                            default: 'Unknown'
                        }
                    },
                    count: 1
                }
            }
        ]);

        // ---- 15. Most Common Health Conditions ----
        const mostCommonConditions = await User.aggregate([
            { $match: { role: 'user', 'healthProfile.currentConditions': { $exists: true, $ne: [] } } },
            { $unwind: '$healthProfile.currentConditions' },
            {
                $group: {
                    _id: '$healthProfile.currentConditions',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 15 },
            {
                $project: {
                    _id: 0,
                    condition: '$_id',
                    count: 1
                }
            }
        ]);

        // ---- 16. Most Common Family History ----
        const mostCommonFamilyHistory = await User.aggregate([
            { $match: { role: 'user', 'healthProfile.familyHistory': { $exists: true, $ne: [] } } },
            { $unwind: '$healthProfile.familyHistory' },
            {
                $group: {
                    _id: '$healthProfile.familyHistory',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 15 },
            {
                $project: {
                    _id: 0,
                    condition: '$_id',
                    count: 1
                }
            }
        ]);

        // ---- 17. Dietary Preferences Distribution ----
        const dietaryPreferences = await User.aggregate([
            { $match: { role: 'user', 'dietaryProfile.preferences': { $exists: true, $ne: [] } } },
            { $unwind: '$dietaryProfile.preferences' },
            {
                $group: {
                    _id: '$dietaryProfile.preferences',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            {
                $project: {
                    _id: 0,
                    preference: '$_id',
                    count: 1
                }
            }
        ]);

        // ---- 18. Pollution Exposure Distribution ----
        const pollutionExposure = await User.aggregate([
            { $match: { role: 'user', 'environmentalFactors.pollutionExposure': { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$environmentalFactors.pollutionExposure',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    level: '$_id',
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ---- 19. Occupation Type Distribution ----
        const occupationTypes = await User.aggregate([
            { $match: { role: 'user', 'environmentalFactors.occupationType': { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$environmentalFactors.occupationType',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: '$_id',
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ---- 20. Mood Distribution (from mood check-ins) ----
        const moodDistribution = await MoodCheckin.aggregate([
            {
                $group: {
                    _id: '$mood.label',
                    count: { $sum: 1 },
                    avgValue: { $avg: '$mood.value' }
                }
            },
            { $sort: { avgValue: 1 } },
            {
                $project: {
                    _id: 0,
                    mood: '$_id',
                    count: 1,
                    avgValue: { $round: ['$avgValue', 2] }
                }
            }
        ]);

        // ---- 21. Meal Frequency Distribution ----
        const mealFrequency = await User.aggregate([
            { $match: { role: 'user', 'dietaryProfile.mealFrequency': { $exists: true, $gt: 0 } } },
            {
                $group: {
                    _id: '$dietaryProfile.mealFrequency',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    mealsPerDay: '$_id',
                    count: 1
                }
            }
        ]);

        // ---- 22. Top Nutrients Consumed (averages from food logs) ----
        const avgNutrients = await FoodLog.aggregate([
            {
                $group: {
                    _id: null,
                    avgProtein: { $avg: '$nutrients.protein' },
                    avgCarbs: { $avg: '$nutrients.carbs' },
                    avgFat: { $avg: '$nutrients.fat' },
                    avgFiber: { $avg: '$nutrients.fiber' },
                    avgSugar: { $avg: '$nutrients.sugar' },
                    avgSodium: { $avg: '$nutrients.sodium' },
                    avgCholesterol: { $avg: '$nutrients.cholesterol' },
                    totalLogs: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    avgProtein: { $round: ['$avgProtein', 1] },
                    avgCarbs: { $round: ['$avgCarbs', 1] },
                    avgFat: { $round: ['$avgFat', 1] },
                    avgFiber: { $round: ['$avgFiber', 1] },
                    avgSugar: { $round: ['$avgSugar', 1] },
                    avgSodium: { $round: ['$avgSodium', 1] },
                    avgCholesterol: { $round: ['$avgCholesterol', 1] },
                    totalLogs: 1
                }
            }
        ]);

        // ---- 23. Addiction/Substance Distribution ----
        const addictionDistribution = await User.aggregate([
            { $match: { role: 'user', 'riskFactors.addictions': { $exists: true, $ne: [] } } },
            { $unwind: '$riskFactors.addictions' },
            {
                $group: {
                    _id: '$riskFactors.addictions.substance',
                    count: { $sum: 1 },
                    avgSeverity: {
                        $push: '$riskFactors.addictions.severity'
                    }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    substance: '$_id',
                    count: 1
                }
            }
        ]);

        console.log('[ADMIN DASHBOARD CATEGORIES] ✓ All categories retrieved successfully');

        res.json({
            usersByAgeBracket,
            usersByGender,
            mostPredictedDiseases,
            mostPopularFoods,
            mostPopularActivities,
            mostKcalBurned,
            mostKcalConsumed,
            mostDailyWaterIntake,
            waterIntakeDistribution,
            usersByBMI,
            usersByActivityLevel,
            usersByBloodType,
            usersByStressLevel,
            sleepDistribution,
            mostCommonConditions,
            mostCommonFamilyHistory,
            dietaryPreferences,
            pollutionExposure,
            occupationTypes,
            moodDistribution,
            mealFrequency,
            avgNutrients: avgNutrients[0] || null,
            addictionDistribution
        });
    } catch (error) {
        console.error('[ADMIN DASHBOARD CATEGORIES] ✗ Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch dashboard categories', error: error.message });
    }
});

// Catch-all route to see what's being requested
router.all('*', (req, res) => {
    console.log('[ADMIN] Unmatched route:', req.method, req.path);
    res.status(404).json({ message: 'Admin route not found', path: req.path });
});

module.exports = router;
