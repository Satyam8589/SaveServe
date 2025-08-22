// Email service for sending reports
import nodemailer from 'nodemailer';
import reportGenerationService from './reportGenerationService';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email configuration missing. Email sending will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  /**
   * Send a report email to a user
   */
  async sendReportEmail(report, customRecipient = null) {
    if (!this.transporter) {
      console.log('Email transporter not configured. Skipping email send.');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const template = reportGenerationService.getEmailTemplate(report);
      const recipient = customRecipient || this.getReportRecipient(report);
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: recipient.email,
        subject: template.subject,
        html: this.formatReportEmail(template, report),
        text: this.formatReportEmailText(template, report),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Report email sent successfully to ${recipient.email}:`, result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: recipient.email,
        reportId: report.id,
      };
    } catch (error) {
      console.error('Error sending report email:', error);
      throw new Error(`Failed to send report email: ${error.message}`);
    }
  }

  /**
   * Send platform summary to administrators
   */
  async sendAdminSummary(platformReport) {
    if (!this.transporter) {
      console.log('Email transporter not configured. Skipping admin email send.');
      return { success: false, reason: 'Email not configured' };
    }

    try {
      const adminEmails = this.getAdminEmails();
      const template = reportGenerationService.getEmailTemplate(platformReport);
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: adminEmails,
        subject: template.subject,
        html: this.formatPlatformReportEmail(template, platformReport),
        text: this.formatPlatformReportEmailText(template, platformReport),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Platform report sent successfully to admins:`, result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        recipients: adminEmails,
        reportId: platformReport.id,
      };
    } catch (error) {
      console.error('Error sending admin summary:', error);
      throw new Error(`Failed to send admin summary: ${error.message}`);
    }
  }

  /**
   * Get recipient information from report
   */
  getReportRecipient(report) {
    if (report.type === 'provider') {
      return {
        email: report.provider.email,
        name: report.provider.name,
      };
    } else if (report.type === 'recipient') {
      return {
        email: report.recipient.email,
        name: report.recipient.name,
      };
    } else {
      throw new Error('Invalid report type for recipient extraction');
    }
  }

  /**
   * Get admin email addresses
   */
  getAdminEmails() {
    // You can configure this in environment variables or database
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@saveserve.com'];
    return adminEmails.map(email => email.trim());
  }

  /**
   * Format report email as HTML
   */
  formatReportEmail(template, report) {
    const isProvider = report.type === 'provider';
    const data = report.data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .metric-value { font-size: 24px; font-weight: bold; color: #10b981; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .narrative { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .cta { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌱 ${template.subject}</h1>
        <p>${template.greeting}</p>
    </div>
    
    <div class="content">
        ${this.generateMetricsHTML(report)}
        
        <div class="narrative">
            ${this.markdownToHTML(template.content)}
        </div>
        
        <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/${isProvider ? 'providerDashboard/analytics' : 'recipientDashboard/impact'}" class="cta">
                View Full Dashboard
            </a>
        </div>
        
        <div class="footer">
            ${template.footer.replace(/\n/g, '<br>')}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate metrics HTML based on report type
   */
  generateMetricsHTML(report) {
    if (report.type === 'provider') {
      const { kpis } = report.data;
      return `
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${kpis.totalFoodListed}</div>
                <div class="metric-label">Food Listed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${kpis.totalFoodCollected}</div>
                <div class="metric-label">Food Collected</div>
            </div>
            <div class="metric">
                <div class="metric-value">${kpis.carbonSaved}kg</div>
                <div class="metric-label">CO₂ Saved</div>
            </div>
            <div class="metric">
                <div class="metric-value">${kpis.waterSaved}L</div>
                <div class="metric-label">Water Saved</div>
            </div>
        </div>`;
    } else if (report.type === 'recipient') {
      const { impact } = report.data;
      return `
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${impact.mealsSaved}</div>
                <div class="metric-label">Meals Saved</div>
            </div>
            <div class="metric">
                <div class="metric-value">${impact.impactScore}</div>
                <div class="metric-label">Impact Score</div>
            </div>
            <div class="metric">
                <div class="metric-value">${impact.carbonSaved}kg</div>
                <div class="metric-label">CO₂ Saved</div>
            </div>
            <div class="metric">
                <div class="metric-value">${impact.waterSaved}L</div>
                <div class="metric-label">Water Saved</div>
            </div>
        </div>`;
    }
    return '';
  }

  /**
   * Format platform report email as HTML
   */
  formatPlatformReportEmail(template, report) {
    const { platform } = report.data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1f2937, #374151); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .metric-value { font-size: 20px; font-weight: bold; color: #1f2937; }
        .metric-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        .narrative { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 ${template.subject}</h1>
        <p>Platform Performance Overview</p>
    </div>
    
    <div class="content">
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${platform.totalProviders}</div>
                <div class="metric-label">Providers</div>
            </div>
            <div class="metric">
                <div class="metric-value">${platform.totalRecipients}</div>
                <div class="metric-label">Recipients</div>
            </div>
            <div class="metric">
                <div class="metric-value">${platform.totalListings}</div>
                <div class="metric-label">Listings</div>
            </div>
            <div class="metric">
                <div class="metric-value">${platform.totalBookings}</div>
                <div class="metric-label">Bookings</div>
            </div>
            <div class="metric">
                <div class="metric-value">${platform.platformWasteReduction}%</div>
                <div class="metric-label">Efficiency</div>
            </div>
            <div class="metric">
                <div class="metric-value">${platform.carbonSaved}kg</div>
                <div class="metric-label">CO₂ Saved</div>
            </div>
        </div>
        
        <div class="narrative">
            ${this.markdownToHTML(template.content)}
        </div>
        
        <div class="footer">
            ${template.footer.replace(/\n/g, '<br>')}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Format report email as plain text
   */
  formatReportEmailText(template, report) {
    const metrics = this.generateMetricsText(report);
    
    return `
${template.subject}

${template.greeting}

${metrics}

${template.content}

${template.footer}
    `.trim();
  }

  /**
   * Format platform report email as plain text
   */
  formatPlatformReportEmailText(template, report) {
    const { platform } = report.data;
    
    const metrics = `
Platform Metrics:
- Providers: ${platform.totalProviders}
- Recipients: ${platform.totalRecipients}
- Listings: ${platform.totalListings}
- Bookings: ${platform.totalBookings}
- Platform Efficiency: ${platform.platformWasteReduction}%
- CO₂ Saved: ${platform.carbonSaved}kg
    `;
    
    return `
${template.subject}

Platform Performance Overview

${metrics}

${template.content}

${template.footer}
    `.trim();
  }

  /**
   * Generate metrics text based on report type
   */
  generateMetricsText(report) {
    if (report.type === 'provider') {
      const { kpis } = report.data;
      return `
Your Key Metrics:
- Food Listed: ${kpis.totalFoodListed}
- Food Collected: ${kpis.totalFoodCollected}
- CO₂ Saved: ${kpis.carbonSaved}kg
- Water Saved: ${kpis.waterSaved}L
      `;
    } else if (report.type === 'recipient') {
      const { impact } = report.data;
      return `
Your Impact:
- Meals Saved: ${impact.mealsSaved}
- Impact Score: ${impact.impactScore}
- CO₂ Saved: ${impact.carbonSaved}kg
- Water Saved: ${impact.waterSaved}L
      `;
    }
    return '';
  }

  /**
   * Simple markdown to HTML converter
   */
  markdownToHTML(markdown) {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
      .replace(/\n/gim, '<br>');
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      throw new Error(`Email configuration test failed: ${error.message}`);
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
