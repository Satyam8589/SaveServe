// Main service for generating complete reports
import reportDataService from './reportDataService';
import geminiReportService from './geminiReportService';
import emailService from './emailService';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

class ReportGenerationService {
  /**
   * Generate a complete provider report
   */
  async generateProviderReport(providerId, reportType = 'weekly') {
    try {
      // Get aggregated data
      const analyticsData = await reportDataService.getProviderReportData(providerId, reportType);
      
      // Generate AI-powered narrative
      const aiReport = await geminiReportService.generateProviderReport(analyticsData, reportType);
      
      // Combine data and narrative
      const report = {
        id: `provider-${providerId}-${reportType}-${Date.now()}`,
        type: 'provider',
        reportType,
        generatedAt: new Date().toISOString(),
        provider: analyticsData.provider,
        period: analyticsData.period,
        data: analyticsData,
        narrative: aiReport,
        summary: this.generateProviderSummary(analyticsData),
      };

      return report;
    } catch (error) {
      console.error('Error generating provider report:', error);
      throw new Error(`Failed to generate provider report: ${error.message}`);
    }
  }

  /**
   * Generate a complete recipient report
   */
  async generateRecipientReport(recipientId, reportType = 'weekly') {
    try {
      // Get aggregated data
      const impactData = await reportDataService.getRecipientReportData(recipientId, reportType);
      
      // Generate AI-powered narrative
      const aiReport = await geminiReportService.generateRecipientReport(impactData, reportType);
      
      // Combine data and narrative
      const report = {
        id: `recipient-${recipientId}-${reportType}-${Date.now()}`,
        type: 'recipient',
        reportType,
        generatedAt: new Date().toISOString(),
        recipient: impactData.recipient,
        period: impactData.period,
        data: impactData,
        narrative: aiReport,
        summary: this.generateRecipientSummary(impactData),
      };

      return report;
    } catch (error) {
      console.error('Error generating recipient report:', error);
      throw new Error(`Failed to generate recipient report: ${error.message}`);
    }
  }

  /**
   * Generate platform summary report for admins
   */
  async generatePlatformReport(reportType = 'weekly') {
    try {
      // Get aggregated platform data
      const platformData = await reportDataService.getPlatformReportData(reportType);
      
      // Generate AI-powered summary
      const aiSummary = await geminiReportService.generateSummaryReport(platformData, reportType);
      
      // Combine data and narrative
      const report = {
        id: `platform-${reportType}-${Date.now()}`,
        type: 'platform',
        reportType,
        generatedAt: new Date().toISOString(),
        period: platformData.period,
        data: platformData,
        narrative: aiSummary,
        summary: this.generatePlatformSummary(platformData),
      };

      return report;
    } catch (error) {
      console.error('Error generating platform report:', error);
      throw new Error(`Failed to generate platform report: ${error.message}`);
    }
  }

  /**
   * Generate reports for all users of a specific type
   */
  async generateBulkReports(userType, reportType = 'weekly') {
    await connectDB();

    try {
      // Use the correct role values from the database
      const roleMap = {
        'provider': 'PROVIDER',
        'recipient': 'RECIPIENT'
      };

      const dbRole = roleMap[userType];
      if (!dbRole) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      const users = await UserProfile.find({
        role: dbRole,
        isActive: true,
        userStatus: { $in: ['ACTIVE', 'APPROVED'] }
      }).select('userId fullName email').lean();

      console.log(`Found ${users.length} ${userType}s to generate reports for`);

      const reports = [];

      for (const user of users) {
        try {
          let report;
          if (userType === 'provider') {
            report = await this.generateProviderReport(user.userId, reportType);
          } else if (userType === 'recipient') {
            report = await this.generateRecipientReport(user.userId, reportType);
          }

          if (report) {
            // Add user email info to the report for easy access
            report.userEmail = user.email;
            report.userName = user.fullName;
            reports.push(report);
          }
        } catch (error) {
          console.error(`Failed to generate report for user ${user.userId} (${user.email}):`, error);
          // Continue with other users even if one fails
        }
      }

      console.log(`Successfully generated ${reports.length} reports for ${userType}s`);
      return reports;
    } catch (error) {
      console.error('Error generating bulk reports:', error);
      throw error;
    }
  }

  /**
   * Generate and send reports to all users of a specific type
   */
  async generateAndSendBulkReports(userType, reportType = 'weekly') {
    try {
      const reports = await this.generateBulkReports(userType, reportType);
      const emailResults = [];

      for (const report of reports) {
        try {
          // Send email using the email from the report
          const emailResult = await emailService.sendReportEmail(report, {
            email: report.userEmail,
            name: report.userName
          });

          emailResults.push({
            userId: report.type === 'provider' ? report.provider.id : report.recipient.id,
            email: report.userEmail,
            success: emailResult.success,
            messageId: emailResult.messageId
          });

          console.log(`Report email sent to ${report.userEmail}`);
        } catch (error) {
          console.error(`Failed to send report email to ${report.userEmail}:`, error);
          emailResults.push({
            userId: report.type === 'provider' ? report.provider.id : report.recipient.id,
            email: report.userEmail,
            success: false,
            error: error.message
          });
        }
      }

      return {
        reportsGenerated: reports.length,
        emailsSent: emailResults.filter(r => r.success).length,
        emailsFailed: emailResults.filter(r => !r.success).length,
        emailResults
      };
    } catch (error) {
      console.error('Error generating and sending bulk reports:', error);
      throw error;
    }
  }

  /**
   * Generate summary for provider report
   */
  generateProviderSummary(data) {
    const { kpis } = data;
    const efficiency = kpis.totalFoodListed > 0 ? 
      ((kpis.totalFoodCollected / kpis.totalFoodListed) * 100).toFixed(1) : 0;
    
    return {
      totalFoodListed: kpis.totalFoodListed,
      totalFoodCollected: kpis.totalFoodCollected,
      efficiency: `${efficiency}%`,
      wasteReduction: `${(100 - parseFloat(kpis.wastePercentage)).toFixed(1)}%`,
      environmentalImpact: {
        carbonSaved: `${kpis.carbonSaved} kg CO₂`,
        waterSaved: `${kpis.waterSaved} liters`,
      },
      keyMetric: efficiency > 80 ? 'Excellent efficiency' : 
                 efficiency > 60 ? 'Good performance' : 'Room for improvement',
    };
  }

  /**
   * Generate summary for recipient report
   */
  generateRecipientSummary(data) {
    const { impact, activity } = data;
    
    return {
      mealsSaved: impact.mealsSaved,
      impactScore: impact.impactScore,
      successRate: `${activity.successRate}%`,
      environmentalImpact: {
        carbonSaved: `${impact.carbonSaved} kg CO₂`,
        waterSaved: `${impact.waterSaved} liters`,
        wasteReduced: `${impact.wasteReduced} kg`,
      },
      keyMetric: activity.successRate > 80 ? 'Highly reliable' :
                 activity.successRate > 60 ? 'Good participation' : 'Improving engagement',
    };
  }

  /**
   * Generate summary for platform report
   */
  generatePlatformSummary(data) {
    const { platform } = data;
    
    return {
      totalUsers: platform.totalProviders + platform.totalRecipients,
      totalProviders: platform.totalProviders,
      totalRecipients: platform.totalRecipients,
      platformEfficiency: `${platform.platformWasteReduction}%`,
      environmentalImpact: {
        carbonSaved: `${platform.carbonSaved} kg CO₂`,
        waterSaved: `${platform.waterSaved} liters`,
      },
      keyMetric: parseFloat(platform.platformWasteReduction) > 70 ? 'Strong performance' :
                 parseFloat(platform.platformWasteReduction) > 50 ? 'Moderate success' : 'Growth opportunity',
    };
  }

  /**
   * Get report template for email formatting
   */
  getEmailTemplate(report) {
    const isProvider = report.type === 'provider';
    const isPlatform = report.type === 'platform';
    
    const subject = isPlatform ? 
      `SaveServe Platform ${this.capitalizeFirst(report.reportType)} Report` :
      `Your SaveServe ${this.capitalizeFirst(report.reportType)} ${isProvider ? 'Analytics' : 'Impact'} Report`;

    const greeting = isPlatform ? 
      'SaveServe Team' :
      `Hi ${isProvider ? report.provider.name : report.recipient.name}!`;

    return {
      subject,
      greeting,
      content: report.narrative,
      footer: this.getEmailFooter(report.type),
    };
  }

  /**
   * Get email footer based on report type
   */
  getEmailFooter(reportType) {
    const baseFooter = `
---
Best regards,
The SaveServe Team

🌱 Together, we're reducing food waste and building a more sustainable future.

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}
Need help? Contact us at support@saveserve.com
    `;

    if (reportType === 'provider') {
      return `
Keep up the great work in reducing food waste! Your efforts make a real difference in our community.
${baseFooter}`;
    } else if (reportType === 'recipient') {
      return `
Thank you for being a food rescue hero! Every meal you save helps build a more sustainable world.
${baseFooter}`;
    } else {
      return baseFooter;
    }
  }

  /**
   * Utility function to capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Validate report data before generation
   */
  validateReportData(data, reportType) {
    if (!data) {
      throw new Error('No data provided for report generation');
    }

    if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
      throw new Error('Invalid report type. Must be daily, weekly, or monthly');
    }

    return true;
  }

  /**
   * Get report statistics for monitoring
   */
  getReportStats(reports) {
    return {
      total: reports.length,
      byType: reports.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {}),
      byReportType: reports.reduce((acc, report) => {
        acc[report.reportType] = (acc[report.reportType] || 0) + 1;
        return acc;
      }, {}),
      generatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
const reportGenerationService = new ReportGenerationService();
export default reportGenerationService;
