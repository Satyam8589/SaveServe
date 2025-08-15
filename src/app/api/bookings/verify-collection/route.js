// app/api/bookings/verify-collection/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';
import User from '@/models/User';
import { QRCodeService } from '@/lib/qrCodeService';

export async function POST(request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    const body = await request.json();
    const { qrData, collectionCode, providerId, listingId } = body;

    console.log('🔍 Verifying collection request:', {
      hasQRData: !!qrData,
      hasCollectionCode: !!collectionCode,
      providerId,
      listingId
    });

    // Verify provider authorization
    const listing = await FoodListing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'Food listing not found' },
        { status: 404 }
      );
    }

    if (listing.providerId !== providerId) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to collect for this listing' },
        { status: 403 }
      );
    }

    let booking = null;

    // Handle QR code verification
    if (qrData) {
      const qrVerification = QRCodeService.verifyQRData(qrData);
      
      if (!qrVerification.isValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid QR code format' },
          { status: 400 }
        );
      }

      const { bookingId, recipientId, listingId: qrListingId } = qrVerification.data;

      // Verify QR data matches the request
      if (qrListingId !== listingId) {
        return NextResponse.json(
          { success: false, message: 'QR code does not match this listing' },
          { status: 400 }
        );
      }

      // Find the booking
      booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return NextResponse.json(
          { success: false, message: 'Booking not found' },
          { status: 404 }
        );
      }

      // Verify QR code belongs to this booking
      if (booking.recipient !== recipientId) {
        return NextResponse.json(
          { success: false, message: 'QR code does not match booking recipient' },
          { status: 400 }
        );
      }
    }
    // Handle collection code verification
    else if (collectionCode) {
      booking = await Booking.findOne({
        collectionCode: collectionCode,
        foodListing: listingId,
        status: { $in: ['pending', 'approved'] }
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, message: 'Invalid collection code or booking not found' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Either QR data or collection code is required' },
        { status: 400 }
      );
    }

    // Check if booking is in a valid state for collection
    if (!['pending', 'approved'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, message: `Cannot collect booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Check if QR code is expired
    if (QRCodeService.isQRExpired(booking.qrCodeExpiry)) {
      return NextResponse.json(
        { success: false, message: 'QR code has expired. Please request a new booking.' },
        { status: 400 }
      );
    }

    // Get recipient details
    const recipient = await User.findOne({ clerkId: booking.recipient });

    // Update booking status to collected
    const collectionTime = new Date();
    booking.status = 'collected';
    booking.collectedAt = collectionTime;
    booking.collectionVerifiedBy = userId; // Provider who verified the collection
    await booking.save();

    // Update listing status if this was the current booking
    if (listing.currentBooking?.toString() === booking._id.toString()) {
      listing.status = 'completed';
      listing.completedAt = collectionTime;
      await listing.save();
    }

    // Update provider's stats
    const provider = await User.findOne({ clerkId: providerId });
    if (provider) {
      provider.stats = provider.stats || {};
      provider.stats.totalItemsShared = (provider.stats.totalItemsShared || 0) + 1;
      provider.stats.totalBookingsCompleted = (provider.stats.totalBookingsCompleted || 0) + 1;
      provider.stats.lastActivity = collectionTime;
      await provider.save();
    }

    // Update recipient's stats
    if (recipient) {
      recipient.stats = recipient.stats || {};
      recipient.stats.totalItemsClaimed = (recipient.stats.totalItemsClaimed || 0) + 1;
      recipient.stats.totalBookingsCompleted = (recipient.stats.totalBookingsCompleted || 0) + 1;
      recipient.stats.reliabilityScore = calculateReliabilityScore(recipient);
      recipient.stats.lastActivity = collectionTime;
      await recipient.save();
    }

    console.log('✅ Collection verified successfully:', {
      bookingId: booking._id,
      recipientName: recipient?.firstName || 'Unknown',
      collectedAt: collectionTime
    });

    return NextResponse.json({
      success: true,
      message: 'Food collection verified successfully!',
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          collectedAt: booking.collectedAt,
          recipientName: recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Unknown',
          recipientId: booking.recipient,
          requestedQuantity: booking.requestedQuantity,
          approvedQuantity: booking.approvedQuantity || booking.requestedQuantity
        },
        listing: {
          _id: listing._id,
          title: listing.title,
          status: listing.status
        },
        collectionSummary: {
          verifiedBy: userId,
          verificationTime: collectionTime,
          verificationMethod: qrData ? 'QR Code' : 'Collection Code'
        }
      }
    });

  } catch (error) {
    console.error('❌ Collection verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to verify collection',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate reliability score
function calculateReliabilityScore(user) {
  const stats = user.stats || {};
  const totalBookings = stats.totalBookingsCompleted || 0;
  const cancelledBookings = stats.totalBookingsCancelled || 0;
  const noShowBookings = stats.totalBookingsNoShow || 0;
  
  if (totalBookings === 0) return 100; // New users start with perfect score
  
  const successfulBookings = totalBookings - cancelledBookings - noShowBookings;
  const reliabilityPercentage = (successfulBookings / totalBookings) * 100;
  
  return Math.max(0, Math.min(100, Math.round(reliabilityPercentage)));
}