'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';

export default function FeedTrendChart() {
    const { getFeedTrend } = useApp();
    const data = getFeedTrend(7).map(d => ({
        ...d,
        displayDate: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }),
        fullDate: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
    }));

    // Calculate Trend
    const lastDay = data[data.length - 1]?.amount || 0;
    const prevDay = data[data.length - 2]?.amount || 0;
    const trendDiff = lastDay - prevDay;
    const trendPercent = prevDay > 0 ? (trendDiff / prevDay) * 100 : 0;
    const isUp = trendDiff > 0;

    return (
        <div className="stat-card p-6 h-full flex flex-col bg-white border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Konsumsi Pakan</h3>
                    <p className="text-xs text-slate-400 mt-1">7 Hari Terakhir</p>
                </div>
                <div className={`text-right ${isUp ? 'text-green-600' : trendDiff < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                    <p className="font-bold text-xl">{lastDay.toFixed(1)} kg</p>
                    {lastDay > 0 && (
                        <p className="text-xs font-medium">
                            {isUp ? '↑' : trendDiff < 0 ? '↓' : '-'}
                            {Math.abs(trendPercent).toFixed(0)}% vs kmrn
                        </p>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontSize: '12px' }}
                            itemStyle={{ color: '#0f172a', fontWeight: '600' }}
                            cursor={{ fill: '#f1f5f9' }}
                            formatter={(value: any) => [`${Number(value).toFixed(1)} kg`, 'Pakan']}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.fullDate;
                                }
                                return label;
                            }}
                        />
                        <Bar
                            dataKey="amount"
                            fill="#f59e0b" // amber-500
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
