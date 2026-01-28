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
        <div className="text-center py-16 card">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center text-4xl">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
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
