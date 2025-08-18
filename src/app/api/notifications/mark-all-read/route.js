// app/api/notifications/mark-all-read/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { markAllNotificationsAsRead } from '@/lib/firestoreNotificationService';

export async function POST(request) {
  try {
    const { userId } = await auth(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await markAllNotificationsAsRead(userId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`
    });

  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}