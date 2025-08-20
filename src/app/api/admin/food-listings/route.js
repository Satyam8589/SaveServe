import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';
import UserProfile from '@/models/UserProfile';

// GET - Fetch all food listings for admin management
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;
    const search = searchParams.get('search') || '';

    // Build query
    let query = {};
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔎 Fetching food listings with query:', query);

    const listings = await FoodListing.find(query)
      .populate('providerId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalCount = await FoodListing.countDocuments(query);

    // Get statistics
    const stats = await FoodListing.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
          expired: { 
            $sum: { 
              $cond: [
                { $lt: ['$expiryTime', new Date()] }, 
                1, 
                0 
              ] 
            } 
          }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      listings,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount
      },
      stats: stats[0] || { total: 0, active: 0, inactive: 0, expired: 0 }
    });

  } catch (error) {
    console.error('Error fetching food listings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a food listing (admin only)
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('id');
    const adminId = searchParams.get('adminId');
    const reason = searchParams.get('reason') || 'Removed by admin';

    if (!listingId || !adminId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID and Admin ID are required' },
        { status: 400 }
      );
    }

    // Verify admin permissions (you might want to add more robust admin verification)
    const adminProfile = await UserProfile.findOne({ userId: adminId });
    if (!adminProfile || adminProfile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Find and delete the listing
    const listing = await FoodListing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Food listing not found' },
        { status: 404 }
      );
    }

    // Store listing info for logging
    const listingInfo = {
      id: listing._id,
      title: listing.title,
      providerId: listing.providerId,
      deletedBy: adminId,
      deletedAt: new Date(),
      reason: reason
    };

    // Delete the listing
    await FoodListing.findByIdAndDelete(listingId);

    console.log('🗑️ Food listing deleted by admin:', listingInfo);

    return NextResponse.json({
      success: true,
      message: 'Food listing deleted successfully',
      deletedListing: listingInfo
    });

  } catch (error) {
    console.error('Error deleting food listing:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
