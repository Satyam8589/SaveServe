'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  Award, 
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Utensils,
  Globe,
  Droplet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

// Card Component
const ReportCard = ({ children, className = '' }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

export default function RecipientReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState('weekly');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current report
  const { 
    data: reportData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['recipient-report', selectedReportType],
    queryFn: async () => {
      const response = await fetch(`/api/reports?type=${selectedReportType}&userType=recipient`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate new report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ reportType, sendEmail }) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          userType: 'recipient',
          sendEmail,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['recipient-report']);
      toast.success('Report generated successfully!');
      if (data.emailTriggered) {
        toast.success('Report email will be sent shortly');
      }
    },
    onError: (error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const handleGenerateReport = async (sendEmail = false) => {
    setIsGenerating(true);
    try {
      await generateReportMutation.mutateAsync({
        reportType: selectedReportType,
        sendEmail,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderReportContent = (report) => {
    if (!report) return null;

    // Handle different data structures - check if data is nested or direct
    const impactData = report.data?.impact || report.impact || {};
    const activityData = report.data?.activity || report.activity || {};
    const periodData = report.period || {};

    // Provide fallback values for missing data
    const metrics = {
      mealsSaved: impactData.mealsSaved || 0,
      carbonSaved: impactData.carbonSaved || '0.0',
      waterSaved: impactData.waterSaved || 0,
      impactScore: impactData.impactScore || 0,
      totalBooked: activityData.totalBooked || 0,
      totalCompleted: activityData.totalCompleted || 0,
      successRate: activityData.successRate || 0
    };

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {(report.reportType || 'Weekly').charAt(0).toUpperCase() + (report.reportType || 'weekly').slice(1)} Impact Report
            </h3>
            <p className="text-gray-400">
              {periodData.start ? formatDate(periodData.start) : 'Recent Period'} - {periodData.end ? formatDate(periodData.end) : 'Now'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Generated: {report.generatedAt ? formatDate(report.generatedAt) : 'Just now'}
            </span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
        </div>

        {/* Data Status Indicator */}
        {report.hasRealData === false && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-200">
                Using demo data - Start using SaveServe to see your real impact!
              </span>
            </div>
          </div>
        )}

        {/* Key Impact Metrics - Only Completed Food */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ReportCard className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-700">
            <div className="text-center">
              <Utensils className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {metrics.mealsSaved}
              </div>
              <div className="text-sm text-emerald-200">Meals Rescued</div>
              <div className="text-xs text-emerald-300 mt-1">Actually Picked Up</div>
            </div>
          </ReportCard>

          <ReportCard className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
            <div className="text-center">
              <Globe className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {metrics.carbonSaved}kg
              </div>
              <div className="text-sm text-blue-200">CO₂ Saved</div>
              <div className="text-xs text-blue-300 mt-1">From Completed Rescues</div>
            </div>
          </ReportCard>

          <ReportCard className="bg-gradient-to-r from-cyan-900 to-cyan-800 border-cyan-700">
            <div className="text-center">
              <Droplet className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {metrics.waterSaved}L
              </div>
              <div className="text-sm text-cyan-200">Water Saved</div>
              <div className="text-xs text-cyan-300 mt-1">From Rescued Food</div>
            </div>
          </ReportCard>

          <ReportCard className="bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-700">
            <div className="text-center">
              <Award className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {metrics.impactScore}
              </div>
              <div className="text-sm text-yellow-200">Impact Score</div>
              <div className="text-xs text-yellow-300 mt-1">Based on Completions</div>
            </div>
          </ReportCard>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReportCard>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">
                {metrics.totalBooked}
              </div>
              <div className="text-sm text-gray-400">Total Bookings</div>
              <div className="text-xs text-gray-500 mt-1">All Attempts</div>
            </div>
          </ReportCard>

          <ReportCard>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">
                {metrics.totalCompleted}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
              <div className="text-xs text-gray-500 mt-1">Successfully Picked Up</div>
            </div>
          </ReportCard>

          <ReportCard>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">
                {metrics.successRate}%
              </div>
              <div className="text-sm text-gray-400">Success Rate</div>
              <div className="text-xs text-gray-500 mt-1">Completion Rate</div>
            </div>
          </ReportCard>
        </div>

        {/* AI-Generated Report */}
        {report.narrative && (
          <ReportCard>
            <div className="space-y-4">
              <div className="flex items-center">
                <Award className="w-5 h-5 text-emerald-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Your Impact Story</h4>
              </div>
              <div className="prose prose-invert max-w-none">
                <div
                  className="text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: report.narrative.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              </div>
            </div>
          </ReportCard>
        )}

        {/* Summary Card when no narrative */}
        {!report.narrative && (
          <ReportCard>
            <div className="space-y-4">
              <div className="flex items-center">
                <Award className="w-5 h-5 text-emerald-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Your Impact Summary</h4>
              </div>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-3">
                  <strong>Great work this {report.reportType || 'period'}!</strong> You've made a real difference in fighting food waste.
                </p>
                <p className="mb-3">
                  Your <strong>{metrics.mealsSaved} rescued meals</strong> represent actual food that was saved from waste and put to good use.
                  This prevented <strong>{metrics.carbonSaved}kg of CO₂</strong> from entering the atmosphere and saved <strong>{metrics.waterSaved} liters</strong> of water.
                </p>
                <p>
                  With a <strong>{metrics.successRate}% completion rate</strong> ({metrics.totalCompleted} completed out of {metrics.totalBooked} bookings),
                  you're showing real commitment to the cause. Keep up the excellent work! 🌱
                </p>
              </div>
            </div>
          </ReportCard>
        )}

        {/* Achievements */}
        <ReportCard>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Achievement Progress</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-3 rounded-lg ${metrics.totalCompleted > 0 ? 'bg-yellow-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`w-6 h-6 mx-auto mb-2 ${metrics.totalCompleted > 0 ? 'text-yellow-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${metrics.totalCompleted > 0 ? 'text-gray-300' : 'text-gray-400'}`}>First Rescue</p>
                <p className={`text-xs ${metrics.totalCompleted > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {metrics.totalCompleted > 0 ? 'Completed' : 'Pending'}
                </p>
              </div>

              <div className={`text-center p-3 rounded-lg ${metrics.mealsSaved >= 10 ? 'bg-emerald-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`w-6 h-6 mx-auto mb-2 ${metrics.mealsSaved >= 10 ? 'text-emerald-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${metrics.mealsSaved >= 10 ? 'text-gray-300' : 'text-gray-400'}`}>10 Meals</p>
                <p className={`text-xs ${metrics.mealsSaved >= 10 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {metrics.mealsSaved >= 10 ? 'Achieved' : `${metrics.mealsSaved}/10`}
                </p>
              </div>

              <div className={`text-center p-3 rounded-lg ${metrics.mealsSaved >= 50 ? 'bg-blue-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`w-6 h-6 mx-auto mb-2 ${metrics.mealsSaved >= 50 ? 'text-blue-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${metrics.mealsSaved >= 50 ? 'text-gray-300' : 'text-gray-400'}`}>50 Meals</p>
                <p className={`text-xs ${metrics.mealsSaved >= 50 ? 'text-blue-400' : 'text-gray-500'}`}>
                  {metrics.mealsSaved >= 50 ? 'Achieved' : `${metrics.mealsSaved}/50`}
                </p>
              </div>

              <div className={`text-center p-3 rounded-lg ${metrics.successRate >= 80 ? 'bg-purple-900/30' : 'bg-gray-700/30'}`}>
                <Award className={`w-6 h-6 mx-auto mb-2 ${metrics.successRate >= 80 ? 'text-purple-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${metrics.successRate >= 80 ? 'text-gray-300' : 'text-gray-400'}`}>Reliable</p>
                <p className={`text-xs ${metrics.successRate >= 80 ? 'text-purple-400' : 'text-gray-500'}`}>
                  {metrics.successRate >= 80 ? 'Achieved' : `${metrics.successRate}%/80%`}
                </p>
              </div>
            </div>
          </div>
        </ReportCard>

        {/* Summary */}
        <ReportCard>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Report Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-white font-medium">{report.summary.successRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Key Metric:</span>
                  <span className="text-emerald-400 font-medium">{report.summary.keyMetric}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Environmental Impact:</span>
                  <span className="text-white font-medium">
                    {report.summary.environmentalImpact.carbonSaved}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Waste Reduced:</span>
                  <span className="text-white font-medium">
                    {report.summary.environmentalImpact.wasteReduced}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ReportCard>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Impact Reports</h1>
            <p className="text-gray-400">Track your food rescue journey and environmental impact</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => handleGenerateReport(true)}
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Email Report
            </Button>
            <Button
              onClick={() => handleGenerateReport(false)}
              disabled={isGenerating}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Report
            </Button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <Tabs value={selectedReportType} onValueChange={setSelectedReportType}>
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="daily" className="data-[state=active]:bg-emerald-600">
              <Calendar className="w-4 h-4 mr-2" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-emerald-600">
              <Calendar className="w-4 h-4 mr-2" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-emerald-600">
              <Calendar className="w-4 h-4 mr-2" />
              Monthly
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedReportType} className="mt-6">
            {isLoading ? (
              <ReportCard>
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mr-3" />
                  <span className="text-gray-300">Loading report...</span>
                </div>
              </ReportCard>
            ) : error ? (
              <ReportCard className="border-red-900/50 bg-red-900/10">
                <div className="flex items-center justify-center py-12">
                  <AlertCircle className="w-8 h-8 text-red-400 mr-3" />
                  <div className="text-center">
                    <p className="text-red-400 font-medium">Failed to load report</p>
                    <p className="text-gray-400 text-sm mt-1">{error.message}</p>
                    <Button
                      onClick={() => refetch()}
                      variant="outline"
                      className="mt-3 border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </ReportCard>
            ) : reportData?.report ? (
              renderReportContent(reportData.report)
            ) : (
              <ReportCard>
                <div className="flex items-center justify-center py-12">
                  <FileText className="w-8 h-8 text-gray-500 mr-3" />
                  <div className="text-center">
                    <p className="text-gray-400">No report available</p>
                    <p className="text-gray-500 text-sm mt-1">Generate a new report to get started</p>
                    <Button
                      onClick={() => handleGenerateReport(false)}
                      className="mt-3 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Generate Report
                    </Button>
                  </div>
                </div>
              </ReportCard>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
