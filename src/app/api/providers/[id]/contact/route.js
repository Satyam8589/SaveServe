import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';
import FoodListing from '@/models/FoodListing';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params; // This could be providerId or listingId
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'provider' or 'listing'
    const listingId = searchParams.get('listingId');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Provider ID or Listing ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let contactInfo = {
      providerName: null,
      email: null,
      phone: null,
      listingContactInfo: null
    };

    if (type === 'provider' || !type) {
      // Get provider profile information
      const providerProfile = await UserProfile.findOne({ userId: id });
      
      if (providerProfile) {
        contactInfo.providerName = providerProfile.fullName;
        contactInfo.email = providerProfile.email;
        contactInfo.phone = providerProfile.phoneNumber;
      }
    }

    // If we have a listingId, also get listing-specific contact info
    if (listingId) {
      const listing = await FoodListing.findById(listingId);
      
      if (listing && listing.contactInfo) {
        contactInfo.listingContactInfo = listing.contactInfo;
        
        // Override with listing-specific contact if available
        if (listing.contactInfo.email) {
          contactInfo.email = listing.contactInfo.email;
        }
        if (listing.contactInfo.phone) {
          contactInfo.phone = listing.contactInfo.phone;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      contactInfo: contactInfo
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching provider contact info:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error fetching provider contact information'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
