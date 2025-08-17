// File: /app/api/analytics/provider/kpis/route.js
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

    // Get total food listed by this provider
    const listings = await FoodListing.find({ providerId: userId });
    const totalFoodListed = listings.reduce((sum, listing) => sum + listing.quantity, 0);

    // Get total food collected by this provider
    const collectedBookings = await Booking.find({
      providerId: userId,
      status: 'collected'
    });
    const totalFoodCollected = collectedBookings.reduce((sum, booking) => sum + booking.approvedQuantity, 0);

    // Calculate food wasted
    const foodWasted = Math.max(0, totalFoodListed - totalFoodCollected);

    // Calculate environmental impact (per unit collected)
    const carbonSaved = totalFoodCollected * 2.5; // 2.5 kg CO₂ per unit
    const waterSaved = totalFoodCollected * 2500; // 2500 L water per unit

    return NextResponse.json({
      totalFoodListed,
      totalFoodCollected,
      foodWasted,
      carbonSaved,
      waterSaved,
      wastePercentage: totalFoodListed > 0 ? ((foodWasted / totalFoodListed) * 100).toFixed(1) : 0
    });

  } catch (error) {
    console.error('Error fetching provider KPIs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





