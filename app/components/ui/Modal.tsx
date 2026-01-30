interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
    footer?: React.ReactNode;
}

export default function Modal({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md',
    showCloseButton = true,
    footer 
}: ModalProps) {
    if (!isOpen) return null;

    const sizeClass = size !== 'md' ? `modal-content-${size}` : '';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${sizeClass}`} onClick={e => e.stopPropagation()}>
                {title && (
                    <div className="modal-header">
                        <h3 className="modal-title">{title}</h3>
                        {showCloseButton && (
                            <button className="modal-close" onClick={onClose}>
                                ✕
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
