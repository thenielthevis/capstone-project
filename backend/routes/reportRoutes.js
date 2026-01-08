const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const reportController = require('../controllers/reportController');

console.log('[Report Routes] Loading report routes module...');

// ============= AUTH MIDDLEWARE =============
const checkAuth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No Authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[Report Auth] JWT Error:', error.message);
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

// Admin check middleware
const checkAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
};

// ============= USER ROUTES =============
// Create a new report (any authenticated user)
router.post('/', checkAuth, reportController.createReport);

// ============= ADMIN ROUTES =============
// Get all reports (admin only)
router.get('/', checkAuth, checkAdmin, reportController.getAllReports);

// Get report statistics (admin only)
router.get('/stats', checkAuth, checkAdmin, reportController.getReportStats);

// Get a single report by ID (admin only)
router.get('/:id', checkAuth, checkAdmin, reportController.getReportById);

// Update report status (admin only)
router.patch('/:id/status', checkAuth, checkAdmin, reportController.updateReportStatus);

// Take action on a report (admin only)
router.post('/:id/action', checkAuth, checkAdmin, reportController.takeAction);

// Delete a report (admin only)
router.delete('/:id', checkAuth, checkAdmin, reportController.deleteReport);

// Bulk update reports (admin only)
router.patch('/bulk/update', checkAuth, checkAdmin, reportController.bulkUpdateReports);

module.exports = router;
