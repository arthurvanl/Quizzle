const fs = require('fs');
const path = require('path');
const {dataFolder, quizzesFolder} = require('./file');
const {decompressQuiz} = require('./quiz');

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

const resolveQuizPaths = (type, id) => {
    if (type === 'live' && /^[a-z0-9]+$/i.test(id)) {
        return {
            quizPath: path.join(quizzesFolder, `${id}.quizzle`),
            metaPath: path.join(quizzesFolder, `${id}.meta.json`),
            remove: [path.join(quizzesFolder, `${id}.quizzle`), path.join(quizzesFolder, `${id}.meta.json`)]
        };
    }
    if (type === 'practice' && /^[A-Z]{4}$/i.test(id)) {
        const quizDir = path.join(practiceQuizzesFolder, id.toUpperCase());
        return {quizPath: path.join(quizDir, 'quiz.quizzle'), metaPath: path.join(quizDir, 'meta.json'), remove: [quizDir]};
    }
    return null;
};

const getQuizOwner = (paths) => (readJson(paths.metaPath) || {}).createdBy || null;

module.exports = {listQuizzes, resolveQuizPaths, getQuizOwner};
