const rateLimit = require('express-rate-limit');
const {validateSchema} = require("../utils/error");
const {quizUpload} = require("../validations/quiz");
const path = require("path");
const fs = require("fs");
const app = require('express').Router();
const {quizzesFolder} = require("../utils/file");
const {generateQuizId} = require("../utils/random");
const {requireAuth} = require("../middleware/auth");
const {compressQuiz} = require("../utils/quiz");

const uploadFile = async (content, user) => {
    let random = generateQuizId();

    while (await checkIfExists(path.join(quizzesFolder, `${random}.quizzle`))) {
        random = generateQuizId();
    }

    const compressed = compressQuiz({__type: "QUIZZLE2", ...content});

    fs.writeFile(path.join(quizzesFolder, `${random}.quizzle`), compressed, (err) => {
        if (err) {
            console.error(err);
        }
    });

    const meta = {created: new Date().toISOString(), createdBy: user.id, createdByName: user.username};
    fs.writeFile(path.join(quizzesFolder, `${random}.meta.json`), JSON.stringify(meta, null, 2), (err) => {
        if (err) {
            console.error(err);
        }
    });
    return random;
};

const checkIfExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch (err) {
        return false;
    }
};

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
});

app.get('/:quizId', (req, res) => {
    const escaped = req.params.quizId.replace(/[^a-z0-9]/gi, '');

    fs.readFile(path.join(quizzesFolder, `${escaped}.quizzle`), (err, data) => {
        if (err) {
            res.status(404).json({message: "Quiz not found"});
            return;
        }

        res.send(data);
    });
});

app.put("/", limiter, requireAuth, async (req, res) => {
    if (validateSchema(res, quizUpload, req.body)) return;

    const quizId = await uploadFile(req.body, req.user);
    res.json({quizId});
});

module.exports = app;