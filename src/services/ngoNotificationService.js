// NGO notification service for bulk food listings
import emailService from './emailService';
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';

class NGONotificationService {
  /**
   * Get all active NGO email addresses (ONLY users with subrole "NGO")
   */
  async getAllNGOs() {
    await connectDB();

    try {
      // Get ONLY users with subrole "NGO" - very specific targeting
      const ngos = await UserProfile.find({
        role: 'RECIPIENT',
        subrole: 'NGO', // Only users with subrole NGO
        isActive: true,
        userStatus: { $in: ['ACTIVE', 'APPROVED'] }
      }).select('userId fullName email subrole organizationType').lean();

      console.log(`Found ${ngos.length} users with subrole "NGO"`);

      return ngos.map(ngo => ({
        userId: ngo.userId,
        name: ngo.fullName,
        email: ngo.email,
        subrole: ngo.subrole,
        type: ngo.organizationType || 'NGO',
      }));
    } catch (error) {
      console.error('Error fetching NGOs:', error);
      throw error;
    }
  }

  /**
   * Check if a food listing qualifies for NGO notification
   */
  shouldNotifyNGOs(listing) {
    const quantity = listing.quantity || 0;
    return quantity >= 50;
  }

  /**
   * Send bulk food notification to all NGOs
   */
  async notifyNGOsOfBulkListing(listing, provider) {
    try {
      if (!this.shouldNotifyNGOs(listing)) {
        console.log(`Listing quantity ${listing.quantity} is below threshold (50). No NGO notification sent.`);
        return { success: true, reason: 'Below threshold', emailsSent: 0 };
      }

      // Get all NGO email addresses
      const ngos = await this.getAllNGOs();
      
      if (ngos.length === 0) {
        console.log('No NGOs found in database');
        return { success: true, reason: 'No NGOs found', emailsSent: 0 };
      }

      console.log(`Sending bulk food notification to ${ngos.length} NGOs for listing: ${listing.title}`);

      const emailResults = [];
      
      for (const ngo of ngos) {
        try {
          const emailResult = await this.sendBulkListingEmail(listing, provider, ngo);
          emailResults.push({
            ngoId: ngo.userId,
            email: ngo.email,
            success: emailResult.success,
            messageId: emailResult.messageId
          });
        } catch (error) {
          console.error(`Failed to send notification to NGO ${ngo.email}:`, error);
          emailResults.push({
            ngoId: ngo.userId,
            email: ngo.email,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = emailResults.filter(r => r.success).length;
      const failureCount = emailResults.filter(r => !r.success).length;

      console.log(`NGO notification results: ${successCount} sent, ${failureCount} failed`);

      return {
        success: true,
        emailsSent: successCount,
        emailsFailed: failureCount,
        totalNGOs: ngos.length,
        results: emailResults
      };

    } catch (error) {
      console.error('Error notifying NGOs of bulk listing:', error);
      throw error;
    }
  }

  /**
   * Send individual bulk listing email to an NGO
   */
  async sendBulkListingEmail(listing, provider, ngo) {
    return await emailService.sendBulkListingNotification(listing, provider, ngo);
  }

  /**
   * Generate HTML email for bulk listing notification
   */
  generateBulkListingEmailHTML(listing, provider, ngo) {
    const listingTime = new Date(listing.createdAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulk Food Available - SaveServe</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            background-color: #f8f9fa;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #dc2626, #b91c1c); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 24px; 
            font-weight: 600; 
            margin-bottom: 8px; 
        }
        .urgent-badge {
            background: #fbbf24;
            color: #92400e;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 15px;
            display: inline-block;
        }
        .content { 
            padding: 30px; 
        }
        .greeting { 
            font-size: 18px; 
            color: #1f2937; 
            margin-bottom: 25px; 
            font-weight: 500;
        }
        .listing-details { 
            background: #fef3c7; 
            border: 2px solid #f59e0b; 
            border-radius: 8px; 
            padding: 25px; 
            margin: 20px 0;
        }
        .listing-details h3 { 
            color: #92400e; 
            margin-bottom: 15px; 
            font-size: 20px;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 8px 0;
            border-bottom: 1px solid #fde68a;
        }
        .detail-label { 
            font-weight: 600; 
            color: #78350f;
        }
        .detail-value { 
            color: #92400e; 
            font-weight: 500;
        }
        .quantity-highlight {
            background: #dc2626;
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: 600;
        }
        .cta { 
            background: #dc2626; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
        }
        .footer { 
            background: #f8f9fa; 
            padding: 25px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px;
        }
        .footer a { 
            color: #dc2626; 
            text-decoration: none;
        }
        .impact-note {
            background: #d1fae5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            color: #065f46;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="urgent-badge">🚨 URGENT OPPORTUNITY</div>
            <h1>🍽️ Bulk Food Available</h1>
            <p>Large quantity food listing requires immediate attention</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear ${ngo.name},
            </div>
            
            <p>We hope this message finds you well. A significant food donation opportunity has just become available on SaveServe that we thought would be perfect for your organization.</p>
            
            <div class="quantity-highlight">
                📦 <strong>${listing.quantity} items</strong> available for immediate collection
            </div>
            
            <div class="listing-details">
                <h3>📋 Listing Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Food Item:</span>
                    <span class="detail-value">${listing.title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Quantity:</span>
                    <span class="detail-value">${listing.quantity} items</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${listing.category || 'General Food'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Provider:</span>
                    <span class="detail-value">${provider.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Listed Time:</span>
                    <span class="detail-value">${listingTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup By:</span>
                    <span class="detail-value">${new Date(listing.pickupEndTime).toLocaleString()}</span>
                </div>
            </div>

            <div class="impact-note">
                <h4>🌍 Environmental Impact</h4>
                <p>By claiming this bulk listing, your organization could prevent approximately <strong>${(listing.quantity * 0.24).toFixed(1)}kg of CO₂</strong> emissions and save <strong>${(listing.quantity * 12.5).toFixed(0)} liters</strong> of water that would otherwise be wasted.</p>
            </div>

            <p><strong>Why this matters:</strong></p>
            <ul style="margin: 15px 0; padding-left: 20px; color: #4b5563;">
                <li>Large quantities like this can feed many people in your community</li>
                <li>Bulk collections are more efficient for your operations</li>
                <li>You're preventing significant food waste and environmental impact</li>
                <li>This strengthens the partnership between SaveServe and NGO community</li>
            </ul>

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/recipientDashboard" class="cta">
                    🚀 Claim This Food Now
                </a>
            </div>

            <p style="margin-top: 20px; color: #dc2626; font-weight: 600;">
                ⏰ <strong>Time Sensitive:</strong> This is a bulk listing and may be claimed quickly. We recommend acting fast to secure this opportunity for your beneficiaries.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>SaveServe</strong> - Connecting Food Providers with NGOs</p>
            <p>Together, we're building a world without food waste! 🌍</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Visit SaveServe</a> | <a href="mailto:support@saveserve.com">Contact Support</a></p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                You're receiving this because you're registered as an NGO on SaveServe. 
                <a href="#" style="color: #9ca3af;">Manage preferences</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email for bulk listing notification
   */
  generateBulkListingEmailText(listing, provider, ngo) {
    const listingTime = new Date(listing.createdAt).toLocaleString();
    
    return `
URGENT: Bulk Food Available - ${listing.quantity} items

Dear ${ngo.name},

A significant food donation opportunity is now available on SaveServe:

LISTING DETAILS:
- Food Item: ${listing.title}
- Quantity: ${listing.quantity} items
- Category: ${listing.category || 'General Food'}
- Provider: ${provider.name}
- Listed: ${listingTime}
- Pickup By: ${new Date(listing.pickupEndTime).toLocaleString()}

ENVIRONMENTAL IMPACT:
This bulk listing could prevent ${(listing.quantity * 0.24).toFixed(1)}kg CO₂ emissions and save ${(listing.quantity * 12.5).toFixed(0)} liters of water.

This is a time-sensitive opportunity. Please visit SaveServe to claim this food for your beneficiaries.

Visit: ${process.env.NEXT_PUBLIC_APP_URL}/recipientDashboard

Best regards,
The SaveServe Team
    `.trim();
  }
}

// Export singleton instance
const ngoNotificationService = new NGONotificationService();
export default ngoNotificationService;
