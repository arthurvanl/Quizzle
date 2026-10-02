import "./styles.sass";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faX, faCheckCircle, faToggleOn, faKeyboard, faSort, faSliders} from "@fortawesome/free-solid-svg-icons";
import AnswerContent from "@/common/components/AnswerContent";
import {QUESTION_TYPES} from "@/common/constants/QuestionTypes.js";

const TRUE_FALSE_LABELS = ["True", "False"];

const getAnswerColor = (index) => {
    const colors = ["orange", "blue", "green", "red", "purple", "teal"];
    return colors[index % colors.length];
};

const MultipleChoiceReview = ({selection, revealAnswers, answerLabels, practiceQuestion}) => {
    const length = practiceQuestion?.answers?.length
        || selection?.length
        || (Array.isArray(revealAnswers) ? revealAnswers.length : 0)
        || (Array.isArray(answerLabels) ? answerLabels.length : 0);

    if (!length) return null;

    const items = Array.from({length}, (_, index) => {
        const isSelected = Array.isArray(selection) ? !!selection[index] : false;
        const isCorrect = Array.isArray(revealAnswers) ? !!revealAnswers[index] : null;
        const practiceAnswer = practiceQuestion?.answers?.[index];
        const label = Array.isArray(answerLabels) ? answerLabels[index] : null;

        return {index, isSelected, isCorrect, practiceAnswer, label};
    });

    return (
        <div className="review-mc-list">
            {items.map(({index, isSelected, isCorrect, practiceAnswer, label}) => {
                let content;
                if (practiceAnswer) {
                    content = <AnswerContent answer={practiceAnswer} index={index} className="review-mc-answer"/>;
                } else if (label) {
                    content = <span className="review-mc-answer-text">{label}</span>;
                } else {
                    content = <span className="review-mc-placeholder">Answer {index + 1}</span>;
                }
                return (
                    <div
                        key={index}
                        className={[
                            "review-mc-item",
                            `review-color-${getAnswerColor(index)}`,
                            isSelected ? "review-mc-selected" : "review-mc-unselected",
                            isCorrect === true ? "review-mc-correct" : "",
                            isCorrect === false && isSelected ? "review-mc-wrong" : ""
                        ].filter(Boolean).join(" ")}
                    >
                        <div className="review-mc-index">
                            <FontAwesomeIcon icon={faCheckCircle}/>
                            <span>{index + 1}</span>
                        </div>
                        <div className="review-mc-content">
                            {content}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TrueFalseReview = ({selection, revealAnswers, userSubmittedAnswer}) => {
    let chosenIndex = -1;
    if (Array.isArray(selection)) {
        chosenIndex = selection.findIndex(Boolean);
    }
    if (chosenIndex === -1 && Array.isArray(userSubmittedAnswer) && userSubmittedAnswer.length > 0) {
        chosenIndex = userSubmittedAnswer[0];
    }

    return (
        <div className="review-tf-list">
            {TRUE_FALSE_LABELS.map((label, index) => {
                const isSelected = index === chosenIndex;
                const isCorrect = Array.isArray(revealAnswers) ? !!revealAnswers[index] : null;
                return (
                    <div
                        key={index}
                        className={[
                            "review-tf-item",
                            index === 0 ? "review-tf-true" : "review-tf-false",
                            isSelected ? "review-tf-selected" : "",
                            isCorrect === true ? "review-tf-correct" : "",
                            isCorrect === false && isSelected ? "review-tf-wrong" : ""
                        ].filter(Boolean).join(" ")}
                    >
                        <span className="review-tf-label">{label}</span>
                    </div>
                );
            })}
        </div>
    );
};

const TextReview = ({userSubmittedAnswer, revealAnswers}) => {
    const text = typeof userSubmittedAnswer === 'string' ? userSubmittedAnswer : '';
    const correctList = Array.isArray(revealAnswers) ? revealAnswers : [];

    return (
        <div className="review-text-wrapper">
            <div className="review-text-box review-text-your">
                <span className="review-text-label">Your answer</span>
                <span className="review-text-value">
                    {text ? text : <em>No answer submitted</em>}
                </span>
            </div>
            {correctList.length > 0 && (
                <div className="review-text-box review-text-correct">
                    <span className="review-text-label">Correct answer{correctList.length > 1 ? 's' : ''}</span>
                    <div className="review-text-correct-list">
                        {correctList.map((value, i) => (
                            <span key={i} className="review-text-pill">{value}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SliderReview = ({userSubmittedAnswer, sliderAnswerData}) => {
    const userValue = Number(userSubmittedAnswer);
    const correctValue = sliderAnswerData ? Number(sliderAnswerData.correctValue) : null;
    const min = sliderAnswerData ? Number(sliderAnswerData.min) : 0;
    const max = sliderAnswerData ? Number(sliderAnswerData.max) : 100;
    const range = max - min;

    const percent = (value) => {
        if (!Number.isFinite(value) || range <= 0) return 50;
        return Math.max(0, Math.min(100, ((value - min) / range) * 100));
    };

    const userPercent = percent(userValue);
    const correctPercent = correctValue !== null ? percent(correctValue) : null;
    const distance = Number.isFinite(userValue) && correctValue !== null
        ? Math.abs(userValue - correctValue)
        : null;

    return (
        <div className="review-slider-wrapper">
            <div className="review-slider-values">
                <div className="review-slider-value-box review-slider-your">
                    <span className="review-slider-label">Your answer</span>
                    <span className="review-slider-number">{Number.isFinite(userValue) ? userValue : '-'}</span>
                </div>
                {correctValue !== null && (
                    <div className="review-slider-value-box review-slider-target">
                        <span className="review-slider-label">Correct value</span>
                        <span className="review-slider-number">{correctValue}</span>
                    </div>
                )}
            </div>

            <div className="review-slider-track-wrapper">
                <div className="review-slider-track">
                    {correctPercent !== null && (
                        <div className="review-slider-marker-correct" style={{left: `${correctPercent}%`}}>
                            <FontAwesomeIcon icon={faCheck}/>
                        </div>
                    )}
                    {Number.isFinite(userValue) && (
                        <div className="review-slider-marker-user" style={{left: `${userPercent}%`}}/>
                    )}
                </div>
                <div className="review-slider-scale">
                    <span>{min}</span>
                    <span>{max}</span>
                </div>
            </div>

            {distance !== null && distance > 0 && (
                <div className="review-slider-distance">
                    Abweichung: <strong>{Number.isInteger(distance) ? distance : distance.toFixed(2)}</strong>
                </div>
            )}
        </div>
    );
};

const SequenceReview = ({userSubmittedAnswer, revealAnswers, practiceQuestion}) => {
    const order = Array.isArray(userSubmittedAnswer) ? userSubmittedAnswer : [];
    const answerSource = Array.isArray(practiceQuestion?.answers)
        ? practiceQuestion.answers
        : (Array.isArray(revealAnswers) ? revealAnswers : []);

    const findAnswer = (originalIndex) => {
        const byOriginal = answerSource.find(a => a && a.originalIndex === originalIndex);
        return byOriginal || answerSource[originalIndex];
    };

    if (order.length === 0) {
        return (
            <div className="review-sequence-empty">No order submitted</div>
        );
    }

    return (
        <div className="review-sequence-list">
            {order.map((originalIndex, position) => {
                const answer = findAnswer(originalIndex);
                const isCorrectSpot = originalIndex === position;
                return (
                    <div
                        key={position}
                        className={`review-sequence-item ${isCorrectSpot ? 'review-sequence-correct' : 'review-sequence-wrong'}`}
                    >
                        <div className="review-sequence-position">{position + 1}</div>
                        <div className="review-sequence-content">
                            {answer
                                ? <AnswerContent answer={answer} index={originalIndex} className="review-sequence-answer"/>
                                : <span>Answer {originalIndex + 1}</span>}
                        </div>
                        <div className="review-sequence-status">
                            <FontAwesomeIcon icon={isCorrectSpot ? faCheck : faX}/>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TYPE_ICONS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: faCheckCircle,
    [QUESTION_TYPES.TRUE_FALSE]: faToggleOn,
    [QUESTION_TYPES.TEXT]: faKeyboard,
    [QUESTION_TYPES.SEQUENCE]: faSort,
    [QUESTION_TYPES.SLIDER]: faSliders
};

export const ClientAnswerReview = ({
    questionType,
    selection,
    userSubmittedAnswer,
    revealAnswers,
    answerLabels,
    sliderAnswerData,
    practiceQuestion
}) => {
    if (!questionType) return null;

    const headerIcon = TYPE_ICONS[questionType] || faCheckCircle;

    let body = null;
    switch (questionType) {
        case QUESTION_TYPES.TRUE_FALSE:
            body = <TrueFalseReview
                selection={selection}
                revealAnswers={revealAnswers}
                userSubmittedAnswer={userSubmittedAnswer}
            />;
            break;
        case QUESTION_TYPES.TEXT:
            body = <TextReview
                userSubmittedAnswer={userSubmittedAnswer}
                revealAnswers={revealAnswers}
            />;
            break;
        case QUESTION_TYPES.SLIDER:
            body = <SliderReview
                userSubmittedAnswer={userSubmittedAnswer}
                sliderAnswerData={sliderAnswerData}
            />;
            break;
        case QUESTION_TYPES.SEQUENCE:
            body = <SequenceReview
                userSubmittedAnswer={userSubmittedAnswer}
                revealAnswers={revealAnswers}
                practiceQuestion={practiceQuestion}
            />;
            break;
        case 'single':
        case 'multiple':
        case QUESTION_TYPES.MULTIPLE_CHOICE:
        default:
            body = <MultipleChoiceReview
                selection={selection}
                revealAnswers={revealAnswers}
                answerLabels={answerLabels}
                practiceQuestion={practiceQuestion}
            />;
            break;
    }

    return (
        <section className="client-answer-review" aria-label="Your submitted answer">
            <header className="client-answer-review-header">
                <FontAwesomeIcon icon={headerIcon}/>
                <span>Your answer</span>
            </header>
            <div className="client-answer-review-body">
                {body}
            </div>
        </section>
    );
};
