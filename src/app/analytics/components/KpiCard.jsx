// File: /analytics/components/KpiCard.jsx
'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({ title, value, unit, description, trend, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    teal: 'bg-teal-50 border-teal-200 text-teal-900'
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-5 h-5" />}
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        {trend && getTrendIcon()}
      </div>
      
      <div className="mb-1">
        <span className="text-3xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className="text-lg font-medium ml-1">{unit}</span>
      </div>
      
      {description && (
        <p className="text-xs opacity-75">{description}</p>
      )}
    </div>
  );
}

