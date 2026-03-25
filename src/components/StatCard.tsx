import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: 'green' | 'blue' | 'purple' | 'orange';
}

export default function StatCard({ title, value, icon, color = 'green' }: StatCardProps) {
    const colorClasses = {
        green: 'from-green-500 to-emerald-600',
        blue: 'from-blue-500 to-cyan-600',
        purple: 'from-purple-500 to-pink-600',
        orange: 'from-orange-500 to-red-600'
    };

    return (
        <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all card-hover animate-fadeIn shadow-xl">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
