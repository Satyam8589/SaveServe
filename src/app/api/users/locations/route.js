// /app/api/users/locations/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import UserProfile from '../../../../models/UserProfile.js'; // Adjust path based on your project structure

/**
 * MongoDB connection utility
 * Reuses existing connection if available to avoid connection pooling issues
 */
async function connectToDatabase() {
  try {
    if (mongoose.connections[0].readyState) {
      console.log('📡 Using existing MongoDB connection');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🚀 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Parse area string to extract latitude and longitude coordinates
 * Expected format: "Lat: 22.5151549, Lon: 88.4104219"
 * 
 * @param {string} areaString - The area string containing coordinates
 * @returns {object} - Object with latitude and longitude or null values
 */
function parseCoordinates(areaString) {
  if (!areaString || typeof areaString !== 'string') {
    return { latitude: null, longitude: null };
  }

  try {
    // Regex to match "Lat: number, Lon: number" format
    // Supports both positive and negative coordinates with optional decimals
    const coordinateRegex = /Lat:\s*(-?\d+\.?\d*),\s*Lon:\s*(-?\d+\.?\d*)/i;
    const match = areaString.match(coordinateRegex);

    if (match && match[1] && match[2]) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);

      // Basic validation for reasonable coordinate ranges
      if (
        !isNaN(latitude) && 
        !isNaN(longitude) && 
        latitude >= -90 && 
        latitude <= 90 && 
        longitude >= -180 && 
        longitude <= 180
      ) {
        return { latitude, longitude };
      }
    }

    console.warn('⚠️  Invalid coordinate format:', areaString);
    return { latitude: null, longitude: null };
  } catch (error) {
    console.error('❌ Error parsing coordinates:', error);
    return { latitude: null, longitude: null };
  }
}

/**
 * GET /api/users/locations
 * Fetches all active users with their parsed location coordinates
 * Returns formatted data suitable for Google Maps integration
 */
export async function GET() {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Fetch all active users with required fields
    const users = await UserProfile.find(
      { isActive: true },
      {
        _id: 1,
        fullName: 1,
        role: 1,
        subrole: 1,
        area: 1,
      }
    ).lean(); // Use lean() for better performance when we don't need mongoose documents

    console.log(`📍 Found ${users.length} active users`);

    // Transform data and parse coordinates
    const locationsData = users.map(user => {
      const { latitude, longitude } = parseCoordinates(user.area);
      
      return {
        id: user._id.toString(),
        fullName: user.fullName,
        role: user.role,
        subrole: user.subrole,
        area: user.area || '', // Original area string for display
        latitude,
        longitude,
        // Add a helper field to determine if coordinates are valid
        hasValidCoordinates: latitude !== null && longitude !== null
      };
    });

    // Filter out users without valid coordinates for map display
    const validLocations = locationsData.filter(user => user.hasValidCoordinates);
    
    console.log(`✅ Returning ${validLocations.length} users with valid coordinates`);

    return NextResponse.json({
      success: true,
      data: locationsData, // Return all users
      validLocations, // Also provide filtered list for convenience
      meta: {
        total: users.length,
        withCoordinates: validLocations.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user locations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}