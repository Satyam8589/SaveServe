// Demo endpoint to test NGO notification with real database email
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';
import ngoNotificationService from '@/services/ngoNotificationService';

// GET /api/demo-ngo-test - Extract one NGO email and show demo data
export async function GET(request) {
  try {
    await connectDB();

    // Look ONLY for users with subrole "NGO"
    const searchMethods = [
      // Method 1: ONLY users with subrole "NGO" (primary target)
      { role: 'RECIPIENT', subrole: 'NGO', isActive: true },
      // Method 2: Fallback - any recipient for demo purposes if no NGO subrole found
      { role: 'RECIPIENT', isActive: true }
    ];

    let demoNGO = null;
    let searchMethod = '';

    for (let i = 0; i < searchMethods.length; i++) {
      const users = await UserProfile.find(searchMethods[i])
        .select('userId fullName email organizationType')
        .limit(1)
        .lean();
      
      if (users.length > 0) {
        demoNGO = users[0];
        searchMethod = `Method ${i + 1}`;
        break;
      }
    }

    if (!demoNGO) {
      return NextResponse.json({
        success: false,
        message: 'No suitable demo NGO found in database',
        suggestion: 'Create a test user with "NGO" in the name or organization type',
        searchMethods: searchMethods.map((method, index) => ({
          method: `Method ${index + 1}`,
          criteria: method
        }))
      });
    }

    // Create demo bulk listing data
    const demoBulkListing = {
      _id: 'demo-listing-' + Date.now(),
      title: 'Bulk Restaurant Meals - Mixed Cuisine',
      quantity: 85, // Above 50 threshold
      category: 'Prepared Meals',
      description: 'Fresh prepared meals from SaveServe Restaurant including vegetarian and non-vegetarian options',
      createdAt: new Date(),
      pickupStartTime: new Date(),
      pickupEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      location: 'SaveServe Restaurant, Main Street',
      providerId: 'demo-provider-id'
    };

    const demoProvider = {
      name: 'SaveServe Demo Restaurant',
      email: 'restaurant@saveserve.com',
      id: 'demo-provider-id'
    };

    // Calculate environmental impact
    const environmentalImpact = {
      carbonSaved: (demoBulkListing.quantity * 0.24).toFixed(1), // kg CO₂
      waterSaved: (demoBulkListing.quantity * 12.5).toFixed(0), // liters
      wasteReduced: (demoBulkListing.quantity * 0.5).toFixed(1) // kg food waste
    };

    return NextResponse.json({
      success: true,
      message: 'Demo NGO found and demo data prepared',
      demoNGO: {
        name: demoNGO.fullName,
        email: demoNGO.email,
        userId: demoNGO.userId,
        organizationType: demoNGO.organizationType || 'NGO',
        foundBy: searchMethod
      },
      demoBulkListing: {
        title: demoBulkListing.title,
        quantity: demoBulkListing.quantity,
        category: demoBulkListing.category,
        pickupDeadline: demoBulkListing.pickupEndTime,
        location: demoBulkListing.location
      },
      demoProvider,
      environmentalImpact,
      qualifiesForNotification: demoBulkListing.quantity >= 50,
      threshold: 50,
      readyForDemo: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error preparing demo NGO test:', error);
    return NextResponse.json(
      { error: 'Failed to prepare demo', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/demo-ngo-test - Send actual demo notification to extracted NGO
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { sendActualEmail = false } = body;

    // Find a demo NGO (ONLY subrole "NGO")
    const searchMethods = [
      { role: 'RECIPIENT', subrole: 'NGO', isActive: true },
      { role: 'RECIPIENT', isActive: true } // Fallback for demo
    ];

    let demoNGO = null;
    for (const method of searchMethods) {
      const users = await UserProfile.find(method)
        .select('userId fullName email organizationType')
        .limit(1)
        .lean();
      
      if (users.length > 0) {
        demoNGO = users[0];
        break;
      }
    }

    if (!demoNGO) {
      return NextResponse.json({
        success: false,
        message: 'No demo NGO found in database'
      }, { status: 404 });
    }

    // Create demo data
    const demoBulkListing = {
      _id: 'demo-listing-' + Date.now(),
      title: 'Bulk Restaurant Meals - Mixed Cuisine',
      quantity: 85,
      category: 'Prepared Meals',
      description: 'Fresh prepared meals including vegetarian and non-vegetarian options',
      createdAt: new Date(),
      pickupStartTime: new Date(),
      pickupEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      location: 'SaveServe Restaurant, Main Street',
      providerId: 'demo-provider-id'
    };

    const demoProvider = {
      name: 'SaveServe Demo Restaurant',
      email: 'restaurant@saveserve.com',
      id: 'demo-provider-id'
    };

    const ngoForEmail = {
      userId: demoNGO.userId,
      name: demoNGO.fullName,
      email: demoNGO.email,
      type: demoNGO.organizationType || 'NGO'
    };

    let emailResult = null;

    if (sendActualEmail) {
      // Send actual email to the NGO
      try {
        emailResult = await ngoNotificationService.sendBulkListingEmail(
          demoBulkListing,
          demoProvider,
          ngoForEmail
        );
        
        console.log(`Demo NGO notification sent to: ${demoNGO.email}`);
      } catch (emailError) {
        console.error('Failed to send demo email:', emailError);
        emailResult = { success: false, error: emailError.message };
      }
    }

    return NextResponse.json({
      success: true,
      message: sendActualEmail ? 'Demo notification sent to real NGO!' : 'Demo data prepared (no email sent)',
      demoNGO: {
        name: demoNGO.fullName,
        email: demoNGO.email,
        organizationType: demoNGO.organizationType || 'NGO'
      },
      demoBulkListing: {
        title: demoBulkListing.title,
        quantity: demoBulkListing.quantity,
        category: demoBulkListing.category,
        location: demoBulkListing.location,
        pickupDeadline: demoBulkListing.pickupEndTime
      },
      demoProvider,
      emailSent: sendActualEmail,
      emailResult,
      environmentalImpact: {
        carbonSaved: `${(demoBulkListing.quantity * 0.24).toFixed(1)}kg CO₂`,
        waterSaved: `${(demoBulkListing.quantity * 12.5).toFixed(0)} liters`,
        wasteReduced: `${(demoBulkListing.quantity * 0.5).toFixed(1)}kg food`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending demo NGO notification:', error);
    return NextResponse.json(
      { error: 'Failed to send demo notification', details: error.message },
      { status: 500 }
    );
  }
}
