// File: /analytics/components/TopProvidersBar.jsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TopProvidersBar({ data, title = 'Top Food Providers' }) {
  // Dark theme colors emphasizing the recommended palette
  const colors = [
    '#10B981', // emerald-500 (primary)
    '#F59E0B', // amber-500 (golden)
    '#FB923C', // orange-400 (warm orange)
    '#60A5FA', // blue-400 (soft blue)
    '#34D399', // emerald-400 (sage green)
    '#FBBF24', // amber-400
    '#F87171', // red-400 (warm red)
    '#A78BFA'  // purple-400
  ];
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 shadow-xl rounded-lg border border-gray-700 max-w-xs">
          <p className="font-medium text-white">{data.providerName}</p>
          <p className="text-sm text-gray-300">{data.subrole} • {data.campusLocation}</p>
          <p className="text-sm text-emerald-400">Food provided: {data.totalWeight} kg</p>
          <p className="text-sm text-gray-300">Total bookings: {data.totalBookings}</p>
          {data.avgRating && (
            <p className="text-sm text-amber-400">Rating: {data.avgRating}/5</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Categories: {data.categories.join(', ')}
          </p>
        </div>
      );
    }
    return null;
  };

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

  // Truncate long provider names for better display
  const formattedData = data.map(provider => ({
    ...provider,
    displayName: provider.providerName.length > 20 
      ? provider.providerName.substring(0, 20) + '...'
      : provider.providerName
  }));

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={formattedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="displayName" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalWeight" radius={[4, 4, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Provider rankings below chart */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
        {data.slice(0, 6).map((provider, index) => (
          <div key={provider.providerId} className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-white">{provider.providerName}</p>
              <p className="text-gray-300">{provider.totalWeight} kg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}