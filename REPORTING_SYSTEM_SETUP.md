# SaveServe Reporting System Setup Guide

This guide will help you set up and configure the comprehensive reporting system for SaveServe, which includes daily, weekly, and monthly reports powered by AI and delivered via email.

## 🚀 Features

- **Automated Report Generation**: Daily, weekly, and monthly reports
- **AI-Powered Insights**: Gemini AI generates personalized, actionable reports
- **Email Delivery**: Automated email delivery with beautiful HTML templates
- **Provider Analytics**: Detailed analytics for food providers
- **Recipient Impact**: Impact tracking for food recipients
- **Admin Dashboard**: Platform-wide analytics and bulk operations
- **Scheduled Jobs**: Background processing with Inngest
- **Real-time UI**: Interactive dashboards for viewing reports

## 📋 Prerequisites

1. **Google Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Email Service**: Gmail or other SMTP service
3. **Inngest Account**: Sign up at [inngest.com](https://inngest.com)
4. **MongoDB Database**: Your existing SaveServe database

## 🔧 Environment Setup

Add the following environment variables to your `.env.local` file:

```env
# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key_here
INNGEST_SIGNING_KEY=your_inngest_signing_key_here

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
FROM_EMAIL=your_email@gmail.com

# Report Configuration
REPORTS_ENABLED=true
DAILY_REPORT_TIME=08:00
WEEKLY_REPORT_DAY=monday
MONTHLY_REPORT_DATE=1

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
INNGEST_BASE_URL=http://localhost:3000/api/inngest

# Admin Configuration (optional)
ADMIN_EMAILS=admin@saveserve.com,manager@saveserve.com
```

## 📧 Email Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

## 🔑 API Keys Setup

### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `GOOGLE_GEMINI_API_KEY`

### Inngest Setup
1. Sign up at [inngest.com](https://inngest.com)
2. Create a new app
3. Get your Event Key and Signing Key
4. Add to environment variables

## 🚀 Installation

The required dependencies are already installed. If you need to reinstall:

```bash
npm install inngest @google/generative-ai nodemailer @types/nodemailer
```

## 🧪 Testing the System

### 1. Test System Health
```bash
# Visit in browser or use curl
curl http://localhost:3000/api/reports/test
```

### 2. Test Email Configuration
```bash
curl -X POST http://localhost:3000/api/reports/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

### 3. Test Email Database Integration
```bash
# Test fetching emails from database
curl http://localhost:3000/api/reports/test-emails?action=fetch

# Test bulk report generation (no emails sent)
curl http://localhost:3000/api/reports/test-emails?action=test-bulk-generation

# Test single email to specific address
curl "http://localhost:3000/api/reports/test-emails?action=test-single-email&email=your-email@example.com"
```

### 4. Test Bulk Email Sending (Limited)
```bash
# Test mode - generate reports but don't send emails
curl -X POST http://localhost:3000/api/reports/test-emails \
  -H "Content-Type: application/json" \
  -d '{"userType": "provider", "reportType": "weekly", "maxEmails": 3, "testMode": true}'

# Live mode - send actual emails (limited to 3)
curl -X POST http://localhost:3000/api/reports/test-emails \
  -H "Content-Type: application/json" \
  -d '{"userType": "provider", "reportType": "weekly", "maxEmails": 3, "testMode": false}'
```

### 5. Generate Test Reports

#### Provider Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"reportType": "weekly", "userType": "provider", "sendEmail": false}'
```

#### Recipient Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"reportType": "weekly", "userType": "recipient", "sendEmail": false}'
```

## 📊 Using the Dashboards

### Provider Dashboard
- Navigate to `/providerDashboard/reports`
- View analytics reports
- Generate and email reports
- Switch between daily/weekly/monthly views

### Recipient Dashboard
- Navigate to `/recipientDashboard/reports`
- View impact reports
- Track achievements and progress
- Generate and email reports

### Admin Dashboard
- Navigate to `/admin/reports`
- View platform-wide analytics
- Bulk generate reports for all users
- Monitor system health
- Send test emails

## ⏰ Scheduled Reports

The system automatically generates and sends reports to all active users:

- **Daily Reports**: 8:00 AM every day - sent to all providers and recipients
- **Weekly Reports**: 9:00 AM every Monday - sent to all providers and recipients
- **Monthly Reports**: 10:00 AM on the 1st of each month - sent to all providers and recipients

### 📧 Automatic Email Distribution

The system automatically:
1. **Fetches all active users** from the database (UserProfile collection)
2. **Filters by role**: PROVIDER and RECIPIENT
3. **Generates personalized reports** for each user using AI
4. **Sends emails** to each user's registered email address
5. **Tracks delivery status** and logs any failures

Users must have:
- `isActive: true`
- `userStatus: 'ACTIVE'` or `'APPROVED'`
- Valid email address in the `email` field

### Customizing Schedule

Edit the cron expressions in `src/lib/inngest/functions.js`:

```javascript
// Daily reports at 8 AM
{ cron: '0 8 * * *' }

// Weekly reports at 9 AM on Monday
{ cron: '0 9 * * 1' }

// Monthly reports at 10 AM on 1st
{ cron: '0 10 1 * *' }
```

## 🔧 Configuration Options

### Report Types
- `daily`: Last 24 hours
- `weekly`: Last 7 days
- `monthly`: Last 30 days

### User Types
- `provider`: Food providers
- `recipient`: Food recipients
- `platform`: Admin/platform reports

### Email Templates
Customize email templates in `src/services/emailService.js`:
- HTML formatting
- Styling and branding
- Content structure

## 🐛 Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check SMTP credentials
   - Verify app password for Gmail
   - Test with `/api/reports/test`

2. **AI Generation Failing**
   - Verify Gemini API key
   - Check API quotas
   - Review error logs

3. **Scheduled Jobs Not Running**
   - Verify Inngest configuration
   - Check signing key
   - Monitor Inngest dashboard

4. **Database Connection Issues**
   - Verify MongoDB connection
   - Check user permissions
   - Review data models

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

## 📈 Monitoring

### System Health Endpoint
- **URL**: `/api/reports/test`
- **Method**: GET
- **Response**: System component status

### Inngest Dashboard
- Monitor job execution
- View logs and errors
- Manage scheduled functions

### Email Delivery
- Check email service logs
- Monitor bounce rates
- Verify deliverability

## 🔒 Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Email Credentials**: Use app passwords, not main passwords
3. **Admin Access**: Implement proper role-based access
4. **Rate Limiting**: Monitor API usage and implement limits
5. **Data Privacy**: Ensure compliance with data protection regulations

## 📚 API Reference

### Generate Report
```
POST /api/reports
{
  "reportType": "weekly",
  "userType": "provider",
  "sendEmail": true
}
```

### Admin Operations
```
POST /api/reports/admin
{
  "action": "generate",
  "reportType": "weekly",
  "userType": "all",
  "sendEmails": true
}
```

### Test System
```
GET /api/reports/test?component=all
POST /api/reports/test
{
  "email": "test@example.com"
}
```

## 🎯 Next Steps

1. **Test all components** using the provided endpoints
2. **Configure email settings** with your SMTP provider
3. **Set up Inngest** for scheduled jobs
4. **Customize report templates** to match your branding
5. **Monitor system health** regularly
6. **Train users** on the new reporting features

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review system health endpoint
3. Check application logs
4. Verify environment configuration

The reporting system is now ready to provide valuable insights to your SaveServe users!
