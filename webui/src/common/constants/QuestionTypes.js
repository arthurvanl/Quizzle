import {faListUl, faToggleOn, faKeyboard, faSort, faSliders} from "@fortawesome/free-solid-svg-icons";

export const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'multiple-choice',
    TRUE_FALSE: 'true-false',
    TEXT: 'text',
    SEQUENCE: 'sequence',
    SLIDER: 'slider'
};

export const DEFAULT_QUESTION_TYPE = QUESTION_TYPES.MULTIPLE_CHOICE;

export const QUESTION_TYPE_CONFIG = [
    {type: QUESTION_TYPES.MULTIPLE_CHOICE, icon: faListUl, name: 'Multiple choice', description: 'Players choose from predefined answer options'},
    {type: QUESTION_TYPES.TRUE_FALSE, icon: faToggleOn, name: 'True/False', description: 'Players choose between True and False'},
    {type: QUESTION_TYPES.TEXT, icon: faKeyboard, name: 'Text input', description: 'Players type their answer as text'},
    {type: QUESTION_TYPES.SEQUENCE, icon: faSort, name: 'Sequence', description: 'Players sort answers into the correct order'},
    {type: QUESTION_TYPES.SLIDER, icon: faSliders, name: 'Slider', description: 'Players estimate a value on a slider'}
];

const getQuestionTypeConfig = (type) => QUESTION_TYPE_CONFIG.find(config => config.type === type) || QUESTION_TYPE_CONFIG[0];
export const getQuestionTypeIcon = (type) => getQuestionTypeConfig(type).icon;
export const getQuestionTypeName = (type) => getQuestionTypeConfig(type).name;

export const getDefaultAnswersForType = (type) => {
    switch (type) {
        case QUESTION_TYPES.TRUE_FALSE: return [{type: QUESTION_TYPES.TEXT, content: 'True', is_correct: false}, {type: QUESTION_TYPES.TEXT, content: 'False', is_correct: false}];
        case QUESTION_TYPES.TEXT: return [{content: ''}];
        case QUESTION_TYPES.SEQUENCE: return [];
        case QUESTION_TYPES.SLIDER: return [{correctValue: 50, min: 0, max: 100, step: 1, answerMargin: 'medium'}];
        case QUESTION_TYPES.MULTIPLE_CHOICE:
        default: return [];
    }
};

export const ANSWER_LIMITS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: 6,
    [QUESTION_TYPES.TRUE_FALSE]: 2,
    [QUESTION_TYPES.TEXT]: 10,
    [QUESTION_TYPES.SEQUENCE]: 8,
    [QUESTION_TYPES.SLIDER]: 1
};

export const MINIMUM_ANSWERS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: 2,
    [QUESTION_TYPES.TRUE_FALSE]: 2,
    [QUESTION_TYPES.TEXT]: 1,
    [QUESTION_TYPES.SEQUENCE]: 2,
    [QUESTION_TYPES.SLIDER]: 1
};

export const SLIDER_MARGIN_CONFIG = {
    none: { label: 'None', description: 'Only accept the exact answer', factor: 0 },
    low: { label: 'Low', description: 'Low error tolerance', factor: 0.05 },
    medium: { label: 'Medium', description: 'Medium error tolerance', factor: 0.1 },
    high: { label: 'High', description: 'High error tolerance', factor: 0.2 },
    maximum: { label: 'Maximum', description: 'Closest answer earns more points', factor: 0.4 }
};