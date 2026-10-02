import "./styles.sass";
import {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {faImage} from "@fortawesome/free-solid-svg-icons";
import {HOST_BACKGROUNDS} from "@/common/data/hostBackgrounds";
import {useHostBackground} from "@/common/hooks/useHostBackground";
import Button from "@/common/components/Button";

export const BackgroundChooser = () => {
    const [open, setOpen] = useState(false);
    const [currentId, setCurrent] = useHostBackground();

    return (
        <div className="background-chooser">
            <Button
                icon={faImage}
                padding="0.5rem 0.8rem"
                onClick={() => setOpen(o => !o)}
                ariaLabel="Change background"
            />

            <AnimatePresence>
                {open && (
                    <>
                        <div className="bg-chooser-backdrop" onClick={() => setOpen(false)}/>
                        <motion.div
                            className="bg-chooser-panel"
                            initial={{opacity: 0, y: 20, scale: 0.95}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            exit={{opacity: 0, y: 20, scale: 0.95}}
                            transition={{duration: 0.2, ease: "easeOut"}}
                        >
                            <h3>Choose background</h3>
                            <div className="bg-chooser-grid">
                                {HOST_BACKGROUNDS.map(bg => {
                                    const selected = bg.id === currentId;
                                    return (
                                        <button
                                            key={bg.id}
                                            type="button"
                                            className={`bg-chooser-tile ${selected ? "selected" : ""}`}
                                            onClick={() => setCurrent(bg.id)}
                                            aria-pressed={selected}
                                        >
                                            <div
                                                className="bg-chooser-preview"
                                                style={{backgroundImage: `url(${bg.image})`}}
                                            />
                                            <span className="bg-chooser-label">{bg.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BackgroundChooser;
