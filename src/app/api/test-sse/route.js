// app/api/test-sse/route.js
// Test endpoint for SSE notifications
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendSSENotification } from "@/lib/sendSSENotification";

export async function POST(request) {
  try {
    // Authenticate the user
    const { userId: authUserId } = await auth(request);
    
    if (!authUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, title, message, type } = body;

    // Validate required fields
    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only allow users to send notifications to themselves (for testing)
    if (userId !== authUserId) {
      return NextResponse.json(
        { success: false, error: 'Can only send test notifications to yourself' },
        { status: 403 }
      );
    }

    console.log(`🧪 Test SSE notification request for user: ${userId}`);
    console.log(`📋 Title: ${title}`);
    console.log(`💬 Message: ${message}`);

    // Send SSE notification
    const result = await sendSSENotification(userId, {
      title,
      message,
      type: type || 'test',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        action: 'test_notification'
      }
    });

    if (result) {
      console.log(`✅ Test SSE notification sent successfully to user: ${userId}`);
      return NextResponse.json({
        success: true,
        message: 'SSE notification sent successfully',
        userId,
        title
      });
    } else {
      console.log(`❌ Failed to send test SSE notification to user: ${userId}`);
      return NextResponse.json(
        { success: false, error: 'Failed to send SSE notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Test SSE endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
