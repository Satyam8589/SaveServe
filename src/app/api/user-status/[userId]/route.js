import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user profile
    const userProfile = await UserProfile.findOne({ userId, isActive: true });
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Return user status information
    const userStatus = {
      userStatus: userProfile.userStatus,
      statusReason: userProfile.statusReason,
      statusChangedAt: userProfile.statusChangedAt,
      statusChangedBy: userProfile.statusChangedBy,
      isBlocked: userProfile.userStatus === 'BLOCKED',
      isActive: userProfile.userStatus === 'ACTIVE',
      isApproved: userProfile.userStatus === 'APPROVED',
      isRejected: userProfile.userStatus === 'REJECTED'
    };

    return NextResponse.json({
      success: true,
      userStatus
    });

  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update user status (for admin use)
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const { userId } = await params;
    const body = await request.json();
    const { action, reason, adminUserId } = body;
    
    if (!userId || !action || !adminUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID, action, and admin ID are required' },
        { status: 400 }
      );
    }

    // Find user profile
    const userProfile = await UserProfile.findOne({ userId, isActive: true });
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Perform the requested action
    let result;
    switch (action) {
      case 'approve':
        result = await userProfile.approve(adminUserId, reason);
        break;
      case 'reject':
        result = await userProfile.reject(adminUserId, reason);
        break;
      case 'block':
        result = await userProfile.block(adminUserId, reason);
        break;
      case 'unblock':
        result = await userProfile.unblock(adminUserId, reason);
        break;
      case 'activate':
        result = await userProfile.activate(adminUserId, reason);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}ed successfully`,
      userStatus: {
        userStatus: result.userStatus,
        statusReason: result.statusReason,
        statusChangedAt: result.statusChangedAt,
        statusChangedBy: result.statusChangedBy
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
