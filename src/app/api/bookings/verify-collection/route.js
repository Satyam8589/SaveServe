// app/api/bookings/verify-collection/route.js (Enhanced with real-time QR auto-close support)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';
import UserProfile from '@/models/UserProfile';
import { QRCodeService } from '@/lib/qrCodeService';
import { sendCompleteNotification, NOTIFICATION_TYPES } from '@/lib/firestoreNotificationService';
import mongoose from 'mongoose';

// Optional: Enhanced real-time update service
const sendRealTimeUpdate = async (recipientId, data) => {
  try {
    console.log(`📡 Sending real-time update to ${recipientId}:`, data);
    
    // Send immediate notification that QR was scanned (this will be picked up by polling)
    await sendCompleteNotification(
      recipientId,
      'QR Code Scanned! ✅',
      'Your pickup has been confirmed. The QR window will close automatically.',
      {
        ...data,
        action: 'qr_scanned_realtime',
        timestamp: new Date().toISOString(),
        // Add flag to indicate this is for QR modal auto-close
        autoCloseQR: true
      },
      {
        type: 'QR_SCANNED',
        bookingId: data.bookingId,
        listingId: data.listingId,
        status: data.status,
        collectedAt: data.collectedAt,
        autoCloseQR: true
      }
    );
    
  } catch (error) {
    console.error('❌ Failed to send real-time update:', error);
  }
};

export async function POST(request) {
  const { userId: providerClerkId } = await auth();

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
    const previousStatus = booking.status;
    
    // Update booking status to collected
    booking.status = 'collected';
    booking.collectedAt = collectionTime;
    booking.collectionVerifiedBy = providerClerkId;
    
    // Update embedded booking in listing
    const embeddedBooking = listing.bookings.find(
      b => b.bookingRefId && b.bookingRefId.toString() === booking._id.toString()
    );

    if (embeddedBooking) {
      embeddedBooking.status = 'collected';
      embeddedBooking.collectedAt = collectionTime;
    } else {
      console.warn(`Could not find embedded booking ref ${booking._id} in listing ${listing._id}`);
    }

    // Save both booking and listing
    await booking.save({ session });
    await listing.save({ session });

    // Update user stats
    await UserProfile.findOneAndUpdate(
      { userId: providerClerkId }, 
      { 
        $inc: { 
          'stats.totalItemsShared': booking.approvedQuantity, 
          'stats.totalBookingsCompleted': 1 
        }, 
        $set: { 'stats.lastActivity': collectionTime } 
      }, 
      { session, new: true }
    );
    
    await UserProfile.findOneAndUpdate(
      { userId: booking.recipientId }, 
      { 
        $inc: { 
          'stats.totalItemsClaimed': booking.approvedQuantity, 
          'stats.totalBookingsCompleted': 1 
        }, 
        $set: { 'stats.lastActivity': collectionTime } 
      }, 
      { session, new: true }
    );

    // Commit the transaction first to ensure data is saved
    await session.commitTransaction();

    const recipient = await UserProfile.findOne({ userId: booking.recipientId }).lean();

    // 🚀 CRITICAL: Send immediate real-time update for QR modal auto-close
    const realTimeData = {
      bookingId: booking._id.toString(),
      listingId: listing._id.toString(),
      status: 'collected',
      previousStatus,
      collectedAt: collectionTime.toISOString(),
      action: 'collection_verified',
      recipientId: booking.recipientId
    };

    // Send real-time update immediately (non-blocking)
    console.log('🚀 Sending immediate real-time update for QR auto-close...');
    sendRealTimeUpdate(booking.recipientId, realTimeData).catch(error => {
      console.error('❌ Real-time update failed:', error);
    });

    // 🔔 Send detailed collection confirmation notification to recipient
    try {
      console.log('📢 Sending collection confirmation to recipient:', booking.recipientId);
      
      const recipientNotificationResult = await sendCompleteNotification(
        booking.recipientId,
        'Food Collected Successfully! 🎉',
        `You've successfully collected "${listing.title}". Enjoy your meal!`,
        {
          bookingId: booking._id.toString(),
          listingId: listing._id.toString(),
          action: 'collection_confirmed',
          collectedAt: collectionTime.toISOString(),
          autoRefreshNeeded: true // Flag to trigger page refresh
        },
        {
          type: NOTIFICATION_TYPES.COLLECTION_CONFIRMED,
          bookingId: booking._id.toString(),
          listingId: listing._id.toString(),
          listingTitle: listing.title,
          providerName: listing.providerName,
          quantity: booking.approvedQuantity,
          unit: listing.unit || 'items',
          collectedAt: collectionTime.toISOString(),
          autoRefreshNeeded: true
        }
      );

      console.log('📨 Collection confirmation result:', recipientNotificationResult);
    } catch (notificationError) {
      console.error('❌ Failed to send collection confirmation:', notificationError);
    }

    // 🔔 Send collection notification to provider
    try {
      console.log('📢 Sending collection success confirmation to provider:', providerClerkId);
      
      const providerNotificationResult = await sendCompleteNotification(
        providerClerkId,
        'Food Collected Successfully! ✅',
        `${recipient?.fullName || 'A recipient'} has collected "${listing.title}". Thanks for sharing food!`,
        {
          bookingId: booking._id.toString(),
          listingId: listing._id.toString(),
          recipientId: booking.recipientId,
          action: 'collection_completed_confirmation'
        },
        {
          type: NOTIFICATION_TYPES.COLLECTION_COMPLETED_CONFIRMATION,
          bookingId: booking._id.toString(),
          listingId: listing._id.toString(),
          listingTitle: listing.title,
          recipientId: booking.recipientId,
          recipientName: recipient?.fullName || 'A recipient',
          quantity: booking.approvedQuantity,
          unit: listing.unit || 'items',
          collectedAt: collectionTime.toISOString()
        }
      );

      console.log('📨 Provider collection confirmation result:', providerNotificationResult);
    } catch (notificationError) {
      console.error('❌ Failed to send provider collection confirmation:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Food collection verified successfully!',
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          previousStatus,
          collectedAt: booking.collectedAt,
          collectionVerifiedBy: booking.collectionVerifiedBy,
          recipientId: booking.recipientId,
          recipientName: recipient ? recipient.fullName : 'Unknown',
        },
        listing: {
          _id: listing._id,
          title: listing.title,
        },
        // Additional data for frontend processing
        realTimeUpdate: {
          sent: true,
          timestamp: new Date().toISOString(),
          recipientId: booking.recipientId
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Collection verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to verify collection',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 400 }
    );
  } finally {
    session.endSession();
  }
}