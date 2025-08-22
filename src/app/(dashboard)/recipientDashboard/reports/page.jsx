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

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Impact Report
            </h3>
            <p className="text-gray-400">
              {formatDate(report.period.start)} - {formatDate(report.period.end)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Generated: {formatDate(report.generatedAt)}
            </span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
        </div>

        {/* Key Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ReportCard className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-700">
            <div className="text-center">
              <Utensils className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {report.data.impact.mealsSaved}
              </div>
              <div className="text-sm text-emerald-200">Meals Saved</div>
            </div>
          </ReportCard>
          
          <ReportCard className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
            <div className="text-center">
              <Globe className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {report.data.impact.carbonSaved}kg
              </div>
              <div className="text-sm text-blue-200">CO₂ Saved</div>
            </div>
          </ReportCard>
          
          <ReportCard className="bg-gradient-to-r from-cyan-900 to-cyan-800 border-cyan-700">
            <div className="text-center">
              <Droplet className="w-8 h-8 text-cyan-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {report.data.impact.waterSaved}L
              </div>
              <div className="text-sm text-cyan-200">Water Saved</div>
            </div>
          </ReportCard>
          
          <ReportCard className="bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-700">
            <div className="text-center">
              <Award className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {report.data.impact.impactScore}
              </div>
              <div className="text-sm text-yellow-200">Impact Score</div>
            </div>
          </ReportCard>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReportCard>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">
                {report.data.activity.totalBooked}
              </div>
              <div className="text-sm text-gray-400">Total Bookings</div>
            </div>
          </ReportCard>
          
          <ReportCard>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">
                {report.data.activity.totalCompleted}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
          </ReportCard>
          
          <ReportCard>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">
                {report.data.activity.successRate}%
              </div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </ReportCard>
        </div>

        {/* AI-Generated Report */}
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

        {/* Achievements */}
        {report.data.achievements && (
          <ReportCard>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Achievement Progress</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`text-center p-3 rounded-lg ${report.data.achievements.firstClaim ? 'bg-yellow-900/30' : 'bg-gray-700/30'}`}>
                  <Award className={`w-6 h-6 mx-auto mb-2 ${report.data.achievements.firstClaim ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <p className={`text-sm font-medium ${report.data.achievements.firstClaim ? 'text-gray-300' : 'text-gray-400'}`}>First Claim</p>
                  <p className={`text-xs ${report.data.achievements.firstClaim ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {report.data.achievements.firstClaim ? 'Completed' : 'Pending'}
                  </p>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${report.data.achievements.tenMeals ? 'bg-emerald-900/30' : 'bg-gray-700/30'}`}>
                  <Award className={`w-6 h-6 mx-auto mb-2 ${report.data.achievements.tenMeals ? 'text-emerald-400' : 'text-gray-500'}`} />
                  <p className={`text-sm font-medium ${report.data.achievements.tenMeals ? 'text-gray-300' : 'text-gray-400'}`}>10 Meals</p>
                  <p className={`text-xs ${report.data.achievements.tenMeals ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {report.data.achievements.tenMeals ? 'Achieved' : `${report.data.achievements.progress?.tenMeals || 0}/10`}
                  </p>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${report.data.achievements.fiftyMeals ? 'bg-blue-900/30' : 'bg-gray-700/30'}`}>
                  <Award className={`w-6 h-6 mx-auto mb-2 ${report.data.achievements.fiftyMeals ? 'text-blue-400' : 'text-gray-500'}`} />
                  <p className={`text-sm font-medium ${report.data.achievements.fiftyMeals ? 'text-gray-300' : 'text-gray-400'}`}>50 Meals</p>
                  <p className={`text-xs ${report.data.achievements.fiftyMeals ? 'text-blue-400' : 'text-gray-500'}`}>
                    {report.data.achievements.fiftyMeals ? 'Achieved' : `${report.data.achievements.progress?.fiftyMeals || 0}/50`}
                  </p>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${report.data.achievements.ecoHero ? 'bg-purple-900/30' : 'bg-gray-700/30'}`}>
                  <Award className={`w-6 h-6 mx-auto mb-2 ${report.data.achievements.ecoHero ? 'text-purple-400' : 'text-gray-500'}`} />
                  <p className={`text-sm font-medium ${report.data.achievements.ecoHero ? 'text-gray-300' : 'text-gray-400'}`}>Eco Hero</p>
                  <p className={`text-xs ${report.data.achievements.ecoHero ? 'text-purple-400' : 'text-gray-500'}`}>
                    {report.data.achievements.ecoHero ? 'Achieved' : `${report.data.achievements.progress?.ecoHero || 0}/1000`}
                  </p>
                </div>
              </div>
            </div>
          </ReportCard>
        )}

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
