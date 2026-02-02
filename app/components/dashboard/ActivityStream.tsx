'use client';
import { useApp } from '../../context/AppContext';
import { FileText, Container, TrendingUp, Users } from 'lucide-react';

export default function ActivityStream() {
    const { getRecentActivities } = useApp();
    const activities = getRecentActivities(4);

    const getIcon = (type: string) => {
        switch (type) {
            case 'PAKAN': return <Container className="w-4 h-4" />;
            case 'PANEN': return <TrendingUp className="w-4 h-4" />;
            case 'KEMATIAN': return '💀';
            case 'TEBAR': return '🌱';
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'PAKAN': return 'bg-amber-100 text-amber-600';
            case 'PANEN': return 'bg-emerald-100 text-emerald-600';
            case 'KEMATIAN': return 'bg-red-100 text-red-600';
            case 'TEBAR': return 'bg-blue-100 text-blue-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="w-full p-6 h-full bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <FileText className="w-6 h-6" />
                </div>
                Aktivitas Terbaru
            </h3>

            <div className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">Belum ada aktivitas tercatat</p>
                ) : (
                    activities.map(act => (
                        <div key={act.id} className="flex gap-3 items-start relative pb-4 last:pb-0 border-l-2 border-slate-100 last:border-0 pl-4 -ml-2">
                            {/* Dot on Timeline */}
                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-slate-500 mb-0.5">{act.date}</p>
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getColor(act.type).replace('text-', 'bg-opacity-20 text-')}`}>
                                        {act.type}
                                    </span>
                                </div>
                                <p className="text-lg font-semibold text-slate-900 leading-tight">
                                    {act.title}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    {act.description} <span className="text-slate-400 mx-1">•</span> {act.kolamName}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
