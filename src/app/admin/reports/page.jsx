'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart3, 
  Users, 
  Mail, 
  Calendar, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Play,
  TestTube,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

// Card Component
const AdminCard = ({ children, className = '' }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

export default function AdminReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState('weekly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const queryClient = useQueryClient();

  // Fetch platform report
  const { 
    data: platformReport, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-platform-report', selectedReportType],
    queryFn: async () => {
      const response = await fetch(`/api/reports/admin?type=${selectedReportType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch platform report');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Test system health
  const { 
    data: systemHealth,
    isLoading: healthLoading,
    refetch: refetchHealth
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await fetch('/api/reports/test');
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Admin operations mutation
  const adminOperationMutation = useMutation({
    mutationFn: async ({ action, reportType, userType, sendEmails }) => {
      const response = await fetch('/api/reports/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reportType,
          userType,
          sendEmails,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute admin operation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-platform-report']);
      toast.success(`Operation completed successfully!`);
    },
    onError: (error) => {
      toast.error(`Operation failed: ${error.message}`);
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email) => {
      const response = await fetch('/api/reports/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Test email sent successfully!');
      setTestEmail('');
    },
    onError: (error) => {
      toast.error(`Test email failed: ${error.message}`);
    },
  });

  const handleAdminOperation = async (action, userType = 'all', sendEmails = false) => {
    setIsGenerating(true);
    try {
      await adminOperationMutation.mutateAsync({
        action,
        reportType: selectedReportType,
        userType,
        sendEmails,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }
    await testEmailMutation.mutateAsync(testEmail);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'working':
      case 'connected':
      case 'configured':
      case 'complete':
        return 'text-green-400';
      case 'issues_detected':
      case 'incomplete':
        return 'text-yellow-400';
      case 'error':
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderPlatformReport = (report) => {
    if (!report) return null;

    return (
      <div className="space-y-6">
        {/* Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <AdminCard>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">
                {report.data.platform.totalProviders}
              </div>
              <div className="text-sm text-gray-400">Providers</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">
                {report.data.platform.totalRecipients}
              </div>
              <div className="text-sm text-gray-400">Recipients</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">
                {report.data.platform.totalListings}
              </div>
              <div className="text-sm text-gray-400">Listings</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-400">
                {report.data.platform.totalBookings}
              </div>
              <div className="text-sm text-gray-400">Bookings</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">
                {report.data.platform.platformWasteReduction}%
              </div>
              <div className="text-sm text-gray-400">Efficiency</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-xl font-bold text-cyan-400">
                {report.data.platform.carbonSaved}kg
              </div>
              <div className="text-sm text-gray-400">CO₂ Saved</div>
            </div>
          </AdminCard>
        </div>

        {/* AI-Generated Summary */}
        <AdminCard>
          <div className="space-y-4">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
              <h4 className="text-lg font-semibold text-white">Platform Summary</h4>
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
        </AdminCard>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard>
            <h4 className="text-lg font-semibold text-white mb-4">Top Providers</h4>
            <div className="space-y-3">
              {report.data.topProviders?.slice(0, 5).map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                  <div>
                    <p className="text-white font-medium">{provider.name}</p>
                    <p className="text-sm text-gray-400">{provider.totalCollected} items collected</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-medium">{provider.efficiency}%</p>
                    <p className="text-xs text-gray-500">efficiency</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <h4 className="text-lg font-semibold text-white mb-4">Active Recipients</h4>
            <div className="space-y-3">
              {report.data.activeRecipients?.slice(0, 5).map((recipient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                  <div>
                    <p className="text-white font-medium">{recipient.name}</p>
                    <p className="text-sm text-gray-400">{recipient.totalBookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-medium">{recipient.successRate}%</p>
                    <p className="text-xs text-gray-500">success rate</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Reports Dashboard</h1>
            <p className="text-gray-400">Manage platform reports and system health</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => refetchHealth()}
              disabled={healthLoading}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {healthLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Health
            </Button>
          </div>
        </div>

        {/* System Health */}
        <AdminCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">System Health</h3>
              <span className={`font-medium ${getHealthStatusColor(systemHealth?.overallStatus)}`}>
                {systemHealth?.overallStatus || 'Unknown'}
              </span>
            </div>
            
            {systemHealth?.results && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(systemHealth.results).map(([component, status]) => (
                  <div key={component} className="p-3 bg-gray-700/50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 capitalize">{component}</span>
                      <span className={`text-xs font-medium ${getHealthStatusColor(status.status)}`}>
                        {status.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminCard>

        {/* Admin Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard>
            <h3 className="text-lg font-semibold text-white mb-4">Bulk Operations</h3>
            <div className="space-y-3">
              <Button
                onClick={() => handleAdminOperation('generate', 'all', false)}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Generate All Reports
              </Button>
              
              <Button
                onClick={() => handleAdminOperation('generate', 'all', true)}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Generate & Email All Reports
              </Button>
              
              <Button
                onClick={() => handleAdminOperation('send', 'all', true)}
                disabled={isGenerating}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Existing Reports
              </Button>
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="text-lg font-semibold text-white mb-4">Test Email System</h3>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter test email address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
              />
              <Button
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending || !testEmail}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {testEmailMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Send Test Email
              </Button>
            </div>
          </AdminCard>
        </div>

        {/* Platform Reports */}
        <Tabs value={selectedReportType} onValueChange={setSelectedReportType}>
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="daily" className="data-[state=active]:bg-blue-600">
              <Calendar className="w-4 h-4 mr-2" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-blue-600">
              <Calendar className="w-4 h-4 mr-2" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600">
              <Calendar className="w-4 h-4 mr-2" />
              Monthly
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedReportType} className="mt-6">
            {isLoading ? (
              <AdminCard>
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mr-3" />
                  <span className="text-gray-300">Loading platform report...</span>
                </div>
              </AdminCard>
            ) : error ? (
              <AdminCard className="border-red-900/50 bg-red-900/10">
                <div className="flex items-center justify-center py-12">
                  <AlertCircle className="w-8 h-8 text-red-400 mr-3" />
                  <div className="text-center">
                    <p className="text-red-400 font-medium">Failed to load platform report</p>
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
              </AdminCard>
            ) : platformReport?.report ? (
              renderPlatformReport(platformReport.report)
            ) : (
              <AdminCard>
                <div className="flex items-center justify-center py-12">
                  <BarChart3 className="w-8 h-8 text-gray-500 mr-3" />
                  <div className="text-center">
                    <p className="text-gray-400">No platform report available</p>
                    <p className="text-gray-500 text-sm mt-1">Generate a new report to get started</p>
                    <Button
                      onClick={() => handleAdminOperation('generate', 'platform', false)}
                      className="mt-3 bg-blue-600 hover:bg-blue-700"
                    >
                      Generate Platform Report
                    </Button>
                  </div>
                </div>
              </AdminCard>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
