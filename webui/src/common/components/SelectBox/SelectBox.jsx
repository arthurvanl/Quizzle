import "./styles.sass";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {useState, useRef, useEffect, useCallback, useId} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {createPortal} from "react-dom";

export const SelectBox = ({value, onChange, options, placeholder = "Select...", disabled = false, ariaLabel}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const selectRef = useRef(null);
    const dropdownRef = useRef(null);
    const listboxId = useId();

    const updatePosition = useCallback(() => {
        if (!selectRef.current) return;
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            bottom: window.innerHeight - rect.top,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleScroll = (event) => {
            if (dropdownRef.current && dropdownRef.current.contains(event.target)) return;
            setIsOpen(false);
        };

        const handleResize = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);
            const selectedIdx = options.findIndex(o => o.value === value);
            setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, options, value]);

    const getSelectedOption = () => {
        return options.find(option => option.value === value);
    };

    const handleOptionClick = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        selectRef.current?.querySelector('.select-trigger')?.focus();
    };

    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen) updatePosition();
        setIsOpen(!isOpen);
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (isOpen && focusedIndex >= 0) {
                    handleOptionClick(options[focusedIndex].value);
                } else {
                    handleToggle();
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    if (!isOpen) updatePosition();
                    setIsOpen(true);
                } else {
                    setFocusedIndex(prev => Math.min(prev + 1, options.length - 1));
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (isOpen) {
                    setFocusedIndex(prev => Math.max(prev - 1, 0));
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                selectRef.current?.querySelector('.select-trigger')?.focus();
                break;
            case 'Home':
                if (isOpen) {
                    e.preventDefault();
                    setFocusedIndex(0);
                }
                break;
            case 'End':
                if (isOpen) {
                    e.preventDefault();
                    setFocusedIndex(options.length - 1);
                }
                break;
        }
    };

    const selectedOption = getSelectedOption();

    return (
        <div className={`select-box ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`} ref={selectRef}>
            <div
                className={`select-trigger ${isOpen ? 'open' : ''}`}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                aria-label={ariaLabel || placeholder}
                aria-activedescendant={isOpen && focusedIndex >= 0 ? `${listboxId}-option-${focusedIndex}` : undefined}
                tabIndex={disabled ? -1 : 0}
            >
                <div className="select-content">
                    {selectedOption ? (
                        <div className="selected-option">
                            {selectedOption.icon && (
                                <FontAwesomeIcon icon={selectedOption.icon} className="option-icon" aria-hidden="true"/>
                            )}
                            <span className="option-label">{selectedOption.label}</span>
                        </div>
                    ) : (
                        <span className="placeholder">{placeholder}</span>
                    )}
                </div>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`select-arrow ${isOpen ? 'rotated' : ''}`}
                    aria-hidden="true"
                />
            </div>

            {createPortal(
                <AnimatePresence>
                    {isOpen && !disabled && (
                        <motion.div
                            ref={dropdownRef}
                            className="select-dropdown"
                            style={dropdownStyle}
                            role="listbox"
                            id={listboxId}
                            initial={{opacity: 0, y: 10, scale: 0.95}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            exit={{opacity: 0, y: 10, scale: 0.95}}
                            transition={{duration: 0.2}}
                        >
                            {options.map((option, index) => (
                                <div
                                    key={option.value}
                                    id={`${listboxId}-option-${index}`}
                                    className={`select-option ${value === option.value ? 'selected' : ''} ${focusedIndex === index ? 'focused' : ''}`}
                                    onClick={() => handleOptionClick(option.value)}
                                    role="option"
                                    aria-selected={value === option.value}
                                >
                                    {option.icon && (
                                        <FontAwesomeIcon icon={option.icon} className="option-icon" aria-hidden="true"/>
                                    )}
                                    <div className="option-content">
                                        <span className="option-label">{option.label}</span>
                                        {option.description && (
                                            <span className="option-description">{option.description}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};