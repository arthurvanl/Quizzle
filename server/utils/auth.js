const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dataFolder = path.join(process.cwd(), 'data');
const usersFile = path.join(dataFolder, 'users.json');

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const TOKEN_LENGTH = 48;
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const sessions = new Map();
const hostTickets = new Map();
const HOST_TICKET_EXPIRY = 60 * 1000;

const isApproved = (user) => !user.status || user.status === 'approved';

const hashPassword = (password) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
    const [salt, hash] = stored.split(':');
    const verify = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
};

const generateToken = () => crypto.randomBytes(TOKEN_LENGTH).toString('hex');

const readUsers = () => {
    try {
        if (!fs.existsSync(usersFile)) return {users: []};
        const data = fs.readFileSync(usersFile, 'utf8');
        const parsed = JSON.parse(data);
        delete parsed.sessions;
        return parsed;
    } catch {
        return {users: []};
    }
};

const writeUsers = (data) => {
    fs.writeFileSync(usersFile, JSON.stringify(data, null, 2), 'utf8');
};

const isSetupComplete = () => {
    const data = readUsers();
    return data.users.length > 0;
};

const createUser = (username, password, role = 'teacher', status = 'approved') => {
    const data = readUsers();

    if (data.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return {error: 'Username already exists.'};
    }

    const user = {
        id: crypto.randomUUID(),
        username,
        password: hashPassword(password),
        role,
        status,
        createdAt: new Date().toISOString()
    };

    data.users.push(user);
    writeUsers(data);

    return {user: {id: user.id, username: user.username, role: user.role}};
};

const login = (username, password) => {
    const data = readUsers();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) return {error: 'Invalid credentials.'};

    try {
        if (!verifyPassword(password, user.password)) {
            return {error: 'Invalid credentials.'};
        }
    } catch {
        return {error: 'Invalid credentials.'};
    }

    if (user.status === 'pending') return {error: 'Your account is awaiting approval by an administrator.'};
    if (user.status === 'denied') return {error: 'Your account request was denied.'};

    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY;

    for (const [t, s] of sessions) {
        if (s.expiresAt <= Date.now()) sessions.delete(t);
    }

    sessions.set(token, {userId: user.id, expiresAt});

    return {
        token,
        user: {id: user.id, username: user.username, role: user.role}
    };
};

const validateToken = (token) => {
    if (!token) return null;

    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
        if (session) sessions.delete(token);
        return null;
    }

    const data = readUsers();
    const user = data.users.find(u => u.id === session.userId);
    if (!user || !isApproved(user)) return null;

    return {id: user.id, username: user.username, role: user.role};
};

const logout = (token) => {
    sessions.delete(token);
};

const getUsers = () => {
    const data = readUsers();
    return data.users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        status: u.status || 'approved',
        createdAt: u.createdAt
    }));
};

const deleteUser = (userId) => {
    const data = readUsers();
    const idx = data.users.findIndex(u => u.id === userId);
    if (idx === -1) return {error: 'User not found.'};

    const user = data.users[idx];
    data.users.splice(idx, 1);
    for (const [t, s] of sessions) {
        if (s.userId === userId) sessions.delete(t);
    }
    writeUsers(data);

    return {success: true, username: user.username};
};

const updateUserRole = (userId, role) => {
    const data = readUsers();
    const user = data.users.find(u => u.id === userId);
    if (!user) return {error: 'User not found.'};

    user.role = role;
    writeUsers(data);

    return {user: {id: user.id, username: user.username, role: user.role}};
};

const updateUserStatus = (userId, status) => {
    const data = readUsers();
    const user = data.users.find(u => u.id === userId);
    if (!user) return {error: 'User not found.'};

    user.status = status;
    writeUsers(data);

    if (status !== 'approved') {
        for (const [t, s] of sessions) {
            if (s.userId === userId) sessions.delete(t);
        }
    }

    return {user: {id: user.id, username: user.username, role: user.role, status: user.status}};
};

const createHostTicket = (userId) => {
    const now = Date.now();
    for (const [t, entry] of hostTickets) {
        if (entry.expiresAt <= now) hostTickets.delete(t);
    }

    const ticket = generateToken();
    hostTickets.set(ticket, {userId, expiresAt: now + HOST_TICKET_EXPIRY});
    return ticket;
};

const consumeHostTicket = (ticket) => {
    if (typeof ticket !== 'string') return false;

    const entry = hostTickets.get(ticket);
    hostTickets.delete(ticket);
    return !!entry && entry.expiresAt > Date.now();
};

const changePassword = (userId, newPassword) => {
    const data = readUsers();
    const user = data.users.find(u => u.id === userId);
    if (!user) return {error: 'User not found.'};

    user.password = hashPassword(newPassword);
    writeUsers(data);

    return {success: true};
};

module.exports = {
    isSetupComplete,
    createUser,
    login,
    validateToken,
    logout,
    getUsers,
    deleteUser,
    updateUserRole,
    updateUserStatus,
    createHostTicket,
    consumeHostTicket,
    changePassword
};
