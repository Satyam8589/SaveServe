// app/api/notification/mark-read/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

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

    // Get notification ID from request body
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format - all notifications now use MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID format. Expected MongoDB ObjectId.' },
        { status: 400 }
      );
    }

    // Find and update the MongoDB notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: userId
      },
      {
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found or unauthorized' },
        { status: 404 }
      );
    }

    console.log(`✅ Notification ${notificationId} marked as read for user ${userId}`);

    // Transform _id to id for frontend compatibility
    const transformedNotification = {
      ...notification.toObject(),
      id: notification._id.toString(),
      _id: undefined
    };

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: transformedNotification
    });

  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
