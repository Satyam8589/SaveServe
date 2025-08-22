// API endpoint to notify NGOs of bulk food listings
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import ngoNotificationService from '@/services/ngoNotificationService';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';
import UserProfile from '@/models/UserProfile';

// POST /api/listings/notify-ngos - Notify NGOs of bulk food listing
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the food listing
    const listing = await FoodListing.findById(listingId).lean();
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Verify the user owns this listing
    if (listing.providerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not your listing' }, { status: 403 });
    }

    // Get provider information
    const provider = await UserProfile.findOne({ userId: listing.providerId }).lean();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Check if this listing qualifies for NGO notification
    if (!ngoNotificationService.shouldNotifyNGOs(listing)) {
      return NextResponse.json({
        success: true,
        message: `Listing quantity (${listing.quantity}) is below threshold (50). No notifications sent.`,
        threshold: 50,
        quantity: listing.quantity,
        emailsSent: 0
      });
    }

    // Send notifications to NGOs
    const result = await ngoNotificationService.notifyNGOsOfBulkListing(listing, {
      name: provider.fullName,
      email: provider.email,
      id: provider.userId
    });

    return NextResponse.json({
      success: true,
      message: `NGO notifications sent successfully`,
      listingId,
      listingTitle: listing.title,
      quantity: listing.quantity,
      ...result
    });

  } catch (error) {
    console.error('Error notifying NGOs:', error);
    return NextResponse.json(
      { error: 'Failed to notify NGOs', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/listings/notify-ngos - Get NGO notification status and settings
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        // Get NGO notification settings and statistics
        const ngos = await ngoNotificationService.getAllNGOs();
        
        return NextResponse.json({
          success: true,
          ngoCount: ngos.length,
          threshold: 50,
          settings: {
            enabled: true,
            threshold: 50,
            description: 'NGOs are notified when food listings have 50+ items'
          },
          sampleNGOs: ngos.slice(0, 3).map(ngo => ({
            name: ngo.name,
            email: ngo.email.substring(0, 3) + '***' // Mask for privacy
          }))
        });

      case 'test':
        // Test NGO notification system
        const testNGOs = await ngoNotificationService.getAllNGOs();
        
        return NextResponse.json({
          success: true,
          message: 'NGO notification system test',
          ngoCount: testNGOs.length,
          threshold: 50,
          systemReady: testNGOs.length > 0,
          ngos: testNGOs.map(ngo => ({
            name: ngo.name,
            email: ngo.email.substring(0, 3) + '***',
            type: ngo.type
          }))
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error getting NGO notification status:', error);
    return NextResponse.json(
      { error: 'Failed to get NGO status', details: error.message },
      { status: 500 }
    );
  }
}
