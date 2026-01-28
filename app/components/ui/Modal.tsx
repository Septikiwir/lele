interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {title && (
                    <h3 className="text-xl font-bold text-slate-900 mb-6">{title}</h3>
                )}
                {children}
            </div>
        </div>
    );
}
