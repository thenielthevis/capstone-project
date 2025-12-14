// Middleware for admin using JWT authentication with admin role verification
const jwt = require('jsonwebtoken');

const adminMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log("[Admin Middleware] Token received:", token ? `${token.substring(0, 20)}...` : 'None');
        
        if (!token) {
            console.log("[Admin Middleware] No token provided");
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("[Admin Middleware] Decoded token:", decoded);
        
        if (decoded.role !== 'admin') {
            console.log("[Admin Middleware] User role is not admin:", decoded.role);
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }
        
        req.user = decoded;
        console.log("[Admin Middleware] Admin verified, proceeding...");
        next();
    } catch (error) {
        console.error("[Admin Middleware] JWT Error:", error.name, "-", error.message);
        return res.status(401).json({ message: error.message });
    }
};

module.exports = adminMiddleware;
