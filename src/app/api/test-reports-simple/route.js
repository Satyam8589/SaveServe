// Simple test endpoint for report data without authentication
import { NextResponse } from 'next/server';
import reportDataService from '@/services/reportDataService';

// GET /api/test-reports-simple - Simple test without auth
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') || 'provider';
    const reportType = searchParams.get('reportType') || 'weekly';

    // Use test user IDs
    const testUserId = userType === 'provider' ? 'test-provider-123' : 'test-recipient-456';

    console.log(`Testing ${userType} ${reportType} report for user: ${testUserId}`);

    let reportData;
    try {
      if (userType === 'provider') {
        reportData = await reportDataService.getProviderReportData(testUserId, reportType);
      } else {
        reportData = await reportDataService.getRecipientReportData(testUserId, reportType);
      }
    } catch (dataError) {
      console.error('Error getting report data:', dataError);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate report data',
        details: dataError.message,
        testParameters: { userType, reportType, testUserId }
      }, { status: 500 });
    }

    // Extract key metrics based on user type
    const metrics = userType === 'provider' ? {
      totalFoodListed: reportData.kpis.totalFoodListed,
      totalFoodCollected: reportData.kpis.totalFoodCollected,
      carbonSaved: reportData.kpis.carbonSaved,
      waterSaved: reportData.kpis.waterSaved,
      wastePercentage: reportData.kpis.wastePercentage
    } : {
      mealsSaved: reportData.impact.mealsSaved,
      carbonSaved: reportData.impact.carbonSaved,
      waterSaved: reportData.impact.waterSaved,
      impactScore: reportData.impact.impactScore,
      successRate: reportData.activity.successRate
    };

    return NextResponse.json({
      success: true,
      message: `${userType} ${reportType} report generated successfully`,
      testParameters: {
        userType,
        reportType,
        testUserId
      },
      dataStatus: reportData.hasRealData ? 'Using real database data' : 'Using mock data for demonstration',
      period: reportData.period,
      metrics,
      user: userType === 'provider' ? reportData.provider : reportData.recipient,
      hasRealData: reportData.hasRealData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in simple report test:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test reports',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// POST /api/test-reports-simple - Test all report types
export async function POST(request) {
  try {
    const body = await request.json();
    const { userType = 'provider' } = body;

    const reportTypes = ['daily', 'weekly', 'monthly'];
    const testUserId = userType === 'provider' ? 'test-provider-123' : 'test-recipient-456';
    const results = {};

    console.log(`Testing all report types for ${userType}: ${testUserId}`);

    for (const reportType of reportTypes) {
      try {
        console.log(`Testing ${reportType} report...`);
        
        let reportData;
        if (userType === 'provider') {
          reportData = await reportDataService.getProviderReportData(testUserId, reportType);
        } else {
          reportData = await reportDataService.getRecipientReportData(testUserId, reportType);
        }

        // Extract key metrics
        const metrics = userType === 'provider' ? {
          totalFoodListed: reportData.kpis.totalFoodListed,
          totalFoodCollected: reportData.kpis.totalFoodCollected,
          carbonSaved: reportData.kpis.carbonSaved,
          waterSaved: reportData.kpis.waterSaved
        } : {
          mealsSaved: reportData.impact.mealsSaved,
          carbonSaved: reportData.impact.carbonSaved,
          waterSaved: reportData.impact.waterSaved,
          impactScore: reportData.impact.impactScore
        };

        results[reportType] = {
          success: true,
          hasRealData: reportData.hasRealData,
          dataStatus: reportData.hasRealData ? 'real' : 'mock',
          period: reportData.period,
          metrics
        };

        console.log(`✅ ${reportType} report: ${reportData.hasRealData ? 'real data' : 'mock data'}`);

      } catch (error) {
        console.error(`❌ Error with ${reportType} report:`, error);
        results[reportType] = {
          success: false,
          error: error.message
        };
      }
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Tested ${totalCount} report types for ${userType}`,
      testParameters: {
        userType,
        testUserId,
        reportTypes
      },
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
        successRate: `${Math.round((successCount / totalCount) * 100)}%`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in comprehensive report test:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test all reports',
      details: error.message
    }, { status: 500 });
  }
}
