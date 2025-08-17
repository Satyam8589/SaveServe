// File: /app/api/analytics/provider/trend/route.js
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

    // Get data for the last 8 weeks
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const listings = await FoodListing.find({
      providerId: userId,
      createdAt: { $gte: eightWeeksAgo }
    });

    const bookings = await Booking.find({
      providerId: userId,
      status: 'collected',
      collectedAt: { $gte: eightWeeksAgo }
    });

    // Group by week
    const weeklyData = {};
    
    // Initialize weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekKey = `Week ${8 - i}`;
      weeklyData[weekKey] = {
        week: weekKey,
        date: weekStart.toISOString().split('T')[0],
        listed: 0,
        collected: 0
      };
    }

    // Process listings
    listings.forEach(listing => {
      const listingDate = new Date(listing.createdAt);
      const weeksAgo = Math.floor((Date.now() - listingDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `Week ${8 - weeksAgo}`;
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].listed += listing.quantity;
      }
    });

    // Process collected bookings
    bookings.forEach(booking => {
      const collectionDate = new Date(booking.collectedAt);
      const weeksAgo = Math.floor((Date.now() - collectionDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `Week ${8 - weeksAgo}`;
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].collected += booking.approvedQuantity;
      }
    });

    return NextResponse.json(Object.values(weeklyData));

  } catch (error) {
    console.error('Error fetching provider trend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}