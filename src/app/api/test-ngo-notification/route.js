// Test endpoint for NGO notification system
import { NextResponse } from 'next/server';
import ngoNotificationService from '@/services/ngoNotificationService';

// GET /api/test-ngo-notification - Test NGO notification system
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        // Get NGO count and system status
        const ngos = await ngoNotificationService.getAllNGOs();
        
        //send the notification when the provider upload food more then 50
        return NextResponse.json({
          success: true,
          system: 'NGO Notification System',
          status: 'operational',
          ngoCount: ngos.length,
          threshold: 50,
          description: 'Automatically notifies NGOs when food listings have 50+ items',
          sampleNGOs: ngos.slice(0, 3).map(ngo => ({
            name: ngo.name,
            email: ngo.email.substring(0, 3) + '***@' + ngo.email.split('@')[1],
            type: ngo.type
          })),
          timestamp: new Date().toISOString()
        });

      case 'test':
        // Test with mock data
        const mockListing = {
          _id: 'test-listing-id',
          title: 'Test Bulk Food Donation',
          quantity: 75,
          category: 'Mixed Food',
          createdAt: new Date(),
          pickupEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        };

        const mockProvider = {
          name: 'Test Restaurant',
          email: 'test@restaurant.com',
          id: 'test-provider-id'
        };

        // Check if it qualifies for notification
        const qualifies = ngoNotificationService.shouldNotifyNGOs(mockListing);
        
        return NextResponse.json({
          success: true,
          test: 'Mock bulk listing test',
          mockListing: {
            title: mockListing.title,
            quantity: mockListing.quantity,
            category: mockListing.category
          },
          mockProvider: mockProvider,
          qualifiesForNotification: qualifies,
          threshold: 50,
          message: qualifies ? 
            `This listing qualifies for NGO notification (${mockListing.quantity} >= 50)` :
            `This listing does not qualify (${mockListing.quantity} < 50)`,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action. Use: status or test' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error testing NGO notification system:', error);
    return NextResponse.json(
      { error: 'Failed to test NGO system', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/test-ngo-notification - Send test NGO notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      testEmail, 
      quantity = 75, 
      title = 'Test Bulk Food Donation',
      providerName = 'Test Restaurant'
    } = body;

    if (!testEmail) {
      return NextResponse.json({ error: 'testEmail is required' }, { status: 400 });
    }

    // Create mock data for testing
    const mockListing = {
      _id: 'test-listing-' + Date.now(),
      title,
      quantity,
      category: 'Mixed Food',
      createdAt: new Date(),
      pickupEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    const mockProvider = {
      name: providerName,
      email: 'test@provider.com',
      id: 'test-provider-id'
    };

    const mockNGO = {
      userId: 'test-ngo-id',
      name: 'Test NGO',
      email: testEmail,
      type: 'NGO'
    };

    // Send test notification
    const emailService = (await import('@/services/emailService')).default;
    const result = await emailService.sendBulkListingNotification(mockListing, mockProvider, mockNGO);

    return NextResponse.json({
      success: true,
      message: 'Test NGO notification sent',
      testData: {
        listing: {
          title: mockListing.title,
          quantity: mockListing.quantity,
          category: mockListing.category
        },
        provider: mockProvider,
        ngo: {
          name: mockNGO.name,
          email: mockNGO.email
        }
      },
      emailResult: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending test NGO notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification', details: error.message },
      { status: 500 }
    );
  }
}
