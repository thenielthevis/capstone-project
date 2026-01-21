const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        const clientIp = req.ip || req.connection.remoteAddress;

        console.log(`[AUTH] Request from ${clientIp} | Header: "${authHeader}"`);

        if (!token || token === authHeader) {
            console.error(`[AUTH] Malformed or missing Bearer token from ${clientIp}`);
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(`[AUTH] Token Verification Failed: ${error.message}`);
        // Log the token length to check for truncation
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '') || "";
        console.error(`[AUTH] Token Length: ${token.length}`);

        res.status(401).json({
            message: 'Invalid token',
            error: error.message
        });
    }
};

module.exports = auth;