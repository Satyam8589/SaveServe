// Public test endpoint for the reporting system (no auth required)
import { NextResponse } from 'next/server';
import reportDataService from '@/services/reportDataService';
import geminiReportService from '@/services/geminiReportService';
import emailService from '@/services/emailService';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

// GET /api/reports/test-public - Test the reporting system components (no auth)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component') || 'all';

    const results = {};

    // Test database connection
    if (component === 'all' || component === 'database') {
      try {
        await connectDB();
        const userCount = await UserProfile.countDocuments();
        const providerCount = await UserProfile.countDocuments({ role: 'PROVIDER' });
        const recipientCount = await UserProfile.countDocuments({ role: 'RECIPIENT' });
        
        results.database = {
          status: 'connected',
          totalUsers: userCount,
          providers: providerCount,
          recipients: recipientCount,
        };
      } catch (error) {
        results.database = {
          status: 'error',
          error: error.message,
        };
      }
    }

    // Test email fetching from database
    if (component === 'all' || component === 'emails') {
      try {
        const providers = await reportDataService.getAllProviders();
        const recipients = await reportDataService.getAllRecipients();
        
        results.emailFetching = {
          status: 'working',
          providersFound: providers.length,
          recipientsFound: recipients.length,
          sampleProviders: providers.slice(0, 2).map(p => ({ 
            name: p.name, 
            email: p.email?.substring(0, 3) + '***' // Mask email for privacy
          })),
          sampleRecipients: recipients.slice(0, 2).map(r => ({ 
            name: r.name, 
            email: r.email?.substring(0, 3) + '***' // Mask email for privacy
          }))
        };
      } catch (error) {
        results.emailFetching = {
          status: 'error',
          error: error.message,
        };
      }
    }

    // Test platform data aggregation
    if (component === 'all' || component === 'data') {
      try {
        const platformData = await reportDataService.getPlatformReportData('weekly');
        results.dataAggregation = {
          status: 'working',
          platformMetrics: {
            totalProviders: platformData.platform.totalProviders,
            totalRecipients: platformData.platform.totalRecipients,
            totalListings: platformData.platform.totalListings,
            totalBookings: platformData.platform.totalBookings,
          }
        };
      } catch (error) {
        results.dataAggregation = {
          status: 'error',
          error: error.message,
        };
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
          preview: aiReport.substring(0, 150) + '...',
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
      note: 'This is a public test endpoint. For full testing, use the authenticated endpoints.'
    });
  } catch (error) {
    console.error('Error testing reporting system:', error);
    return NextResponse.json(
      { error: 'Failed to test reporting system', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/reports/test-public - Send a test report email (no auth required)
export async function POST(request) {
  try {
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
        id: 'test-user',
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

**Environmental Impact:**
- 4.8 kg CO₂ saved
- 250 liters of water conserved
- 20% waste reduction achieved

## Next Steps
1. Configure your actual user data
2. Set up scheduled reports
3. Monitor delivery success rates

Thank you for testing the SaveServe reporting system! 🌱`,
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
      testReport: {
        id: mockReport.id,
        type: mockReport.type,
        hasNarrative: !!mockReport.narrative,
        narrativeLength: mockReport.narrative.length
      },
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    );
  }
}
