import {useContext, useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faVolumeUp, faVolumeMute, faVolumeDown, faVolumeOff} from "@fortawesome/free-solid-svg-icons";
import {AnimatePresence, motion} from "framer-motion";
import {QuizContext} from "@/common/contexts/Quiz";
import "./styles.sass";

export const SoundControl = ({className = ""}) => {
    const {soundEnabled, toggleSound, masterVolume, setMasterVolume} = useContext(QuizContext);
    const [expanded, setExpanded] = useState(false);
    const hideTimeoutRef = useRef(null);

    useEffect(() => () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    }, []);

    const scheduleHide = () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setExpanded(false), 350);
    };

    const cancelHide = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    const show = () => {
        cancelHide();
        setExpanded(true);
    };

    const icon = !soundEnabled || masterVolume === 0
        ? faVolumeMute
        : masterVolume < 34
            ? faVolumeOff
            : masterVolume < 67
                ? faVolumeDown
                : faVolumeUp;

    const handleSliderChange = (e) => {
        const value = Number(e.target.value);
        setMasterVolume(value);
        if (value > 0 && !soundEnabled) toggleSound();
    };

    return (
        <div
            className={`sound-control ${className}`}
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            onFocus={show}
            onBlur={scheduleHide}
        >
            <AnimatePresence>
                {expanded && (
                    <div
                        className="sound-control-popover-anchor"
                        onMouseEnter={cancelHide}
                        onMouseLeave={scheduleHide}
                    >
                        <motion.div
                            className="sound-control-popover"
                            initial={{opacity: 0, y: 8, scale: 0.95}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            exit={{opacity: 0, y: 8, scale: 0.95}}
                            transition={{duration: 0.15}}
                        >
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={soundEnabled ? masterVolume : 0}
                                onChange={handleSliderChange}
                                aria-label="Volume"
                                style={{"--fill": `${soundEnabled ? masterVolume : 0}%`}}
                            />
                            <span className="sound-control-value">{soundEnabled ? masterVolume : 0}</span>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <button
                type="button"
                className="sound-control-button"
                onClick={toggleSound}
                aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                aria-pressed={!soundEnabled}
            >
                <FontAwesomeIcon icon={icon} aria-hidden="true"/>
            </button>
        </div>
    );
};
