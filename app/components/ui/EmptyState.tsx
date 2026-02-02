import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: string | ReactNode;
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
                            <Plus className="w-4 h-4" />
                            {action.label}
                        </Link>
                    ) : (
                        <button onClick={action.onClick} className="btn btn-primary">
                            <Plus className="w-4 h-4" />
                            {action.label}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
