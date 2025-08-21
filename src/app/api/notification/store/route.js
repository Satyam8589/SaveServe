// GET /api/notification/store
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

// POST /api/notification/store
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    // Validate required fields
    const { userId, title, message, type, data } = body;
    if (!userId || !title || !message) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }
    // Coerce/validate notification type to schema enum
    const allowedTypes = ['new-food','success', 'expiring-soon', 'reminder', 'expired', 'report','connection'];
    const safeType = allowedTypes.includes(type) ? type : 'reminder';
    // Create and save notification
    const notification = new Notification({
      userId,
      title,
      message,
      type: safeType, // ensure valid enum
      data: data || {},
      read: false,
      createdAt: new Date(),
    });
    await notification.save();

    // Transform _id to id for frontend compatibility
    const transformedNotification = {
      ...notification.toObject(),
      id: notification._id.toString(),
      _id: undefined
    };

    return NextResponse.json({ success: true, notification: transformedNotification });
  } catch (error) {
    console.error("Error storing notification:", error);
    // Surface validation errors to client for easier debugging
    if (error?.name === 'ValidationError') {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}


export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, message: "Missing userId." }, { status: 400 });
    }
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();

    // Transform _id to id for frontend compatibility
    const transformedNotifications = notifications.map(notification => ({
      ...notification,
      id: notification._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    }));

    return NextResponse.json({ success: true, notifications: transformedNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}