// app/api/listings/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';
import { sendNotificationToArea } from '@/lib/notificationService';

// GET - Fetch all active listings (unchanged)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    let query = {
      isActive: true,
      expiryTime: { $gte: new Date() }
    };

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const listings = await FoodListing.find(query)
      .select('title description quantity freshnessStatus availabilityWindow location expiryTime isActive providerId providerName imageUrl createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await FoodListing.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('GET /api/listings error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch listings'
    }, { status: 500 });
  }
}

// POST - Create new listing with FCM notifications
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    
    console.log('🔍 POST /api/listings - Received body:');
    console.log('📋 Full request body:', JSON.stringify(body, null, 2));
    console.log('🖼️ imageUrl in request:', body.imageUrl);
    console.log('📊 imageUrl type:', typeof body.imageUrl);
    console.log('📏 imageUrl length:', body.imageUrl?.length || 0);
    
    // Validate required fields
    const {
      title,
      quantity,
      freshnessStatus,
      availabilityWindow,
      location,
      expiryTime,
      providerId,
      providerName
    } = body;

    console.log('✅ Required fields check:');
    console.log('- title:', !!title);
    console.log('- quantity:', !!quantity);
    console.log('- freshnessStatus:', !!freshnessStatus);
    console.log('- availabilityWindow:', !!availabilityWindow);
    console.log('- location:', !!location);
    console.log('- expiryTime:', !!expiryTime);
    console.log('- providerId:', !!providerId);
    console.log('- providerName:', !!providerName);

    if (!title || !quantity || !freshnessStatus || !availabilityWindow || !location || !expiryTime || !providerId || !providerName) {
      console.log('❌ Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate dates
    const startTime = new Date(availabilityWindow.startTime);
    const endTime = new Date(availabilityWindow.endTime);
    const expiry = new Date(expiryTime);

    if (startTime >= endTime) {
      console.log('❌ Invalid time range');
      return NextResponse.json({
        success: false,
        error: 'End time must be after start time'
      }, { status: 400 });
    }

    if (expiry <= new Date()) {
      console.log('❌ Invalid expiry time');
      return NextResponse.json({
        success: false,
        error: 'Expiry time must be in the future'
      }, { status: 400 });
    }

    // ✅ CRITICAL: Explicitly handle imageUrl
    const listingData = {
      title,
      description: body.description || '',
      category: body.category || '',
      quantity: parseInt(quantity, 10),
      unit: body.unit || '',
      freshnessStatus,
      freshnessHours: body.freshnessHours || 24,
      availabilityWindow: {
        startTime,
        endTime
      },
      location,
      expiryTime: expiry,
      providerId,
      providerName,
      imageUrl: body.imageUrl || '', // ✅ Always include imageUrl, even if empty
      bookedBy: body.bookedBy || [],
      remainingQuantity: body.remainingQuantity || parseInt(quantity, 10),
      isActive: body.isActive !== undefined ? body.isActive : true
    };

    console.log('📦 Final listing data to save:');
    console.log('🖼️ imageUrl being saved:', listingData.imageUrl);
    console.log('📋 Full listing data:', JSON.stringify(listingData, null, 2));

    const newListing = new FoodListing(listingData);
    const savedListing = await newListing.save();

    console.log('✅ Listing saved successfully:');
    console.log('🆔 Saved listing ID:', savedListing._id);
    console.log('🖼️ Saved imageUrl:', savedListing.imageUrl);
    console.log('📋 Full saved listing:', JSON.stringify(savedListing.toObject(), null, 2));

    // 🔔 Send push notifications to recipients in the area
    try {
      console.log('📢 Sending notifications to area:', location);
      
      const notificationResult = await sendNotificationToArea(
        location,
        'New Food Available! 🍽️',
        `${title} is available in ${location}. Grab it before it's gone!`,
        {
          listingId: savedListing._id.toString(),
          providerId: savedListing.providerId,
          location: savedListing.location,
          category: savedListing.category || 'food',
          action: 'new_listing'
        }
      );

      console.log('📨 Notification result:', notificationResult);
      
      if (notificationResult.success) {
        console.log(`✅ Sent ${notificationResult.sentCount} notifications to recipients in ${location}`);
      } else {
        console.warn('⚠️ Failed to send area notifications:', notificationResult.error);
      }
    } catch (notificationError) {
      // Don't fail the entire request if notifications fail
      console.error('❌ Notification sending failed:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: savedListing,
      notifications: {
        sent: true,
        area: location
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ POST /api/listings error:', error);
    
    if (error.name === 'ValidationError') {
      console.log('❌ Mongoose validation error:', error.message);
      console.log('❌ Validation errors:', error.errors);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create listing'
    }, { status: 500 });
  }
}