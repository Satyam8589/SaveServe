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
    // Create and save notification
    const notification = new Notification({
      userId,
      title,
      message,
      type: type || "reminder", // Use a valid default type
      data: data || {},
      read: false,
      createdAt: new Date(),
    });
    await notification.save();
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Error storing notification:", error);
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
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}