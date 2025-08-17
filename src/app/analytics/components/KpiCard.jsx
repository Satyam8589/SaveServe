// File: /analytics/components/KpiCard.jsx
'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({ title, value, unit, description, trend, icon: Icon, color = 'emerald' }) {
  const colorClasses = {
    emerald: 'bg-gray-800 border-emerald-500/30 text-emerald-400 hover:bg-gray-700/50',
    orange: 'bg-gray-800 border-orange-400/30 text-orange-400 hover:bg-gray-700/50',
    amber: 'bg-gray-800 border-amber-400/30 text-amber-400 hover:bg-gray-700/50',
    blue: 'bg-gray-800 border-blue-400/30 text-blue-400 hover:bg-gray-700/50',
    red: 'bg-gray-800 border-red-400/30 text-red-400 hover:bg-gray-700/50',
    green: 'bg-gray-800 border-green-400/30 text-green-400 hover:bg-gray-700/50'
  };

  const iconColorClasses = {
    emerald: 'text-emerald-500',
    orange: 'text-orange-500',
    amber: 'text-amber-500',
    blue: 'text-blue-400',
    red: 'text-red-400',
    green: 'text-green-400'
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-xl hover:shadow-emerald-500/10`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />}
          <h3 className="font-medium text-sm text-gray-300">{title}</h3>
        </div>
        {trend && getTrendIcon()}
      </div>
      
      <div className="mb-1">
        <span className="text-3xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className="text-lg font-medium ml-1 text-gray-400">{unit}</span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-400 opacity-75">{description}</p>
      )}
    </div>
  );
}

