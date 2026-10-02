import "./styles.sass";
import SelectBox from "@/common/components/SelectBox";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock, faInfinity, faCoins, faSliders} from "@fortawesome/free-solid-svg-icons";
import {useState, useEffect} from "react";
import {motion} from "framer-motion";
import {QUESTION_TYPES, SLIDER_MARGIN_CONFIG} from "@/common/constants/QuestionTypes.js";

export const QuestionSettings = ({question, onChange, onCommit, defaultTimer = 60}) => {
    const [selectedTimer, setSelectedTimer] = useState(() => {
        if (question.timer === undefined || question.timer === null) return "default";
        if (question.timer === -1) return "unlimited";
        if (question.timer === 30) return "30";
        if (question.timer === 120) return "120";
        return "custom";
    });

    const [selectedPointMultiplier, setSelectedPointMultiplier] = useState(() => {
        if (question.pointMultiplier === undefined || question.pointMultiplier === null) return "standard";
        return question.pointMultiplier;
    });

    const defaultTimerLabel = defaultTimer === -1 ? "Unlimited" : `${defaultTimer}s`;

    const timerOptions = [
        {
            value: "default",
            label: `Standard (${defaultTimerLabel})`,
            description: "From quiz settings",
            icon: faClock
        },
        {
            value: "30",
            label: "30 seconds",
            description: "Quick questions",
            icon: faClock
        },
        {
            value: "60",
            label: "60 seconds",
            description: "One minute per question",
            icon: faClock
        },
        {
            value: "120",
            label: "2 minutes",
            description: "More time to think",
            icon: faClock
        },
        {
            value: "unlimited",
            label: "Unlimited",
            description: "No time limit",
            icon: faInfinity
        }
    ];

    const pointMultiplierOptions = [
        {
            value: "standard",
            label: "Standard",
            description: "Normal scoring",
            icon: faCoins
        },
        {
            value: "none",
            label: "No points",
            description: "This question awards no points",
            icon: faCoins
        },
        {
            value: "double",
            label: "Double points",
            description: "This question awards double points",
            icon: faCoins
        }
    ];

    useEffect(() => {
        if (question.timer === undefined || question.timer === null) {
            setSelectedTimer("default");
        } else if (question.timer === -1) {
            setSelectedTimer("unlimited");
        } else if (question.timer === 30) {
            setSelectedTimer("30");
        } else if (question.timer === 120) {
            setSelectedTimer("120");
        } else {
            setSelectedTimer("custom");
        }

        if (question.pointMultiplier === undefined || question.pointMultiplier === null) {
            setSelectedPointMultiplier("standard");
        } else {
            setSelectedPointMultiplier(question.pointMultiplier);
        }
    }, [question.timer, question.pointMultiplier]);

    const handleTimerChange = (value) => {
        setSelectedTimer(value);
        const commit = onCommit || onChange;

        let timerNum;
        if (value === "default") {
            timerNum = undefined;
        } else if (value === "unlimited") {
            timerNum = -1;
        } else if (value === "30") {
            timerNum = 30;
        } else if (value === "120") {
            timerNum = 120;
        }

        commit({...question, timer: timerNum});
    };

    const handlePointMultiplierChange = (value) => {
        setSelectedPointMultiplier(value);
        const commit = onCommit || onChange;
        const multiplierValue = value === "standard" ? undefined : value;
        commit({...question, pointMultiplier: multiplierValue});
    };

    const handleAnswerMarginChange = (value) => {
        const commit = onCommit || onChange;
        const answers = question.answers || [{correctValue: 50, min: 0, max: 100, step: 1, answerMargin: 'medium'}];
        const updatedAnswers = [{...answers[0], answerMargin: value}];
        commit({...question, answers: updatedAnswers});
    };

    const answerMarginOptions = Object.entries(SLIDER_MARGIN_CONFIG).map(([key, config]) => ({
        value: key,
        label: config.label,
        description: config.description,
        icon: faSliders
    }));

    const isSliderType = question?.type === QUESTION_TYPES.SLIDER;
    const currentAnswerMargin = question?.answers?.[0]?.answerMargin || 'medium';

    if (!question) return null;

    return (
        <motion.div
            className="question-settings"
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.25, delay: 0.2, ease: "easeOut"}}
        >
            <div className="settings-header">
                <h3>Question settings</h3>
            </div>

            <div className="setting-group">
                <div className="setting-label">
                    <FontAwesomeIcon icon={faClock}/>
                    <span>Time limit</span>
                </div>

                <SelectBox value={selectedTimer} onChange={handleTimerChange} options={timerOptions} placeholder="Select timer..."/>
            </div>

            <div className="setting-group">
                <div className="setting-label">
                    <FontAwesomeIcon icon={faCoins}/>
                    <span>Scoring</span>
                </div>

                <SelectBox value={selectedPointMultiplier} onChange={handlePointMultiplierChange} options={pointMultiplierOptions} placeholder="Select scoring..."/>
            </div>

            {isSliderType && (
                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faSliders}/>
                        <span>Answer margin</span>
                    </div>

                    <SelectBox value={currentAnswerMargin} onChange={handleAnswerMarginChange} options={answerMarginOptions} placeholder="Select answer margin..."/>
                </div>
            )}
        </motion.div>
    );
};