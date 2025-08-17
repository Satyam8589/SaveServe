// File: /app/api/analytics/global/food-by-category/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';

const WEIGHT_FACTORS = {
  plates: 0.3,
  servings: 0.25,
  kg: 1,
  packets: 0.1,
  pieces: 0.05,
  liters: 1
};

const CATEGORY_COLORS = {
  'Cooked Food': '#FF6B6B',
  'fruits': '#4ECDC4',
  'snacks': '#45B7D1',
  'Raw Ingredients': '#96CEB4',
  'Packaged Food': '#FFEAA7',
  'Beverages': '#DDA0DD'
};

export async function GET(request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const foodByCategoryData = await Booking.aggregate([
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
        $group: {
          _id: '$listing.category',
          totalQuantity: { $sum: '$approvedQuantity' },
          totalListings: { $sum: 1 },
          units: { $addToSet: '$listing.unit' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalQuantity: 1,
          totalListings: 1,
          units: 1,
          // Calculate approximate weight based on common units for each category
          estimatedWeight: {
            $multiply: [
              '$totalQuantity',
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id', 'Cooked Food'] }, then: 0.3 },
                    { case: { $eq: ['$_id', 'fruits'] }, then: 0.15 },
                    { case: { $eq: ['$_id', 'snacks'] }, then: 0.08 },
                    { case: { $eq: ['$_id', 'Raw Ingredients'] }, then: 0.5 },
                    { case: { $eq: ['$_id', 'Packaged Food'] }, then: 0.2 },
                    { case: { $eq: ['$_id', 'Beverages'] }, then: 0.25 }
                  ],
                  default: 0.2
                }
              }
            ]
          }
        }
      },
      {
        $sort: { estimatedWeight: -1 }
      }
    ]);

    // Add colors and format data for charts
    const formattedData = foodByCategoryData.map(item => ({
      category: item.category,
      name: item.category, // For Recharts compatibility
      value: Math.round(item.estimatedWeight * 10) / 10,
      quantity: item.totalQuantity,
      listings: item.totalListings,
      color: CATEGORY_COLORS[item.category] || '#8884d8',
      fill: CATEGORY_COLORS[item.category] || '#8884d8' // For Recharts PieChart
    }));

    // Calculate totals
    const totals = {
      totalWeight: formattedData.reduce((sum, item) => sum + item.value, 0),
      totalQuantity: formattedData.reduce((sum, item) => sum + item.quantity, 0),
      totalListings: formattedData.reduce((sum, item) => sum + item.listings, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        categories: formattedData,
        totals: {
          totalWeight: Math.round(totals.totalWeight * 10) / 10,
          totalQuantity: totals.totalQuantity,
          totalListings: totals.totalListings
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching food by category data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch food by category data',
        message: error.message
      },
      { status: 500 }
    );
  }
}