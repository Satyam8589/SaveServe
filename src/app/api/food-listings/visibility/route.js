import { NextResponse } from "next/server";
import {
  updateVisibilityRules,
  getVisibilitySummary,
  updateListingVisibility,
} from "@/lib/updateVisibilityRules";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "summary") {
      const summary = await getVisibilitySummary();
      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    // Default: update all visibility rules
    const result = await updateVisibilityRules();
    return NextResponse.json({
      success: true,
      message: `Updated ${result.updated} listings`,
      data: result,
    });
  } catch (error) {
    console.error("Error in visibility API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, listingId } = body;

    if (action === "update_listing" && listingId) {
      const result = await updateListingVisibility(listingId);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (action === "update_all") {
      const result = await updateVisibilityRules();
      return NextResponse.json({
        success: true,
        message: `Updated ${result.updated} listings`,
        data: result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid action specified",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in visibility POST API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
