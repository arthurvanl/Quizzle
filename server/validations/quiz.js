const Joi = require('joi');

module.exports.questionValidation = Joi.object({
    title: Joi.string().required().min(1).max(200)
        .custom((value, helpers) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) {
                return helpers.error('string.min');
            }
            return trimmed;
        })
        .messages({
            'string.min': 'Question title must not be empty',
            'string.max': 'Question title must be at most 200 characters long'
        }),
    type: Joi.string().valid('multiple-choice', 'true-false', 'text', 'sequence', 'slider').required(),
    timer: Joi.number().integer().min(-1).max(3600).optional()
        .messages({
            'number.min': 'Timer must be -1 (unlimited) or a positive number',
            'number.max': 'Timer must be at most 3600 seconds (1 hour)'
        }),
    pointMultiplier: Joi.string().valid('none', 'double').optional()
        .messages({
            'any.only': 'Point multiplier must be "none" or "double"'
        }),
    b64_image: Joi.string().max(10000000),
    answers: Joi.when('type', {
        is: 'slider',
        then: Joi.array().items(Joi.object({
            correctValue: Joi.number().required(),
            min: Joi.number().required(),
            max: Joi.number().required(),
            step: Joi.number().positive().optional().default(1),
            answerMargin: Joi.string().valid('none', 'low', 'medium', 'high', 'maximum').optional().default('medium'),
            type: Joi.string().optional()
        })).length(1),
        otherwise: Joi.when('type', {
        is: 'text',
        then: Joi.array().items(Joi.object({
            content: Joi.string().required().min(1).max(150)
                .custom((value, helpers) => {
                    const trimmed = value.trim();
                    if (trimmed.length === 0) {
                        return helpers.error('string.min');
                    }
                    return trimmed;
                })
                .messages({
                    'string.min': 'Answer must not be empty',
                    'string.max': 'Answer must be at most 150 characters'
                })
        })).min(1).max(10),
        otherwise: Joi.when('type', {
            is: 'sequence',
            then: Joi.array().items(Joi.object({
                content: Joi.string().required().min(1).max(150)
                    .custom((value, helpers) => {
                        const trimmed = value.trim();
                        if (trimmed.length === 0) {
                            return helpers.error('string.min');
                        }
                        return trimmed;
                    })
                    .messages({
                        'string.min': 'Answer must not be empty',
                        'string.max': 'Answer must be at most 150 characters'
                    }),
                order: Joi.number().integer().min(1).optional()
            })).min(2).max(8),
            otherwise: Joi.when('type', {
                is: 'true-false',
                then: Joi.array().items(Joi.object({
                type: Joi.string().valid('text', 'image').required(),
                content: Joi.string().required().min(1).max(150)
                    .custom((value, helpers) => {
                        const trimmed = value.trim();
                        if (trimmed.length === 0) {
                            return helpers.error('string.min');
                        }
                        return trimmed;
                    })
                    .messages({
                        'string.min': 'Answer must not be empty',
                        'string.max': 'Answer must be at most 150 characters'
                    }),
                is_correct: Joi.boolean().required()
            })).length(2).custom((answers, helpers) => {
                const correctCount = answers.filter(a => a.is_correct).length;
                if (correctCount !== 1) {
                    return helpers.error('array.correctCount');
                }
                return answers;
            }).messages({
                'array.correctCount': 'True/False questions must have exactly one correct answer'
            }),
            otherwise: Joi.array().items(Joi.object({
                type: Joi.string().valid('text', 'image').required(),
                content: Joi.string().required().min(1).max(10000000)
                    .messages({
                        'string.min': 'Image URL must not be empty',
                        'string.max': 'Image is too large'
                    }),
                is_correct: Joi.boolean().required()
            })).min(2).max(6)
            })
        })
    })
    })
});

module.exports.settingsValidation = Joi.object({
    description: Joi.string().allow('').max(300).optional(),
    coverImage: Joi.string().max(10000000).allow(null).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').allow(null).optional(),
    shuffleQuestions: Joi.boolean().optional(),
    shuffleAnswers: Joi.boolean().optional(),
    defaultTimer: Joi.number().integer().min(-1).max(3600).optional(),
    scoringMode: Joi.string().valid('time-based', 'flat').optional()
});

module.exports.quizUpload = Joi.object({
    title: Joi.string().required().min(1).max(100)
        .custom((value, helpers) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) {
                return helpers.error('string.min');
            }
            return trimmed;
        })
        .messages({
            'string.min': 'Quiz title must not be empty',
            'string.max': 'Quiz title must be at most 100 characters long'
        }),
    settings: module.exports.settingsValidation.optional(),
    questions: Joi.array().items(module.exports.questionValidation).min(1).max(50).required()
        .messages({
            'array.min': 'Quiz must contain at least one question',
            'array.max': 'Quiz must contain at most 50 questions'
        })
});