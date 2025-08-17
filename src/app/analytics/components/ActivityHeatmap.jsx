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
    if (maxActivity === 0) return 'bg-gray-100';
    const intensity = activity / maxActivity;
    
    if (intensity === 0) return 'bg-gray-100';
    if (intensity <= 0.2) return 'bg-blue-100';
    if (intensity <= 0.4) return 'bg-blue-200';
    if (intensity <= 0.6) return 'bg-blue-300';
    if (intensity <= 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="text-sm text-gray-600 mb-4">
        Activity intensity over the last 30 days
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-12"></div>
            {hours.map(hour => (
              <div key={hour} className="w-4 text-xs text-center text-gray-500">
                {hour % 6 === 0 ? hour : ''}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {heatmapGrid.map((dayData, dayIndex) => (
            <div key={dayIndex} className="flex items-center mb-1">
              <div className="w-12 text-xs text-gray-700 pr-2">
                {dayNames[dayIndex]}
              </div>
              {dayData.map((cell, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className={`w-4 h-4 mr-px mb-px rounded-sm cursor-pointer transition-all hover:scale-110 ${getIntensityColor(cell.totalActivity)}`}
                  title={`${dayNames[dayIndex]} ${cell.hour}:00 - ${cell.totalActivity} activities (${cell.bookings} bookings, ${cell.listings} listings, ${cell.collections} collections)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
        <span>Less active</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
        </div>
        <span>More active</span>
      </div>
    </div>
  );
}