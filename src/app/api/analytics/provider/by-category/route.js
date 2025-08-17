// File: /app/api/analytics/provider/by-category/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const listings = await FoodListing.find({ providerId: userId });
    
    const categoryData = {};
    
    listings.forEach(listing => {
      if (!categoryData[listing.category]) {
        categoryData[listing.category] = {
          category: listing.category,
          quantity: 0,
          listings: 0
        };
      }
      categoryData[listing.category].quantity += listing.quantity;
      categoryData[listing.category].listings += 1;
    });

    const result = Object.values(categoryData).map(item => ({
      ...item,
      percentage: ((item.quantity / listings.reduce((sum, l) => sum + l.quantity, 0)) * 100).toFixed(1)
    }));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

