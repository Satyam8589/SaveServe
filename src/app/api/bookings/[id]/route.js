// File: /app/api/bookings/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';

// GET - Get specific booking details
export async function GET(request, { params }) {
  try {
    await connectDB();

    const bookingId = params.id;
    console.log('🔍 GET /api/bookings/[id] - Fetching booking:', bookingId);

    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'listingId',
        select: 'title description category imageUrl location quantity unit freshnessStatus availabilityWindow pickupInstructions contactInfo'
      })
      .lean();

    if (!booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 });
    }

    // Add computed fields
    const enhancedBooking = {
      ...booking,
      canModify: ['pending', 'approved'].includes(booking.status),
      isExpired: booking.scheduledPickupTime && booking.scheduledPickupTime < new Date() && booking.status !== 'collected',
      timeUntilPickup: booking.scheduledPickupTime ? Math.max(0, booking.scheduledPickupTime.getTime() - Date.now()) : null,
      bookingDuration: booking.collectedAt ? booking.collectedAt.getTime() - booking.requestedAt.getTime() : null
    };

    return NextResponse.json({
      success: true,
      data: enhancedBooking
    });

  } catch (error) {
    console.error('❌ GET /api/bookings/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch booking'
    }, { status: 500 });
  }
}

// PUT - Update booking status (approve, reject, collect, cancel)
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const bookingId = params.id;
    const body = await request.json();

    console.log('🔄 PUT /api/bookings/[id] - Updating booking:', bookingId);
    console.log('📋 Update data:', JSON.stringify(body, null, 2));

    const { action, userId, approvedQuantity, providerResponse, rating, feedback } = body;

    if (!action || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: action, userId'
      }, { status: 400 });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 });
    }

    // Find the associated listing
    const listing = await FoodListing.findById(booking.listingId);
    
    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Associated listing not found'
      }, { status: 404 });
    }

    // Authorization check
    let isAuthorized = false;
    let newStatus = booking.status;
    let updateData = {};

    switch (action) {
      case 'approve':
        // Only provider can approve
        if (userId !== booking.providerId) {
          return NextResponse.json({
            success: false,
            error: 'Only the provider can approve bookings'
          }, { status: 403 });
        }

        if (booking.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: 'Only pending bookings can be approved'
          }, { status: 400 });
        }

        // Validate approved quantity
        const requestedQty = booking.requestedQuantity;
        const finalApprovedQty = approvedQuantity ? Math.min(approvedQuantity, requestedQty) : requestedQty;
        
        // Check if there's enough quantity available
        const currentAvailable = listing.quantity - listing.totalBookedQuantity;
        if (finalApprovedQty > currentAvailable) {
          return NextResponse.json({
            success: false,
            error: `Only ${currentAvailable} ${listing.unit} available`
          }, { status: 400 });
        }

        newStatus = 'approved';
        updateData = {
          status: newStatus,
          approvedQuantity: finalApprovedQty,
          providerResponse: providerResponse?.trim() || '',
          approvedAt: new Date()
        };

        isAuthorized = true;
        break;

      case 'reject':
        // Only provider can reject
        if (userId !== booking.providerId) {
          return NextResponse.json({
            success: false,
            error: 'Only the provider can reject bookings'
          }, { status: 403 });
        }

        if (booking.status !== 'pending') {
          return NextResponse.json({
            success: false,
            error: 'Only pending bookings can be rejected'
          }, { status: 400 });
        }

        newStatus = 'rejected';
        updateData = {
          status: newStatus,
          providerResponse: providerResponse?.trim() || '',
          rejectedAt: new Date()
        };

        isAuthorized = true;
        break;

      case 'collect':
        // Only provider can mark as collected
        if (userId !== booking.providerId) {
          return NextResponse.json({
            success: false,
            error: 'Only the provider can mark bookings as collected'
          }, { status: 403 });
        }

        if (booking.status !== 'approved') {
          return NextResponse.json({
            success: false,
            error: 'Only approved bookings can be marked as collected'
          }, { status: 400 });
        }

        newStatus = 'collected';
        updateData = {
          status: newStatus,
          collectedAt: new Date(),
          actualPickupTime: new Date()
        };

        isAuthorized = true;
        break;

      case 'cancel':
        // Recipient can cancel their own pending requests
        // Provider can cancel approved bookings
        if (userId !== booking.recipientId && userId !== booking.providerId) {
          return NextResponse.json({
            success: false,
            error: 'Not authorized to cancel this booking'
          }, { status: 403 });
        }

        if (!['pending', 'approved'].includes(booking.status)) {
          return NextResponse.json({
            success: false,
            error: 'Only pending or approved bookings can be cancelled'
          }, { status: 400 });
        }

        newStatus = 'cancelled';
        updateData = {
          status: newStatus,
          cancelledAt: new Date()
        };

        isAuthorized = true;
        break;

      case 'rate':
        // Only recipient can rate after collection
        if (userId !== booking.recipientId) {
          return NextResponse.json({
            success: false,
            error: 'Only the recipient can rate the booking'
          }, { status: 403 });
        }

        if (booking.status !== 'collected') {
          return NextResponse.json({
            success: false,
            error: 'Can only rate collected bookings'
          }, { status: 400 });
        }

        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({
            success: false,
            error: 'Rating must be between 1 and 5'
          }, { status: 400 });
        }

        updateData = {
          rating: parseInt(rating),
          feedback: feedback?.trim() || ''
        };

        isAuthorized = true;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    if (!isAuthorized) {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to perform this action'
      }, { status: 403 });
    }

    // Update the standalone booking
    Object.assign(booking, updateData);
    await booking.save();

    // Update the booking in the listing's bookings array
    const listingBooking = listing.bookings.id(booking._id) || 
      listing.bookings.find(b => 
        b.recipientId === booking.recipientId && 
        b.requestedQuantity === booking.requestedQuantity &&
        Math.abs(new Date(b.requestedAt).getTime() - new Date(booking.requestedAt).getTime()) < 5000 // 5 second tolerance
      );

    if (listingBooking) {
      Object.assign(listingBooking, updateData);
      
      // For approval, also update the approved quantity in the listing booking
      if (action === 'approve') {
        listingBooking.approvedQuantity = updateData.approvedQuantity;
      }
    }

    // Save the listing to trigger the pre-save middleware that recalculates totals
    await listing.save();

    console.log('✅ Booking updated successfully:', bookingId, 'New status:', newStatus);

    // Prepare response data
    const responseData = {
      bookingId: booking._id,
      status: booking.status,
      updatedAt: booking.updatedAt,
      listingTitle: listing.title,
      action: action
    };

    // Add action-specific data to response
    if (action === 'approve') {
      responseData.approvedQuantity = booking.approvedQuantity;
      responseData.availableQuantity = listing.quantity - listing.totalBookedQuantity;
    }

    if (action === 'rate') {
      responseData.rating = booking.rating;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Booking ${action === 'collect' ? 'marked as collected' : action + 'd'} successfully`
    });

  } catch (error) {
    console.error('❌ PUT /api/bookings/[id] error:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({
        success: false,
        error: errorMessages.join(', ')
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update booking'
    }, { status: 500 });
  }
}