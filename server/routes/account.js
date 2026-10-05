const app = require('express').Router();
const fs = require('fs');
const {requireAuth} = require('../middleware/auth');
const {decompressQuiz} = require('../utils/quiz');
const {listQuizzes, resolveQuizPaths, getQuizOwner} = require('../utils/quizList');

app.get('/quizzes', requireAuth, (req, res) => {
    const quizzes = listQuizzes().filter(quiz => quiz.createdBy === req.user.id);
    res.json({quizzes});
});

app.get('/quizzes/:type/:id', requireAuth, (req, res) => {
    const paths = resolveQuizPaths(req.params.type, req.params.id);
    if (!paths || !fs.existsSync(paths.quizPath) || getQuizOwner(paths) !== req.user.id) {
        return res.status(404).json({message: 'Quiz not found.'});
    }

    try {
        res.json({quiz: decompressQuiz(fs.readFileSync(paths.quizPath))});
    } catch {
        res.status(500).json({message: 'Quiz could not be read.'});
    }
});

module.exports = app;
