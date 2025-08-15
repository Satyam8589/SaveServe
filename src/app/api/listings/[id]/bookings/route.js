// File: /app/api/listings/[id]/bookings/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';
import Booking from '@/models/Booking';

// GET - Get all bookings for a specific listing (Provider only)
export async function GET(request, { params }) {
  try {
    await connectDB();

    const listingId = params.id;
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const status = searchParams.get('status');

    console.log('🔍 GET /api/listings/[id]/bookings - Fetching bookings for listing:', listingId);

    if (!providerId) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID is required'
      }, { status: 400 });
    }

    // Find the listing and verify ownership
    const listing = await FoodListing.findById(listingId);
    
    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Listing not found'
      }, { status: 404 });
    }

    // Verify that the requester is the owner of the listing
    if (listing.providerId !== providerId) {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to view bookings for this listing'
      }, { status: 403 });
    }

    // Build query for bookings
    let bookingQuery = { listingId };
    if (status && status !== 'all') {
      bookingQuery.status = status;
    }

    // Get bookings with recipient details
    const bookings = await Booking.find(bookingQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Enhance bookings with computed fields
    const enhancedBookings = bookings.map(booking => ({
      ...booking,
      canApprove: booking.status === 'pending',
      canReject: booking.status === 'pending',
      canMarkCollected: booking.status === 'approved',
      canCancel: ['pending', 'approved'].includes(booking.status),
      isExpired: booking.scheduledPickupTime && booking.scheduledPickupTime < new Date() && booking.status !== 'collected',
      timeUntilPickup: booking.scheduledPickupTime ? Math.max(0, booking.scheduledPickupTime.getTime() - Date.now()) : null,
      daysSinceRequest: Math.floor((Date.now() - booking.requestedAt.getTime()) / (1000 * 60 * 60 * 24)),
      isUrgent: booking.scheduledPickupTime && (booking.scheduledPickupTime.getTime() - Date.now()) < (2 * 60 * 60 * 1000) // Less than 2 hours
    }));

    // Calculate statistics
    const stats = {
      total: enhancedBookings.length,
      pending: enhancedBookings.filter(b => b.status === 'pending').length,
      approved: enhancedBookings.filter(b => b.status === 'approved').length,
      rejected: enhancedBookings.filter(b => b.status === 'rejected').length,
      collected: enhancedBookings.filter(b => b.status === 'collected').length,
      cancelled: enhancedBookings.filter(b => b.status === 'cancelled').length,
      expired: enhancedBookings.filter(b => b.isExpired).length,
      totalRequestedQuantity: enhancedBookings
        .filter(b => ['pending', 'approved'].includes(b.status))
        .reduce((sum, b) => sum + b.requestedQuantity, 0),
      totalApprovedQuantity: enhancedBookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + (b.approvedQuantity || 0), 0)
    };

    // Get listing summary
    const listingSummary = {
      id: listing._id,
      title: listing.title,
      category: listing.category,
      totalQuantity: listing.quantity,
      unit: listing.unit,
      availableQuantity: listing.quantity - listing.totalBookedQuantity,
      location: listing.location,
      expiryTime: listing.expiryTime,
      listingStatus: listing.listingStatus,
      isActive: listing.isActive
    };

    return NextResponse.json({
      success: true,
      data: {
        listing: listingSummary,
        bookings: enhancedBookings,
        stats
      },
      message: `Found ${enhancedBookings.length} booking(s) for this listing`
    });

  } catch (error) {
    console.error('❌ GET /api/listings/[id]/bookings error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch listing bookings'
    }, { status: 500 });
  }
}

// DELETE - Bulk action on bookings (Provider only)
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const listingId = params.id;
    const body = await request.json();
    const { providerId, action, bookingIds } = body;

    console.log('🗑️ DELETE /api/listings/[id]/bookings - Bulk action:', action);

    if (!providerId || !action || !bookingIds?.length) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: providerId, action, bookingIds'
      }, { status: 400 });
    }

    // Find the listing and verify ownership
    const listing = await FoodListing.findById(listingId);
    
    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Listing not found'
      }, { status: 404 });
    }

    if (listing.providerId !== providerId) {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to modify bookings for this listing'
      }, { status: 403 });
    }

    const results = {
      successful: [],
      failed: []
    };

    // Process each booking
    for (const bookingId of bookingIds) {
      try {
        const booking = await Booking.findById(bookingId);
        
        if (!booking || booking.listingId.toString() !== listingId) {
          results.failed.push({
            bookingId,
            error: 'Booking not found or does not belong to this listing'
          });
          continue;
        }

        let updateData = {};
        let canPerformAction = false;

        switch (action) {
          case 'approve_all':
            if (booking.status === 'pending') {
              updateData = {
                status: 'approved',
                approvedQuantity: booking.requestedQuantity,
                approvedAt: new Date()
              };
              canPerformAction = true;
            }
            break;

          case 'reject_all':
            if (booking.status === 'pending') {
              updateData = {
                status: 'rejected',
                rejectedAt: new Date()
              };
              canPerformAction = true;
            }
            break;

          case 'cancel_all':
            if (['pending', 'approved'].includes(booking.status)) {
              updateData = {
                status: 'cancelled',
                cancelledAt: new Date()
              };
              canPerformAction = true;
            }
            break;

          default:
            results.failed.push({
              bookingId,
              error: 'Invalid action'
            });
            continue;
        }

        if (!canPerformAction) {
          results.failed.push({
            bookingId,
            error: `Cannot ${action.replace('_all', '')} booking with status: ${booking.status}`
          });
          continue;
        }

        // Update booking
        Object.assign(booking, updateData);
        await booking.save();

        // Update corresponding booking in listing
        const listingBooking = listing.bookings.find(b => 
          b.recipientId === booking.recipientId && 
          b.requestedQuantity === booking.requestedQuantity &&
          Math.abs(new Date(b.requestedAt).getTime() - new Date(booking.requestedAt).getTime()) < 5000
        );

        if (listingBooking) {
          Object.assign(listingBooking, updateData);
        }

        results.successful.push({
          bookingId,
          newStatus: booking.status,
          recipientName: booking.recipientName
        });

      } catch (error) {
        results.failed.push({
          bookingId,
          error: error.message
        });
      }
    }

    // Save listing to trigger middleware
    await listing.save();

    const actionName = action.replace('_all', '');
    const successCount = results.successful.length;
    const failCount = results.failed.length;

    return NextResponse.json({
      success: successCount > 0,
      data: results,
      message: `Bulk ${actionName}: ${successCount} successful, ${failCount} failed`,
      summary: {
        totalProcessed: bookingIds.length,
        successful: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('❌ DELETE /api/listings/[id]/bookings error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk action'
    }, { status: 500 });
  }
}