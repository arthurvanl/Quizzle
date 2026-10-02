const rateLimit = require('express-rate-limit');
const app = require('express').Router();
const {isSetupComplete, createUser, login, validateToken, logout, createHostTicket} = require('../utils/auth');
const {extractToken, requireAuth} = require('../middleware/auth');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {message: 'Too many login attempts. Please try again later.'}
});

const setupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {message: 'Too many attempts. Please try again later.'}
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: {message: 'Too many account requests. Please try again later.'}
});

const validateCredentials = (username, password) => {
    if (!username || !password) return 'Username and password are required.';
    if (username.length < 3 || username.length > 32) return 'Username must be between 3 and 32 characters.';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return 'Username may only contain letters, numbers, dots, hyphens and underscores.';
    return null;
};

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setTokenCookie = (res, token) => {
    res.cookie('quizzle_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_MAX_AGE,
        path: '/'
    });
};

app.get('/setup-status', (req, res) => {
    res.json({setupComplete: isSetupComplete()});
});

app.post('/setup', setupLimiter, (req, res) => {
    if (isSetupComplete()) {
        return res.status(400).json({message: 'Setup has already been completed.'});
    }

    const {username, password} = req.body;

    const credentialsError = validateCredentials(username, password);
    if (credentialsError) {
        return res.status(400).json({message: credentialsError});
    }

    const result = createUser(username, password, 'admin');
    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    const loginResult = login(username, password);
    if (loginResult.error) {
        return res.status(500).json({message: 'Setup succeeded, but login failed.'});
    }

    setTokenCookie(res, loginResult.token);
    res.json({user: loginResult.user});
});

app.post('/register', registerLimiter, (req, res) => {
    if (!isSetupComplete()) {
        return res.status(400).json({message: 'Setup has not been completed yet.'});
    }

    const {username, password} = req.body;

    const credentialsError = validateCredentials(username, password);
    if (credentialsError) {
        return res.status(400).json({message: credentialsError});
    }

    const result = createUser(username, password, 'teacher', 'pending');
    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    res.json({success: true});
});

app.post('/host-ticket', requireAuth, (req, res) => {
    res.json({ticket: createHostTicket(req.user.id)});
});

app.post('/login', loginLimiter, (req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({message: 'Username and password are required.'});
    }

    const result = login(username, password);
    if (result.error) {
        return res.status(401).json({message: result.error});
    }

    setTokenCookie(res, result.token);
    res.json({user: result.user});
});

app.get('/me', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.json({authenticated: false});
    }

    const user = validateToken(token);
    if (!user) {
        return res.json({authenticated: false});
    }

    res.json({authenticated: true, user});
});

app.post('/logout', (req, res) => {
    const token = extractToken(req);
    if (token) {
        logout(token);
    }

    res.clearCookie('quizzle_token', {path: '/'});
    res.json({success: true});
});

module.exports = app;
