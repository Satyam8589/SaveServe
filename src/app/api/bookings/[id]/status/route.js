// File: /app/api/bookings/[id]/status/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';

export async function PATCH(request, { params }) {
  try {
    // Fix 1: Handle params properly for Next.js 13+ App Router
    const { id } = params; // Remove await - params is already resolved
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { status, providerResponse } = await request.json();
    
    // Fix 2: Validate status input
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
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

    // Fix 3: Check if listing exists after population
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

    // Fix 4: Add status transition validation
    const validTransitions = {
      'pending': ['approved', 'rejected'],
      'approved': ['completed', 'cancelled'],
      'rejected': [], // Cannot change from rejected
      'completed': [], // Cannot change from completed
      'cancelled': [] // Cannot change from cancelled
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
        
        // Update listing status
        await FoodListing.findByIdAndUpdate(booking.listingId._id, {
          status: 'booked',
          currentBooking: booking._id
        });
        
      } else if (status === 'rejected') {
        booking.rejectedAt = new Date();
        
        // Reset listing to available
        await FoodListing.findByIdAndUpdate(booking.listingId._id, {
          status: 'available',
          currentBooking: null
        });
        
      } else if (status === 'completed') {
        booking.completedAt = new Date();
        
        // Fix 5: Update listing properly for completion
        await FoodListing.findByIdAndUpdate(booking.listingId._id, {
          status: 'completed',
          quantity: Math.max(0, booking.listingId.quantity - booking.approvedQuantity), // Reduce quantity properly
          currentBooking: null
        });
        
      } else if (status === 'cancelled') {
        booking.cancelledAt = new Date();
        
        // Reset listing to available if it was booked
        if (booking.listingId.status === 'booked') {
          await FoodListing.findByIdAndUpdate(booking.listingId._id, {
            status: 'available',
            currentBooking: null
          });
        }
      }

      // Save the booking
      await booking.save();

      // Fix 6: Return populated booking for frontend
      const updatedBooking = await Booking.findById(id).populate('listingId');

      return NextResponse.json({
        success: true,
        data: updatedBooking,
        message: `Booking ${status} successfully`
      });
      
    } catch (updateError) {
      // Rollback booking status if listing update failed
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