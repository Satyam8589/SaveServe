import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

// Test endpoint to reject a user (for demonstration purposes)
export async function POST(request) {
  try {
    const { userId, reason } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user profile
    const userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Reject the user
    await userProfile.reject(
      'admin_test', 
      reason || 'Test rejection for demonstration'
    );

    return NextResponse.json({
      success: true,
      message: 'User has been rejected successfully',
      userStatus: userProfile.userStatus,
      statusReason: userProfile.statusReason
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test endpoint to activate a user (for demonstration purposes)
export async function PUT(request) {
  try {
    const { userId, reason } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user profile
    const userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Activate the user
    await userProfile.activate(
      'admin_test', 
      reason || 'Test activation for demonstration'
    );

    return NextResponse.json({
      success: true,
      message: 'User has been activated successfully',
      userStatus: userProfile.userStatus,
      statusReason: userProfile.statusReason
    });

  } catch (error) {
    console.error('Error activating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
