import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Booking ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Booking not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if booking has been collected (scanned)
    const isScanned = booking.status === 'collected' && booking.collectedAt;

    return new Response(JSON.stringify({
      success: true,
      isScanned: isScanned,
      status: booking.status,
      collectedAt: booking.collectedAt,
      collectionVerifiedBy: booking.collectionVerifiedBy
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking scan status:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error checking scan status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
