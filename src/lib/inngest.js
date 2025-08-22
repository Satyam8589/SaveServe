// Inngest client configuration for SaveServe reporting system
import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'saveserve-reports',
  name: 'SaveServe Reporting System',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event types for the reporting system
export const REPORT_EVENTS = {
  GENERATE_DAILY_REPORT: 'reports/generate.daily',
  GENERATE_WEEKLY_REPORT: 'reports/generate.weekly', 
  GENERATE_MONTHLY_REPORT: 'reports/generate.monthly',
  SEND_REPORT_EMAIL: 'reports/send.email',
  SCHEDULE_REPORTS: 'reports/schedule.all',
};

// Helper function to trigger report generation
export const triggerReportGeneration = async (reportType, userId = null, userType = null) => {
  const eventName = REPORT_EVENTS[`GENERATE_${reportType.toUpperCase()}_REPORT`];

  if (!eventName) {
    throw new Error(`Invalid report type: ${reportType}`);
  }

  try {
    return await inngest.send({
      name: eventName,
      data: {
        reportType,
        userId,
        userType,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Inngest trigger failed:', error);
    // For now, we'll just log the error and continue
    // In production, you might want to use a fallback mechanism
    throw new Error(`Failed to trigger report generation: ${error.message}`);
  }
};

// Helper function to send report emails
export const triggerReportEmail = async (reportData, recipients) => {
  return await inngest.send({
    name: REPORT_EVENTS.SEND_REPORT_EMAIL,
    data: {
      reportData,
      recipients,
      timestamp: new Date().toISOString(),
    },
  });
};

export default inngest;
