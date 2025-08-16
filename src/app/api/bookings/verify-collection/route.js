// app/api/bookings/verify-collection/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';
import UserProfile from '@/models/UserProfile'; // CORRECT MODEL
import { QRCodeService } from '@/lib/qrCodeService';
import mongoose from 'mongoose';

export async function POST(request) {
  const { userId: providerClerkId } = await auth(request);

  if (!providerClerkId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await request.json();
    const { qrData, collectionCode, listingId } = body;

    if (!listingId) {
        throw new Error("Listing ID is required for verification.");
    }

    const listing = await FoodListing.findById(listingId).session(session);
    if (!listing) {
      throw new Error('Food listing not found');
    }

    if (listing.providerId !== providerClerkId) {
      throw new Error('Not authorized to verify collections for this listing');
    }

    let booking = null;

    if (qrData) {
      const qrVerification = QRCodeService.verifyQRData(qrData);
      if (!qrVerification.isValid) {
        throw new Error('Invalid QR code format');
      }

      const { bookingId, recipientId, listingId: qrListingId } = qrVerification.data;

      if (qrListingId !== listingId) {
        throw new Error('QR code does not match this listing');
      }

      booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        throw new Error('Booking not found from QR code');
      }

      if (booking.recipientId !== recipientId) {
        throw new Error('QR code does not belong to the booking recipient');
      }
    } else if (collectionCode) {
      booking = await Booking.findOne({
        listingId: listingId,
        collectionCode: collectionCode,
      }).session(session);

      if (!booking) {
        throw new Error('Invalid collection code for this listing');
      }
    } else {
      throw new Error('Either QR data or collection code is required');
    }

    if (booking.status === 'collected') {
        throw new Error('This booking has already been collected.');
    }

    if (booking.status !== 'approved') {
      throw new Error(`Cannot collect a booking with status: ${booking.status}`);
    }

    if (booking.qrCodeExpiry && new Date(booking.qrCodeExpiry) < new Date()) {
        booking.status = 'expired';
        await booking.save({ session });
        throw new Error('This booking has expired.');
    }

    const collectionTime = new Date();
    booking.status = 'collected';
    booking.collectedAt = collectionTime;
    booking.collectionVerifiedBy = providerClerkId;
    
    // --- THE FIX ---
    const embeddedBooking = listing.bookings.find(
      b => b.bookingRefId && b.bookingRefId.toString() === booking._id.toString()
    );

    if (embeddedBooking) {
      embeddedBooking.status = 'collected';
    } else {
      console.warn(`Could not find embedded booking ref ${booking._id} in listing ${listing._id}`);
    }

    await booking.save({ session });
    await listing.save({ session });

    // Update stats (optional, but good to have in the transaction)
    await UserProfile.findOneAndUpdate({ userId: providerClerkId }, { $inc: { 'stats.totalItemsShared': booking.approvedQuantity, 'stats.totalBookingsCompleted': 1 }, $set: { 'stats.lastActivity': collectionTime } }, { session, new: true });
    await UserProfile.findOneAndUpdate({ userId: booking.recipientId }, { $inc: { 'stats.totalItemsClaimed': booking.approvedQuantity, 'stats.totalBookingsCompleted': 1 }, $set: { 'stats.lastActivity': collectionTime } }, { session, new: true });

    await session.commitTransaction();

    const recipient = await UserProfile.findOne({ userId: booking.recipientId }).lean();

    return NextResponse.json({
      success: true,
      message: 'Food collection verified successfully!',
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          collectedAt: booking.collectedAt,
          recipientName: recipient ? recipient.fullName : 'Unknown',
        },
        listing: {
          _id: listing._id,
          title: listing.title,
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Collection verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to verify collection'
      },
      { status: 400 } // Use 400 for client-side errors, 500 for true server errors
    );
  } finally {
    session.endSession();
  }
}
