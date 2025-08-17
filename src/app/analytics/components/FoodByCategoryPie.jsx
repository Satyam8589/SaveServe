// File: app/analytics/components/FoodByCategoryPie.jsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function FoodByCategoryPie({ data, title = 'Food Distribution by Category' }) {
  const RADIAN = Math.PI / 180;
  
  // Dark theme category colors
  const CATEGORY_COLORS = {
    'Cooked Food': '#FB7185', // warm red
    'fruits': '#34D399', // emerald
    'snacks': '#FBBF24', // amber
    'Raw Ingredients': '#10B981', // emerald-500
    'Packaged Food': '#F59E0B', // amber-500
    'Beverages': '#60A5FA' // blue-400
  };
  
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    if (percent < 0.05) return null; // Hide labels for slices < 5%
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 shadow-xl rounded-lg border border-gray-700">
          <p className="font-medium text-white">{data.category}</p>
          <p className="text-sm text-emerald-400">Weight: {data.value} kg</p>
          <p className="text-sm text-gray-300">Quantity: {data.quantity} units</p>
          <p className="text-sm text-gray-300">Listings: {data.listings}</p>
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

  // Enhance data with dark theme colors
  const enhancedData = data.map(item => ({
    ...item,
    color: CATEGORY_COLORS[item.category] || '#60A5FA',
    fill: CATEGORY_COLORS[item.category] || '#60A5FA'
  }));

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enhancedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {enhancedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', color: '#ffffff' }}
              formatter={(value, entry) => (
                <span style={{ color: '#ffffff' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}