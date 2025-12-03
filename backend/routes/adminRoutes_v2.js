const express = require('express');
const User = require('../models/userModel');
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
            premiumUsers: 0,
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

// Catch-all route to see what's being requested
router.all('*', (req, res) => {
    console.log('[ADMIN] Unmatched route:', req.method, req.path);
    res.status(404).json({ message: 'Admin route not found', path: req.path });
});

module.exports = router;

