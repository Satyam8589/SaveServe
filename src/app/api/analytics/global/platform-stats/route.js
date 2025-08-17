// File: /app/api/analytics/global/platform-stats/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import FoodListing from '@/models/FoodListing';
import Booking from '@/models/Booking';
import UserProfile from '@/models/UserProfile';

export async function GET(request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Get various platform statistics
    const [
      totalListings,
      activeListings,
      expiredListings,
      totalBookings,
      collectedBookings,
      pendingBookings,
      totalUsers,
      activeUsers,
      providers,
      recipients
    ] = await Promise.all([
      // Listing statistics
      FoodListing.countDocuments({}),
      FoodListing.countDocuments({ 
        isActive: true, 
        expiryTime: { $gt: new Date() },
        listingStatus: { $in: ['active', 'partially_booked'] }
      }),
      FoodListing.countDocuments({ 
        $or: [
          { isActive: false },
          { expiryTime: { $lte: new Date() } }
        ]
      }),

      // Booking statistics
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'collected' }),
      Booking.countDocuments({ status: 'pending' }),

      // User statistics
      UserProfile.countDocuments({}),
      UserProfile.countDocuments({ isActive: true }),
      UserProfile.countDocuments({ role: 'PROVIDER', isActive: true }),
      UserProfile.countDocuments({ role: 'RECIPIENT', isActive: true })
    ]);

    // Calculate efficiency metrics
    const collectionRate = totalBookings > 0 ? (collectedBookings / totalBookings * 100) : 0;
    const listingUtilization = totalListings > 0 ? ((totalListings - activeListings) / totalListings * 100) : 0;

    // Get growth statistics (comparing last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    const [
      recentListings,
      previousListings,
      recentBookings,
      previousBookings,
      recentUsers,
      previousUsers
    ] = await Promise.all([
      FoodListing.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      FoodListing.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      }),
      Booking.countDocuments({ requestedAt: { $gte: thirtyDaysAgo } }),
      Booking.countDocuments({ 
        requestedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      }),
      UserProfile.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      UserProfile.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      })
    ]);

    // Calculate growth percentages
    const listingGrowth = previousListings > 0 
      ? ((recentListings - previousListings) / previousListings * 100) 
      : 0;
    const bookingGrowth = previousBookings > 0 
      ? ((recentBookings - previousBookings) / previousBookings * 100) 
      : 0;
    const userGrowth = previousUsers > 0 
      ? ((recentUsers - previousUsers) / previousUsers * 100) 
      : 0;

    // Get subrole distribution
    const subroleDistribution = await UserProfile.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$subrole',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get location distribution
    const locationDistribution = await UserProfile.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$campusLocation',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get category distribution for listings
    const categoryDistribution = await FoodListing.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const stats = {
      overview: {
        totalListings,
        activeListings,
        expiredListings,
        totalBookings,
        collectedBookings,
        pendingBookings,
        totalUsers,
        activeUsers,
        providers,
        recipients
      },
      efficiency: {
        collectionRate: Math.round(collectionRate * 10) / 10,
        listingUtilization: Math.round(listingUtilization * 10) / 10,
        avgBookingsPerListing: totalListings > 0 ? Math.round((totalBookings / totalListings) * 10) / 10 : 0,
        providerToRecipientRatio: recipients > 0 ? Math.round((providers / recipients) * 100) / 100 : 0
      },
      growth: {
        listingGrowth: Math.round(listingGrowth * 10) / 10,
        bookingGrowth: Math.round(bookingGrowth * 10) / 10,
        userGrowth: Math.round(userGrowth * 10) / 10,
        recentListings,
        recentBookings,
        recentUsers
      },
      distribution: {
        bySubrole: subroleDistribution.map(item => ({
          subrole: item._id,
          count: item.count,
          percentage: Math.round((item.count / totalUsers * 100) * 10) / 10
        })),
        byLocation: locationDistribution.map(item => ({
          location: item._id,
          count: item.count,
          percentage: Math.round((item.count / totalUsers * 100) * 10) / 10
        })),
        byCategory: categoryDistribution.map(item => ({
          category: item._id,
          listings: item.count,
          totalQuantity: item.totalQuantity,
          percentage: Math.round((item.count / totalListings * 100) * 10) / 10
        }))
      },
      timeRanges: {
        last30Days: {
          start: thirtyDaysAgo.toISOString(),
          end: now.toISOString()
        },
        previous30Days: {
          start: sixtyDaysAgo.toISOString(),
          end: thirtyDaysAgo.toISOString()
        }
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch platform statistics',
        message: error.message
      },
      { status: 500 }
    );
  }
}