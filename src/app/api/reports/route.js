// API endpoints for report management
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import reportGenerationService from '@/services/reportGenerationService';
import { triggerReportGeneration } from '@/lib/inngest';

// GET /api/reports - Get available reports for user
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'weekly';
    const userType = searchParams.get('userType');

    if (!userType || !['provider', 'recipient'].includes(userType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    // For now, we'll generate the report on-demand
    // In a production system, you might want to store and retrieve cached reports
    let report;
    if (userType === 'provider') {
      report = await reportGenerationService.generateProviderReport(userId, reportType);
    } else {
      report = await reportGenerationService.generateRecipientReport(userId, reportType);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate a new report
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportType = 'weekly', userType, sendEmail = false } = body;

    if (!userType || !['provider', 'recipient'].includes(userType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Generate report immediately
    let report;
    if (userType === 'provider') {
      report = await reportGenerationService.generateProviderReport(userId, reportType);
    } else {
      report = await reportGenerationService.generateRecipientReport(userId, reportType);
    }

    // Optionally send email directly (bypass Inngest for now)
    if (sendEmail) {
      try {
        const emailService = (await import('@/services/emailService')).default;
        const emailResult = await emailService.sendReportEmail(report, {
          email: report.type === 'provider' ? report.provider.email : report.recipient.email,
          name: report.type === 'provider' ? report.provider.name : report.recipient.name
        });
        console.log('Email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      report,
      emailTriggered: sendEmail,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}
