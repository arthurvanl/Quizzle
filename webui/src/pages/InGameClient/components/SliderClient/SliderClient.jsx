import "./styles.sass";
import {useState, useEffect, useRef} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPaperPlane, faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";

export const SliderClient = ({question, onSubmit}) => {
    const config = question.sliderConfig || {min: 0, max: 100, step: 1};
    const midPoint = Math.round((config.min + config.max) / 2 / config.step) * config.step;
    const [value, setValue] = useState(midPoint);
    const [submitted, setSubmitted] = useState(false);
    const sliderRef = useRef(null);

    const range = config.max - config.min;
    const percent = range > 0 ? ((value - config.min) / range) * 100 : 50;

    const handleSubmit = () => {
        if (!submitted) {
            setSubmitted(true);
            onSubmit(value);
        }
    };

    const nudge = (direction) => {
        setValue(prev => {
            const next = prev + direction * config.step;
            return Math.max(config.min, Math.min(config.max, Math.round(next / config.step) * config.step));
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (submitted) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                nudge(-1);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                nudge(1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [submitted, value]);

    return (
        <div className="slider-client">
            <div className="slider-value-badge">
                <span className="value-number">{value}</span>
            </div>

            <div className="slider-control-area">
                <button 
                    className="nudge-button" 
                    onClick={() => nudge(-1)}
                    disabled={submitted || value <= config.min}
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div className="slider-track-wrapper">
                    <input
                        ref={sliderRef}
                        type="range"
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={value}
                        onChange={(e) => !submitted && setValue(Number(e.target.value))}
                        className="client-slider-input"
                        disabled={submitted}
                        style={{'--slider-percent': `${percent}%`}}
                    />
                    <div className="slider-ticks">
                        <span>{config.min}</span>
                        <span>{config.max}</span>
                    </div>
                </div>

                <button 
                    className="nudge-button" 
                    onClick={() => nudge(1)}
                    disabled={submitted || value >= config.max}
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </div>

            <button 
                onClick={handleSubmit}
                disabled={submitted}
                className={`submit-slider-answer ${!submitted ? 'submit-shown' : ''}`}
            >
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>Submit answer</span>
            </button>
        </div>
    );
};
