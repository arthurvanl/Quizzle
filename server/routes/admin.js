const app = require('express').Router();
const {requireAdmin} = require('../middleware/auth');
const {getUsers, createUser, deleteUser, updateUserRole, updateUserStatus, changePassword} = require('../utils/auth');
const fs = require('fs');
const path = require('path');
const {brandingFolder, dataFolder, quizzesFolder} = require('../utils/file');
const {createProvider} = require('../utils/ai');
const {decompressQuiz} = require('../utils/quiz');

const practiceQuizzesFolder = path.join(dataFolder, 'practice-quizzes');

const readJson = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
};

const summarizeQuiz = (quizPath) => {
    try {
        const quiz = decompressQuiz(fs.readFileSync(quizPath));
        return {title: quiz.title || 'Untitled', questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0};
    } catch {
        return {title: 'Unreadable quiz', questionCount: 0};
    }
};

const listQuizzes = () => {
    const quizzes = [];

    if (fs.existsSync(quizzesFolder)) {
        for (const file of fs.readdirSync(quizzesFolder)) {
            if (!file.endsWith('.quizzle')) continue;
            const id = file.slice(0, -'.quizzle'.length);
            const quizPath = path.join(quizzesFolder, file);
            const meta = readJson(path.join(quizzesFolder, `${id}.meta.json`)) || {};

            quizzes.push({
                id,
                type: 'live',
                ...summarizeQuiz(quizPath),
                created: meta.created || fs.statSync(quizPath).mtime.toISOString(),
                createdBy: meta.createdBy || null,
                createdByName: meta.createdByName || null
            });
        }
    }

    if (fs.existsSync(practiceQuizzesFolder)) {
        for (const code of fs.readdirSync(practiceQuizzesFolder)) {
            const quizPath = path.join(practiceQuizzesFolder, code, 'quiz.quizzle');
            if (!fs.existsSync(quizPath)) continue;
            const meta = readJson(path.join(practiceQuizzesFolder, code, 'meta.json')) || {};

            quizzes.push({
                id: code,
                type: 'practice',
                ...summarizeQuiz(quizPath),
                created: meta.created || fs.statSync(quizPath).mtime.toISOString(),
                createdBy: meta.createdBy || null,
                createdByName: meta.createdByName || null
            });
        }
    }

    return quizzes.sort((a, b) => new Date(b.created) - new Date(a.created));
};

app.post('/models', requireAdmin, async (req, res) => {
    const {provider, apiKey, baseUrl} = req.body;
    if (!provider) return res.status(400).json({message: 'Provider is required.'});

    const instance = createProvider({provider, apiKey, baseUrl});
    if (!instance) return res.status(400).json({message: 'Invalid provider.'});

    try {
        const models = await instance.listModels();
        res.json({models});
    } catch {
        res.json({models: []});
    }
});

app.get('/settings', requireAdmin, (req, res) => {
    const configPayload = JSON.parse(fs.readFileSync(path.join(brandingFolder, 'config.json'), 'utf8'));
    const brandingPayload = JSON.parse(fs.readFileSync(path.join(brandingFolder, 'branding.json'), 'utf8'));

    res.json({
        config: {
            ai: configPayload.ai || {provider: '', apiKey: '', model: '', baseUrl: ''},
            media: configPayload.media || {unsplashAccessKey: '', giphyApiKey: ''}
        },
        branding: brandingPayload
    });
});

app.put('/settings', requireAdmin, (req, res) => {
    const {config, branding} = req.body;

    if (config) {
        const configPath = path.join(brandingFolder, 'config.json');
        const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (config.ai) {
            existing.ai = {
                provider: config.ai.provider || '',
                apiKey: config.ai.apiKey || '',
                model: config.ai.model || '',
                baseUrl: config.ai.baseUrl || ''
            };
        }

        if (config.media) {
            existing.media = {
                unsplashAccessKey: config.media.unsplashAccessKey || '',
                giphyApiKey: config.media.giphyApiKey || ''
            };
        }

        delete existing.password;

        fs.writeFileSync(configPath, JSON.stringify(existing, null, 2), 'utf8');

        delete require.cache[require.resolve(configPath)];
    }

    if (branding) {
        const brandingPath = path.join(brandingFolder, 'branding.json');
        const existing = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));

        for (const key of ['name', 'color', 'imprint', 'privacy']) {
            if (branding[key] !== undefined) existing[key] = branding[key];
        }

        fs.writeFileSync(brandingPath, JSON.stringify(existing, null, 2), 'utf8');
        delete require.cache[require.resolve(brandingPath)];
    }

    res.json({success: true});
});

app.put('/branding/:type', requireAdmin, (req, res) => {
    const {type} = req.params;

    if (type !== 'logo' && type !== 'title') {
        return res.status(400).json({message: 'Invalid image type.'});
    }

    const {image} = req.body;

    if (!image || typeof image !== 'string') {
        return res.status(400).json({message: 'No image provided.'});
    }

    const match = image.match(/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,(.+)$/);
    if (!match) {
        return res.status(400).json({message: 'Invalid image format. Allowed: PNG, JPEG, GIF, WebP, SVG.'});
    }

    const buffer = Buffer.from(match[2], 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({message: 'Image is too large (max 5 MB).'});
    }

    const filePath = path.join(brandingFolder, `${type}.png`);
    fs.writeFileSync(filePath, buffer);

    res.json({success: true});
});

app.delete('/branding/:type', requireAdmin, (req, res) => {
    const {type} = req.params;

    if (type !== 'logo' && type !== 'title') {
        return res.status(400).json({message: 'Invalid image type.'});
    }

    const defaultPath = path.join(process.cwd(), 'content', `${type}.png`);
    const targetPath = path.join(brandingFolder, `${type}.png`);

    if (!fs.existsSync(defaultPath)) {
        return res.status(404).json({message: 'Default image not found.'});
    }

    fs.copyFileSync(defaultPath, targetPath);
    res.json({success: true});
});

app.get('/quizzes', requireAdmin, (req, res) => {
    const usernames = new Map(getUsers().map(u => [u.id, u.username]));

    const quizzes = listQuizzes().map(quiz => ({
        ...quiz,
        createdByName: usernames.get(quiz.createdBy) || quiz.createdByName
    }));

    res.json({quizzes});
});

const resolveQuizPaths = (type, id) => {
    if (type === 'live' && /^[a-z0-9]+$/i.test(id)) {
        return {quizPath: path.join(quizzesFolder, `${id}.quizzle`), remove: [path.join(quizzesFolder, `${id}.quizzle`), path.join(quizzesFolder, `${id}.meta.json`)]};
    }
    if (type === 'practice' && /^[A-Z]{4}$/i.test(id)) {
        const quizDir = path.join(practiceQuizzesFolder, id.toUpperCase());
        return {quizPath: path.join(quizDir, 'quiz.quizzle'), remove: [quizDir]};
    }
    return null;
};

app.get('/quizzes/:type/:id', requireAdmin, (req, res) => {
    const paths = resolveQuizPaths(req.params.type, req.params.id);
    if (!paths || !fs.existsSync(paths.quizPath)) return res.status(404).json({message: 'Quiz not found.'});

    try {
        res.json({quiz: decompressQuiz(fs.readFileSync(paths.quizPath))});
    } catch {
        res.status(500).json({message: 'Quiz could not be read.'});
    }
});

app.delete('/quizzes/:type/:id', requireAdmin, (req, res) => {
    const paths = resolveQuizPaths(req.params.type, req.params.id);
    if (!paths || !fs.existsSync(paths.quizPath)) return res.status(404).json({message: 'Quiz not found.'});

    for (const target of paths.remove) {
        fs.rmSync(target, {recursive: true, force: true});
    }

    res.json({success: true});
});

app.get('/users', requireAdmin, (req, res) => {
    res.json({users: getUsers()});
});

app.post('/users', requireAdmin, (req, res) => {
    const {username, password, role} = req.body;

    if (!username || !password) {
        return res.status(400).json({message: 'Username and password are required.'});
    }

    if (username.length < 3 || username.length > 32) {
        return res.status(400).json({message: 'Username must be between 3 and 32 characters.'});
    }

    if (password.length < 6) {
        return res.status(400).json({message: 'Password must be at least 6 characters long.'});
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        return res.status(400).json({message: 'Username may only contain letters, numbers, dots, hyphens and underscores.'});
    }

    if (role && !['admin', 'teacher'].includes(role)) {
        return res.status(400).json({message: 'Invalid role.'});
    }

    const result = createUser(username, password, role || 'teacher');
    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    res.json(result);
});

app.delete('/users/:userId', requireAdmin, (req, res) => {
    const {userId} = req.params;

    if (userId === req.user.id) {
        return res.status(400).json({message: 'You cannot delete your own account.'});
    }

    const result = deleteUser(userId);
    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    res.json(result);
});

app.put('/users/:userId/role', requireAdmin, (req, res) => {
    const {userId} = req.params;
    const {role} = req.body;

    if (!role || !['admin', 'teacher'].includes(role)) {
        return res.status(400).json({message: 'Invalid role.'});
    }

    if (userId === req.user.id) {
        return res.status(400).json({message: 'You cannot change your own role.'});
    }

    const result = updateUserRole(userId, role);
    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    res.json(result);
});

app.put('/users/:userId/status', requireAdmin, (req, res) => {
    const {userId} = req.params;
    const {status} = req.body;

    if (!['approved', 'denied'].includes(status)) {
        return res.status(400).json({message: 'Invalid status.'});
    }

    if (userId === req.user.id) {
        return res.status(400).json({message: 'You cannot change your own status.'});
    }

    const result = updateUserStatus(userId, status);
    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    res.json(result);
});

app.put('/users/:userId/password', requireAdmin, (req, res) => {
    const {userId} = req.params;
    const {password} = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({message: 'Password must be at least 6 characters long.'});
    }

    const result = changePassword(userId, password);
    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    res.json(result);
});

module.exports = app;
