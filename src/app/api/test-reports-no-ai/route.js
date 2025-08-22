// Test endpoint for reports without AI/Gemini API (quota-safe)
import { NextResponse } from 'next/server';
import reportDataService from '@/services/reportDataService';
import geminiReportService from '@/services/geminiReportService';

// GET /api/test-reports-no-ai - Test reports without using Gemini API
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') || 'recipient';
    const reportType = searchParams.get('reportType') || 'weekly';
    const userId = searchParams.get('userId') || `test-${userType}-${Date.now()}`;

    console.log(`Testing ${userType} ${reportType} report (no AI) for: ${userId}`);

    let reportData;
    let fallbackReport;

    if (userType === 'provider') {
      // Get provider data
      reportData = await reportDataService.getProviderReportData(userId, reportType);
      // Generate fallback report (no Gemini API)
      fallbackReport = geminiReportService.generateFallbackProviderReport(reportData, reportType);
    } else {
      // Get recipient data
      reportData = await reportDataService.getRecipientReportData(userId, reportType);
      // Generate fallback report (no Gemini API)
      fallbackReport = geminiReportService.generateFallbackRecipientReport(reportData, reportType);
    }

    // Create complete report structure
    const completeReport = {
      id: `${userType}-${userId}-${reportType}-${Date.now()}`,
      type: userType,
      reportType,
      generatedAt: new Date().toISOString(),
      user: userType === 'provider' ? reportData.provider : reportData.recipient,
      period: reportData.period,
      data: reportData,
      narrative: fallbackReport,
      summary: userType === 'provider' ? {
        totalFoodListed: reportData.kpis.totalFoodListed,
        totalFoodCollected: reportData.kpis.totalFoodCollected,
        efficiency: `${100 - parseFloat(reportData.kpis.wastePercentage)}%`,
        keyMetric: `${reportData.kpis.carbonSaved}kg CO₂ saved`
      } : {
        mealsSaved: reportData.impact.mealsSaved,
        impactScore: reportData.impact.impactScore,
        successRate: `${reportData.activity.successRate}%`,
        keyMetric: `${reportData.impact.carbonSaved}kg CO₂ saved`
      },
      generationMethod: 'fallback', // Indicates no AI was used
      hasRealData: reportData.hasRealData
    };

    return NextResponse.json({
      success: true,
      message: `${userType} ${reportType} report generated successfully (no AI)`,
      testParameters: {
        userId,
        userType,
        reportType
      },
      dataStatus: reportData.hasRealData ? 'Using real database data' : 'Using mock data for demonstration',
      generationMethod: 'Fallback (no Gemini API)',
      
      // Key metrics
      metrics: userType === 'provider' ? {
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
        successRate: reportData.activity.successRate,
        completedBookings: reportData.activity.totalCompleted,
        totalBookings: reportData.activity.totalBooked
      },
      
      // Report content
      report: {
        id: completeReport.id,
        hasNarrative: true,
        narrativeLength: fallbackReport.length,
        narrativePreview: fallbackReport.substring(0, 200) + '...',
        summary: completeReport.summary
      },
      
      // Full report for email testing
      fullReport: completeReport,
      
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in no-AI report test:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report without AI',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// POST /api/test-reports-no-ai - Test email sending with fallback reports
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      email = 'gabbar656521@gmail.com',
      userType = 'recipient',
      reportType = 'weekly',
      userId = `test-${userType}-${Date.now()}`
    } = body;

    console.log(`Testing ${userType} ${reportType} report email (no AI) for: ${email}`);

    let reportData;
    let fallbackReport;

    if (userType === 'provider') {
      reportData = await reportDataService.getProviderReportData(userId, reportType);
      fallbackReport = geminiReportService.generateFallbackProviderReport(reportData, reportType);
    } else {
      reportData = await reportDataService.getRecipientReportData(userId, reportType);
      fallbackReport = geminiReportService.generateFallbackRecipientReport(reportData, reportType);
    }

    // Create complete report
    const completeReport = {
      id: `${userType}-${userId}-${reportType}-${Date.now()}`,
      type: userType,
      reportType,
      generatedAt: new Date().toISOString(),
      [userType]: userType === 'provider' ? reportData.provider : reportData.recipient,
      period: reportData.period,
      data: reportData,
      narrative: fallbackReport,
      summary: userType === 'provider' ? {
        totalFoodListed: reportData.kpis.totalFoodListed,
        totalFoodCollected: reportData.kpis.totalFoodCollected,
        efficiency: `${100 - parseFloat(reportData.kpis.wastePercentage)}%`,
        keyMetric: `${reportData.kpis.carbonSaved}kg CO₂ saved`
      } : {
        mealsSaved: reportData.impact.mealsSaved,
        impactScore: reportData.impact.impactScore,
        successRate: `${reportData.activity.successRate}%`,
        keyMetric: `${reportData.impact.carbonSaved}kg CO₂ saved`
      }
    };

    // Send email
    const emailService = (await import('@/services/emailService')).default;
    const emailResult = await emailService.sendReportEmail(completeReport, {
      email,
      name: userType === 'provider' ? reportData.provider.name : reportData.recipient.name
    });

    return NextResponse.json({
      success: true,
      message: `${userType} report email sent successfully (no AI)`,
      testParameters: {
        email,
        userType,
        reportType,
        userId
      },
      dataStatus: reportData.hasRealData ? 'real data' : 'mock data',
      generationMethod: 'Fallback (no Gemini API)',
      emailResult,
      reportPreview: {
        id: completeReport.id,
        type: completeReport.type,
        hasNarrative: true,
        narrativeLength: fallbackReport.length,
        summary: completeReport.summary
      },
      note: 'Email sent with fallback report content (no AI quota used)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending no-AI report email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send report email without AI',
      details: error.message
    }, { status: 500 });
  }
}
