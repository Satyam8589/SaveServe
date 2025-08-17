// File: /analytics/components/TopProvidersBar.jsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TopProvidersBar({ data, title = 'Top Food Providers' }) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border max-w-xs">
          <p className="font-medium">{data.providerName}</p>
          <p className="text-sm text-gray-600">{data.subrole} • {data.campusLocation}</p>
          <p className="text-sm text-blue-600">Food provided: {data.totalWeight} kg</p>
          <p className="text-sm text-gray-600">Total bookings: {data.totalBookings}</p>
          {data.avgRating && (
            <p className="text-sm text-yellow-600">Rating: {data.avgRating}/5</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Categories: {data.categories.join(', ')}
          </p>
        </div>
      );
    }
    return null;
  };

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

  // Truncate long provider names for better display
  const formattedData = data.map(provider => ({
    ...provider,
    displayName: provider.providerName.length > 20 
      ? provider.providerName.substring(0, 20) + '...'
      : provider.providerName
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={formattedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayName" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
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
          <div key={provider.providerId} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{provider.providerName}</p>
              <p className="text-gray-500">{provider.totalWeight} kg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}