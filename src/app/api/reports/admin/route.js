// Admin API endpoints for platform reports and bulk operations
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import reportGenerationService from '@/services/reportGenerationService';
import emailService from '@/services/emailService';
import { triggerReportGeneration } from '@/lib/inngest';

// Helper function to check admin permissions
async function checkAdminPermissions() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check if user has admin role
  const userRole = sessionClaims?.metadata?.role;
  if (userRole !== 'admin') {
    throw new Error('Admin access required');
  }

  return userId;
}

// GET /api/reports/admin - Get platform reports
export async function GET(request) {
  try {
    await checkAdminPermissions();

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'weekly';

    if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Generate platform report
    const platformReport = await reportGenerationService.generatePlatformReport(reportType);

    return NextResponse.json({
      success: true,
      report: platformReport,
    });
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    const status = error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin reports' },
      { status }
    );
  }
}

// POST /api/reports/admin - Trigger bulk report generation
export async function POST(request) {
  try {
    await checkAdminPermissions();

    const body = await request.json();
    const { 
      action, 
      reportType = 'weekly', 
      userType = 'all', 
      sendEmails = false 
    } = body;

    if (!['generate', 'send', 'test'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    let result = {};

    switch (action) {
      case 'generate':
        if (userType === 'all' || userType === 'provider') {
          if (sendEmails) {
            const providerResults = await reportGenerationService.generateAndSendBulkReports('provider', reportType);
            result.providerReports = providerResults.reportsGenerated;
            result.providerEmailsSent = providerResults.emailsSent;
            result.providerEmailsFailed = providerResults.emailsFailed;
          } else {
            const providerReports = await reportGenerationService.generateBulkReports('provider', reportType);
            result.providerReports = providerReports.length;
          }
        }

        if (userType === 'all' || userType === 'recipient') {
          if (sendEmails) {
            const recipientResults = await reportGenerationService.generateAndSendBulkReports('recipient', reportType);
            result.recipientReports = recipientResults.reportsGenerated;
            result.recipientEmailsSent = recipientResults.emailsSent;
            result.recipientEmailsFailed = recipientResults.emailsFailed;
          } else {
            const recipientReports = await reportGenerationService.generateBulkReports('recipient', reportType);
            result.recipientReports = recipientReports.length;
          }
        }

        if (userType === 'all' || userType === 'platform') {
          const platformReport = await reportGenerationService.generatePlatformReport(reportType);
          result.platformReport = !!platformReport;

          if (sendEmails && platformReport) {
            await emailService.sendAdminSummary(platformReport);
            result.platformEmailSent = true;
          }
        }
        break;

      case 'send':
        // Generate and send reports directly
        if (userType === 'all' || userType === 'provider') {
          const providerResults = await reportGenerationService.generateAndSendBulkReports('provider', reportType);
          result.providerEmailsSent = providerResults.emailsSent;
          result.providerEmailsFailed = providerResults.emailsFailed;
        }
        if (userType === 'all' || userType === 'recipient') {
          const recipientResults = await reportGenerationService.generateAndSendBulkReports('recipient', reportType);
          result.recipientEmailsSent = recipientResults.emailsSent;
          result.recipientEmailsFailed = recipientResults.emailsFailed;
        }
        if (userType === 'all' || userType === 'platform') {
          const platformReport = await reportGenerationService.generatePlatformReport(reportType);
          if (platformReport) {
            await emailService.sendAdminSummary(platformReport);
            result.platformEmailSent = true;
          }
        }
        break;

      case 'test':
        // Test email configuration
        const testResult = await emailService.testEmailConfiguration();
        result.emailTest = testResult;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      reportType,
      userType,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in admin reports operation:', error);
    const status = error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to execute admin operation' },
      { status }
    );
  }
}
