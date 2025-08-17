// File: /app/api/analytics/global/activity-timeline/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';
import FoodListing from '@/models/FoodListing';

export async function GET(request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Get activity data for the last 30 days, grouped by hour of day and day of week
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    // Analyze booking creation patterns (when requests are made)
    const bookingPatterns = await Booking.aggregate([
      {
        $match: {
          requestedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $addFields: {
          hourOfDay: { $hour: '$requestedAt' },
          dayOfWeek: { $dayOfWeek: '$requestedAt' }, // 1 = Sunday, 7 = Saturday
          dayOfMonth: { $dayOfMonth: '$requestedAt' }
        }
      },
      {
        $group: {
          _id: {
            hour: '$hourOfDay',
            dayOfWeek: '$dayOfWeek'
          },
          bookingCount: { $sum: 1 },
          collectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'collected'] }, 1, 0] }
          }
        }
      }
    ]);

    // Analyze food listing creation patterns (when food is posted)
    const listingPatterns = await FoodListing.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $addFields: {
          hourOfDay: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' }
        }
      },
      {
        $group: {
          _id: {
            hour: '$hourOfDay',
            dayOfWeek: '$dayOfWeek'
          },
          listingCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Analyze collection patterns (when food is actually collected)
    const collectionPatterns = await Booking.aggregate([
      {
        $match: {
          status: 'collected',
          collectedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $addFields: {
          hourOfDay: { $hour: '$collectedAt' },
          dayOfWeek: { $dayOfWeek: '$collectedAt' }
        }
      },
      {
        $group: {
          _id: {
            hour: '$hourOfDay',
            dayOfWeek: '$dayOfWeek'
          },
          collectionCount: { $sum: 1 },
          totalCollected: { $sum: '$approvedQuantity' }
        }
      }
    ]);

    // Create heatmap data structure (24 hours x 7 days)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmapData = [];

    // Initialize with zeros
    for (let hour = 0; hour < 24; hour++) {
      for (let day = 1; day <= 7; day++) {
        heatmapData.push({
          hour,
          day,
          dayName: dayNames[day - 1],
          hourLabel: `${hour.toString().padStart(2, '0')}:00`,
          bookings: 0,
          listings: 0,
          collections: 0,
          totalActivity: 0
        });
      }
    }

    // Populate with actual data
    const activityMap = {};
    heatmapData.forEach(cell => {
      const key = `${cell.hour}-${cell.day}`;
      activityMap[key] = cell;
    });

    // Add booking data
    bookingPatterns.forEach(pattern => {
      const key = `${pattern._id.hour}-${pattern._id.dayOfWeek}`;
      if (activityMap[key]) {
        activityMap[key].bookings = pattern.bookingCount;
        activityMap[key].totalActivity += pattern.bookingCount;
      }
    });

    // Add listing data
    listingPatterns.forEach(pattern => {
      const key = `${pattern._id.hour}-${pattern._id.dayOfWeek}`;
      if (activityMap[key]) {
        activityMap[key].listings = pattern.listingCount;
        activityMap[key].totalActivity += pattern.listingCount;
      }
    });

    // Add collection data
    collectionPatterns.forEach(pattern => {
      const key = `${pattern._id.hour}-${pattern._id.dayOfWeek}`;
      if (activityMap[key]) {
        activityMap[key].collections = pattern.collectionCount;
        activityMap[key].totalActivity += pattern.collectionCount;
      }
    });

    // Calculate peak activity times
    const sortedByActivity = [...heatmapData].sort((a, b) => b.totalActivity - a.totalActivity);
    const peakHours = sortedByActivity.slice(0, 5).map(cell => ({
      hour: cell.hour,
      day: cell.dayName,
      hourLabel: cell.hourLabel,
      totalActivity: cell.totalActivity,
      breakdown: {
        bookings: cell.bookings,
        listings: cell.listings,
        collections: cell.collections
      }
    }));

    // Calculate daily and hourly summaries
    const dailySummary = {};
    const hourlySummary = {};

    heatmapData.forEach(cell => {
      // Daily summary
      if (!dailySummary[cell.dayName]) {
        dailySummary[cell.dayName] = {
          day: cell.dayName,
          bookings: 0,
          listings: 0,
          collections: 0,
          totalActivity: 0
        };
      }
      dailySummary[cell.dayName].bookings += cell.bookings;
      dailySummary[cell.dayName].listings += cell.listings;
      dailySummary[cell.dayName].collections += cell.collections;
      dailySummary[cell.dayName].totalActivity += cell.totalActivity;

      // Hourly summary
      if (!hourlySummary[cell.hour]) {
        hourlySummary[cell.hour] = {
          hour: cell.hour,
          hourLabel: cell.hourLabel,
          bookings: 0,
          listings: 0,
          collections: 0,
          totalActivity: 0
        };
      }
      hourlySummary[cell.hour].bookings += cell.bookings;
      hourlySummary[cell.hour].listings += cell.listings;
      hourlySummary[cell.hour].collections += cell.collections;
      hourlySummary[cell.hour].totalActivity += cell.totalActivity;
    });

    // Convert to arrays and sort
    const dailySummaryArray = Object.values(dailySummary);
    const hourlySummaryArray = Object.values(hourlySummary).sort((a, b) => a.hour - b.hour);

    // Calculate efficiency metrics
    const totalBookings = heatmapData.reduce((sum, cell) => sum + cell.bookings, 0);
    const totalCollections = heatmapData.reduce((sum, cell) => sum + cell.collections, 0);
    const collectionRate = totalBookings > 0 ? (totalCollections / totalBookings * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        heatmap: heatmapData,
        peakTimes: peakHours,
        dailySummary: dailySummaryArray,
        hourlySummary: hourlySummaryArray,
        metrics: {
          totalBookings,
          totalCollections,
          collectionRate: Math.round(collectionRate * 10) / 10,
          dataRange: `${thirtyDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching activity timeline data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activity timeline data',
        message: error.message
      },
      { status: 500 }
    );
  }
}