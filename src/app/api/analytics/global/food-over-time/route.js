// File: /app/api/analytics/global/food-over-time/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';

export async function GET(request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week'; // 'week' or 'month'

    // Define date grouping format based on timeframe
    let dateFormat, dateRange;
    const now = new Date();
    
    if (timeframe === 'month') {
      dateFormat = '%Y-%m'; // Group by year-month
      dateRange = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
    } else {
      dateFormat = '%Y-%U'; // Group by year-week
      dateRange = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000)); // Last 12 weeks
    }

    const foodOverTimeData = await Booking.aggregate([
      {
        $match: {
          status: 'collected',
          collectedAt: { $gte: dateRange },
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
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$collectedAt' } },
            category: '$listing.category'
          },
          totalWeight: { $sum: '$estimatedWeight' },
          totalQuantity: { $sum: '$approvedQuantity' },
          totalBookings: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.period',
          totalWeight: { $sum: '$totalWeight' },
          totalQuantity: { $sum: '$totalQuantity' },
          totalBookings: { $sum: '$totalBookings' },
          categories: {
            $push: {
              category: '$_id.category',
              weight: '$totalWeight',
              quantity: '$totalQuantity'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format data for chart consumption
    const formattedData = foodOverTimeData.map(item => {
      // Convert period to readable format
      let periodLabel;
      if (timeframe === 'month') {
        const [year, month] = item._id.split('-');
        const date = new Date(year, month - 1);
        periodLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else {
        const [year, week] = item._id.split('-');
        // Approximate week to date (this is simplified)
        const weekDate = new Date(year, 0, (week - 1) * 7);
        periodLabel = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        period: item._id,
        periodLabel,
        date: item._id,
        totalWeight: Math.round(item.totalWeight * 10) / 10,
        totalQuantity: item.totalQuantity,
        totalBookings: item.totalBookings,
        categories: item.categories,
        // For cumulative calculations
        value: Math.round(item.totalWeight * 10) / 10 // Recharts compatibility
      };
    });

    // Calculate cumulative data
    let cumulativeWeight = 0;
    const cumulativeData = formattedData.map(item => {
      cumulativeWeight += item.totalWeight;
      return {
        ...item,
        cumulativeWeight: Math.round(cumulativeWeight * 10) / 10
      };
    });

    // Calculate trends
    const totalPeriods = formattedData.length;
    const recentPeriods = formattedData.slice(-4); // Last 4 periods
    const avgRecentWeight = recentPeriods.length > 0 
      ? recentPeriods.reduce((sum, item) => sum + item.totalWeight, 0) / recentPeriods.length 
      : 0;

    const trends = {
      totalPeriods,
      averageWeightPerPeriod: totalPeriods > 0 
        ? Math.round((cumulativeWeight / totalPeriods) * 10) / 10 
        : 0,
      recentAverageWeight: Math.round(avgRecentWeight * 10) / 10,
      trend: recentPeriods.length >= 2 
        ? (recentPeriods[recentPeriods.length - 1].totalWeight > recentPeriods[0].totalWeight ? 'up' : 'down')
        : 'stable'
    };

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        periods: cumulativeData,
        trends,
        totalWeight: Math.round(cumulativeWeight * 10) / 10
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching food over time data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch food over time data',
        message: error.message
      },
      { status: 500 }
    );
  }
}