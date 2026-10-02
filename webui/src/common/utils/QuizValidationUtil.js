import {QUESTION_TYPES, ANSWER_LIMITS, MINIMUM_ANSWERS} from '../constants/QuestionTypes.js';

export class QuizValidationUtil {
    static LIMITS = {MAX_QUESTIONS: 50, MIN_QUESTIONS: 1, MAX_QUESTION_LENGTH: 200, MAX_ANSWER_LENGTH: 150};

    static validateQuiz(questions, title) {
        if (!title || title.trim() === "") return { isValid: false, error: "Quiz title must not be empty." };
        if (questions.length === 0) return { isValid: false, error: "There must be at least one question." };
        if (questions.length > this.LIMITS.MAX_QUESTIONS) return { isValid: false, error: `Quiz may contain at most ${this.LIMITS.MAX_QUESTIONS} questions.` };

        for (const question of questions) {
            const questionValidation = this.validateQuestion(question);
            if (!questionValidation.isValid) return questionValidation;
        }
        return { isValid: true };
    }

    static validateQuestion(question) {
        if (!question.title || question.title.trim() === "") return { isValid: false, error: "Questions must not be empty." };
        if (question.title.trim().length > this.LIMITS.MAX_QUESTION_LENGTH) return { isValid: false, error: `Questions may be at most ${this.LIMITS.MAX_QUESTION_LENGTH} characters long.` };
        const questionType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE;
        return this.validateAnswers(question.answers || [], questionType);
    }

    static validateAnswers(answers, questionType) {
        const minAnswers = MINIMUM_ANSWERS[questionType] || 1;
        const maxAnswers = ANSWER_LIMITS[questionType] || 6;

        if (answers.length < minAnswers) return { isValid: false, error: this.getMinAnswersErrorMessage(questionType, minAnswers) };
        if (answers.length > maxAnswers) return { isValid: false, error: this.getMaxAnswersErrorMessage(questionType, maxAnswers) };

        switch (questionType) {
            case QUESTION_TYPES.TEXT: return this.validateTextAnswers(answers);
            case QUESTION_TYPES.TRUE_FALSE: return this.validateTrueFalseAnswers(answers);
            case QUESTION_TYPES.SEQUENCE: return this.validateSequenceAnswers(answers);
            case QUESTION_TYPES.SLIDER: return this.validateSliderAnswers(answers);
            case QUESTION_TYPES.MULTIPLE_CHOICE:
            default: return this.validateMultipleChoiceAnswers(answers);
        }
    }

    static validateTextAnswers(answers) {
        if (answers.some(a => !a.content || a.content.trim() === "")) return { isValid: false, error: "Text answers must not be empty." };
        return { isValid: true };
    }

    static validateTrueFalseAnswers(answers) {
        if (answers.length !== 2) return { isValid: false, error: "True/False questions must have exactly two answers." };
        if (!answers.some(a => a.is_correct)) return { isValid: false, error: "True/False questions must have at least one correct answer." };
        return { isValid: true };
    }

    static validateMultipleChoiceAnswers(answers) {
        if (answers.filter(a => a.is_correct).length === 0) return { isValid: false, error: "Every multiple-choice question must have at least one correct answer." };
        if (answers.some(a => (!a.content || a.content.trim() === "") && a.imageId === undefined)) return { isValid: false, error: "Multiple-choice answers must not be empty." };
        if (answers.some(a => a.content?.trim().length > this.LIMITS.MAX_ANSWER_LENGTH && a.type === QUESTION_TYPES.TEXT)) return { isValid: false, error: `Multiple-choice answers may be at most ${this.LIMITS.MAX_ANSWER_LENGTH} characters long.` };
        return { isValid: true };
    }

    static validateSequenceAnswers(answers) {
        if (answers.some(a => !a.content || a.content.trim() === "")) return { isValid: false, error: "Sequence answers must not be empty." };
        if (answers.some(a => a.content?.trim().length > this.LIMITS.MAX_ANSWER_LENGTH)) return { isValid: false, error: `Sequence answers may be at most ${this.LIMITS.MAX_ANSWER_LENGTH} characters long.` };
        return { isValid: true };
    }

    static validateSliderAnswers(answers) {
        if (!answers || answers.length !== 1) return { isValid: false, error: "Slider questions must have exactly one answer configuration." };
        const config = answers[0];
        if (config.correctValue === undefined || config.correctValue === null) return { isValid: false, error: "Slider questions must have a correct value." };
        if (config.min === undefined || config.max === undefined) return { isValid: false, error: "Slider questions must have a min and max value." };
        if (config.min >= config.max) return { isValid: false, error: "The minimum value must be less than the maximum value." };
        if (config.correctValue < config.min || config.correctValue > config.max) return { isValid: false, error: "The correct value must be between min and max." };
        if (config.step !== undefined && config.step <= 0) return { isValid: false, error: "The step value must be greater than 0." };
        return { isValid: true };
    }

    static getMinAnswersErrorMessage(questionType, minAnswers) {
        switch (questionType) {
            case QUESTION_TYPES.TEXT: return "Text questions must have at least one accepted answer.";
            case QUESTION_TYPES.TRUE_FALSE: return "True/False questions must have exactly two answers.";
            case QUESTION_TYPES.SEQUENCE: return "Sequence questions must have at least two answers.";
            case QUESTION_TYPES.SLIDER: return "Slider questions must have a configuration.";
            case QUESTION_TYPES.MULTIPLE_CHOICE:
            default: return "Multiple-choice questions must have at least two answers.";
        }
    }

    static getMaxAnswersErrorMessage(questionType, maxAnswers) {
        switch (questionType) {
            case QUESTION_TYPES.TEXT: return `Text questions may have at most ${maxAnswers} accepted answers.`;
            case QUESTION_TYPES.TRUE_FALSE: return "True/False questions must have exactly two answers.";
            case QUESTION_TYPES.SEQUENCE: return `Sequence questions may have at most ${maxAnswers} answers.`;
            case QUESTION_TYPES.SLIDER: return "Slider questions may only have one configuration.";
            case QUESTION_TYPES.MULTIPLE_CHOICE:
            default: return `Multiple-choice questions may have at most ${maxAnswers} answers.`;
        }
    }

    static validateQuizForContext(json) {
        if (json.__type !== "QUIZZLE2") return false;
        const {title, questions} = json;
        if (!title || title.length > 100) return false;
        if (!questions || questions.length === 0) return false;
        if (questions.some(q => !q.title || q.title === "" || q.title.length > 200)) return false;

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.type) return false;
            const questionType = question.type;
            
            if (questionType === QUESTION_TYPES.TEXT) {
                if (!question.answers || question.answers.length === 0 || question.answers.length > 10) return false;
                if (question.answers.some(a => !a.content || a.content.trim() === "")) return false;
            } else if (questionType === QUESTION_TYPES.TRUE_FALSE) {
                if (!question.answers || question.answers.length !== 2) return false;
                if (question.answers.some(a => typeof a.is_correct !== 'boolean')) return false;
                if (!question.answers.some(a => a.is_correct) || question.answers.filter(a => a.is_correct).length !== 1) return false;
            } else if (questionType === QUESTION_TYPES.MULTIPLE_CHOICE) {
                if (!question.answers || question.answers.length < 2 || question.answers.length > 6) return false;
                if (question.answers.some(a => typeof a.is_correct !== 'boolean')) return false;
                if (question.answers.filter(a => a.is_correct).length === 0) return false;
                if (question.answers.some(a => !a.content || a.content.trim() === "")) return false;
            } else if (questionType === QUESTION_TYPES.SEQUENCE) {
                if (!question.answers || question.answers.length < 2 || question.answers.length > 8) return false;
                if (question.answers.some(a => !a.content || a.content.trim() === "")) return false;
            } else if (questionType === QUESTION_TYPES.SLIDER) {
                if (!question.answers || question.answers.length !== 1) return false;
                const cfg = question.answers[0];
                if (cfg.correctValue == null || cfg.min == null || cfg.max == null) return false;
                if (cfg.min >= cfg.max || cfg.correctValue < cfg.min || cfg.correctValue > cfg.max) return false;
            } else {
                return false;
            }
        }
        return true;
    }
}