import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';

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
    const { rating, feedback } = await request.json();
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user authorization
    if (booking.recipientId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to rate this booking' },
        { status: 403 }
      );
    }

    // Verify booking is completed
    if (booking.status !== 'collected') {
      return NextResponse.json(
        { success: false, message: 'Can only rate completed bookings' },
        { status: 400 }
      );
    }

    booking.rating = rating;
    if (feedback) booking.feedback = feedback;
    await booking.save();

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Rate booking error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to rate booking' },
      { status: 500 }
    );
  }
}