// app/api/notifications/[id]/mark-read/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markNotificationAsRead } from '@/lib/firestoreNotificationService';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: notificationId } = await params;
    
    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const result = await markNotificationAsRead(userId, notificationId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

