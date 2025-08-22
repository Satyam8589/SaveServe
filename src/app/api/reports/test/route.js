// Test endpoint for the reporting system
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import reportDataService from '@/services/reportDataService';
import geminiReportService from '@/services/geminiReportService';
import emailService from '@/services/emailService';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

// GET /api/reports/test - Test the reporting system components
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component') || 'all';

    const results = {};

    // Test database connection
    if (component === 'all' || component === 'database') {
      try {
        await connectDB();
        const userCount = await UserProfile.countDocuments();
        results.database = {
          status: 'connected',
          userCount,
        };
      } catch (error) {
        results.database = {
          status: 'error',
          error: error.message,
        };
      }
    }

    // Test data aggregation
    if (component === 'all' || component === 'data') {
      try {
        // Try to get sample data for the current user
        const sampleData = await reportDataService.getProviderReportData(userId, 'weekly');
        results.dataAggregation = {
          status: 'working',
          sampleDataKeys: Object.keys(sampleData),
        };
      } catch (error) {
        // Try recipient data if provider fails
        try {
          const sampleData = await reportDataService.getRecipientReportData(userId, 'weekly');
          results.dataAggregation = {
            status: 'working',
            sampleDataKeys: Object.keys(sampleData),
            note: 'Tested with recipient data',
          };
        } catch (recipientError) {
          results.dataAggregation = {
            status: 'error',
            error: error.message,
          };
        }
      }
    }

    // Test AI generation (with mock data)
    if (component === 'all' || component === 'ai') {
      try {
        const mockData = {
          provider: { name: 'Test Provider', email: 'test@example.com' },
          period: { type: 'weekly', start: new Date().toISOString(), end: new Date().toISOString() },
          kpis: {
            totalFoodListed: 50,
            totalFoodCollected: 40,
            carbonSaved: 9.6,
            waterSaved: 500,
            wastePercentage: 20,
          },
          categoryBreakdown: [
            { category: 'Fruits', quantity: 20 },
            { category: 'Vegetables', quantity: 15 },
            { category: 'Bakery', quantity: 15 },
          ],
        };

        const aiReport = await geminiReportService.generateProviderReport(mockData, 'weekly');
        results.aiGeneration = {
          status: 'working',
          reportLength: aiReport.length,
          preview: aiReport.substring(0, 100) + '...',
        };
      } catch (error) {
        results.aiGeneration = {
          status: 'error',
          error: error.message,
        };
      }
    }

    // Test email configuration
    if (component === 'all' || component === 'email') {
      try {
        const emailTest = await emailService.testEmailConfiguration();
        results.email = {
          status: 'configured',
          ...emailTest,
        };
      } catch (error) {
        results.email = {
          status: 'error',
          error: error.message,
        };
      }
    }

    // Test environment variables
    if (component === 'all' || component === 'env') {
      const requiredEnvVars = [
        'GOOGLE_GEMINI_API_KEY',
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASS',
        'INNGEST_EVENT_KEY',
        'INNGEST_SIGNING_KEY',
      ];

      const envStatus = {};
      requiredEnvVars.forEach(envVar => {
        envStatus[envVar] = process.env[envVar] ? 'set' : 'missing';
      });

      results.environment = {
        status: Object.values(envStatus).every(status => status === 'set') ? 'complete' : 'incomplete',
        variables: envStatus,
      };
    }

    // Overall system health
    const overallStatus = Object.values(results).every(result => 
      result.status === 'working' || result.status === 'connected' || result.status === 'configured' || result.status === 'complete'
    ) ? 'healthy' : 'issues_detected';

    return NextResponse.json({
      success: true,
      overallStatus,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Error testing reporting system:', error);
    return NextResponse.json(
      { error: 'Failed to test reporting system', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/reports/test - Send a test report email
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, reportType = 'test' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }

    // Create a mock report for testing
    const mockReport = {
      id: `test-${Date.now()}`,
      type: 'provider',
      reportType: 'weekly',
      generatedAt: new Date().toISOString(),
      provider: {
        id: userId,
        name: 'Test User',
        email: email,
      },
      period: {
        type: 'weekly',
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      data: {
        kpis: {
          totalFoodListed: 25,
          totalFoodCollected: 20,
          carbonSaved: 4.8,
          waterSaved: 250,
          wastePercentage: 20,
        },
      },
      narrative: `# Test Weekly Report

This is a test report to verify that the SaveServe reporting system is working correctly.

## Key Highlights
- Successfully generated mock data
- Email delivery system is functional
- AI report generation is operational

## Test Metrics
Your test metrics show that the system is ready to generate real reports with your actual data.

Thank you for testing the SaveServe reporting system!`,
      summary: {
        totalFoodListed: 25,
        totalFoodCollected: 20,
        efficiency: '80%',
        keyMetric: 'Test successful',
      },
    };

    // Send test email
    const emailResult = await emailService.sendReportEmail(mockReport, { email, name: 'Test User' });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailResult,
      testReport: mockReport,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    );
  }
}
