// lib/notificationService.js
import admin from './firebaseAdmin';
import { connectDB } from './db';
import UserProfile from '@/models/UserProfile';

/**
 * Send notification to a specific user by their userId
 * @param {string} userId - User's Clerk ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional additional data
 * @returns {Promise<Object>} Result object with success status
 */
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    await connectDB();

    // Find user by userId (Clerk ID)
    const user = await UserProfile.findOne({ userId }).lean();
    
    if (!user || !user.fcmToken) {
      console.warn(`User ${userId} not found or has no FCM token`);
      return {
        success: false,
        error: 'User not found or no FCM token available'
      };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        userId,
        timestamp: new Date().toISOString(),
      },
      token: user.fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification to user:', userId, response);

    return {
      success: true,
      messageId: response,
      sentTo: user.fullName || userId
    };

  } catch (error) {
    console.error('Error sending notification to user:', error);
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      
      // Remove invalid token from database
      try {
        await UserProfile.findOneAndUpdate(
          { userId },
          { $unset: { fcmToken: 1 } }
        );
        console.log(`Removed invalid FCM token for user ${userId}`);
      } catch (updateError) {
        console.error('Error removing invalid token:', updateError);
      }
    }

    return {
      success: false,
      error: error.message || 'Failed to send notification'
    };
  }
};

/**
 * Send notification to all recipients in a specific area
 * @param {string} area - Geographic area/location
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional additional data
 * @returns {Promise<Object>} Result object with success status and stats
 */
export const sendNotificationToArea = async (area, title, body, data = {}) => {
  try {
    await connectDB();

    // Find all recipients in the area with FCM tokens
    const users = await UserProfile.find({
      area: { $regex: area, $options: 'i' }, // Case-insensitive area matching
      role: 'recipient',
      fcmToken: { $exists: true, $ne: null, $ne: '' }
    }).lean();

    if (users.length === 0) {
      console.warn(`No recipients with FCM tokens found in area: ${area}`);
      return {
        success: true,
        sentCount: 0,
        totalFound: 0,
        message: 'No recipients found in area'
      };
    }

    const tokens = users.map(user => user.fcmToken);
    
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        area,
        timestamp: new Date().toISOString(),
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} notifications to area ${area}`);
    console.log(`Failed to send ${response.failureCount} notifications`);

    // Handle failed tokens (remove invalid ones)
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((result, index) => {
        if (!result.success && 
            (result.error.code === 'messaging/invalid-registration-token' ||
             result.error.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(tokens[index]);
        }
      });

      if (invalidTokens.length > 0) {
        await UserProfile.updateMany(
          { fcmToken: { $in: invalidTokens } },
          { $unset: { fcmToken: 1 } }
        );
        console.log(`Removed ${invalidTokens.length} invalid FCM tokens`);
      }
    }

    return {
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      totalFound: users.length,
      area
    };

  } catch (error) {
    console.error('Error sending notification to area:', error);
    return {
      success: false,
      error: error.message || 'Failed to send area notification'
    };
  }
};

/**
 * Send notification to multiple specific users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional additional data
 * @returns {Promise<Object>} Result object with success status and stats
 */
export const sendNotificationToUsers = async (userIds, title, body, data = {}) => {
  try {
    await connectDB();

    const users = await UserProfile.find({
      userId: { $in: userIds },
      fcmToken: { $exists: true, $ne: null, $ne: '' }
    }).lean();

    if (users.length === 0) {
      return {
        success: true,
        sentCount: 0,
        totalFound: 0,
        message: 'No users with FCM tokens found'
      };
    }

    const tokens = users.map(user => user.fcmToken);
    
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} notifications to users`);

    // Handle failed tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((result, index) => {
        if (!result.success && 
            (result.error.code === 'messaging/invalid-registration-token' ||
             result.error.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(tokens[index]);
        }
      });

      if (invalidTokens.length > 0) {
        await UserProfile.updateMany(
          { fcmToken: { $in: invalidTokens } },
          { $unset: { fcmToken: 1 } }
        );
        console.log(`Removed ${invalidTokens.length} invalid FCM tokens`);
      }
    }

    return {
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      totalFound: users.length
    };

  } catch (error) {
    console.error('Error sending notification to users:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notifications'
    };
  }
};