const {validateToken} = require('../utils/auth');

const extractToken = (req) => {
    const cookie = req.headers.cookie;
    if (!cookie) return null;

    const match = cookie.split(';').find(c => c.trim().startsWith('quizzle_token='));
    if (!match) return null;

    return match.split('=')[1].trim();
};

const optionalAuth = (req, res, next) => {
    const token = extractToken(req);
    if (token) {
        req.user = validateToken(token);
        req.token = token;
    }
    next();
};

const requireAuth = (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({message: 'Authentication required.'});
    }

    const user = validateToken(token);
    if (!user) {
        return res.status(401).json({message: 'Session expired. Please sign in again.'});
    }

    req.user = user;
    req.token = token;
    next();
};

const requireAdmin = (req, res, next) => {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({message: 'Administrator rights required.'});
        }
        next();
    });
};

module.exports = {extractToken, optionalAuth, requireAuth, requireAdmin};
