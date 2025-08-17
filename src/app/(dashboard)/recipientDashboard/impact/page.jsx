"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Utensils,
  Globe,
  Droplet,
  Award,
  BarChart3,
  TrendingUp,
  Calendar,
  RefreshCw,
  Users,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserBookings } from "@/hooks/useBookings";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ImpactPage() {
  const { user, isLoaded } = useUser();
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('30'); // 30, 90, 365 days
  const [impactStats, setImpactStats] = useState({
    totalImpact: {
      mealsSaved: 0,
      carbonSaved: 0,
      waterSaved: 0,
      wasteReduced: 0,
    },
    stats: {
      impactScore: 0,
    },
    totals: {
      booked: 0,
      completed: 0,
      cancelled: 0,
    }
  });

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch
  } = useUserBookings(user?.id);

  const claims = bookingsData?.data || [];

  // Process claims data to create chart data and calculate impact
  useEffect(() => {
    if (!claims.length) return;

    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Create daily data points
    const dailyData = {};
    
    // Initialize all days in range with zero values
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: dateKey,
        dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        booked: 0,
        completed: 0,
        cancelled: 0,
      };
    }

    // Count claims by date and status
    let totalBooked = 0;
    let totalCompleted = 0;
    let totalCancelled = 0;
    let totalItemsSaved = 0;

    claims.forEach(claim => {
      const claimDate = new Date(claim.createdAt || claim.requestedAt);
      const dateKey = claimDate.toISOString().split('T')[0];
      
      // Count totals
      totalBooked++;
      
      if (claim.status === 'collected') {
        totalCompleted++;
        totalItemsSaved += (claim.approvedQuantity || claim.requestedQuantity || 1);
      } else if (['cancelled', 'rejected', 'expired'].includes(claim.status)) {
        totalCancelled++;
      }

      // Add to daily data if within range
      if (dailyData[dateKey]) {
        dailyData[dateKey].booked++;
        
        if (claim.status === 'collected') {
          dailyData[dateKey].completed++;
        } else if (['cancelled', 'rejected', 'expired'].includes(claim.status)) {
          dailyData[dateKey].cancelled++;
        }
      }
    });

    // Convert to array and sort by date
    const chartDataArray = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item, index, array) => {
        // Calculate cumulative values
        const prevItem = index > 0 ? array[index - 1] : { booked: 0, completed: 0, cancelled: 0 };
        return {
          ...item,
          booked: prevItem.booked + item.booked,
          completed: prevItem.completed + item.completed,
          cancelled: prevItem.cancelled + item.cancelled,
        };
      });

    setChartData(chartDataArray);

    // Calculate impact statistics
    const carbonPerMeal = 0.24; // kg CO2 per meal saved
    const waterPerMeal = 12.5; // liters per meal
    const wastePerMeal = 0.16; // kg waste per meal

    setImpactStats({
      totalImpact: {
        mealsSaved: totalItemsSaved,
        carbonSaved: (totalItemsSaved * carbonPerMeal).toFixed(1),
        waterSaved: Math.round(totalItemsSaved * waterPerMeal),
        wasteReduced: (totalItemsSaved * wastePerMeal).toFixed(1),
      },
      stats: {
        impactScore: Math.round(totalCompleted * 100 + (totalBooked - totalCancelled) * 10),
      },
      totals: {
        booked: totalBooked,
        completed: totalCompleted,
        cancelled: totalCancelled,
      }
    });
  }, [claims, timeRange]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-200 font-medium">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="ml-2 text-gray-300">Loading your impact data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">My Impact Dashboard</h2>
          <p className="text-gray-400">Track your food rescue journey and environmental impact</p>
        </div>
        <Button
          onClick={refetch}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 self-start sm:self-auto"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Impact Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-700">
          <CardContent className="p-6 text-center">
            <Utensils className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">
              {impactStats.totalImpact.mealsSaved}
            </div>
            <div className="text-sm text-emerald-200">Meals Saved</div>
            <div className="text-xs text-emerald-300 mt-1">
              Total rescued items
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 text-blue-300 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">
              {impactStats.totalImpact.carbonSaved}kg
            </div>
            <div className="text-sm text-blue-200">CO₂ Saved</div>
            <div className="text-xs text-blue-300 mt-1">
              Carbon footprint reduced
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-cyan-900 to-cyan-800 border-cyan-700">
          <CardContent className="p-6 text-center">
            <Droplet className="h-12 w-12 text-cyan-300 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">
              {impactStats.totalImpact.waterSaved}L
            </div>
            <div className="text-sm text-cyan-200">Water Saved</div>
            <div className="text-xs text-cyan-300 mt-1">
              Virtual water preserved
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-700">
          <CardContent className="p-6 text-center">
            <Award className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">
              {impactStats.stats.impactScore}
            </div>
            <div className="text-sm text-yellow-200">Impact Score</div>
            <div className="text-xs text-yellow-300 mt-1">
              Keep rescuing food!
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{impactStats.totals.booked}</p>
                <p className="text-sm text-gray-400">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{impactStats.totals.completed}</p>
                <p className="text-sm text-gray-400">Successfully Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{impactStats.totals.cancelled}</p>
                <p className="text-sm text-gray-400">Cancelled/Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-gray-100 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Booking Activity Trends
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your cumulative booking patterns over time
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timeRange === '30' ? "default" : "outline"}
                onClick={() => setTimeRange('30')}
                className={`${timeRange === '30' 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                30 Days
              </Button>
              <Button
                size="sm"
                variant={timeRange === '90' ? "default" : "outline"}
                onClick={() => setTimeRange('90')}
                className={`${timeRange === '90' 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                90 Days
              </Button>
              <Button
                size="sm"
                variant={timeRange === '365' ? "default" : "outline"}
                onClick={() => setTimeRange('365')}
                className={`${timeRange === '365' 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                1 Year
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="booked"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    name="Total Booked"
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                    name="Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="cancelled"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                    name="Cancelled"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No booking data available yet</p>
                <p className="text-sm text-gray-500">
                  Start claiming food to see your activity trends
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Impact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Environmental Impact</CardTitle>
            <CardDescription className="text-gray-400">
              Your contribution to sustainability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Waste Reduced</span>
              <span className="text-emerald-400 font-semibold">
                {impactStats.totalImpact.wasteReduced}kg
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Carbon Footprint</span>
              <span className="text-blue-400 font-semibold">
                -{impactStats.totalImpact.carbonSaved}kg CO₂
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Water Conservation</span>
              <span className="text-cyan-400 font-semibold">
                {impactStats.totalImpact.waterSaved}L saved
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Success Rate</span>
              <span className="text-yellow-400 font-semibold">
                {impactStats.totals.booked > 0 
                  ? Math.round((impactStats.totals.completed / impactStats.totals.booked) * 100) 
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Achievement Badges</CardTitle>
            <CardDescription className="text-gray-400">
              Milestones you've reached
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className={`text-center p-3 rounded-lg ${impactStats.totals.booked > 0 ? 'bg-yellow-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`h-8 w-8 mx-auto mb-2 ${impactStats.totals.booked > 0 ? 'text-yellow-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${impactStats.totals.booked > 0 ? 'text-gray-300' : 'text-gray-400'}`}>First Claim</p>
                <p className={`text-xs ${impactStats.totals.booked > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {impactStats.totals.booked > 0 ? 'Completed' : 'Pending'}
                </p>
              </div>
              
              <div className={`text-center p-3 rounded-lg ${impactStats.totalImpact.mealsSaved >= 10 ? 'bg-emerald-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`h-8 w-8 mx-auto mb-2 ${impactStats.totalImpact.mealsSaved >= 10 ? 'text-emerald-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${impactStats.totalImpact.mealsSaved >= 10 ? 'text-gray-300' : 'text-gray-400'}`}>10 Meals</p>
                <p className={`text-xs ${impactStats.totalImpact.mealsSaved >= 10 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {impactStats.totalImpact.mealsSaved >= 10 ? 'Achieved' : `${impactStats.totalImpact.mealsSaved}/10`}
                </p>
              </div>
              
              <div className={`text-center p-3 rounded-lg ${impactStats.totalImpact.mealsSaved >= 50 ? 'bg-blue-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`h-8 w-8 mx-auto mb-2 ${impactStats.totalImpact.mealsSaved >= 50 ? 'text-blue-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${impactStats.totalImpact.mealsSaved >= 50 ? 'text-gray-300' : 'text-gray-400'}`}>50 Meals</p>
                <p className={`text-xs ${impactStats.totalImpact.mealsSaved >= 50 ? 'text-blue-400' : 'text-gray-500'}`}>
                  {impactStats.totalImpact.mealsSaved >= 50 ? 'Achieved' : `${impactStats.totalImpact.mealsSaved}/50`}
                </p>
              </div>
              
              <div className={`text-center p-3 rounded-lg ${impactStats.stats.impactScore >= 1000 ? 'bg-purple-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`h-8 w-8 mx-auto mb-2 ${impactStats.stats.impactScore >= 1000 ? 'text-purple-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${impactStats.stats.impactScore >= 1000 ? 'text-gray-300' : 'text-gray-400'}`}>Eco Hero</p>
                <p className={`text-xs ${impactStats.stats.impactScore >= 1000 ? 'text-purple-400' : 'text-gray-500'}`}>
                  {impactStats.stats.impactScore >= 1000 ? 'Achieved' : `${impactStats.stats.impactScore}/1000`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}