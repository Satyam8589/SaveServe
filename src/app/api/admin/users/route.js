// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import UserProfile from '../../../../models/UserProfile';

// GET request handler - Fetch all users for admin
export async function GET(request) {
  try {
    console.log('🔍 GET /api/admin/users - Starting request');
    
    // Check if user is authenticated and is admin
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No user found' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = user.publicMetadata?.mainRole;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter by status
    const limit = parseInt(searchParams.get('limit')) || 100;
    const skip = parseInt(searchParams.get('skip')) || 0;

    console.log('📝 Query params:', { status, limit, skip });

    // Build query
    let query = { isActive: true };
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      query.approvalStatus = status;
    }

    console.log('🔎 Fetching users with query:', query);
    
    const users = await UserProfile.find(query)
      .select('-fcmToken') // Exclude sensitive data
      .sort({ submittedForApprovalAt: -1, createdAt: -1 }) // Newest first
      .limit(limit)
      .skip(skip)
      .lean();

    const totalCount = await UserProfile.countDocuments(query);

    console.log('✅ Found users:', {
      count: users.length,
      total: totalCount,
      hasMore: (skip + users.length) < totalCount
    });
    
    return NextResponse.json({
      success: true,
      message: 'Users fetched successfully.',
      users: users,
      pagination: {
        total: totalCount,
        limit: limit,
        skip: skip,
        hasMore: (skip + users.length) < totalCount
      }
    });

  } catch (error) {
    console.error('💥 GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching users.' },
      { status: 500 }
    );
  }
}

// POST request handler - Create admin user (optional)
export async function POST(request) {
  try {
    console.log('📝 POST /api/admin/users - Starting request');
    
    // Check if user is authenticated and is admin
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No user found' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = user.publicMetadata?.mainRole;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { action, userId, data } = body;

    console.log('📦 Received admin action:', { action, userId });

    switch (action) {
      case 'UPDATE_STATUS':
        const profile = await UserProfile.findOne({ userId });
        if (!profile) {
          return NextResponse.json(
            { success: false, message: 'User profile not found.' },
            { status: 404 }
          );
        }

        // Update the profile with new data
        Object.assign(profile, data);
        await profile.save();

        console.log('✅ User status updated:', { userId, newStatus: data.approvalStatus });
        
        return NextResponse.json({
          success: true,
          message: 'User status updated successfully.',
          user: profile
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action specified.' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('💥 POST /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while processing admin action.' },
      { status: 500 }
    );
  }
}
