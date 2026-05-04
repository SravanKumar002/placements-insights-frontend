import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode; // For Lucide icons or similar
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    description,
    trend,
    trendValue,
}) => {
    const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
    const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col justify-between h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </h3>
                <div className="text-brand-500 dark:text-brand-400">
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline mb-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {value}
                </p>
                {trend && trendValue && (
                    <span className={`ml-2 text-sm font-semibold ${trendColor}`}>
                        {trendArrow} {trendValue}
                    </span>
                )}
            </div>
            {description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {description}
                </p>
            )}
        </div>
    );
};