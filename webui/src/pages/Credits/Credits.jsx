import {motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowLeft, faImage, faMusic, faFont, faCode, faHeart} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/components/Button";
import {CREDITS} from "@/common/data/credits";
import "./styles.sass";

const SectionIcon = {
    backgrounds: faImage,
    audio: faMusic,
    fonts: faFont,
    libraries: faCode
};

export const Credits = () => {
    const navigate = useNavigate();

    return (
        <div className="credits-page">
            <motion.div
                className="credits-container"
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.4}}
            >
                <div className="credits-header">
                    <Button icon={faArrowLeft} onClick={() => navigate("/")} ariaLabel="Back">
                        Back
                    </Button>
                    <h1>Credits &amp; Attributions</h1>
                    <p className="credits-subtitle">
                        Quizzle would not be possible without the great work of many artists and open-source projects.
                        Thank you!
                    </p>
                </div>

                {CREDITS.map((section) => (
                    <motion.section
                        key={section.id}
                        className="credits-section"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.3, delay: 0.1}}
                    >
                        <h2>
                            <FontAwesomeIcon icon={SectionIcon[section.id] || faHeart}/>
                            {section.title}
                        </h2>
                        {section.description && (
                            <p className="section-description">{section.description}</p>
                        )}

                        <ul className="credits-list">
                            {section.entries.map((entry, idx) => (
                                <li key={idx} className="credit-entry">
                                    <div className="credit-main">
                                        <span className="credit-title">{entry.title}</span>
                                        {entry.author && (
                                            <span className="credit-author">
                                                by{" "}
                                                {entry.authorUrl ? (
                                                    <a href={entry.authorUrl} target="_blank" rel="noreferrer">
                                                        {entry.author}
                                                    </a>
                                                ) : (
                                                    entry.author
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="credit-meta">
                                        {entry.source && (
                                            <a href={entry.source} target="_blank" rel="noreferrer" className="credit-link">
                                                {entry.sourceName || "Source"}
                                            </a>
                                        )}
                                        {entry.license && (
                                            <span className="credit-license">{entry.license}</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.section>
                ))}
            </motion.div>
        </div>
    );
};
