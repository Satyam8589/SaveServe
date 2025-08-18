import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { userId } = await auth(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    const { status, providerResponse } = await request.json();
    
    const booking = await Booking.findById(id).populate('listingId');
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
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

    // Update booking
    booking.status = status;
    if (providerResponse) booking.providerResponse = providerResponse;
    
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
    } else if (status === 'completed') { // --- ADDED THIS BLOCK ---
      booking.completedAt = new Date();
      // Mark listing as completed & unavailable
      await FoodListing.findByIdAndUpdate(booking.listingId._id, {
        status: 'completed',
        quantity: 0, 
        currentBooking: null
      });
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}