import "./styles.sass";
import SelectBox from "@/common/components/SelectBox";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faClock,
    faShuffle,
    faCoins,
    faAlignLeft,
    faSignal,
} from "@fortawesome/free-solid-svg-icons";
import {motion} from "framer-motion";
import {DEFAULT_QUIZ_SETTINGS} from "@/common/constants/QuizSettings.js";

export const QuizSettingsPanel = ({settings, onChange}) => {
    const s = {...DEFAULT_QUIZ_SETTINGS, ...settings};

    const update = (key, value) => {
        onChange({...s, [key]: value});
    };

    const difficultyOptions = [
        {value: "none", label: "Not specified", description: "No difficulty specified", icon: faSignal},
        {value: "easy", label: "Easy", description: "For beginners", icon: faSignal},
        {value: "medium", label: "Medium", description: "Intermediate questions", icon: faSignal},
        {value: "hard", label: "Hard", description: "Challenging questions", icon: faSignal},
    ];

    const timerOptions = [
        {value: "15", label: "15 seconds", description: "Very quick questions", icon: faClock},
        {value: "30", label: "30 seconds", description: "Quick questions", icon: faClock},
        {value: "60", label: "60 seconds", description: "One minute per question", icon: faClock},
        {value: "120", label: "2 minutes", description: "More time to think", icon: faClock},
        {value: "-1", label: "Unlimited", description: "No time limit", icon: faClock},
    ];

    const scoringOptions = [
        {value: "time-based", label: "Time-based", description: "Faster answers = more points", icon: faCoins},
        {value: "flat", label: "Even", description: "Fixed points per correct answer", icon: faCoins},
    ];

    return (
        <motion.div
            className="quiz-settings-panel"
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.25, delay: 0.1, ease: "easeOut"}}
        >
            <div className="settings-header">
                <h3>Quiz settings</h3>
            </div>

            <div className="settings-section">
                <div className="section-title">About the quiz</div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faAlignLeft}/>
                        <span>Description</span>
                    </div>
                    <textarea
                        className="settings-textarea"
                        placeholder="What is this quiz about?"
                        value={s.description}
                        onChange={(e) => update("description", e.target.value)}
                        maxLength={300}
                        rows={3}
                    />
                    <div className="char-count">{s.description.length}/300</div>
                </div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faSignal}/>
                        <span>Difficulty</span>
                    </div>
                    <SelectBox
                        value={s.difficulty || "none"}
                        onChange={(v) => update("difficulty", v === "none" ? null : v)}
                        options={difficultyOptions}
                        placeholder="Select difficulty..."
                    />
                </div>
            </div>

            <div className="settings-section">
                <div className="section-title">Gameplay</div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faShuffle}/>
                        <span>Shuffle questions</span>
                    </div>
                    <div className="toggle-row" onClick={() => update("shuffleQuestions", !s.shuffleQuestions)}>
                        <div className={`toggle ${s.shuffleQuestions ? "active" : ""}`}>
                            <div className="toggle-knob"/>
                        </div>
                        <span className="toggle-text">{s.shuffleQuestions ? "Ein" : "Aus"}</span>
                    </div>
                </div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faShuffle}/>
                        <span>Shuffle answers</span>
                    </div>
                    <div className="toggle-row" onClick={() => update("shuffleAnswers", !s.shuffleAnswers)}>
                        <div className={`toggle ${s.shuffleAnswers ? "active" : ""}`}>
                            <div className="toggle-knob"/>
                        </div>
                        <span className="toggle-text">{s.shuffleAnswers ? "Ein" : "Aus"}</span>
                    </div>
                </div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faClock}/>
                        <span>Default time limit</span>
                    </div>
                    <SelectBox
                        value={String(s.defaultTimer)}
                        onChange={(v) => update("defaultTimer", parseInt(v))}
                        options={timerOptions}
                        placeholder="Select time limit..."
                    />
                </div>

                <div className="setting-group">
                    <div className="setting-label">
                        <FontAwesomeIcon icon={faCoins}/>
                        <span>Scoring</span>
                    </div>
                    <SelectBox
                        value={s.scoringMode}
                        onChange={(v) => update("scoringMode", v)}
                        options={scoringOptions}
                        placeholder="Select scoring..."
                    />
                </div>
            </div>
        </motion.div>
    );
};
