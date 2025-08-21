// lib/mongoNotificationService.js
// MongoDB-based notification service to replace Firestore
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { sendNotificationToUser, sendNotificationToRole } from "@/lib/notificationService";

// Notification types enum
export const NOTIFICATION_TYPES = {
  NEW_LISTING: "new_listing",
  LISTING_CREATED_CONFIRMATION: "listing_created_confirmation", 
  BOOKING_CONFIRMED: "booking_confirmed",
  NEW_BOOKING: "new_booking",
  COLLECTION_CONFIRMED: "collection_confirmed",
  COLLECTION_COMPLETED_CONFIRMATION: "collection_completed_confirmation",
  GENERAL: "general",
  NEW_FOOD: "new-food",
  SUCCESS: "success",
  EXPIRING_SOON: "expiring-soon",
  REMINDER: "reminder",
  EXPIRED: "expired",
  REPORT: "report",
  CONNECTION: "connection",
};

/**
 * Create a notification document in MongoDB
 * @param {string} userId - The user ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} type - Notification type
 * @param {object} metadata - Additional metadata
 */
export async function createMongoNotification(
  userId,
  title,
  body,
  type,
  metadata = {}
) {
  try {
    console.log(`📝 Creating MongoDB notification for user ${userId}`);
    
    await connectDB();

    const notificationData = {
      userId,
      title,
      message: body, // Map body to message field
      type,
      read: false,
      readAt: null,
      createdAt: new Date(),
      // Extract specific fields from metadata
      listingId: metadata.listingId || metadata.foodId || null,
      bookingId: metadata.bookingId || null,
      providerId: metadata.providerId || null,
      foodId: metadata.foodId || null,
      // Store remaining metadata
      metadata: {
        ...metadata,
        // Remove fields that have dedicated schema fields
        listingId: undefined,
        bookingId: undefined,
        providerId: undefined,
        foodId: undefined,
      },
    };

    // Clean up undefined values from metadata
    Object.keys(notificationData.metadata).forEach(key => {
      if (notificationData.metadata[key] === undefined) {
        delete notificationData.metadata[key];
      }
    });

    const notification = new Notification(notificationData);
    await notification.save();

    console.log(`✅ MongoDB notification created: ${notification._id}`);

    return {
      success: true,
      notificationId: notification._id.toString(),
      data: notificationData,
    };
  } catch (error) {
    console.error("❌ MongoDB notification failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create notifications for multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} type - Notification type
 * @param {object} metadata - Additional metadata
 */
export async function createBulkMongoNotifications(
  userIds,
  title,
  body,
  type,
  metadata = {}
) {
  try {
    console.log(`📝 Creating bulk MongoDB notifications for ${userIds.length} users`);
    
    await connectDB();

    const notifications = userIds.map(userId => ({
      userId,
      title,
      message: body,
      type,
      read: false,
      readAt: null,
      createdAt: new Date(),
      listingId: metadata.listingId || metadata.foodId || null,
      bookingId: metadata.bookingId || null,
      providerId: metadata.providerId || null,
      foodId: metadata.foodId || null,
      metadata: {
        ...metadata,
        listingId: undefined,
        bookingId: undefined,
        providerId: undefined,
        foodId: undefined,
      },
    }));

    // Clean up undefined values from metadata for each notification
    notifications.forEach(notification => {
      Object.keys(notification.metadata).forEach(key => {
        if (notification.metadata[key] === undefined) {
          delete notification.metadata[key];
        }
      });
    });

    const result = await Notification.insertMany(notifications);

    console.log(`✅ Created ${result.length} MongoDB notifications`);

    return {
      success: true,
      results: result.map(notification => ({
        userId: notification.userId,
        notificationId: notification._id.toString(),
      })),
      count: result.length,
    };
  } catch (error) {
    console.error("❌ Bulk MongoDB notification failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark a notification as read
 * @param {string} userId - The user ID
 * @param {string} notificationId - The notification ID
 */
export async function markNotificationAsRead(userId, notificationId) {
  try {
    await connectDB();

    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!result) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    console.log(
      `✅ Notification ${notificationId} marked as read for user ${userId}`
    );

    return { success: true };
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    await connectDB();

    const result = await Notification.updateMany(
      { userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    console.log(
      `✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`
    );

    return { 
      success: true, 
      count: result.modifiedCount 
    };
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get notifications for a user with pagination
 * @param {string} userId - The user ID
 * @param {object} options - Query options
 */
export async function getUserNotifications(userId, options = {}) {
  try {
    const {
      limit = 50,
      skip = 0,
      filterUnread = false,
      sortBy = 'createdAt',
      sortOrder = -1
    } = options;

    await connectDB();

    const query = { userId };
    if (filterUnread) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip(skip)
      .populate('listingId', 'title description')
      .populate('bookingId', 'status')
      .lean();

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return {
      success: true,
      notifications,
      totalCount,
      unreadCount,
      hasMore: skip + notifications.length < totalCount,
    };
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return {
      success: false,
      error: error.message,
      notifications: [],
      totalCount: 0,
      unreadCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Enhanced notification service that combines FCM and MongoDB
 * This replaces the Firestore-based notification system
 */
export async function sendCompleteNotification(
  userId,
  title,
  body,
  fcmData = {},
  mongoMetadata = {}
) {
  const results = {
    fcm: { success: false },
    mongo: { success: false },
  };

  // Send FCM notification using existing service
  try {
    results.fcm = await sendNotificationToUser(userId, title, body, fcmData);
    console.log("📱 FCM notification result:", results.fcm);
  } catch (error) {
    console.error("❌ FCM notification failed:", error);
    results.fcm = { success: false, error: error.message };
  }

  // Create MongoDB notification
  try {
    results.mongo = await createMongoNotification(
      userId,
      title,
      body,
      fcmData.action || "general",
      {
        ...mongoMetadata,
        ...fcmData, // Include FCM data as metadata
      }
    );
    console.log("🔔 MongoDB notification result:", results.mongo);
  } catch (error) {
    console.error("❌ MongoDB notification failed:", error);
    results.mongo = { success: false, error: error.message };
  }

  return {
    success: results.fcm.success || results.mongo.success, // Success if either works
    fcm: results.fcm,
    mongo: results.mongo,
  };
}

/**
 * Send notifications to multiple users by role
 * @param {string} role - User role to send to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} fcmData - FCM data
 * @param {object} mongoMetadata - MongoDB metadata
 */
export async function sendCompleteNotificationToRole(
  role,
  title,
  body,
  fcmData = {},
  mongoMetadata = {}
) {
  const results = {
    fcm: { success: false },
    mongo: { success: false },
  };

  // Send FCM notification to role
  try {
    results.fcm = await sendNotificationToRole(role, title, body, fcmData);
    console.log("📱 FCM role notification result:", results.fcm);
  } catch (error) {
    console.error("❌ FCM role notification failed:", error);
    results.fcm = { success: false, error: error.message };
  }

  // Create MongoDB notifications for all users with this role
  try {
    await connectDB();
    const UserProfile = (await import("@/models/UserProfile")).default;
    
    // Find all users with the specified role
    const users = await UserProfile.find({ 
      mainrole: role.toLowerCase() 
    }).select('userId').lean();
    
    const userIds = users.map(user => user.userId);
    
    if (userIds.length > 0) {
      results.mongo = await createBulkMongoNotifications(
        userIds,
        title,
        body,
        fcmData.action || "general",
        {
          ...mongoMetadata,
          ...fcmData,
        }
      );
    } else {
      results.mongo = { success: true, count: 0, message: `No users found with role ${role}` };
    }
    
    console.log("🔔 MongoDB role notification result:", results.mongo);
  } catch (error) {
    console.error("❌ MongoDB role notification failed:", error);
    results.mongo = { success: false, error: error.message };
  }

  return {
    success: results.fcm.success || results.mongo.success,
    fcm: results.fcm,
    mongo: results.mongo,
  };
}
