// Middleware for user using JWT authentication with user role verification
const jwt = require('jsonwebtoken');

const userMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log("Token:", token);
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded:", decoded);
        if (decoded.role !== 'user') {
            return res.status(403).json({ message: 'Access denied: User role required' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.log("JWT Error:", error.name, "-", error.message);
        return res.status(401).json({ message: error.message });
    }
};
module.exports = userMiddleware;
