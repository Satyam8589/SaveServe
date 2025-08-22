// Inngest functions for scheduled report generation
import { inngest, REPORT_EVENTS } from '../inngest';
import reportGenerationService from '@/services/reportGenerationService';
import emailService from '@/services/emailService';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

// Daily report generation function
export const generateDailyReports = inngest.createFunction(
  { id: 'generate-daily-reports' },
  { cron: process.env.DAILY_REPORT_TIME || '0 8 * * *' }, // Default: 8 AM daily
  async ({ event, step }) => {
    console.log('Starting daily report generation...');

    // Generate and send provider reports
    const providerResults = await step.run('generate-and-send-provider-reports', async () => {
      return await reportGenerationService.generateAndSendBulkReports('provider', 'daily');
    });

    // Generate and send recipient reports
    const recipientResults = await step.run('generate-and-send-recipient-reports', async () => {
      return await reportGenerationService.generateAndSendBulkReports('recipient', 'daily');
    });

    // Generate platform summary for admins
    const platformReport = await step.run('generate-platform-summary', async () => {
      return await reportGenerationService.generatePlatformReport('daily');
    });

    await step.run('send-admin-summary', async () => {
      await emailService.sendAdminSummary(platformReport);
    });

    return {
      success: true,
      providerReports: providerResults.reportsGenerated,
      providerEmailsSent: providerResults.emailsSent,
      recipientReports: recipientResults.reportsGenerated,
      recipientEmailsSent: recipientResults.emailsSent,
      platformReport: !!platformReport,
      timestamp: new Date().toISOString(),
    };
  }
);

// Weekly report generation function
export const generateWeeklyReports = inngest.createFunction(
  { id: 'generate-weekly-reports' },
  { cron: '0 9 * * 1' }, // 9 AM every Monday
  async ({ event, step }) => {
    console.log('Starting weekly report generation...');

    // Generate and send provider reports
    const providerResults = await step.run('generate-and-send-provider-reports', async () => {
      return await reportGenerationService.generateAndSendBulkReports('provider', 'weekly');
    });

    // Generate and send recipient reports
    const recipientResults = await step.run('generate-and-send-recipient-reports', async () => {
      return await reportGenerationService.generateAndSendBulkReports('recipient', 'weekly');
    });

    // Generate platform summary for admins
    const platformReport = await step.run('generate-platform-summary', async () => {
      return await reportGenerationService.generatePlatformReport('weekly');
    });

    await step.run('send-admin-summary', async () => {
      await emailService.sendAdminSummary(platformReport);
    });

    return {
      success: true,
      providerReports: providerResults.reportsGenerated,
      providerEmailsSent: providerResults.emailsSent,
      recipientReports: recipientResults.reportsGenerated,
      recipientEmailsSent: recipientResults.emailsSent,
      platformReport: !!platformReport,
      timestamp: new Date().toISOString(),
    };
  }
);

// Monthly report generation function
export const generateMonthlyReports = inngest.createFunction(
  { id: 'generate-monthly-reports' },
  { cron: '0 10 1 * *' }, // 10 AM on the 1st of every month
  async ({ event, step }) => {
    console.log('Starting monthly report generation...');

    // Generate and send provider reports
    const providerResults = await step.run('generate-and-send-provider-reports', async () => {
      return await reportGenerationService.generateAndSendBulkReports('provider', 'monthly');
    });

    // Generate and send recipient reports
    const recipientResults = await step.run('generate-and-send-recipient-reports', async () => {
      return await reportGenerationService.generateAndSendBulkReports('recipient', 'monthly');
    });

    // Generate comprehensive platform summary for admins
    const platformReport = await step.run('generate-platform-summary', async () => {
      return await reportGenerationService.generatePlatformReport('monthly');
    });

    await step.run('send-admin-summary', async () => {
      await emailService.sendAdminSummary(platformReport);
    });

    return {
      success: true,
      providerReports: providerResults.reportsGenerated,
      providerEmailsSent: providerResults.emailsSent,
      recipientReports: recipientResults.reportsGenerated,
      recipientEmailsSent: recipientResults.emailsSent,
      platformReport: !!platformReport,
      timestamp: new Date().toISOString(),
    };
  }
);

// Manual report generation function (triggered by API)
export const generateManualReport = inngest.createFunction(
  { id: 'generate-manual-report' },
  { event: REPORT_EVENTS.GENERATE_DAILY_REPORT },
  async ({ event, step }) => {
    const { reportType, userId, userType } = event.data;

    console.log(`Generating manual ${reportType} report for ${userType} ${userId}`);

    const report = await step.run('generate-report', async () => {
      if (userType === 'provider') {
        return await reportGenerationService.generateProviderReport(userId, reportType);
      } else if (userType === 'recipient') {
        return await reportGenerationService.generateRecipientReport(userId, reportType);
      } else if (userType === 'platform') {
        return await reportGenerationService.generatePlatformReport(reportType);
      } else {
        throw new Error(`Invalid user type: ${userType}`);
      }
    });

    await step.run('send-report-email', async () => {
      if (userType === 'platform') {
        await emailService.sendAdminSummary(report);
      } else {
        await emailService.sendReportEmail(report);
      }
    });

    return {
      success: true,
      reportId: report.id,
      reportType,
      userType,
      userId,
      timestamp: new Date().toISOString(),
    };
  }
);

// Email sending function (can be triggered separately)
export const sendReportEmail = inngest.createFunction(
  { id: 'send-report-email' },
  { event: REPORT_EVENTS.SEND_REPORT_EMAIL },
  async ({ event, step }) => {
    const { reportData, recipients } = event.data;

    await step.run('send-emails', async () => {
      for (const recipient of recipients) {
        try {
          await emailService.sendReportEmail(reportData, recipient);
        } catch (error) {
          console.error(`Failed to send report email to ${recipient}:`, error);
        }
      }
    });

    return {
      success: true,
      emailsSent: recipients.length,
      timestamp: new Date().toISOString(),
    };
  }
);

// Function to initialize and schedule all reports
export const scheduleAllReports = inngest.createFunction(
  { id: 'schedule-all-reports' },
  { event: REPORT_EVENTS.SCHEDULE_REPORTS },
  async ({ event, step }) => {
    console.log('Scheduling all report functions...');

    // This function can be used to trigger initial setup or re-scheduling
    // The actual scheduling is handled by the cron expressions above

    await step.run('verify-users', async () => {
      await connectDB();
      const providers = await UserProfile.countDocuments({ role: 'provider' });
      const recipients = await UserProfile.countDocuments({ role: 'recipient' });
      
      console.log(`Found ${providers} providers and ${recipients} recipients for reporting`);
      
      return { providers, recipients };
    });

    return {
      success: true,
      message: 'Report scheduling verified',
      timestamp: new Date().toISOString(),
    };
  }
);

// Health check function for monitoring
export const reportSystemHealthCheck = inngest.createFunction(
  { id: 'report-system-health-check' },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ event, step }) => {
    const healthStatus = await step.run('check-system-health', async () => {
      try {
        // Check database connection
        await connectDB();
        
        // Check if required environment variables are set
        const requiredEnvVars = [
          'GOOGLE_GEMINI_API_KEY',
          'SMTP_HOST',
          'SMTP_USER',
          'SMTP_PASS'
        ];
        
        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
        
        // Check user counts
        const providers = await UserProfile.countDocuments({ role: 'provider' });
        const recipients = await UserProfile.countDocuments({ role: 'recipient' });
        
        return {
          status: 'healthy',
          database: 'connected',
          missingEnvVars,
          userCounts: { providers, recipients },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    });

    // Log health status
    console.log('Report system health check:', healthStatus);

    return healthStatus;
  }
);

// Export all functions for the Inngest serve handler
export const inngestFunctions = [
  generateDailyReports,
  generateWeeklyReports,
  generateMonthlyReports,
  generateManualReport,
  sendReportEmail,
  scheduleAllReports,
  reportSystemHealthCheck,
];
