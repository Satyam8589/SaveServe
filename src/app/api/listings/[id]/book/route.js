// File: /app/api/listings/[id]/book/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';
import Booking from '@/models/Booking';

// POST - Create booking request
export async function POST(request, { params }) {
  try {
    await connectDB();

    const listingId = params.id;
    const body = await request.json();

    console.log('🔖 POST /api/listings/[id]/book - Creating booking for listing:', listingId);
    console.log('📋 Booking request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const { recipientId, recipientName, requestedQuantity, requestMessage, scheduledPickupTime } = body;

    if (!recipientId || !recipientName || !requestedQuantity) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: recipientId, recipientName, requestedQuantity'
      }, { status: 400 });
    }

    // Find the listing
    const listing = await FoodListing.findById(listingId);
    
    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Listing not found'
      }, { status: 404 });
    }

    // Validate listing availability
    if (!listing.isActive) {
      return NextResponse.json({
        success: false,
        error: 'This listing is no longer active'
      }, { status: 400 });
    }

    if (listing.expiryTime <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'This listing has expired'
      }, { status: 400 });
    }

    if (!['active', 'partially_booked'].includes(listing.listingStatus)) {
      return NextResponse.json({
        success: false,
        error: 'This listing is not available for booking'
      }, { status: 400 });
    }

    // Check if user is trying to book their own listing
    if (listing.providerId === recipientId) {
      return NextResponse.json({
        success: false,
        error: 'You cannot book your own listing'
      }, { status: 400 });
    }

    // Check available quantity
    const availableQuantity = listing.quantity - listing.totalBookedQuantity;
    
    if (requestedQuantity > availableQuantity) {
      return NextResponse.json({
        success: false,
        error: `Only ${availableQuantity} ${listing.unit} available. You requested ${requestedQuantity}.`
      }, { status: 400 });
    }

    // Check if user already has a pending/approved booking for this listing
    const existingBooking = listing.bookings.find(booking => 
      booking.recipientId === recipientId && 
      ['pending', 'approved'].includes(booking.status)
    );

    if (existingBooking) {
      return NextResponse.json({
        success: false,
        error: `You already have a ${existingBooking.status} booking for this listing`
      }, { status: 400 });
    }

    // Validate scheduled pickup time
    let pickupTime = null;
    if (scheduledPickupTime) {
      pickupTime = new Date(scheduledPickupTime);
      
      if (isNaN(pickupTime.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid pickup time format'
        }, { status: 400 });
      }

      // Check if pickup time is within availability window
      if (pickupTime < listing.availabilityWindow.startTime || 
          pickupTime > listing.availabilityWindow.endTime) {
        return NextResponse.json({
          success: false,
          error: 'Pickup time must be within the availability window'
        }, { status: 400 });
      }
    }

    // Create booking in both models
    
    // 1. Create standalone booking record
    const bookingData = {
      listingId: listing._id,
      providerId: listing.providerId,
      providerName: listing.providerName,
      recipientId,
      recipientName,
      requestedQuantity: parseInt(requestedQuantity, 10),
      requestMessage: requestMessage?.trim() || '',
      scheduledPickupTime: pickupTime,
      pickupLocation: listing.location,
      pickupInstructions: listing.pickupInstructions || '',
      isUrgent: body.isUrgent || false,
      status: 'pending'
    };

    const newBooking = new Booking(bookingData);
    await newBooking.save();

    // 2. Add booking to listing's bookings array
    const listingBookingData = {
      recipientId,
      recipientName,
      requestedQuantity: parseInt(requestedQuantity, 10),
      requestMessage: requestMessage?.trim() || '',
      scheduledPickupTime: pickupTime,
      status: 'pending'
    };

    listing.bookings.push(listingBookingData);
    await listing.save();

    console.log('✅ Booking created successfully:', newBooking._id);

    // Prepare response with listing details
    const responseData = {
      bookingId: newBooking._id,
      listingTitle: listing.title,
      providerName: listing.providerName,
      requestedQuantity,
      status: 'pending',
      scheduledPickupTime: pickupTime,
      createdAt: newBooking.createdAt,
      listing: {
        id: listing._id,
        title: listing.title,
        category: listing.category,
        availableQuantity: listing.quantity - listing.totalBookedQuantity - requestedQuantity,
        location: listing.location,
        pickupInstructions: listing.pickupInstructions
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Booking request created successfully. The provider will be notified.'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ POST /api/listings/[id]/book error:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({
        success: false,
        error: errorMessages.join(', ')
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create booking request'
    }, { status: 500 });
  }
}