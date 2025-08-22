// Service for aggregating data for reports
import { connectDB } from '@/lib/db';
import UserProfile from '@/models/UserProfile';
import FoodListing from '@/models/FoodListing';
import Booking from '@/models/Booking';

class ReportDataService {
  /**
   * Get date range for report type
   */
  getDateRange(reportType) {
    const now = new Date();
    const ranges = {
      daily: {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: now
      },
      weekly: {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      },
      monthly: {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now
      }
    };
    
    return ranges[reportType] || ranges.weekly;
  }

  /**
   * Aggregate provider analytics data for reports
   */
  async getProviderReportData(providerId, reportType = 'weekly') {
    await connectDB();
    
    const { start, end } = this.getDateRange(reportType);
    
    try {
      // Get provider profile
      const provider = await UserProfile.findOne({ userId: providerId });
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Get food listings in date range
      const listings = await FoodListing.find({
        providerId,
        createdAt: { $gte: start, $lte: end }
      }).lean();

      // Get bookings for these listings
      const listingIds = listings.map(l => l._id);
      const bookings = await Booking.find({
        listingId: { $in: listingIds },
        createdAt: { $gte: start, $lte: end }
      }).lean();

      // Calculate metrics
      const totalFoodListed = listings.reduce((sum, listing) => sum + (listing.quantity || 0), 0);
      const totalFoodCollected = bookings
        .filter(b => b.status === 'collected')
        .reduce((sum, booking) => sum + (booking.approvedQuantity || booking.requestedQuantity || 0), 0);
      
      const totalFoodWasted = totalFoodListed - totalFoodCollected;
      const wastePercentage = totalFoodListed > 0 ? (totalFoodWasted / totalFoodListed) * 100 : 0;

      // Environmental impact calculations
      const carbonSaved = totalFoodCollected * 0.24; // kg CO2 per meal
      const waterSaved = totalFoodCollected * 12.5; // liters per meal

      // Category breakdown
      const categoryBreakdown = this.calculateCategoryBreakdown(listings);
      
      // Trend data (daily breakdown)
      const trendData = this.calculateTrendData(listings, bookings, start, end);

      // Recent listings efficiency
      const efficiencyData = this.calculateEfficiencyData(listings, bookings);

      return {
        provider: {
          id: providerId,
          name: provider.fullName,
          email: provider.email,
        },
        period: {
          type: reportType,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        kpis: {
          totalFoodListed,
          totalFoodCollected,
          totalFoodWasted,
          wastePercentage: wastePercentage.toFixed(1),
          carbonSaved: carbonSaved.toFixed(1),
          waterSaved: Math.round(waterSaved),
        },
        categoryBreakdown,
        trendData,
        efficiencyData,
        listings: listings.length,
        bookings: bookings.length,
      };
    } catch (error) {
      console.error('Error aggregating provider report data:', error);
      throw error;
    }
  }

  /**
   * Aggregate recipient impact data for reports
   */
  async getRecipientReportData(recipientId, reportType = 'weekly') {
    await connectDB();
    
    const { start, end } = this.getDateRange(reportType);
    
    try {
      // Get recipient profile
      const recipient = await UserProfile.findOne({ userId: recipientId });
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Get bookings in date range
      const bookings = await Booking.find({
        userId: recipientId,
        createdAt: { $gte: start, $lte: end }
      }).lean();

      // Calculate metrics
      const totalBooked = bookings.length;
      const totalCompleted = bookings.filter(b => b.status === 'collected').length;
      const totalCancelled = bookings.filter(b => ['cancelled', 'rejected', 'expired'].includes(b.status)).length;
      
      const totalItemsSaved = bookings
        .filter(b => b.status === 'collected')
        .reduce((sum, booking) => sum + (booking.approvedQuantity || booking.requestedQuantity || 1), 0);

      // Environmental impact
      const carbonSaved = totalItemsSaved * 0.24; // kg CO2 per meal
      const waterSaved = totalItemsSaved * 12.5; // liters per meal
      const wasteReduced = totalItemsSaved * 0.16; // kg waste per meal

      // Impact score calculation
      const impactScore = Math.round(totalCompleted * 100 + (totalBooked - totalCancelled) * 10);

      // Success rate
      const successRate = totalBooked > 0 ? Math.round((totalCompleted / totalBooked) * 100) : 0;

      // Activity trend data
      const activityTrend = this.calculateRecipientActivityTrend(bookings, start, end);

      // Achievement progress
      const achievements = this.calculateAchievements(totalItemsSaved, impactScore, totalBooked);

      return {
        recipient: {
          id: recipientId,
          name: recipient.fullName,
          email: recipient.email,
        },
        period: {
          type: reportType,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        impact: {
          mealsSaved: totalItemsSaved,
          carbonSaved: carbonSaved.toFixed(1),
          waterSaved: Math.round(waterSaved),
          wasteReduced: wasteReduced.toFixed(1),
          impactScore,
        },
        activity: {
          totalBooked,
          totalCompleted,
          totalCancelled,
          successRate,
        },
        activityTrend,
        achievements,
      };
    } catch (error) {
      console.error('Error aggregating recipient report data:', error);
      throw error;
    }
  }

  /**
   * Calculate category breakdown for listings
   */
  calculateCategoryBreakdown(listings) {
    const categories = {};
    
    listings.forEach(listing => {
      const category = listing.category || 'Other';
      if (!categories[category]) {
        categories[category] = { quantity: 0, count: 0 };
      }
      categories[category].quantity += listing.quantity || 0;
      categories[category].count += 1;
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      listings: data.count,
    }));
  }

  /**
   * Calculate trend data for provider reports
   */
  calculateTrendData(listings, bookings, start, end) {
    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    const trendData = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayListings = listings.filter(l => 
        new Date(l.createdAt) >= dayStart && new Date(l.createdAt) < dayEnd
      );
      
      const dayBookings = bookings.filter(b => 
        new Date(b.createdAt) >= dayStart && new Date(b.createdAt) < dayEnd &&
        b.status === 'collected'
      );

      const listed = dayListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
      const collected = dayBookings.reduce((sum, b) => sum + (b.approvedQuantity || b.requestedQuantity || 0), 0);

      trendData.push({
        date: dayStart.toISOString().split('T')[0],
        week: `Day ${i + 1}`,
        listed,
        collected,
      });
    }

    return trendData;
  }

  /**
   * Calculate efficiency data for recent listings
   */
  calculateEfficiencyData(listings, bookings) {
    return listings.slice(-10).map(listing => {
      const listingBookings = bookings.filter(b => b.listingId.toString() === listing._id.toString());
      const collected = listingBookings
        .filter(b => b.status === 'collected')
        .reduce((sum, b) => sum + (b.approvedQuantity || b.requestedQuantity || 0), 0);
      
      const listed = listing.quantity || 0;
      const wasted = Math.max(0, listed - collected);

      return {
        title: listing.title || 'Untitled Listing',
        category: listing.category || 'Other',
        listed,
        collected,
        wasted,
        efficiency: listed > 0 ? Math.round((collected / listed) * 100) : 0,
        date: listing.createdAt,
      };
    });
  }

  /**
   * Calculate recipient activity trend
   */
  calculateRecipientActivityTrend(bookings, start, end) {
    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    const trendData = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayBookings = bookings.filter(b => 
        new Date(b.createdAt) >= dayStart && new Date(b.createdAt) < dayEnd
      );

      const booked = dayBookings.length;
      const completed = dayBookings.filter(b => b.status === 'collected').length;
      const cancelled = dayBookings.filter(b => ['cancelled', 'rejected', 'expired'].includes(b.status)).length;

      trendData.push({
        date: dayStart.toISOString().split('T')[0],
        dateFormatted: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        booked,
        completed,
        cancelled,
      });
    }

    return trendData;
  }

  /**
   * Calculate achievement progress
   */
  calculateAchievements(mealsSaved, impactScore, totalBooked) {
    return {
      firstClaim: totalBooked > 0,
      tenMeals: mealsSaved >= 10,
      fiftyMeals: mealsSaved >= 50,
      ecoHero: impactScore >= 1000,
      progress: {
        tenMeals: Math.min(mealsSaved, 10),
        fiftyMeals: Math.min(mealsSaved, 50),
        ecoHero: Math.min(impactScore, 1000),
      }
    };
  }

  /**
   * Get platform-wide aggregated data for admin reports
   */
  async getPlatformReportData(reportType = 'weekly') {
    await connectDB();
    
    const { start, end } = this.getDateRange(reportType);
    
    try {
      // Get all providers and recipients
      const providers = await UserProfile.find({ role: 'PROVIDER' }).lean();
      const recipients = await UserProfile.find({ role: 'RECIPIENT' }).lean();

      // Get all listings and bookings in period
      const listings = await FoodListing.find({
        createdAt: { $gte: start, $lte: end }
      }).lean();

      const bookings = await Booking.find({
        createdAt: { $gte: start, $lte: end }
      }).lean();

      // Calculate platform metrics
      const totalProviders = providers.length;
      const totalRecipients = recipients.length;
      const totalListings = listings.length;
      const totalBookings = bookings.length;
      
      const totalFoodListed = listings.reduce((sum, l) => sum + (l.quantity || 0), 0);
      const totalFoodCollected = bookings
        .filter(b => b.status === 'collected')
        .reduce((sum, b) => sum + (b.approvedQuantity || b.requestedQuantity || 0), 0);

      const platformWasteReduction = totalFoodListed > 0 ? 
        ((totalFoodCollected / totalFoodListed) * 100).toFixed(1) : 0;

      return {
        period: {
          type: reportType,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        platform: {
          totalProviders,
          totalRecipients,
          totalListings,
          totalBookings,
          totalFoodListed,
          totalFoodCollected,
          platformWasteReduction,
          carbonSaved: (totalFoodCollected * 0.24).toFixed(1),
          waterSaved: Math.round(totalFoodCollected * 12.5),
        },
        topProviders: this.getTopProviders(providers, listings, bookings),
        activeRecipients: this.getActiveRecipients(recipients, bookings),
      };
    } catch (error) {
      console.error('Error aggregating platform report data:', error);
      throw error;
    }
  }

  /**
   * Get top performing providers
   */
  getTopProviders(providers, listings, bookings) {
    return providers
      .map(provider => {
        const providerListings = listings.filter(l => l.providerId === provider.userId);
        const providerBookings = bookings.filter(b => 
          providerListings.some(l => l._id.toString() === b.listingId.toString())
        );
        
        const totalListed = providerListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
        const totalCollected = providerBookings
          .filter(b => b.status === 'collected')
          .reduce((sum, b) => sum + (b.approvedQuantity || b.requestedQuantity || 0), 0);

        return {
          name: provider.fullName,
          totalListed,
          totalCollected,
          efficiency: totalListed > 0 ? Math.round((totalCollected / totalListed) * 100) : 0,
        };
      })
      .sort((a, b) => b.totalCollected - a.totalCollected)
      .slice(0, 5);
  }

  /**
   * Get most active recipients
   */
  getActiveRecipients(recipients, bookings) {
    return recipients
      .map(recipient => {
        const recipientBookings = bookings.filter(b => b.userId === recipient.userId);
        const completed = recipientBookings.filter(b => b.status === 'collected').length;

        return {
          name: recipient.fullName,
          totalBookings: recipientBookings.length,
          completed,
          successRate: recipientBookings.length > 0 ?
            Math.round((completed / recipientBookings.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }

  /**
   * Get all active providers with their email addresses
   */
  async getAllProviders() {
    await connectDB();

    try {
      const providers = await UserProfile.find({
        role: 'PROVIDER',
        isActive: true,
        userStatus: { $in: ['ACTIVE', 'APPROVED'] }
      }).select('userId fullName email').lean();

      return providers.map(provider => ({
        userId: provider.userId,
        name: provider.fullName,
        email: provider.email,
      }));
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  /**
   * Get all active recipients with their email addresses
   */
  async getAllRecipients() {
    await connectDB();

    try {
      const recipients = await UserProfile.find({
        role: 'RECIPIENT',
        isActive: true,
        userStatus: { $in: ['ACTIVE', 'APPROVED'] }
      }).select('userId fullName email').lean();

      return recipients.map(recipient => ({
        userId: recipient.userId,
        name: recipient.fullName,
        email: recipient.email,
      }));
    } catch (error) {
      console.error('Error fetching recipients:', error);
      throw error;
    }
  }

  /**
   * Get all active users (both providers and recipients) with their email addresses
   */
  async getAllUsers() {
    await connectDB();

    try {
      const users = await UserProfile.find({
        isActive: true,
        userStatus: { $in: ['ACTIVE', 'APPROVED'] }
      }).select('userId fullName email role').lean();

      return users.map(user => ({
        userId: user.userId,
        name: user.fullName,
        email: user.email,
        role: user.role.toLowerCase(),
      }));
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }
}

// Export singleton instance
const reportDataService = new ReportDataService();
export default reportDataService;
