// File: /app/api/analytics/global/top-providers/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';
import UserProfile from '@/models/UserProfile';

export async function GET(request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get top providers based on collected food
    const topProvidersData = await Booking.aggregate([
      {
        $match: {
          status: 'collected',
          approvedQuantity: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'foodlistings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $unwind: '$listing'
      },
      {
        $addFields: {
          estimatedWeight: {
            $multiply: [
              '$approvedQuantity',
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$listing.unit', 'plates'] }, then: 0.3 },
                    { case: { $eq: ['$listing.unit', 'servings'] }, then: 0.25 },
                    { case: { $eq: ['$listing.unit', 'kg'] }, then: 1 },
                    { case: { $eq: ['$listing.unit', 'packets'] }, then: 0.1 },
                    { case: { $eq: ['$listing.unit', 'pieces'] }, then: 0.05 },
                    { case: { $eq: ['$listing.unit', 'liters'] }, then: 1 }
                  ],
                  default: 0.2
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$providerId',
          providerName: { $first: '$providerName' },
          totalWeight: { $sum: '$estimatedWeight' },
          totalQuantity: { $sum: '$approvedQuantity' },
          totalBookings: { $sum: 1 },
          categories: { $addToSet: '$listing.category' },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { totalWeight: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Get additional provider details
    const providerIds = topProvidersData.map(provider => provider._id);
    const providerProfiles = await UserProfile.find(
      { userId: { $in: providerIds } },
      { userId: 1, subrole: 1, campusLocation: 1, organizationName: 1 }
    );

    // Create a map for quick lookup
    const profileMap = {};
    providerProfiles.forEach(profile => {
      profileMap[profile.userId] = profile;
    });

    // Enhance provider data with profile information
    const enhancedProviders = topProvidersData.map((provider, index) => {
      const profile = profileMap[provider._id];
      
      return {
        rank: index + 1,
        providerId: provider._id,
        providerName: provider.providerName,
        subrole: profile?.subrole || 'Unknown',
        campusLocation: profile?.campusLocation || 'Unknown',
        organizationName: profile?.organizationName || '',
        totalWeight: Math.round(provider.totalWeight * 10) / 10,
        totalQuantity: provider.totalQuantity,
        totalBookings: provider.totalBookings,
        categories: provider.categories,
        avgRating: provider.avgRating ? Math.round(provider.avgRating * 10) / 10 : null,
        // For chart compatibility
        name: provider.providerName,
        value: Math.round(provider.totalWeight * 10) / 10
      };
    });

    // Calculate additional statistics
    const stats = {
      totalProviders: enhancedProviders.length,
      totalFoodProvided: enhancedProviders.reduce((sum, provider) => sum + provider.totalWeight, 0),
      totalBookings: enhancedProviders.reduce((sum, provider) => sum + provider.totalBookings, 0),
      avgBookingsPerProvider: enhancedProviders.length > 0 
        ? Math.round((enhancedProviders.reduce((sum, provider) => sum + provider.totalBookings, 0) / enhancedProviders.length) * 10) / 10
        : 0
    };

    // Group by subrole for additional insights
    const bySubrole = enhancedProviders.reduce((acc, provider) => {
      if (!acc[provider.subrole]) {
        acc[provider.subrole] = {
          subrole: provider.subrole,
          count: 0,
          totalWeight: 0,
          providers: []
        };
      }
      acc[provider.subrole].count++;
      acc[provider.subrole].totalWeight += provider.totalWeight;
      acc[provider.subrole].providers.push(provider.providerName);
      return acc;
    }, {});

    const subroleStats = Object.values(bySubrole).map(item => ({
      ...item,
      totalWeight: Math.round(item.totalWeight * 10) / 10,
      avgWeightPerProvider: Math.round((item.totalWeight / item.count) * 10) / 10
    })).sort((a, b) => b.totalWeight - a.totalWeight);

    return NextResponse.json({
      success: true,
      data: {
        providers: enhancedProviders,
        stats,
        bySubrole: subroleStats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching top providers data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top providers data',
        message: error.message
      },
      { status: 500 }
    );
  }
}