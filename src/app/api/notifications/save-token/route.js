// app/api/notifications/save-token/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No user session'
      }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { token, userId, role, area } = body;

    console.log('🔔 Saving FCM token for user:', userId);
    console.log('📱 Token:', token);
    console.log('👤 Role:', role);
    console.log('📍 Area:', area);

    // Validate required fields
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'FCM token is required'
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Ensure the authenticated user matches the userId in the request
    if (clerkUserId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID mismatch'
      }, { status: 403 });
    }

    // Validate role if provided
    if (role && !['provider', 'recipient'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be either "provider" or "recipient"'
      }, { status: 400 });
    }

    // Update or create user profile with FCM token
    const updateData = {
      fcmToken: token,
      'stats.lastActivity': new Date()
    };

    // Only update role and area if they are provided
    if (role) {
      updateData.role = role;
    }
    if (area) {
      updateData.area = area;
    }

    const user = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    console.log('✅ FCM token saved successfully for user:', user.userId);
    console.log('📱 Token saved:', user.fcmToken ? 'Yes' : 'No');
    console.log('👤 User role:', user.role);
    console.log('📍 User area:', user.area);

    return NextResponse.json({
      success: true,
      message: 'FCM token saved successfully',
      data: {
        userId: user.userId,
        role: user.role,
        area: user.area,
        tokenSaved: !!user.fcmToken
      }
    });

  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    
    // Handle specific mongoose errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({
        success: false,
        error: `Validation error: ${error.message}`
      }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'Duplicate user data conflict'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to save FCM token'
    }, { status: 500 });
  }
}