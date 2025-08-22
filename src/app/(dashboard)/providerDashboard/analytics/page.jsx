'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  Leaf,
  Droplets,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb,
  Utensils,
  Recycle,
  RefreshCw,
  TrendingDown,
  Award,
  Calendar,
  MapPin,
  Brain,
  Sparkles,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import providerAnalyticsService from '@/services/providerAnalyticsService';

// Dark theme color palette
const COLORS = {
  emerald: '#10b981', // emerald-500
  orange: '#fb923c',  // orange-400
  amber: '#fbbf24',   // amber-400
  blue: '#60a5fa',    // blue-400
  red: '#f87171',     // red-400
  green: '#4ade80',   // green-400
  purple: '#a855f7',  // purple-500
  slate: '#1e293b',   // slate-800
  gray: '#374151',    // gray-700
};

const CHART_COLORS = [COLORS.emerald, COLORS.orange, COLORS.amber, COLORS.blue, COLORS.red, COLORS.green];

// Reusable Card Component
const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

// KPI Card Component
const KPICard = ({ icon: Icon, title, value, subtitle, color = COLORS.emerald, trend = null }) => (
  <Card className="relative overflow-hidden group hover:border-gray-600 transition-colors duration-200">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {subtitle && (
          <p className="text-gray-500 text-sm">{subtitle}</p>
        )}
      </div>
      <div className="relative">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity duration-200"
          style={{ backgroundColor: color }}
        />
        <Icon 
          className="w-8 h-8 absolute inset-0 m-auto group-hover:scale-110 transition-transform duration-200"
          style={{ color }}
        />
      </div>
    </div>
    {trend !== null && (
      <div className="flex items-center mt-3 text-sm">
        {trend > 0 ? (
          <TrendingUp className="w-4 h-4 mr-1" style={{ color: COLORS.green }} />
        ) : (
          <TrendingDown className="w-4 h-4 mr-1" style={{ color: COLORS.red }} />
        )}
        <span style={{ color: trend > 0 ? COLORS.green : COLORS.red }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-gray-500 ml-1">vs last period</span>
      </div>
    )}
    <div 
      className="absolute top-0 right-0 w-1 h-full opacity-50"
      style={{ backgroundColor: color }}
    />
  </Card>
);

// Loading Component
const LoadingCard = ({ height = 'auto' }) => (
  <Card className="animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      <div className="h-8 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      {height !== 'auto' && (
        <div className={`bg-gray-700 rounded ${height}`}></div>
      )}
    </div>
  </Card>
);

// Error Component
const ErrorCard = ({ error, retry, title = "Error Loading Data" }) => (
  <Card className="border-red-900/50 bg-red-900/10">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-red-400 font-medium flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {title}
        </h3>
        <p className="text-gray-400 text-sm mt-1">{error?.message || 'Something went wrong'}</p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      )}
    </div>
  </Card>
);

// Enhanced Recommendation Card Component with AI indicators
const RecommendationCard = ({ recommendation, isAIPowered = false }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.red;
      case 'medium': return COLORS.orange;
      case 'low': return COLORS.blue;
      default: return COLORS.gray;
    }
  };

  const getPriorityIcon = (type) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'timing': return Clock;
      case 'category': return Utensils;
      case 'strategy': return Brain;
      case 'portion': return TrendingDown;
      default: return Lightbulb;
    }
  };

  const Icon = getPriorityIcon(recommendation.type);
  const color = getPriorityColor(recommendation.priority);

  return (
    <div className={`flex items-start space-x-4 p-4 border rounded-lg transition-all duration-200 hover:border-gray-600 ${
      isAIPowered
        ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-900/10 to-gray-800/50 hover:from-emerald-900/20'
        : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800/70'
    }`}>
      <div className="flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
          {isAIPowered && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-white truncate">{recommendation.title}</h4>
            {isAIPowered && (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30 flex items-center">
                <Brain className="w-3 h-3 mr-1" />
                AI
              </span>
            )}
          </div>
          <span
            className="px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2"
            style={{
              backgroundColor: `${color}20`,
              color: color,
              border: `1px solid ${color}40`
            }}
          >
            {recommendation.priority}
          </span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">{recommendation.description}</p>
        {recommendation.expectedImpact && (
          <div className="flex items-center text-xs text-emerald-400">
            <TrendingUpIcon className="w-3 h-3 mr-1" />
            <span>Expected impact: {recommendation.expectedImpact}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart Container Component
const ChartContainer = ({ title, icon: Icon, children, isLoading, error, emptyMessage }) => (
  <Card>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3" style={{ color: COLORS.emerald }} />
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
    </div>
    {isLoading ? (
      <div className="h-80 bg-gray-700/30 rounded-lg animate-pulse flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    ) : error ? (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <p>Failed to load chart data</p>
        </div>
      </div>
    ) : (
      children || (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{emptyMessage || 'No data available'}</p>
          </div>
        </div>
      )
    )}
  </Card>
);

export default function ProviderAnalyticsPage() {
  // Fetch all analytics data with React Query
  const { 
    data: kpis, 
    error: kpisError, 
    isLoading: kpisLoading,
    refetch: refetchKpis
  } = useQuery({
    queryKey: ['provider-kpis'],
    queryFn: () => providerAnalyticsService.getKPIs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const { 
    data: trendData, 
    error: trendError, 
    isLoading: trendLoading,
    refetch: refetchTrend
  } = useQuery({
    queryKey: ['provider-trend'],
    queryFn: () => providerAnalyticsService.getTrend(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const { 
    data: categoryData, 
    error: categoryError, 
    isLoading: categoryLoading,
    refetch: refetchCategory
  } = useQuery({
    queryKey: ['provider-categories'],
    queryFn: () => providerAnalyticsService.getCategoryBreakdown(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });

  const { 
    data: efficiencyData, 
    error: efficiencyError, 
    isLoading: efficiencyLoading,
    refetch: refetchEfficiency
  } = useQuery({
    queryKey: ['provider-efficiency'],
    queryFn: () => providerAnalyticsService.getEfficiencyData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const { 
    data: recommendations, 
    error: recommendationsError, 
    isLoading: recommendationsLoading,
    refetch: refetchRecommendations
  } = useQuery({
    queryKey: ['provider-recommendations'],
    queryFn: () => providerAnalyticsService.getRecommendations(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mr-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Provider Analytics</h1>
              <p className="text-gray-400 text-lg">Track your food sharing impact and discover ways to reduce waste</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>Campus Analytics</span>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpisLoading ? (
              Array.from({ length: 4 }, (_, i) => <LoadingCard key={i} />)
            ) : kpisError ? (
              <div className="col-span-full">
                <ErrorCard error={kpisError} retry={refetchKpis} title="Failed to load KPI data" />
              </div>
            ) : kpis ? (
              <>
                <KPICard
                  icon={Utensils}
                  title="Total Food Listed"
                  value={kpis.totalFoodListed.toLocaleString()}
                  subtitle="servings shared"
                  color={COLORS.emerald}
                />
                <KPICard
                  icon={Target}
                  title="Food Collected"
                  value={kpis.totalFoodCollected.toLocaleString()}
                  subtitle={`${(100 - parseFloat(kpis.wastePercentage)).toFixed(1)}% efficiency`}
                  color={COLORS.orange}
                />
                <KPICard
                  icon={Leaf}
                  title="CO₂ Saved"
                  value={`${kpis.carbonSaved.toLocaleString()} kg`}
                  subtitle="carbon footprint reduced"
                  color={COLORS.green}
                />
                <KPICard
                  icon={Droplets}
                  title="Water Saved"
                  value={`${(kpis.waterSaved / 1000).toFixed(1)}K L`}
                  subtitle="water conserved"
                  color={COLORS.blue}
                />
              </>
            ) : null}
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trend Chart */}
          <ChartContainer
            title="Weekly Food Trends"
            icon={TrendingUp}
            isLoading={trendLoading}
            error={trendError}
            emptyMessage="No trend data available yet"
          >
            {trendData && trendData.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: '#9ca3af' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="listed" 
                    stroke={COLORS.orange} 
                    strokeWidth={3}
                    name="Listed"
                    dot={{ fill: COLORS.orange, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.orange, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="collected" 
                    stroke={COLORS.emerald} 
                    strokeWidth={3}
                    name="Collected"
                    dot={{ fill: COLORS.emerald, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.emerald, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* Category Breakdown Pie Chart */}
          <ChartContainer
            title="Food Category Distribution"
            icon={PieChartIcon}
            isLoading={categoryLoading}
            error={categoryError}
            emptyMessage="No category data available"
          >
            {categoryData && categoryData.length > 0 && (
              <div className="flex flex-col space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="quantity"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {categoryData.map((item, index) => (
                    <div key={item.category} className="flex items-center text-sm p-2 bg-gray-700/30 rounded">
                      <div 
                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-300 truncate">{item.category}</div>
                        <div className="text-gray-500 text-xs">{item.quantity} servings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartContainer>
        </section>

        {/* Efficiency Chart - Full Width */}
        <section>
          <ChartContainer
            title="Recent Listing Performance"
            icon={Award}
            isLoading={efficiencyLoading}
            error={efficiencyError}
            emptyMessage="No efficiency data available"
          >
            {efficiencyData && efficiencyData.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="title" 
                    stroke="#9ca3af"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="listed" fill={COLORS.orange} name="Listed" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="collected" fill={COLORS.emerald} name="Collected" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="wasted" fill={COLORS.red} name="Wasted" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </section>

        {/* Insights & Recommendations Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Surplus Insights Card */}
          <Card className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-amber-600/20 rounded-full flex items-center justify-center mr-3">
                <Recycle className="w-5 h-5" style={{ color: COLORS.amber }} />
              </div>
              <h3 className="text-xl font-semibold text-white">Surplus Insights</h3>
            </div>
            {recommendationsLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ) : recommendationsError ? (
              <ErrorCard error={recommendationsError} retry={refetchRecommendations} title="Failed to load insights" />
            ) : recommendations ? (
              <div className="space-y-6">
                <div className="prose prose-sm prose-invert">
                  <p className="text-gray-300 leading-relaxed">
                    {recommendations.summary}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gradient-to-r from-emerald-600/10 to-emerald-600/5 border border-emerald-600/20 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5 mr-2" style={{ color: COLORS.emerald }} />
                      <span className="text-3xl font-bold text-white">
                        {recommendations.totalListings}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Total Listings (60 days)</p>
                  </div>
                  <div className={`bg-gradient-to-r ${parseFloat(recommendations.overallWasteRate) > 20 ? 'from-red-600/10 to-red-600/5 border-red-600/20' : 'from-green-600/10 to-green-600/5 border-green-600/20'} border rounded-lg p-4 text-center`}>
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 mr-2" style={{ 
                        color: parseFloat(recommendations.overallWasteRate) > 20 ? COLORS.red : COLORS.green 
                      }} />
                      <span className="text-3xl font-bold text-white">
                        {recommendations.overallWasteRate}%
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Overall Waste Rate</p>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          {/* Recommendations Card */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  recommendations?.aiPowered
                    ? 'bg-gradient-to-r from-emerald-600/20 to-green-600/20'
                    : 'bg-green-600/20'
                }`}>
                  {recommendations?.aiPowered ? (
                    <Brain className="w-5 h-5" style={{ color: COLORS.emerald }} />
                  ) : (
                    <Lightbulb className="w-5 h-5" style={{ color: COLORS.green }} />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold text-white">Smart Recommendations</h3>
                  {recommendations?.aiPowered && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30 flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI-Powered
                    </span>
                  )}
                </div>
              </div>
              {!recommendationsLoading && !recommendationsError && recommendations && (
                <button
                  onClick={refetchRecommendations}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </button>
              )}
            </div>

            {recommendationsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50 animate-pulse">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendationsError ? (
              <ErrorCard error={recommendationsError} retry={refetchRecommendations} title="Failed to load recommendations" />
            ) : recommendations && recommendations.recommendations ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {recommendations.recommendations.length > 0 ? (
                  recommendations.recommendations.map((rec, index) => (
                    <RecommendationCard
                      key={index}
                      recommendation={rec}
                      isAIPowered={recommendations.aiPowered}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10" style={{ color: COLORS.green }} />
                    </div>
                    <h4 className="text-white font-medium mb-2">Excellent Performance!</h4>
                    <p className="text-gray-400 text-sm">No recommendations needed at this time.</p>
                    <p className="text-gray-500 text-xs mt-1">Keep up the great work with food sharing!</p>
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        </section>

        {/* AI Insights Section - Only show if AI-powered recommendations are available */}
        {recommendations?.aiPowered && recommendations?.insights && (
          <section>
            <Card>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mr-3">
                  <Brain className="w-5 h-5" style={{ color: COLORS.purple }} />
                </div>
                <h3 className="text-xl font-semibold text-white">AI Insights & Patterns</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Performance */}
                {recommendations.insights.categoryBreakdown && recommendations.insights.categoryBreakdown.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white flex items-center">
                      <Utensils className="w-4 h-4 mr-2" style={{ color: COLORS.orange }} />
                      Category Performance
                    </h4>
                    <div className="space-y-3">
                      {recommendations.insights.categoryBreakdown.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="flex-1">
                            <span className="text-white font-medium">{category.category}</span>
                            <div className="text-sm text-gray-400">
                              {category.totalListed} listed • {category.totalCollected} collected
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              parseFloat(category.wasteRate) > 25 ? 'text-red-400' :
                              parseFloat(category.wasteRate) > 15 ? 'text-orange-400' : 'text-emerald-400'
                            }`}>
                              {category.wasteRate}% waste
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day of Week Patterns */}
                {recommendations.insights.dayOfWeekPatterns && recommendations.insights.dayOfWeekPatterns.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white flex items-center">
                      <Calendar className="w-4 h-4 mr-2" style={{ color: COLORS.blue }} />
                      Weekly Patterns
                    </h4>
                    <div className="space-y-3">
                      {recommendations.insights.dayOfWeekPatterns.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="flex-1">
                            <span className="text-white font-medium">{day.day}</span>
                            <div className="text-sm text-gray-400">
                              {day.totalListed} listed • {day.totalCollected} collected
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              parseFloat(day.wasteRate) > 30 ? 'text-red-400' :
                              parseFloat(day.wasteRate) > 20 ? 'text-orange-400' : 'text-emerald-400'
                            }`}>
                              {day.wasteRate}% waste
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>
        )}

      </div>
    </div>
  );
}