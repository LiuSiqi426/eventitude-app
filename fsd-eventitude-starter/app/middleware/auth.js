// app/middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key';

export const authenticate = function(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        req.userId = decoded.userId; // 添加这行确保userId可用
        next();
    } catch (err) {
        res.status(400).json({
            status: 'error',
            message: 'Invalid token.'
        });
    }
};

export default { authenticate };