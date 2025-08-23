// Test endpoint to verify report data generation
import { NextResponse } from 'next/server';
import reportDataService from '@/services/reportDataService';
import reportGenerationService from '@/services/reportGenerationService';

// GET /api/test-report-data - Test report data generation
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') || 'provider';
    const reportType = searchParams.get('reportType') || 'weekly';
    const userId = searchParams.get('userId') || 'test-user-id';

    let reportData;
    let fullReport;

    if (userType === 'provider') {
      // Test provider report data
      reportData = await reportDataService.getProviderReportData(userId, reportType);
      fullReport = await reportGenerationService.generateProviderReport(userId, reportType);
    } else {
      // Test recipient report data
      reportData = await reportDataService.getRecipientReportData(userId, reportType);
      fullReport = await reportGenerationService.generateRecipientReport(userId, reportType);
    }

    return NextResponse.json({
      success: true,
      message: 'Report data generated successfully',
      testParameters: {
        userType,
        reportType,
        userId
      },
      rawData: {
        hasRealData: reportData.hasRealData,
        period: reportData.period,
        kpis: userType === 'provider' ? reportData.kpis : reportData.impact,
        activity: userType === 'provider' ? reportData.categoryBreakdown : reportData.activity
      },
      fullReport: {
        id: fullReport.id,
        type: fullReport.type,
        reportType: fullReport.reportType,
        hasNarrative: !!fullReport.narrative,
        narrativeLength: fullReport.narrative ? fullReport.narrative.length : 0,
        summary: fullReport.summary
      },
      dataStatus: reportData.hasRealData ? 'Using real database data' : 'Using mock data for demonstration',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing report data:', error);
    return NextResponse.json(
      { error: 'Failed to test report data', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/test-report-data - Test report generation for specific user
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId = 'test-user-' + Date.now(),
      userType = 'provider',
      reportType = 'weekly',
      testAllPeriods = false
    } = body;

    const results = {};

    if (testAllPeriods) {
      // Test all report periods
      const periods = ['daily', 'weekly', 'monthly'];
      
      for (const period of periods) {
        try {
          let reportData;
          if (userType === 'provider') {
            reportData = await reportDataService.getProviderReportData(userId, period);
          } else {
            reportData = await reportDataService.getRecipientReportData(userId, period);
          }
          
          results[period] = {
            success: true,
            hasRealData: reportData.hasRealData,
            period: reportData.period,
            kpis: userType === 'provider' ? reportData.kpis : reportData.impact,
            dataStatus: reportData.hasRealData ? 'real' : 'mock'
          };
        } catch (error) {
          results[period] = {
            success: false,
            error: error.message
          };
        }
      }
    } else {
      // Test single period
      try {
        let reportData;
        let fullReport;
        
        if (userType === 'provider') {
          reportData = await reportDataService.getProviderReportData(userId, reportType);
          fullReport = await reportGenerationService.generateProviderReport(userId, reportType);
        } else {
          reportData = await reportDataService.getRecipientReportData(userId, reportType);
          fullReport = await reportGenerationService.generateRecipientReport(userId, reportType);
        }
        
        results[reportType] = {
          success: true,
          hasRealData: reportData.hasRealData,
          rawData: reportData,
          fullReport: {
            id: fullReport.id,
            type: fullReport.type,
            hasNarrative: !!fullReport.narrative,
            narrativePreview: fullReport.narrative ? fullReport.narrative.substring(0, 200) + '...' : null,
            summary: fullReport.summary
          }
        };
      } catch (error) {
        results[reportType] = {
          success: false,
          error: error.message
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report data test completed',
      testParameters: {
        userId,
        userType,
        reportType,
        testAllPeriods
      },
      results,
      summary: {
        totalTests: Object.keys(results).length,
        successfulTests: Object.values(results).filter(r => r.success).length,
        failedTests: Object.values(results).filter(r => !r.success).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in report data test:', error);
    return NextResponse.json(
      { error: 'Failed to complete report test', details: error.message },
      { status: 500 }
    );
  }
}
