import "./styles.sass";
import {useState, useEffect, useCallback, useRef} from "react";
import {createPortal} from "react-dom";
import {motion, AnimatePresence} from "framer-motion";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faImage,
    faFilm,
    faUpload,
    faSearch,
    faSpinner,
    faTimes,
    faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

const ALL_TABS = [
    {id: "images", label: "Images", icon: faImage, requiresApi: true},
    {id: "gifs", label: "GIFs", icon: faFilm, requiresApi: true},
    {id: "upload", label: "Upload", icon: faUpload, requiresApi: false},
];

export const MediaDialog = ({isOpen, onClose, onSelect}) => {
    const [availableTabs, setAvailableTabs] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const searchTimeout = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setResults([]);
            setError(null);
            setLoading(false);
            setActiveTab(null);
            return;
        }

        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/media/status");
                const status = await res.json();
                const tabs = ALL_TABS.filter(t => !t.requiresApi || status[t.id]);
                setAvailableTabs(tabs);
                setActiveTab(tabs[0]?.id || "upload");
            } catch {
                setAvailableTabs([ALL_TABS.find(t => t.id === "upload")]);
                setActiveTab("upload");
            }
        };
        fetchStatus();
    }, [isOpen]);

    const search = useCallback(async (query, tab) => {
        setLoading(true);
        setError(null);

        try {
            const params = query ? `query=${encodeURIComponent(query)}` : "";
            const url = tab === "images"
                ? `/api/media/images?${params}`
                : `/api/media/gifs?${params}`;

            const response = await fetch(url);

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Search failed.");
            }

            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            setError(err.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!activeTab || activeTab === "upload") return;

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!searchQuery.trim()) {
            search("", activeTab);
            return;
        }

        searchTimeout.current = setTimeout(() => {
            search(searchQuery, activeTab);
        }, 400);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchQuery, activeTab, search]);

    const handleSelectMedia = async (item) => {
        try {
            setLoading(true);
            const response = await fetch(item.url);
            const blob = await response.blob();
            const extension = blob.type.includes("gif") ? "gif" : "png";
            const file = new File([blob], `media.${extension}`, {type: blob.type});
            onSelect(file);
            onClose();
        } catch (err) {
            setError("Failed to load media.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (files) => {
        const file = files[0];
        if (!file || !file.type.startsWith("image/")) {
            setError("Only image files are allowed.");
            return;
        }
        onSelect(file);
        onClose();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen || !availableTabs) return null;

    const isSearchTab = activeTab === "images" || activeTab === "gifs";

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="media-dialog-overlay"
                    onClick={handleOverlayClick}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.2}}
                >
                    <motion.div
                        className="media-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Insert media"
                        initial={{opacity: 0, scale: 0.9, y: -20}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.9, y: -20}}
                        transition={{duration: 0.2, ease: "easeOut"}}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.key === 'Escape' && onClose()}
                    >
                        <div className="media-dialog-header">
                            <h3>Insert media</h3>
                            <button type="button" className="media-dialog-close" onClick={onClose} aria-label="Close dialog">
                                <FontAwesomeIcon icon={faTimes} aria-hidden="true"/>
                            </button>
                        </div>

                        <div className="media-dialog-body">
                            <div className="media-dialog-sidebar">
                                {availableTabs.map((tab) => (
                                    <button
                                        type="button"
                                        key={tab.id}
                                        className={`media-tab ${activeTab === tab.id ? "active" : ""}`}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setSearchQuery("");
                                            setResults([]);
                                            setError(null);
                                        }}
                                        aria-pressed={activeTab === tab.id}
                                    >
                                        <FontAwesomeIcon icon={tab.icon} aria-hidden="true"/>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="media-dialog-content">
                                {isSearchTab && (
                                    <div className="media-search">
                                        <FontAwesomeIcon icon={faSearch} className="search-icon"/>
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="media-error">
                                        <FontAwesomeIcon icon={faExclamationTriangle}/>
                                        <span>{error}</span>
                                    </div>
                                )}

                                {activeTab === "upload" && (
                                    <div
                                        className={`media-upload-zone ${dragActive ? "drag-active" : ""}`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragActive(true);
                                        }}
                                        onDragLeave={() => setDragActive(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FontAwesomeIcon icon={faUpload}/>
                                        <p>Drag a file here or click</p>
                                        <span>PNG, JPG, GIF, WebP</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e.target.files)}
                                            hidden
                                        />
                                    </div>
                                )}

                                {isSearchTab && loading && (
                                    <div className="media-loading">
                                        <FontAwesomeIcon icon={faSpinner} spin/>
                                    </div>
                                )}

                                {isSearchTab && !loading && !error && results.length === 0 && searchQuery.trim() && (
                                    <div className="media-empty">No results found.</div>
                                )}

                                {isSearchTab && !loading && results.length > 0 && (
                                    <div className={`media-grid ${activeTab === "gifs" ? "media-grid-gifs" : ""}`}>
                                        {results.map((item) => (
                                            <div
                                                key={item.id}
                                                className="media-grid-item"
                                                onClick={() => handleSelectMedia(item)}
                                            >
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.alt}
                                                    loading="lazy"
                                                />
                                                {item.author && (
                                                    <div className="media-attribution">
                                                        {item.author}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "images" && results.length > 0 && !loading && (
                                    <div className="media-attribution-footer">
                                        {searchQuery.trim() ? "Results" : "Popular images"} from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
                                    </div>
                                )}
                                {activeTab === "gifs" && results.length > 0 && !loading && (
                                    <div className="media-attribution-footer">
                                        {searchQuery.trim() ? "Results" : "Popular GIFs"} from <a href="https://giphy.com" target="_blank" rel="noopener noreferrer">GIPHY</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
