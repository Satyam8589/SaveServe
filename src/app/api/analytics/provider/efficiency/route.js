// File: /app/api/analytics/provider/efficiency/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';
import Booking from '@/models/Booking';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get recent listings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const listings = await FoodListing.find({
      providerId: userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).limit(10).sort({ createdAt: -1 });

    const efficiencyData = await Promise.all(
      listings.map(async (listing) => {
        const collectedBookings = await Booking.find({
          listingId: listing._id,
          status: 'collected'
        });

        const collected = collectedBookings.reduce((sum, booking) => sum + booking.approvedQuantity, 0);
        const wasted = Math.max(0, listing.quantity - collected);
        const efficiency = listing.quantity > 0 ? ((collected / listing.quantity) * 100).toFixed(1) : 0;

        return {
          title: listing.title.length > 20 ? listing.title.substring(0, 20) + '...' : listing.title,
          category: listing.category,
          listed: listing.quantity,
          collected,
          wasted,
          efficiency: parseFloat(efficiency),
          date: listing.createdAt.toISOString().split('T')[0]
        };
      })
    );

    return NextResponse.json(efficiencyData);

  } catch (error) {
    console.error('Error fetching efficiency data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}