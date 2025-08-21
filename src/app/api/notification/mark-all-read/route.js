// app/api/notification/mark-all-read/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';

export async function POST(request) {
  try {
    // Authenticate the user
    const { userId } = await auth(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { 
        userId: userId,
        read: false 
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      count: result.modifiedCount
    });

  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
