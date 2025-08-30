import { NextResponse } from "next/server";
import { updateVisibilityRules } from "@/lib/updateVisibilityRules";

export async function GET(request) {
  try {
    // This endpoint can be called by external cron services (e.g., Vercel Cron, GitHub Actions, etc.)
    // to automatically update visibility rules every minute

    const result = await updateVisibilityRules();

    return NextResponse.json({
      success: true,
      message: `Visibility rules updated successfully`,
      timestamp: new Date().toISOString(),
      updated: result.updated,
      data: result,
    });
  } catch (error) {
    console.error("Error in cron visibility update:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Also support POST for cron services that prefer POST requests
  return GET(request);
}
