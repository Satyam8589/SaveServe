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
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        end: now
      },
      weekly: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
        end: now
      },
      monthly: {
        start: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
        end: now
      }
    };

    return ranges[reportType] || ranges.weekly;
  }

  /**
   * Generate mock data when no real data exists
   */
  generateMockProviderData(providerId, reportType) {
    const mockMultipliers = {
      daily: { listings: 2, collected: 1.5 },
      weekly: { listings: 12, collected: 9 },
      monthly: { listings: 45, collected: 35 }
    };

    const multiplier = mockMultipliers[reportType] || mockMultipliers.weekly;
    const totalFoodListed = Math.floor(Math.random() * multiplier.listings) + multiplier.listings;
    const totalFoodCollected = Math.floor(Math.random() * multiplier.collected) + multiplier.collected;

    return {
      totalFoodListed,
      totalFoodCollected,
      totalFoodWasted: totalFoodListed - totalFoodCollected,
      wastePercentage: ((totalFoodListed - totalFoodCollected) / totalFoodListed * 100).toFixed(1),
      carbonSaved: (totalFoodCollected * 0.24).toFixed(1),
      waterSaved: Math.round(totalFoodCollected * 12.5),
      categoryBreakdown: [
        { category: 'Prepared Meals', quantity: Math.floor(totalFoodListed * 0.4) },
        { category: 'Fruits & Vegetables', quantity: Math.floor(totalFoodListed * 0.3) },
        { category: 'Bakery Items', quantity: Math.floor(totalFoodListed * 0.2) },
        { category: 'Beverages', quantity: Math.floor(totalFoodListed * 0.1) }
      ]
    };
  }

  /**
   * Generate mock data for recipients when no real data exists
   */
  generateMockRecipientData(recipientId, reportType) {
    const mockMultipliers = {
      daily: { meals: 1, bookings: 1 },
      weekly: { meals: 8, bookings: 6 },
      monthly: { meals: 25, bookings: 20 }
    };

    const multiplier = mockMultipliers[reportType] || mockMultipliers.weekly;
    const mealsSaved = Math.floor(Math.random() * multiplier.meals) + multiplier.meals;
    const totalBooked = Math.floor(Math.random() * multiplier.bookings) + multiplier.bookings;
    const totalCompleted = Math.floor(totalBooked * 0.8);

    return {
      mealsSaved, // Only completed/picked up meals
      carbonSaved: (mealsSaved * 0.24).toFixed(1),
      waterSaved: Math.round(mealsSaved * 12.5),
      wasteReduced: (mealsSaved * 0.16).toFixed(1),
      impactScore: Math.round(totalCompleted * 100 + mealsSaved * 10),
      totalBooked,
      totalCompleted,
      totalCancelled: totalBooked - totalCompleted,
      successRate: Math.round((totalCompleted / totalBooked) * 100),
      completedBookingsCount: totalCompleted,
      foodCategories: [
        { category: 'Prepared Meals', quantity: Math.floor(mealsSaved * 0.5) },
        { category: 'Fruits & Vegetables', quantity: Math.floor(mealsSaved * 0.3) },
        { category: 'Bakery Items', quantity: Math.floor(mealsSaved * 0.2) }
      ]
    };
  }

  /**
   * Aggregate provider analytics data for reports
   */
  async getProviderReportData(providerId, reportType = 'weekly') {
    await connectDB();
    
    const { start, end } = this.getDateRange(reportType);
    
    try {
      // Get provider profile - create mock if not found for testing
      let provider = await UserProfile.findOne({ userId: providerId });
      if (!provider) {
        console.log(`Provider ${providerId} not found in database. Creating mock provider for testing.`);
        provider = {
          userId: providerId,
          fullName: `Test Provider ${providerId.slice(-3)}`,
          email: `provider-${providerId.slice(-3)}@saveserve.com`,
          role: 'PROVIDER'
        };
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

      // Check if we have real data, otherwise use mock data
      const hasRealData = listings.length > 0 || bookings.length > 0;

      let metrics;
      if (hasRealData) {
        // Calculate real metrics
        const totalFoodListed = listings.reduce((sum, listing) => sum + (listing.quantity || 0), 0);
        const totalFoodCollected = bookings
          .filter(b => b.status === 'collected')
          .reduce((sum, booking) => sum + (booking.approvedQuantity || booking.requestedQuantity || 0), 0);

        const totalFoodWasted = totalFoodListed - totalFoodCollected;
        const wastePercentage = totalFoodListed > 0 ? (totalFoodWasted / totalFoodListed) * 100 : 0;

        // Environmental impact calculations
        const carbonSaved = totalFoodCollected * 0.24; // kg CO2 per meal
        const waterSaved = totalFoodCollected * 12.5; // liters per meal

        metrics = {
          totalFoodListed,
          totalFoodCollected,
          totalFoodWasted,
          wastePercentage: wastePercentage.toFixed(1),
          carbonSaved: carbonSaved.toFixed(1),
          waterSaved: Math.round(waterSaved),
          categoryBreakdown: this.calculateCategoryBreakdown(listings)
        };
      } else {
        // Use mock data for demonstration
        console.log(`No real data found for provider ${providerId} in ${reportType} period. Using mock data.`);
        metrics = this.generateMockProviderData(providerId, reportType);
      }

      // Trend data (daily breakdown) - always calculate, use mock if needed
      const trendData = hasRealData ?
        this.calculateTrendData(listings, bookings, start, end) :
        this.generateMockTrendData(reportType);

      // Recent listings efficiency - always calculate, use mock if needed
      const efficiencyData = hasRealData ?
        this.calculateEfficiencyData(listings, bookings) :
        this.generateMockEfficiencyData(reportType);

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
          totalFoodListed: metrics.totalFoodListed,
          totalFoodCollected: metrics.totalFoodCollected,
          totalFoodWasted: metrics.totalFoodWasted,
          wastePercentage: metrics.wastePercentage,
          carbonSaved: metrics.carbonSaved,
          waterSaved: metrics.waterSaved,
        },
        categoryBreakdown: metrics.categoryBreakdown,
        hasRealData,
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
      // Get recipient profile - create mock if not found for testing
      let recipient = await UserProfile.findOne({ userId: recipientId });
      if (!recipient) {
        console.log(`Recipient ${recipientId} not found in database. Creating mock recipient for testing.`);
        recipient = {
          userId: recipientId,
          fullName: `Test Recipient ${recipientId.slice(-3)}`,
          email: `recipient-${recipientId.slice(-3)}@saveserve.com`,
          role: 'RECIPIENT'
        };
      }

      // Get bookings in date range - ALL bookings for activity tracking
      const allBookings = await Booking.find({
        recipientId: recipientId, // Use recipientId, not userId
        createdAt: { $gte: start, $lte: end }
      }).lean();

      // Get ONLY completed/collected bookings for impact calculations
      const completedBookings = allBookings.filter(b =>
        b.status === 'collected' // Only 'collected' status exists in the model
      );

      console.log(`Recipient ${recipientId} ${reportType} bookings: ${allBookings.length} total, ${completedBookings.length} collected`);

      // Check if we have real data, otherwise use mock data
      const hasRealData = allBookings.length > 0;

      let metrics;
      if (hasRealData) {
        // Calculate activity metrics using ALL bookings
        const totalBooked = allBookings.length;
        const totalCompleted = completedBookings.length;
        const totalCancelled = allBookings.filter(b =>
          ['cancelled', 'rejected', 'expired'].includes(b.status)
        ).length;

        // Calculate impact metrics using ONLY completed bookings
        const totalItemsSaved = completedBookings.reduce((sum, booking) => {
          // Use approved quantity if available, otherwise requested quantity
          const quantity = booking.approvedQuantity || booking.requestedQuantity || 1;
          return sum + quantity;
        }, 0);

        // Environmental impact calculations (based on COMPLETED food only)
        const carbonSaved = totalItemsSaved * 0.24; // kg CO2 per meal
        const waterSaved = totalItemsSaved * 12.5; // liters per meal
        const wasteReduced = totalItemsSaved * 0.16; // kg waste per meal

        // Impact score calculation (based on completed actions)
        const impactScore = Math.round(totalCompleted * 100 + totalItemsSaved * 10);

        // Success rate (completed vs total booked)
        const successRate = totalBooked > 0 ? Math.round((totalCompleted / totalBooked) * 100) : 0;

        // Food categories from completed bookings
        const foodCategories = this.calculateRecipientFoodCategories(completedBookings);

        metrics = {
          mealsSaved: totalItemsSaved, // Only completed/picked up meals
          carbonSaved: carbonSaved.toFixed(1),
          waterSaved: Math.round(waterSaved),
          wasteReduced: wasteReduced.toFixed(1),
          impactScore,
          totalBooked, // All bookings for activity tracking
          totalCompleted, // Only completed bookings
          totalCancelled,
          successRate,
          foodCategories, // Categories of completed food
          completedBookingsCount: completedBookings.length
        };

        console.log(`Recipient ${recipientId} ${reportType} report: ${totalCompleted} completed out of ${totalBooked} total bookings, ${totalItemsSaved} meals actually saved`);
      } else {
        // Use mock data for demonstration
        console.log(`No real data found for recipient ${recipientId} in ${reportType} period. Using mock data.`);
        metrics = this.generateMockRecipientData(recipientId, reportType);
      }

      // Activity trend data - always calculate, use mock if needed
      const activityTrend = hasRealData ?
        this.calculateRecipientActivityTrend(allBookings, completedBookings, start, end) :
        this.generateMockActivityTrend(reportType);

      // Achievement progress - always calculate, use mock if needed
      const achievements = hasRealData ?
        this.calculateAchievements(metrics.mealsSaved, metrics.impactScore, metrics.totalBooked) :
        this.generateMockAchievements(reportType);

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
          mealsSaved: metrics.mealsSaved,
          carbonSaved: metrics.carbonSaved,
          waterSaved: metrics.waterSaved,
          wasteReduced: metrics.wasteReduced,
          impactScore: metrics.impactScore,
        },
        activity: {
          totalBooked: metrics.totalBooked,
          totalCompleted: metrics.totalCompleted,
          totalCancelled: metrics.totalCancelled,
          successRate: metrics.successRate,
          completedBookingsCount: metrics.completedBookingsCount || 0,
        },
        foodCategories: metrics.foodCategories || [],
        hasRealData,
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
  /**
   * Generate mock trend data for providers
   */
  generateMockTrendData(reportType) {
    const days = reportType === 'daily' ? 1 : reportType === 'weekly' ? 7 : 30;
    const trendData = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trendData.push({
        date: date.toISOString().split('T')[0],
        listed: Math.floor(Math.random() * 5) + 1,
        collected: Math.floor(Math.random() * 4) + 1,
        efficiency: Math.floor(Math.random() * 30) + 70
      });
    }

    return trendData.reverse();
  }

  /**
   * Generate mock efficiency data for providers
   */
  generateMockEfficiencyData(reportType) {
    return {
      averageEfficiency: Math.floor(Math.random() * 20) + 75,
      bestPerformingCategory: 'Prepared Meals',
      improvementSuggestions: [
        'List food items earlier in the day',
        'Improve food description accuracy',
        'Optimize pickup time windows'
      ]
    };
  }

  /**
   * Generate mock activity trend for recipients
   */
  generateMockActivityTrend(reportType) {
    const days = reportType === 'daily' ? 1 : reportType === 'weekly' ? 7 : 30;
    const activityData = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      activityData.push({
        date: date.toISOString().split('T')[0],
        bookings: Math.floor(Math.random() * 3) + 1,
        collections: Math.floor(Math.random() * 2) + 1,
        impact: Math.floor(Math.random() * 50) + 25
      });
    }

    return activityData.reverse();
  }

  /**
   * Generate mock achievements for recipients
   */
  generateMockAchievements(reportType) {
    return {
      badges: [
        { name: 'Food Saver', progress: 80, target: 100 },
        { name: 'Eco Warrior', progress: 60, target: 100 },
        { name: 'Community Helper', progress: 45, target: 100 }
      ],
      milestones: [
        { name: '10 Meals Saved', achieved: true },
        { name: '50 Meals Saved', achieved: false, progress: 60 },
        { name: '100 Meals Saved', achieved: false, progress: 25 }
      ]
    };
  }

  /**
   * Calculate food categories from completed bookings
   */
  calculateRecipientFoodCategories(completedBookings) {
    const categories = {};

    completedBookings.forEach(booking => {
      // You might need to populate listing data to get category
      // For now, we'll use a default categorization
      const category = booking.category || booking.listingCategory || 'Mixed Food';
      const quantity = booking.approvedQuantity || booking.requestedQuantity || 1;

      categories[category] = (categories[category] || 0) + quantity;
    });

    // Convert to array format
    return Object.entries(categories).map(([category, quantity]) => ({
      category,
      quantity,
      percentage: 0 // Will be calculated if needed
    }));
  }

  /**
   * Calculate recipient activity trend with completed vs total bookings
   */
  calculateRecipientActivityTrend(allBookings, completedBookings, start, end) {
    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    const trendData = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Count bookings for this day
      const dayBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt).toISOString().split('T')[0];
        return bookingDate === dateStr;
      });

      // Count completed bookings for this day
      const dayCompleted = completedBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt).toISOString().split('T')[0];
        return bookingDate === dateStr;
      });

      const totalQuantity = dayCompleted.reduce((sum, booking) =>
        sum + (booking.approvedQuantity || booking.requestedQuantity || 1), 0
      );

      trendData.push({
        date: dateStr,
        totalBookings: dayBookings.length,
        completedBookings: dayCompleted.length,
        mealsCollected: totalQuantity,
        successRate: dayBookings.length > 0 ? Math.round((dayCompleted.length / dayBookings.length) * 100) : 0
      });
    }

    return trendData;
  }
}

// Export singleton instance
const reportDataService = new ReportDataService();
export default reportDataService;
