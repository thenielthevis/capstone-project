// Middleware for admin using JWT authentication with admin role verification
const jwt = require('jsonwebtoken');

const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log("Token:", token);
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded:", decoded);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.log("JWT Error:", error.name, "-", error.message);
        return res.status(401).json({ message: error.message });
    }
};
module.exports = adminMiddleware;
