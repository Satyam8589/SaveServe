// File: /app/api/listings/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';

// GET - Fetch all active listings
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

// POST - Create new listing
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    
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

    if (!title || !quantity || !freshnessStatus || !availabilityWindow || !location || !expiryTime || !providerId || !providerName) {
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
      return NextResponse.json({
        success: false,
        error: 'End time must be after start time'
      }, { status: 400 });
    }

    if (expiry <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Expiry time must be in the future'
      }, { status: 400 });
    }

    const newListing = new FoodListing({
      ...body,
      availabilityWindow: {
        startTime,
        endTime
      },
      expiryTime: expiry
    });

    const savedListing = await newListing.save();

    return NextResponse.json({
      success: true,
      data: savedListing
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/listings error:', error);
    
    if (error.name === 'ValidationError') {
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