import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faXmark} from "@fortawesome/free-solid-svg-icons";
import AnswerContent from "@/common/components/AnswerContent";
import {QUESTION_TYPES, SLIDER_MARGIN_CONFIG, getQuestionTypeIcon, getQuestionTypeName} from "@/common/constants/QuestionTypes.js";
import "./styles.sass";

const renderAnswers = (question) => {
    const answers = question.answers || [];

    if (question.type === QUESTION_TYPES.SLIDER) {
        const config = answers[0] || {};
        return (
            <div className="qq-slider">
                Correct value: <strong>{config.correctValue}</strong> (range {config.min} to {config.max}, margin {SLIDER_MARGIN_CONFIG[config.answerMargin || 'medium']?.label.toLowerCase()})
            </div>
        );
    }

    if (question.type === QUESTION_TYPES.TEXT) {
        return (
            <div className="qq-answers">
                <span className="qq-hint">Accepted answers:</span>
                {answers.map((answer, index) => (
                    <div key={index} className="qq-answer correct">
                        <FontAwesomeIcon icon={faCheck}/> {answer.content}
                    </div>
                ))}
            </div>
        );
    }

    if (question.type === QUESTION_TYPES.SEQUENCE) {
        return (
            <ol className="qq-answers qq-sequence">
                {answers.map((answer, index) => (
                    <li key={index} className="qq-answer">
                        <AnswerContent answer={answer} index={index}/>
                    </li>
                ))}
            </ol>
        );
    }

    return (
        <div className="qq-answers">
            {answers.map((answer, index) => (
                <div key={index} className={`qq-answer ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                    <FontAwesomeIcon icon={answer.is_correct ? faCheck : faXmark}/>
                    <AnswerContent answer={answer} index={index}/>
                </div>
            ))}
        </div>
    );
};

export const QuizQuestions = ({quiz}) => {
    if (!quiz?.questions?.length) return <div className="qq-empty">This quiz has no questions.</div>;

    return (
        <div className="quiz-questions">
            {quiz.questions.map((question, index) => (
                <div key={index} className="qq-question">
                    <div className="qq-header">
                        <span className="qq-number">Question {index + 1}</span>
                        <span className="qq-type">
                            <FontAwesomeIcon icon={getQuestionTypeIcon(question.type)}/> {getQuestionTypeName(question.type)}
                        </span>
                    </div>
                    <div className="qq-title">{question.title}</div>
                    {question.b64_image && <img src={question.b64_image} alt={`Question ${index + 1}`} className="qq-image"/>}
                    {renderAnswers(question)}
                </div>
            ))}
        </div>
    );
};
