import React, {useEffect, useRef, useId} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button';
import './styles.sass';

const Dialog = ({
                    isOpen,
                    onClose,
                    title,
                    children,
                    onConfirm,
                    onCancel,
                    confirmText = "OK",
                    cancelText = "Cancel",
                    showCancelButton = true,
                    className = ""
                }) => {
    const dialogRef = useRef(null);
    const previousFocusRef = useRef(null);
    const titleId = useId();

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
            requestAnimationFrame(() => {
                dialogRef.current?.focus();
            });
        } else if (previousFocusRef.current) {
            previousFocusRef.current?.focus();
            previousFocusRef.current = null;
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose?.();
                return;
            }
            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    };

    const handleConfirm = () => {
        onConfirm?.();
    };

    const handleCancel = () => {
        onCancel?.();
        onClose?.();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="dialog-overlay" 
                    onClick={handleOverlayClick}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div 
                        ref={dialogRef}
                        className={`dialog ${className}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        tabIndex={-1}
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {title && (
                            <div className="dialog-header">
                                <h3 id={titleId} className="dialog-title">{title}</h3>
                            </div>
                        )}

                        <div className="dialog-content">
                            {children}
                        </div>

                        {(showCancelButton || confirmText) && (
                            <div className="dialog-actions">
                                {showCancelButton && (
                                    <Button
                                        onClick={handleCancel}
                                        type="secondary compact"
                                        text={cancelText}
                                    />
                                )}
                                {confirmText && (
                                    <Button
                                        onClick={handleConfirm}
                                        type="primary compact"
                                        text={confirmText}
                                    />
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Dialog;
