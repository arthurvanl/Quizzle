import "./styles.sass";
import Button from "@/common/components/Button";
import Input from "@/common/components/Input";
import {useState} from "react";
import {CHARACTERS} from "@/common/data/characters";
import {motion, AnimatePresence} from "framer-motion";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {useInputValidation, validationRules} from "@/common/hooks/useInputValidation";

export const CharacterSelection = ({code, submit, isPracticeMode = false}) => {
    const nameValidation = useInputValidation('', validationRules.playerName);
    const [selectedCharacter, setSelectedCharacter] = useState(() => {
        const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
        return CHARACTERS[randomIndex];
    });
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitSelection = async () => {
        if (!nameValidation.validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await submit(nameValidation.value.trim(), selectedCharacter.id, code);
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const selectCharacter = (character) => {
        setSelectedCharacter(character);
        setShowModal(false);
    }

    return (
        <div className="character-selection">
            <button
                type="button"
                className="character-display"
                onClick={() => setShowModal(true)}
                aria-label={`Character: ${selectedCharacter.name}. Click to change`}
            >
                <div className="character-emoji">{selectedCharacter.emoji}</div>
                <span>{selectedCharacter.name}</span>
            </button>

            <Input
                placeholder="Your name"
                value={nameValidation.value}
                onChange={(e) => nameValidation.setValue(e.target.value)}
                onBlur={nameValidation.onBlur}
                error={nameValidation.error}
                warning={nameValidation.warning}
                maxLength={validationRules.playerName.maxLength}
                disabled={isSubmitting}
            />

            <Button
                text={isSubmitting ? "Joining..." : (isPracticeMode ? "Start quiz" : "Join")}
                padding={"0.7rem 1.5rem"}
                onClick={submitSelection}
                disabled={!nameValidation.value.trim() || !!nameValidation.error || isSubmitting}
            />

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="character-modal-overlay"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            className="character-modal"
                            initial={{scale: 0.9, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.9, opacity: 0}}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Choose your character</h3>
                                <button
                                    className="close-button"
                                    onClick={() => setShowModal(false)}
                                >
                                    <FontAwesomeIcon icon={faTimes}/>
                                </button>
                            </div>

                            <div className="character-grid" role="radiogroup" aria-label="Choose character">
                                {CHARACTERS.map((character) => (
                                    <button
                                        type="button"
                                        key={character.id}
                                        className={`character-option ${selectedCharacter?.id === character.id ? 'selected' : ''}`}
                                        onClick={() => selectCharacter(character)}
                                        role="radio"
                                        aria-checked={selectedCharacter?.id === character.id}
                                        aria-label={character.name}
                                    >
                                        <div className="character-emoji">{character.emoji}</div>
                                        <div className="character-name">{character.name}</div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}