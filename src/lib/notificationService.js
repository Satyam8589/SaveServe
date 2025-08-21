// lib/notificationService.js
// Updated to use direct FCM API instead of Firebase Admin SDK
import { connectDB } from './db';
import UserProfile from '@/models/UserProfile';

// FCM Server Key - you'll need to get this from Firebase Console
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

/**
 * Send FCM notification using direct HTTP API
 * @param {string|string[]} tokens - FCM token(s)
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload
 */
async function sendFCMNotification(tokens, notification, data = {}) {
  if (!FCM_SERVER_KEY) {
    console.warn('⚠️ FCM_SERVER_KEY not configured, skipping FCM notification');
    return { success: false, error: 'FCM not configured' };
  }

  try {
    const isMultiple = Array.isArray(tokens);
    const payload = {
      notification,
      data,
      ...(isMultiple
        ? { registration_ids: tokens }
        : { to: tokens }
      )
    };

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`FCM API error: ${result.error || response.statusText}`);
    }

    return {
      success: true,
      result,
      successCount: result.success || (result.results?.filter(r => r.message_id).length || 0),
      failureCount: result.failure || (result.results?.filter(r => r.error).length || 0),
    };
  } catch (error) {
    console.error('❌ FCM API error:', error);
    return {
      success: false,
      error: error.message,
      successCount: 0,
      failureCount: isMultiple ? tokens.length : 1,
    };
  }
}

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

    const notification = {
      title,
      body,
    };

    const fcmData = {
      ...data,
      userId,
      timestamp: new Date().toISOString(),
    };

    const response = await sendFCMNotification(user.fcmToken, notification, fcmData);
    console.log('Successfully sent notification to user:', userId, response);

    return {
      success: response.success,
      messageId: response.result?.message_id || response.result,
      sentTo: user.fullName || userId,
      fcmResult: response.result
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
 * Send notification to all users with a specific role
 * @param {string} role - User role ('provider' or 'recipient')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional additional data
 * @returns {Promise<Object>} Result object with success status and stats
 */
export const sendNotificationToRole = async (role, title, body, data = {}) => {
  try {
    await connectDB();

    // Find all users with the specified role and FCM tokens
    const users = await UserProfile.find({
      role: role,
      fcmToken: { $exists: true, $ne: null, $ne: '' },
      isActive: true
    }).lean();

    if (users.length === 0) {
      console.warn(`No ${role}s with FCM tokens found`);
      return {
        success: true,
        sentCount: 0,
        totalFound: 0,
        message: `No ${role}s found with FCM tokens`
      };
    }

    const tokens = users.map(user => user.fcmToken);

    const notification = {
      title,
      body,
    };

    const fcmData = {
      ...data,
      role,
      timestamp: new Date().toISOString(),
    };

    const response = await sendFCMNotification(tokens, notification, fcmData);
    
    console.log(`Successfully sent ${response.successCount} notifications to ${role}s`);
    console.log(`Failed to send ${response.failureCount} notifications`);

    // Handle failed tokens (remove invalid ones)
    if (response.failureCount > 0 && response.result?.results) {
      const invalidTokens = [];
      response.result.results.forEach((result, index) => {
        if (result.error &&
            (result.error.includes('InvalidRegistration') ||
             result.error.includes('NotRegistered'))) {
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
      success: response.success,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      totalFound: users.length,
      role
    };

  } catch (error) {
    console.error(`Error sending notification to ${role}s:`, error);
    return {
      success: false,
      error: error.message || `Failed to send ${role} notifications`
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

    const notification = {
      title,
      body,
    };

    const fcmData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    const response = await sendFCMNotification(tokens, notification, fcmData);
    
    console.log(`Successfully sent ${response.successCount} notifications to users`);

    // Handle failed tokens
    if (response.failureCount > 0 && response.result?.results) {
      const invalidTokens = [];
      response.result.results.forEach((result, index) => {
        if (result.error &&
            (result.error.includes('InvalidRegistration') ||
             result.error.includes('NotRegistered'))) {
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
      success: response.success,
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