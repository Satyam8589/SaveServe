// File: /app/api/bookings/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';

// GET - Fetch user bookings (both as provider and recipient)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role'); // 'provider', 'recipient', or 'all'
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    console.log('🔍 GET /api/bookings - Fetching bookings for user:', userId, 'role:', role);

    let bookings = [];
    let totalCount = 0;

    if (role === 'provider' || role === 'all' || !role) {
      // Get bookings where user is the provider
      const providerQuery = { providerId: userId };
      if (status && status !== 'all') {
        providerQuery.status = status;
      }

      const providerBookings = await Booking.find(providerQuery)
        .populate({
          path: 'listingId',
          select: 'title category imageUrl location expiryTime quantity unit'
        })
        .sort({ createdAt: -1 })
        .skip(role === 'provider' ? skip : 0)
        .limit(role === 'provider' ? limit : 1000)
        .lean();

      // Add role identifier
      const enhancedProviderBookings = providerBookings.map(booking => ({
        ...booking,
        userRole: 'provider',
        canModify: ['pending', 'approved'].includes(booking.status),
        isExpired: booking.scheduledPickupTime && booking.scheduledPickupTime < new Date() && booking.status !== 'collected',
        timeUntilPickup: booking.scheduledPickupTime ? Math.max(0, booking.scheduledPickupTime.getTime() - Date.now()) : null
      }));

      if (role === 'provider') {
        bookings = enhancedProviderBookings;
        totalCount = await Booking.countDocuments(providerQuery);
      } else {
        bookings.push(...enhancedProviderBookings);
      }
    }

    if (role === 'recipient' || role === 'all' || !role) {
      // Get bookings where user is the recipient
      const recipientQuery = { recipientId: userId };
      if (status && status !== 'all') {
        recipientQuery.status = status;
      }

      const recipientBookings = await Booking.find(recipientQuery)
        .populate({
          path: 'listingId',
          select: 'title category imageUrl location expiryTime quantity unit providerId providerName'
        })
        .sort({ createdAt: -1 })
        .skip(role === 'recipient' ? skip : 0)
        .limit(role === 'recipient' ? limit : 1000)
        .lean();

      // Add role identifier
      const enhancedRecipientBookings = recipientBookings.map(booking => ({
        ...booking,
        userRole: 'recipient',
        canModify: ['pending'].includes(booking.status), // Recipients can only cancel pending requests
        isExpired: booking.scheduledPickupTime && booking.scheduledPickupTime < new Date() && booking.status !== 'collected',
        timeUntilPickup: booking.scheduledPickupTime ? Math.max(0, booking.scheduledPickupTime.getTime() - Date.now()) : null
      }));

      if (role === 'recipient') {
        bookings = enhancedRecipientBookings;
        totalCount = await Booking.countDocuments(recipientQuery);
      } else {
        bookings.push(...enhancedRecipientBookings);
      }
    }

    // If fetching all bookings, sort by creation date and paginate
    if (role === 'all' || !role) {
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      totalCount = bookings.length;
      bookings = bookings.slice(skip, skip + limit);
    }

    // Get statistics
    const stats = {
      pending: bookings.filter(b => b.status === 'pending').length,
      approved: bookings.filter(b => b.status === 'approved').length,
      collected: bookings.filter(b => b.status === 'collected').length,
      expired: bookings.filter(b => b.isExpired).length,
      total: totalCount
    };

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      stats,
      filters: {
        statuses: ['pending', 'approved', 'rejected', 'collected', 'cancelled', 'expired']
      }
    });

  } catch (error) {
    console.error('❌ GET /api/bookings error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings'
    }, { status: 500 });
  }
}