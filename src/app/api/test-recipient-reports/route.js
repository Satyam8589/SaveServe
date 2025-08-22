// Test endpoint specifically for recipient reports with completed food only
import { NextResponse } from 'next/server';
import reportDataService from '@/services/reportDataService';
import reportGenerationService from '@/services/reportGenerationService';

// GET /api/test-recipient-reports - Test recipient reports with completed food focus
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType') || 'weekly';
    const recipientId = searchParams.get('recipientId') || 'test-recipient-456';

    console.log(`Testing recipient ${reportType} report for: ${recipientId}`);

    // Generate recipient report data
    const reportData = await reportDataService.getRecipientReportData(recipientId, reportType);

    // Generate full report with AI content
    const fullReport = await reportGenerationService.generateRecipientReport(recipientId, reportType);

    return NextResponse.json({
      success: true,
      message: `Recipient ${reportType} report generated successfully`,
      testParameters: {
        recipientId,
        reportType
      },
      dataStatus: reportData.hasRealData ? 'Using real database data' : 'Using mock data for demonstration',
      
      // Key metrics focused on COMPLETED food only
      impactMetrics: {
        mealsSaved: reportData.impact.mealsSaved, // Only completed/picked up meals
        carbonSaved: reportData.impact.carbonSaved,
        waterSaved: reportData.impact.waterSaved,
        wasteReduced: reportData.impact.wasteReduced,
        impactScore: reportData.impact.impactScore
      },
      
      // Activity breakdown
      activityMetrics: {
        totalBooked: reportData.activity.totalBooked, // All bookings made
        totalCompleted: reportData.activity.totalCompleted, // Only completed bookings
        totalCancelled: reportData.activity.totalCancelled,
        successRate: reportData.activity.successRate,
        completedBookingsCount: reportData.activity.completedBookingsCount
      },
      
      // Food categories from completed bookings only
      foodCategories: reportData.foodCategories,
      
      // Period information
      period: reportData.period,
      
      // User information
      recipient: reportData.recipient,
      
      // Full report preview
      fullReport: {
        id: fullReport.id,
        type: fullReport.type,
        hasNarrative: !!fullReport.narrative,
        narrativePreview: fullReport.narrative ? fullReport.narrative.substring(0, 300) + '...' : null,
        summary: fullReport.summary
      },
      
      // Data source indicator
      hasRealData: reportData.hasRealData,
      
      // Explanation of metrics
      explanation: {
        mealsSaved: "Only includes meals from bookings with status 'collected' or 'completed'",
        environmentalImpact: "Calculated based on actually collected food, not just booked food",
        activityTracking: "Total bookings vs completed bookings for success rate calculation",
        foodCategories: "Categories of food that was actually picked up and completed"
      },
      
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing recipient report:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recipient report',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// POST /api/test-recipient-reports - Test all recipient report periods
export async function POST(request) {
  try {
    const body = await request.json();
    const { recipientId = 'test-recipient-456' } = body;

    const reportTypes = ['daily', 'weekly', 'monthly'];
    const results = {};

    console.log(`Testing all recipient report types for: ${recipientId}`);

    for (const reportType of reportTypes) {
      try {
        console.log(`Testing ${reportType} recipient report...`);
        
        const reportData = await reportDataService.getRecipientReportData(recipientId, reportType);

        results[reportType] = {
          success: true,
          hasRealData: reportData.hasRealData,
          dataStatus: reportData.hasRealData ? 'real' : 'mock',
          period: reportData.period,
          
          // Impact metrics (completed food only)
          impact: {
            mealsSaved: reportData.impact.mealsSaved,
            carbonSaved: reportData.impact.carbonSaved,
            waterSaved: reportData.impact.waterSaved,
            impactScore: reportData.impact.impactScore
          },
          
          // Activity metrics
          activity: {
            totalBooked: reportData.activity.totalBooked,
            totalCompleted: reportData.activity.totalCompleted,
            successRate: reportData.activity.successRate
          },
          
          // Food categories from completed bookings
          foodCategoriesCount: reportData.foodCategories ? reportData.foodCategories.length : 0,
          
          // Key insight
          completionRate: reportData.activity.totalBooked > 0 ? 
            `${reportData.activity.totalCompleted}/${reportData.activity.totalBooked} bookings completed` :
            'No bookings in this period'
        };

        console.log(`✅ ${reportType} recipient report: ${reportData.impact.mealsSaved} meals saved from ${reportData.activity.totalCompleted} completed bookings`);

      } catch (error) {
        console.error(`❌ Error with ${reportType} recipient report:`, error);
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
      message: `Tested ${totalCount} recipient report types`,
      testParameters: {
        recipientId,
        reportTypes
      },
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
        successRate: `${Math.round((successCount / totalCount) * 100)}%`
      },
      keyInsight: "All metrics now focus on completed/picked up food only, not just booked food",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in comprehensive recipient report test:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test recipient reports',
      details: error.message
    }, { status: 500 });
  }
}
