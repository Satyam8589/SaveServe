// Debug endpoint to check recipient booking data
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import UserProfile from '@/models/UserProfile';
import mongoose from 'mongoose';

// GET /api/debug-recipient-data - Debug recipient booking data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId') || 'user_31XaVMYRT2fkHWE2tLdCES4Bhi2';
    const reportType = searchParams.get('reportType') || 'weekly';

    await connectDB();

    // Calculate date range
    const now = new Date();
    const ranges = {
      daily: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        end: now
      },
      weekly: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
        end: now
      },
      monthly: {
        start: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
        end: now
      }
    };
    
    const { start, end } = ranges[reportType] || ranges.weekly;

    // Check if user exists
    const user = await UserProfile.findOne({ userId: recipientId });

    // Get ALL bookings for this recipient
    const allBookingsEver = await Booking.find({
      recipientId: recipientId
    }).lean();

    // Get bookings in date range
    const allBookings = await Booking.find({
      recipientId: recipientId,
      createdAt: { $gte: start, $lte: end }
    }).lean();

    // Get only collected bookings
    const collectedBookings = allBookings.filter(b => b.status === 'collected');

    // Get booking status breakdown
    const statusBreakdown = {};
    allBookings.forEach(booking => {
      const status = booking.status || 'unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Calculate meals from collected bookings
    const totalMealsFromCollected = collectedBookings.reduce((sum, booking) => {
      const quantity = booking.approvedQuantity || booking.requestedQuantity || 1;
      return sum + quantity;
    }, 0);

    return NextResponse.json({
      success: true,
      debug: 'Recipient booking data analysis',
      recipientId,
      reportType,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      user: user ? {
        name: user.fullName,
        email: user.email,
        role: user.role,
        subrole: user.subrole
      } : null,
      bookingAnalysis: {
        totalBookingsEver: allBookingsEver.length,
        bookingsInPeriod: allBookings.length,
        collectedInPeriod: collectedBookings.length,
        statusBreakdown,
        totalMealsFromCollected
      },
      sampleBookings: allBookings.slice(0, 5).map(booking => ({
        id: booking._id,
        status: booking.status,
        requestedQuantity: booking.requestedQuantity,
        approvedQuantity: booking.approvedQuantity,
        createdAt: booking.createdAt,
        listingId: booking.listingId
      })),
      collectedBookings: collectedBookings.map(booking => ({
        id: booking._id,
        status: booking.status,
        requestedQuantity: booking.requestedQuantity,
        approvedQuantity: booking.approvedQuantity,
        mealsCount: booking.approvedQuantity || booking.requestedQuantity || 1,
        createdAt: booking.createdAt
      })),
      calculations: {
        totalBooked: allBookings.length,
        totalCollected: collectedBookings.length,
        successRate: allBookings.length > 0 ? Math.round((collectedBookings.length / allBookings.length) * 100) : 0,
        mealsSaved: totalMealsFromCollected,
        carbonSaved: (totalMealsFromCollected * 0.24).toFixed(1),
        waterSaved: Math.round(totalMealsFromCollected * 12.5)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error debugging recipient data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug recipient data',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// POST /api/debug-recipient-data - Create test bookings for debugging
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      recipientId = 'user_31XaVMYRT2fkHWE2tLdCES4Bhi2',
      createTestBookings = false,
      testBookingsCount = 5
    } = body;

    if (!createTestBookings) {
      return NextResponse.json({
        success: false,
        message: 'Set createTestBookings: true to create test bookings',
        example: {
          recipientId: 'user_31XaVMYRT2fkHWE2tLdCES4Bhi2',
          createTestBookings: true,
          testBookingsCount: 5
        }
      });
    }

    await connectDB();

    const testBookings = [];
    const statuses = ['pending', 'approved', 'collected', 'rejected', 'cancelled'];
    
    for (let i = 0; i < testBookingsCount; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const requestedQuantity = Math.floor(Math.random() * 3) + 1;
      const approvedQuantity = status === 'collected' ? requestedQuantity : 0;
      
      const testBooking = new Booking({
        listingId: new mongoose.Types.ObjectId(),
        providerId: 'test-provider-' + i,
        providerName: `Test Provider ${i}`,
        recipientId: recipientId,
        recipientName: 'Test Recipient',
        requestedQuantity,
        approvedQuantity,
        status,
        requestMessage: `Test booking ${i}`,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        updatedAt: new Date()
      });

      const savedBooking = await testBooking.save();
      testBookings.push({
        id: savedBooking._id,
        status: savedBooking.status,
        requestedQuantity: savedBooking.requestedQuantity,
        approvedQuantity: savedBooking.approvedQuantity,
        createdAt: savedBooking.createdAt
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${testBookingsCount} test bookings`,
      recipientId,
      testBookings,
      note: 'Now test the recipient report to see if data is calculated correctly',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating test bookings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create test bookings',
      details: error.message
    }, { status: 500 });
  }
}
