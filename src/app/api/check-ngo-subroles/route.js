// Check what users have subrole "NGO" in the database
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

// GET /api/check-ngo-subroles - Check NGO subroles in database
export async function GET(request) {
  try {
    await connectDB();

    // Check for users with subrole "NGO"
    const ngoSubroleUsers = await UserProfile.find({
      role: 'RECIPIENT',
      subrole: 'NGO'
    }).select('userId fullName email role subrole organizationType isActive userStatus').lean();

    // Check all recipients to see their subroles
    const allRecipients = await UserProfile.find({
      role: 'RECIPIENT'
    }).select('userId fullName email role subrole organizationType isActive userStatus').lean();

    // Get unique subroles
    const uniqueSubroles = [...new Set(allRecipients.map(user => user.subrole).filter(Boolean))];

    // Count by subrole
    const subroleCount = {};
    allRecipients.forEach(user => {
      const subrole = user.subrole || 'No Subrole';
      subroleCount[subrole] = (subroleCount[subrole] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      message: 'NGO subrole analysis complete',
      ngoSubroleUsers: {
        count: ngoSubroleUsers.length,
        users: ngoSubroleUsers.map(user => ({
          name: user.fullName,
          email: user.email,
          subrole: user.subrole,
          organizationType: user.organizationType,
          isActive: user.isActive,
          userStatus: user.userStatus
        }))
      },
      allRecipientsAnalysis: {
        totalRecipients: allRecipients.length,
        uniqueSubroles: uniqueSubroles,
        subroleBreakdown: subroleCount
      },
      recommendation: ngoSubroleUsers.length === 0 ? 
        'No users found with subrole "NGO". You may need to create test users or update existing users.' :
        `Found ${ngoSubroleUsers.length} users with subrole "NGO". Bulk notifications will be sent to these users only.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking NGO subroles:', error);
    return NextResponse.json(
      { error: 'Failed to check NGO subroles', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/check-ngo-subroles - Create a test NGO user for demo
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      email = 'test-ngo@saveserve.com',
      name = 'Test NGO Organization',
      createTestUser = false 
    } = body;

    if (!createTestUser) {
      return NextResponse.json({
        success: false,
        message: 'Set createTestUser: true to create a test NGO user',
        example: {
          email: 'test-ngo@saveserve.com',
          name: 'Test NGO Organization',
          createTestUser: true
        }
      });
    }

    // Check if user already exists
    const existingUser = await UserProfile.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists',
        existingUser: {
          name: existingUser.fullName,
          email: existingUser.email,
          role: existingUser.role,
          subrole: existingUser.subrole
        }
      });
    }

    // Create test NGO user with all required fields
    const testNGOUser = new UserProfile({
      userId: 'test-ngo-' + Date.now(),
      fullName: name,
      email: email,
      role: 'RECIPIENT',
      subrole: 'NGO',
      phoneNumber: '+1234567890', // Required field
      campusLocation: 'NGO Office', // Required field
      organizationName: name, // Required for NGO subrole
      organizationType: 'NGO',
      description: 'Test NGO organization for bulk food notifications',
      isActive: true,
      userStatus: 'ACTIVE',
      isProfileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedUser = await testNGOUser.save();

    return NextResponse.json({
      success: true,
      message: 'Test NGO user created successfully',
      testUser: {
        userId: savedUser.userId,
        name: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role,
        subrole: savedUser.subrole,
        organizationType: savedUser.organizationType,
        isActive: savedUser.isActive,
        userStatus: savedUser.userStatus
      },
      note: 'This user will now receive bulk food notifications when listings have 50+ items',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating test NGO user:', error);
    return NextResponse.json(
      { error: 'Failed to create test NGO user', details: error.message },
      { status: 500 }
    );
  }
}
