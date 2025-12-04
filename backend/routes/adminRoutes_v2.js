const express = require('express');
const User = require('../models/userModel');
const FoodLog = require('../models/foodLogModel');
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

// Get stats
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

// Create admin
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

// Search users - MUST come before /users/:userId to avoid treating 'search' as an ID
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

// ============= FOOD LOG ENDPOINTS =============
// IMPORTANT: Specific routes like /stats must come BEFORE generic routes like /:id

// Get food log statistics - MUST be before /foodlogs to avoid route conflicts
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

// Get all food logs - MUST be after /stats to avoid route conflicts
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

// Catch-all route to see what's being requested
router.all('*', (req, res) => {
    console.log('[ADMIN] Unmatched route:', req.method, req.path);
    res.status(404).json({ message: 'Admin route not found', path: req.path });
});

module.exports = router;

