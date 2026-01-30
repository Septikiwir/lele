import Link from 'next/link';
import { PlusIcon } from './Icons';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

export default function EmptyState({ title, description, icon = '📂', action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                {icon}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
            {action && (
                <>
                    {action.href ? (
                        <Link href={action.href} className="btn btn-primary">
                            <PlusIcon />
                            {action.label}
                        </Link>
                    ) : (
                        <button onClick={action.onClick} className="btn btn-primary">
                            <PlusIcon />
                            {action.label}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
