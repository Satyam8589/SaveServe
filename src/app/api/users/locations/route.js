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
 * Format address and coordinates to fit within database constraints
 * @param {string} address - The full address string
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {string} - Formatted area string within 100 character limit
 */
function formatAreaString(address, latitude, longitude) {
  const coordinatesPart = `(Lat: ${latitude}, Lon: ${longitude})`;
  const maxTotalLength = 100;

  if (!address) {
    return `Lat: ${latitude}, Lon: ${longitude}`;
  }

  // Calculate available space for address
  const maxAddressLength = maxTotalLength - coordinatesPart.length - 1; // -1 for space

  if (address.length <= maxAddressLength) {
    return `${address} ${coordinatesPart}`;
  }

  // Truncate address intelligently
  let truncatedAddress = address.substring(0, maxAddressLength - 3);

  // Try to break at a comma or space to avoid cutting words
  const lastComma = truncatedAddress.lastIndexOf(',');
  const lastSpace = truncatedAddress.lastIndexOf(' ');

  if (lastComma > maxAddressLength * 0.7) {
    truncatedAddress = address.substring(0, lastComma);
  } else if (lastSpace > maxAddressLength * 0.7) {
    truncatedAddress = address.substring(0, lastSpace);
  }

  const result = `${truncatedAddress}... ${coordinatesPart}`;

  // Final safety check
  if (result.length > maxTotalLength) {
    return `Lat: ${latitude}, Lon: ${longitude}`;
  }

  return result;
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
        userId: 1, // Fetch the userId (Clerk ID)
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
        id: user.userId, // Use userId (Clerk ID) as the main identifier
        mongoId: user._id.toString(), // Keep mongoId for reference
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
 * PUT /api/users/locations
 * Updates user location in the area field
 */
export async function PUT(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, latitude, longitude, address } = body;

    console.log('📍 PUT /api/users/locations - Updating location for user:', userId);
    console.log('📍 Coordinates:', { latitude, longitude });
    console.log('📍 Address:', address);

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Handle clearing location data
    if (latitude === null || longitude === null) {
      const updatedUser = await UserProfile.findOneAndUpdate(
        { userId },
        {
          area: '',
          lastLoginAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return NextResponse.json(
          { success: false, error: 'User profile not found' },
          { status: 404 }
        );
      }

      console.log('✅ Location cleared successfully for user:', userId);

      return NextResponse.json({
        success: true,
        message: 'Location cleared successfully',
        data: {
          userId: updatedUser.userId,
          area: '',
          coordinates: null,
          address: null
        }
      });
    }

    // Validate coordinate ranges for non-null values
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinate values' },
        { status: 400 }
      );
    }

    // Format the area string with coordinates and optional address
    const areaString = formatAreaString(address, lat, lon);
    console.log(`📝 Formatted area string (${areaString.length} chars):`, areaString);

    if (address && address.length > areaString.length) {
      console.log(`⚠️ Address truncated from ${address.length} to fit database constraints`);
    }

    // Update user profile with location data
    console.log(`💾 Updating user profile with area: "${areaString}"`);

    const updatedUser = await UserProfile.findOneAndUpdate(
      { userId },
      {
        area: areaString,
        lastLoginAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.error(`❌ User profile not found for userId: ${userId}`);
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Location updated successfully for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        userId: updatedUser.userId,
        area: updatedUser.area,
        coordinates: { latitude: lat, longitude: lon },
        address: address || null
      }
    });

  } catch (error) {
    console.error('❌ PUT /api/users/locations error:', error);

    // Handle specific validation errors
    let errorMessage = 'Failed to update user location';
    let statusCode = 500;

    if (error.name === 'ValidationError') {
      errorMessage = 'Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', ');
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid data format provided';
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : undefined
      },
      { status: statusCode }
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

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}