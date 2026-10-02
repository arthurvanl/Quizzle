import "./styles.sass";
import {useState, useEffect, useCallback} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperPlane, faGripVertical, faSort, faRotateLeft} from "@fortawesome/free-solid-svg-icons";
import {Reorder, AnimatePresence, motion} from "framer-motion";
import AnswerContent from "@/common/components/AnswerContent";

const useIsTouchDevice = () => {
    const [isTouch, setIsTouch] = useState(false);
    useEffect(() => {
        const mq = globalThis.matchMedia("(pointer: coarse)");
        setIsTouch(mq.matches);
        const handler = (e) => setIsTouch(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isTouch;
};

export const SequenceClient = ({question, onSubmit}) => {
    const [sortableAnswers, setSortableAnswers] = useState([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [pickedOrder, setPickedOrder] = useState([]);
    const isTouchDevice = useIsTouchDevice();

    useEffect(() => {
        if (question && question.answers && Array.isArray(question.answers) && question.answers.length > 0) {
            const answersWithDisplayId = question.answers.map((answer, index) => ({
                ...answer,
                displayId: `client-${index}-${Math.random().toString(36).substring(2, 9)}`
            }));
            setSortableAnswers(answersWithDisplayId);
            setHasSubmitted(false);
            setPickedOrder([]);
        } else {
            setSortableAnswers([]);
            setHasSubmitted(false);
            setPickedOrder([]);
        }
    }, [question]);

    const handleTapItem = useCallback((displayId) => {
        if (hasSubmitted) return;
        const alreadyIndex = pickedOrder.indexOf(displayId);
        if (alreadyIndex === -1) {
            setPickedOrder(prev => [...prev, displayId]);
        } else {
            setPickedOrder(prev => prev.slice(0, alreadyIndex));
        }
    }, [pickedOrder, hasSubmitted]);

    const handleReset = useCallback(() => {
        setPickedOrder([]);
    }, []);

    const handleSubmit = () => {
        if (hasSubmitted) return;

        if (isTouchDevice) {
            const orderedAnswers = pickedOrder.map(id => sortableAnswers.find(a => a.displayId === id));
            const answerOrder = orderedAnswers.map(answer => answer.originalIndex);
            setHasSubmitted(true);
            onSubmit(answerOrder);
        } else {
            const answerOrder = sortableAnswers.map(answer => answer.originalIndex);
            setHasSubmitted(true);
            onSubmit(answerOrder);
        }
    };

    const allPicked = pickedOrder.length === sortableAnswers.length;
    const canSubmit = isTouchDevice
        ? allPicked && !hasSubmitted
        : sortableAnswers.length > 0 && !hasSubmitted;

    if (!question || !question.answers) {
        return (
            <div className="sequence-client">
                <div className="sequence-instructions">
                    <FontAwesomeIcon icon={faSort} className="sequence-icon" />
                    <span>Waiting for question...</span>
                </div>
            </div>
        );
    }

    if (typeof question.answers === 'number') {
        return (
            <div className="sequence-client">
                <div className="sequence-instructions">
                    <FontAwesomeIcon icon={faSort} className="sequence-icon" />
                    <span>Loading sorting question...</span>
                </div>
                <div className="sequence-error">
                    <p>Sequence questions need the answer contents.</p>
                    <p>Please use practice mode for sequence questions.</p>
                </div>
            </div>
        );
    }

    if (!Array.isArray(question.answers) || question.answers.length === 0) {
        return (
            <div className="sequence-client">
                <div className="sequence-instructions">
                    <FontAwesomeIcon icon={faSort} className="sequence-icon" />
                    <span>No answers available</span>
                </div>
            </div>
        );
    }

    const renderDesktopItem = (answer, index) => (
        <>
            <div className="drag-handle" aria-hidden="true">
                <FontAwesomeIcon icon={faGripVertical} />
            </div>
            <div className="sequence-number">{index + 1}</div>
            <div className="sequence-content">
                <AnswerContent answer={answer} index={index} className="sequence-answer" />
            </div>
        </>
    );

    const tapColors = ["orange", "blue", "green", "red"];

    const renderTouchItem = (answer, index) => {
        const pickIndex = pickedOrder.indexOf(answer.displayId);
        const isPicked = pickIndex !== -1;
        const colorClass = tapColors[index % tapColors.length];
        return (
            <motion.div
                key={answer.displayId}
                className={`tap-item tap-color-${colorClass} ${isPicked ? "picked" : ""}`}
                onClick={() => handleTapItem(answer.displayId)}
                role="option"
                aria-selected={isPicked}
                aria-label={answer.type === "image" ? `Answer ${index + 1}` : answer.content}
                layout
                transition={{type: "spring", stiffness: 400, damping: 30}}
            >
                <div className="tap-badge" aria-hidden="true">
                    {isPicked ? pickIndex + 1 : ""}
                </div>
                <div className="tap-content">
                    <AnswerContent answer={answer} index={index} className="tap-answer" />
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`sequence-client ${isTouchDevice ? "touch-mode" : ""}`}>
            <div className="sequence-instructions">
                <FontAwesomeIcon icon={faSort} className="sequence-icon" />
                <span>{isTouchDevice
                    ? "Tap the answers in the correct order"
                    : "Drag the answers into the correct order"
                }</span>
            </div>

            {isTouchDevice ? (
                <>
                    <div className="tap-list">
                        {sortableAnswers.map((answer, index) => renderTouchItem(answer, index))}
                    </div>
                </>
            ) : (
                <Reorder.Group
                    as="div"
                    className="sequence-list"
                    values={sortableAnswers}
                    onReorder={setSortableAnswers}
                >
                    <AnimatePresence initial={false}>
                        {sortableAnswers.map((answer, index) => (
                            <Reorder.Item
                                key={answer.displayId}
                                value={answer}
                                style={{listStyleType: "none"}}
                            >
                                <motion.div
                                    className="sequence-item"
                                    initial={{opacity: 0, y: -20}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -20}}
                                    whileDrag={{scale: 1.05}}
                                >
                                    {renderDesktopItem(answer, index)}
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            )}

            <div className="submit-container">
                {isTouchDevice && pickedOrder.length > 0 && !hasSubmitted && (
                    <button className="reset-btn" onClick={handleReset}>
                        <FontAwesomeIcon icon={faRotateLeft} />
                    </button>
                )}
                <button 
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`submit-sequence ${canSubmit ? "submit-shown" : ""}`}
                >
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
        </div>
    );
};