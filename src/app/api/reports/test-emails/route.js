// Test endpoint to verify email fetching from database
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import reportDataService from '@/services/reportDataService';
import reportGenerationService from '@/services/reportGenerationService';

// GET /api/reports/test-emails - Test email fetching and bulk operations
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'fetch';

    let result = {};

    switch (action) {
      case 'fetch':
        // Test fetching all users with emails
        const providers = await reportDataService.getAllProviders();
        const recipients = await reportDataService.getAllRecipients();
        const allUsers = await reportDataService.getAllUsers();

        result = {
          providers: {
            count: providers.length,
            sample: providers.slice(0, 3).map(p => ({ 
              name: p.name, 
              email: p.email,
              userId: p.userId 
            }))
          },
          recipients: {
            count: recipients.length,
            sample: recipients.slice(0, 3).map(r => ({ 
              name: r.name, 
              email: r.email,
              userId: r.userId 
            }))
          },
          allUsers: {
            count: allUsers.length,
            byRole: allUsers.reduce((acc, user) => {
              acc[user.role] = (acc[user.role] || 0) + 1;
              return acc;
            }, {})
          }
        };
        break;

      case 'test-bulk-generation':
        // Test bulk report generation (without sending emails)
        const providerReports = await reportGenerationService.generateBulkReports('provider', 'weekly');
        const recipientReports = await reportGenerationService.generateBulkReports('recipient', 'weekly');

        result = {
          providerReports: {
            count: providerReports.length,
            sample: providerReports.slice(0, 2).map(r => ({
              id: r.id,
              type: r.type,
              userEmail: r.userEmail,
              userName: r.userName,
              hasNarrative: !!r.narrative
            }))
          },
          recipientReports: {
            count: recipientReports.length,
            sample: recipientReports.slice(0, 2).map(r => ({
              id: r.id,
              type: r.type,
              userEmail: r.userEmail,
              userName: r.userName,
              hasNarrative: !!r.narrative
            }))
          }
        };
        break;

      case 'test-single-email':
        // Test sending a single email to the current user
        const testEmail = searchParams.get('email');
        if (!testEmail) {
          return NextResponse.json({ error: 'Email parameter required for test-single-email' }, { status: 400 });
        }

        // Generate a test report for the current user
        try {
          const testReport = await reportGenerationService.generateProviderReport(userId, 'weekly');
          
          // Send test email
          const emailService = (await import('@/services/emailService')).default;
          const emailResult = await emailService.sendReportEmail(testReport, {
            email: testEmail,
            name: 'Test User'
          });

          result = {
            emailSent: emailResult.success,
            messageId: emailResult.messageId,
            testEmail,
            reportGenerated: !!testReport
          };
        } catch (error) {
          // If provider report fails, try recipient report
          try {
            const testReport = await reportGenerationService.generateRecipientReport(userId, 'weekly');
            
            const emailService = (await import('@/services/emailService')).default;
            const emailResult = await emailService.sendReportEmail(testReport, {
              email: testEmail,
              name: 'Test User'
            });

            result = {
              emailSent: emailResult.success,
              messageId: emailResult.messageId,
              testEmail,
              reportGenerated: !!testReport,
              note: 'Used recipient report as provider report failed'
            };
          } catch (recipientError) {
            result = {
              emailSent: false,
              error: `Both provider and recipient report generation failed: ${error.message}`,
              testEmail
            };
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action. Use: fetch, test-bulk-generation, or test-single-email' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('Error in test-emails endpoint:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/reports/test-emails - Test bulk email sending
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userType = 'provider', 
      reportType = 'weekly', 
      maxEmails = 3,
      testMode = true 
    } = body;

    if (!['provider', 'recipient'].includes(userType)) {
      return NextResponse.json({ error: 'Invalid userType. Use provider or recipient' }, { status: 400 });
    }

    let result;

    if (testMode) {
      // Test mode: generate reports but don't send emails
      const reports = await reportGenerationService.generateBulkReports(userType, reportType);
      
      result = {
        testMode: true,
        reportsGenerated: reports.length,
        maxEmails,
        sampleReports: reports.slice(0, maxEmails).map(r => ({
          id: r.id,
          userEmail: r.userEmail,
          userName: r.userName,
          type: r.type,
          reportType: r.reportType,
          hasNarrative: !!r.narrative,
          narrativeLength: r.narrative?.length || 0
        }))
      };
    } else {
      // Live mode: generate and send emails (limited by maxEmails)
      const allReports = await reportGenerationService.generateBulkReports(userType, reportType);
      const reportsToSend = allReports.slice(0, maxEmails);
      
      const emailService = (await import('@/services/emailService')).default;
      const emailResults = [];
      
      for (const report of reportsToSend) {
        try {
          const emailResult = await emailService.sendReportEmail(report, {
            email: report.userEmail,
            name: report.userName
          });
          
          emailResults.push({
            email: report.userEmail,
            success: emailResult.success,
            messageId: emailResult.messageId
          });
        } catch (error) {
          emailResults.push({
            email: report.userEmail,
            success: false,
            error: error.message
          });
        }
      }
      
      result = {
        testMode: false,
        reportsGenerated: allReports.length,
        emailsSent: emailResults.filter(r => r.success).length,
        emailsFailed: emailResults.filter(r => !r.success).length,
        maxEmails,
        emailResults
      };
    }

    return NextResponse.json({
      success: true,
      userType,
      reportType,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('Error in bulk email test:', error);
    return NextResponse.json(
      { error: 'Bulk email test failed', details: error.message },
      { status: 500 }
    );
  }
}
