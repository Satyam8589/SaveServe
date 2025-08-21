// GET /api/notification/store
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

// POST /api/notification/store
export async function POST(request) {
  try {
    console.log('📝 POST /api/notification/store - Processing notification...');

    // Authenticate the user (optional - some notifications might be system-generated)
    const { userId: authUserId } = await auth(request);

    await connectDB();
    console.log('✅ Database connected');

    const body = await request.json();

    // Validate required fields
    const { userId, title, message, type, data } = body;

    // If authenticated, ensure user can only create notifications for themselves
    // (unless it's a system/admin operation)
    if (authUserId && userId !== authUserId) {
      return NextResponse.json(
        { success: false, message: "Cannot create notifications for other users." },
        { status: 403 }
      );
    }

    if (!userId || !title || !message) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    // Coerce/validate notification type to schema enum (updated to match Notification model)
    const allowedTypes = [
      'new-food', 'success', 'expiring-soon', 'reminder', 'expired', 'report', 'connection',
      'new_listing', 'listing_created_confirmation', 'booking_confirmed', 'new_booking',
      'collection_confirmed', 'collection_completed_confirmation', 'general'
    ];
    const safeType = allowedTypes.includes(type) ? type : 'general';

    // Create and save notification
    const notificationData = {
      userId,
      title,
      message,
      type: safeType, // ensure valid enum
      data: data || {},
      read: false,
      createdAt: new Date(),
    };
    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();
    console.log('✅ Notification saved to database with ID:', savedNotification._id);

    // Transform _id to id for frontend compatibility
    const transformedNotification = {
      ...savedNotification.toObject(),
      id: savedNotification._id.toString(),
      _id: undefined
    };

    return NextResponse.json({ success: true, notification: transformedNotification });
  } catch (error) {
    console.error("❌ Error storing notification:", error);
    console.error("❌ Error name:", error?.name);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error stack:", error?.stack);

    // Surface validation errors to client for easier debugging
    if (error?.name === 'ValidationError') {
      console.error("❌ Validation Error Details:", error.errors);
      return NextResponse.json({
        success: false,
        message: error.message,
        validationErrors: error.errors
      }, { status: 400 });
    }

    if (error?.name === 'MongoError' || error?.name === 'MongoServerError') {
      console.error("❌ MongoDB Error:", error);
      return NextResponse.json({
        success: false,
        message: "Database error",
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      message: "Internal server error",
      error: error.message
    }, { status: 500 });
  }
}


export async function GET(request) {
  try {
    // Authenticate the user
    const { userId } = await auth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type");

    // Build query
    const query = { userId };
    if (unreadOnly) query.read = false;
    if (type) query.type = type;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ]);

    // Transform _id to id for frontend compatibility
    const transformedNotifications = notifications.map(notification => ({
      ...notification,
      id: notification._id.toString(),
      _id: undefined // Remove _id to avoid confusion
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      notifications: transformedNotifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}