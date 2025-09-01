const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const createAuthMiddleware = (jwtSecret, optional = false) => async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    // console.log('Auth Middleware: Received token:', token ? 'Exists' : 'None');

    if (!token) {
        if (optional) {
            // console.log('Auth Middleware: No token, optional mode. Proceeding.');
            return next();
        }
        // console.log('Auth Middleware: No token, not optional. Sending 401.');
        return res.status(401).json({ success: false, message: '인증되지 않았습니다. 토큰이 없습니다.' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        // console.log('Auth Middleware: Token decoded successfully:', decoded);
        const user = await userRepository.getUser(decoded.id);

        if (user) {
            req.user = user;
            // console.log('Auth Middleware: User found and attached to request.');
        } else if (!optional) {
            // If user not found and auth is not optional, deny access
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        next();
    } catch (error) {
        // console.error('Auth Middleware: Token verification failed:', error.message);
        if (optional) {
            // console.log('Auth Middleware: Token invalid, optional mode. Proceeding.');
            return next();
        }
        // console.log('Auth Middleware: Token invalid, not optional. Sending 401.');
        return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
};

module.exports = createAuthMiddleware;
