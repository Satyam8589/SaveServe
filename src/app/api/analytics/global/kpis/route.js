// File: /app/api/analytics/global/kpis/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import FoodListing from '@/models/FoodListing';
import Booking from '@/models/Booking';
import UserProfile from '@/models/UserProfile';

// Conversion factors for environmental impact
const CONVERSION_FACTORS = {
  // CO2 emissions saved (kg CO2 per kg of food)
  co2: {
    'Cooked Food': 2.5,
    'fruits': 0.8,
    'snacks': 1.2,
    'Raw Ingredients': 1.5,
    'Packaged Food': 2.0,
    'Beverages': 0.5
  },
  // Water saved (liters per kg of food)
  water: {
    'Cooked Food': 2500,
    'fruits': 800,
    'snacks': 1200,
    'Raw Ingredients': 1500,
    'Packaged Food': 2000,
    'Beverages': 300
  }
};

// Weight conversion factors (kg per unit)
const WEIGHT_FACTORS = {
  plates: 0.3,    // Average cooked meal plate
  servings: 0.25, // Average serving
  kg: 1,          // Already in kg
  packets: 0.1,   // Average packet weight
  pieces: 0.05,   // Average piece weight
  liters: 1       // 1 liter ≈ 1 kg for most beverages
};

export async function GET(request) {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Aggregate data from collected bookings
    const collectedBookingsData = await Booking.aggregate([
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
          _id: null,
          totalQuantitySaved: {
            $sum: '$approvedQuantity'
          },
          foodByCategory: {
            $push: {
              category: '$listing.category',
              unit: '$listing.unit',
              quantity: '$approvedQuantity'
            }
          },
          totalMealsServed: {
            $sum: {
              $cond: {
                if: { $in: ['$listing.unit', ['plates', 'servings']] },
                then: '$approvedQuantity',
                else: 0
              }
            }
          }
        }
      }
    ]);

    const data = collectedBookingsData[0] || {
      totalQuantitySaved: 0,
      foodByCategory: [],
      totalMealsServed: 0
    };

    // Calculate environmental impact
    let totalCO2Saved = 0;
    let totalWaterSaved = 0;
    let totalWeightSaved = 0;

    data.foodByCategory.forEach(item => {
      const weightInKg = item.quantity * (WEIGHT_FACTORS[item.unit] || 0.1);
      const co2Factor = CONVERSION_FACTORS.co2[item.category] || 1.5;
      const waterFactor = CONVERSION_FACTORS.water[item.category] || 1000;
      
      totalWeightSaved += weightInKg;
      totalCO2Saved += weightInKg * co2Factor;
      totalWaterSaved += weightInKg * waterFactor;
    });

    // Get additional platform statistics
    const [totalListings, totalUsers, totalProviders] = await Promise.all([
      FoodListing.countDocuments({}),
      UserProfile.countDocuments({ isActive: true }),
      UserProfile.countDocuments({ role: 'PROVIDER', isActive: true })
    ]);

    const kpis = {
      totalFoodSaved: {
        value: Math.round(totalWeightSaved * 10) / 10, // Round to 1 decimal
        unit: 'kg',
        label: 'Food Saved',
        description: 'Total weight of food redistributed'
      },
      totalMealsServed: {
        value: data.totalMealsServed,
        unit: 'meals',
        label: 'Meals Served',
        description: 'Number of meals provided to recipients'
      },
      co2Saved: {
        value: Math.round(totalCO2Saved * 10) / 10,
        unit: 'kg CO₂',
        label: 'CO₂ Emissions Saved',
        description: 'Environmental impact reduction'
      },
      waterSaved: {
        value: Math.round(totalWaterSaved),
        unit: 'liters',
        label: 'Water Saved',
        description: 'Water resources conserved'
      },
      totalListings: {
        value: totalListings,
        unit: 'listings',
        label: 'Total Listings',
        description: 'Food items posted on platform'
      },
      activeUsers: {
        value: totalUsers,
        unit: 'users',
        label: 'Active Users',
        description: 'Registered platform users'
      },
      providers: {
        value: totalProviders,
        unit: 'providers',
        label: 'Food Providers',
        description: 'Active food donors'
      }
    };

    return NextResponse.json({
      success: true,
      data: kpis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch KPI data',
        message: error.message
      },
      { status: 500 }
    );
  }
}