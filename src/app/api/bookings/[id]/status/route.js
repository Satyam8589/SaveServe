// File: /app/api/bookings/[id]/status/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';

// GET method for checking booking status (used by QR code polling)
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await connectDB();
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' }, 
        { status: 400 }
      );
    }

    // Find the booking and verify user has access to it
    const booking = await Booking.findById(id).lean();
    
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' }, 
        { status: 404 }
      );
    }

    // Verify user has access to this booking (either recipient or provider)
    if (booking.recipientId !== userId && booking.providerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' }, 
        { status: 403 }
      );
    }

    // Return the current status with additional info for QR modal
    return NextResponse.json({
      success: true,
      bookingId: booking._id,
      status: booking.status,
      isCollected: booking.status === 'collected',
      isCompleted: booking.status === 'completed',
      collectedAt: booking.collectedAt,
      completedAt: booking.completedAt,
      qrCodeExpiry: booking.qrCodeExpiry,
      lastUpdated: booking.updatedAt || booking.createdAt,
      // Additional fields that might be useful for the frontend
      approvedQuantity: booking.approvedQuantity,
      collectionVerifiedBy: booking.collectionVerifiedBy
    });

  } catch (error) {
    console.error('Error fetching booking status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// PATCH method for updating booking status (existing functionality)
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { status, providerResponse } = await request.json();
    
    // Validate status input
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'collected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    const booking = await Booking.findById(id).populate('listingId');
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    if (!booking.listingId) {
      return NextResponse.json(
        { success: false, message: 'Associated listing not found' },
        { status: 404 }
      );
    }

    // Verify provider authorization
    if (booking.listingId.providerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this booking' },
        { status: 403 }
      );
    }

    // Add status transition validation
    const validTransitions = {
      'pending': ['approved', 'rejected'],
      'approved': ['completed', 'cancelled', 'collected'],
      'rejected': [],
      'completed': [],
      'cancelled': [],
      'collected': ['completed'] // Allow collected -> completed transition
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Cannot change status from ${booking.status} to ${status}` },
        { status: 400 }
      );
    }

    // Store old status for potential rollback
    const oldStatus = booking.status;
    
    // Update booking
    booking.status = status;
    if (providerResponse) booking.providerResponse = providerResponse;
    
    try {
      if (status === 'approved') {
        booking.approvedQuantity = booking.requestedQuantity;
        booking.approvedAt = new Date();
        
        await FoodListing.findByIdAndUpdate(booking.listingId._id, {
          status: 'booked',
          currentBooking: booking._id
        });
        
      } else if (status === 'rejected') {
        booking.rejectedAt = new Date();
        
        await FoodListing.findByIdAndUpdate(booking.listingId._id, {
          status: 'available',
          currentBooking: null
        });
        
      } else if (status === 'collected') {
        // Handle collected status (from QR scanning)
        booking.collectedAt = new Date();
        booking.collectionVerifiedBy = userId;
        
      } else if (status === 'completed') {
        booking.completedAt = new Date();
        
        await FoodListing.findByIdAndUpdate(booking.listingId._id, {
          status: 'completed',
          quantity: Math.max(0, booking.listingId.quantity - booking.approvedQuantity),
          currentBooking: null
        });
        
      } else if (status === 'cancelled') {
        booking.cancelledAt = new Date();
        
        if (booking.listingId.status === 'booked') {
          await FoodListing.findByIdAndUpdate(booking.listingId._id, {
            status: 'available',
            currentBooking: null
          });
        }
      }

      await booking.save();

      const updatedBooking = await Booking.findById(id).populate('listingId');

      return NextResponse.json({
        success: true,
        data: updatedBooking,
        message: `Booking ${status} successfully`
      });
      
    } catch (updateError) {
      booking.status = oldStatus;
      await booking.save();
      throw updateError;
    }

  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}