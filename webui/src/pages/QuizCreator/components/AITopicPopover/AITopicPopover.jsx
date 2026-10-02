import {useState, useRef, useEffect, useLayoutEffect} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {createPortal} from "react-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faWandMagicSparkles, faSpinner, faSliders} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/components/Button";
import "./styles.sass";

export const AITopicPopover = ({generating, onGenerate, onStop, onOpenAdvanced}) => {
    const [showInput, setShowInput] = useState(false);
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState("");
    const [popoverStyle, setPopoverStyle] = useState({});
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const popoverRef = useRef(null);

    const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPopoverStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left,
            zIndex: 1100
        });
    };

    useLayoutEffect(() => {
        if (showInput) updatePosition();
    }, [showInput]);

    useEffect(() => {
        if (!showInput) return;
        const handleClickOutside = (e) => {
            if (generating) return;
            if (containerRef.current?.contains(e.target)) return;
            if (popoverRef.current?.contains(e.target)) return;
            setShowInput(false);
        };
        const handleReposition = () => updatePosition();
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [showInput, generating]);

    useEffect(() => {
        if (showInput && inputRef.current) inputRef.current.focus();
    }, [showInput]);

    const handleGenerate = () => {
        if (!topic.trim()) return;
        const parsedCount = count ? Number.parseInt(count, 10) : undefined;
        onGenerate({topic: topic.trim(), questionCount: parsedCount});
        setShowInput(false);
        setTopic("");
        setCount("");
    };

    const handleButtonClick = () => {
        if (generating) {
            onStop();
        } else {
            setShowInput(!showInput);
        }
    };

    const handleAdvanced = () => {
        setShowInput(false);
        setTopic("");
        setCount("");
        onOpenAdvanced?.();
    };

    const popover = (
        <AnimatePresence>
            {showInput && (
                <motion.div
                    ref={popoverRef}
                    className="ai-topic-popover"
                    style={popoverStyle}
                    initial={{opacity: 0, y: -8, scale: 0.95}}
                    animate={{opacity: 1, y: 0, scale: 1}}
                    exit={{opacity: 0, y: -8, scale: 0.95}}
                    transition={{duration: 0.15}}
                >
                    <div className="ai-topic-row">
                        <input
                            ref={inputRef}
                            className="ai-topic-input"
                            type="text"
                            placeholder="Enter topic..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            maxLength={200}
                        />
                        <input
                            className="ai-count-input"
                            type="number"
                            placeholder="No."
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            min={1}
                            max={50}
                        />
                        {onOpenAdvanced && (
                            <Button
                                onClick={handleAdvanced}
                                type="secondary compact"
                                icon={faSliders}
                                ariaLabel="Advanced options: PDF, URL, Wikipedia"
                            />
                        )}
                        <Button
                            onClick={handleGenerate}
                            type="primary compact"
                            icon={faWandMagicSparkles}
                            disabled={!topic.trim()}
                            ariaLabel="Generate quiz"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="ai-generate-container" ref={containerRef}>
            <div
                className={`action-button ai-generate ${generating ? 'generating' : ''}`}
                onClick={handleButtonClick}
                title={generating ? "Cancel generation" : "Generate quiz with AI"}
            >
                <FontAwesomeIcon icon={generating ? faSpinner : faWandMagicSparkles} spin={generating}/>
            </div>
            {createPortal(popover, document.body)}
        </div>
    );
};
