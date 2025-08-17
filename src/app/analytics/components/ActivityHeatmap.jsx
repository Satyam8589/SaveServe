// File: /analytics/components/ActivityHeatmap.jsx
'use client';

import { useMemo } from 'react';

export default function ActivityHeatmap({ data, title = 'Platform Activity Heatmap' }) {
  const { heatmapGrid, maxActivity } = useMemo(() => {
    if (!data || data.length === 0) {
      return { heatmapGrid: [], maxActivity: 0 };
    }

    const maxActivity = Math.max(...data.map(cell => cell.totalActivity));
    const heatmapGrid = [];
    
    // Group data by day and hour
    for (let day = 1; day <= 7; day++) {
      const dayData = [];
      for (let hour = 0; hour < 24; hour++) {
        const cell = data.find(d => d.day === day && d.hour === hour);
        dayData.push(cell || { hour, day, totalActivity: 0, bookings: 0, listings: 0, collections: 0 });
      }
      heatmapGrid.push(dayData);
    }
    
    return { heatmapGrid, maxActivity };
  }, [data]);

  const getIntensityColor = (activity) => {
    if (maxActivity === 0) return 'bg-gray-800';
    const intensity = activity / maxActivity;
    
    if (intensity === 0) return 'bg-gray-800';
    if (intensity <= 0.2) return 'bg-emerald-900/50';
    if (intensity <= 0.4) return 'bg-emerald-800/60';
    if (intensity <= 0.6) return 'bg-emerald-600/70';
    if (intensity <= 0.8) return 'bg-emerald-500/80';
    return 'bg-emerald-400';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div className="text-sm text-gray-400 mb-4">
        Activity intensity over the last 30 days
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-12"></div>
            {hours.map(hour => (
              <div key={hour} className="w-4 text-xs text-center text-gray-400">
                {hour % 6 === 0 ? hour : ''}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {heatmapGrid.map((dayData, dayIndex) => (
            <div key={dayIndex} className="flex items-center mb-1">
              <div className="w-12 text-xs text-gray-300 pr-2">
                {dayNames[dayIndex]}
              </div>
              {dayData.map((cell, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className={`w-4 h-4 mr-px mb-px rounded-sm cursor-pointer transition-all hover:scale-110 hover:ring-1 hover:ring-emerald-400 ${getIntensityColor(cell.totalActivity)}`}
                  title={`${dayNames[dayIndex]} ${cell.hour}:00 - ${cell.totalActivity} activities (${cell.bookings} bookings, ${cell.listings} listings, ${cell.collections} collections)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <span>Less active</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-800 rounded-sm border border-gray-600"></div>
          <div className="w-3 h-3 bg-emerald-900/50 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-800/60 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-600/70 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-500/80 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
        </div>
        <span>More active</span>
      </div>
    </div>
  );
}