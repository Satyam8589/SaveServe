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
    const { reason } = await request.json();
    
    const booking = await Booking.findById(id).populate('listingId');
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user authorization (recipient or provider can cancel)
    if (booking.recipientId !== userId && booking.listingId.providerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to cancel this booking' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (!['pending', 'approved'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, message: 'Cannot cancel booking with current status' },
        { status: 400 }
      );
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    if (reason) booking.cancellationReason = reason;
    await booking.save();

    // Reset listing to available
    await FoodListing.findByIdAndUpdate(booking.listingId._id, {
      status: 'available',
      currentBooking: null
    });

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}