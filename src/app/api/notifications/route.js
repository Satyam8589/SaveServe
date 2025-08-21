// app/api/notifications/route.js
// MongoDB-based notifications API to replace Firestore
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserNotifications } from '@/lib/mongoNotificationService';

export async function GET(request) {
  try {
    const { userId } = await auth(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const filterUnread = searchParams.get('filterUnread') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = parseInt(searchParams.get('sortOrder') || '-1');

    console.log('📱 Fetching notifications for user:', userId, {
      limit,
      skip,
      filterUnread,
      sortBy,
      sortOrder
    });

    const result = await getUserNotifications(userId, {
      limit,
      skip,
      filterUnread,
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications: result.notifications,
      totalCount: result.totalCount,
      unreadCount: result.unreadCount,
      hasMore: result.hasMore,
    });

  } catch (error) {
    console.error('❌ Notifications API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
