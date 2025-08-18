// lib/firestoreNotificationService.js (Fixed FieldValue import)
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_LISTING: 'new_listing',
  LISTING_CREATED_CONFIRMATION: 'listing_created_confirmation',
  BOOKING_CONFIRMED: 'booking_confirmed',
  NEW_BOOKING: 'new_booking',
  COLLECTION_CONFIRMED: 'collection_confirmed',
  COLLECTION_COMPLETED_CONFIRMATION: 'collection_completed_confirmation'
};

/**
 * Create a notification document in Firestore
 * @param {string} userId - The user ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} type - Notification type
 * @param {object} metadata - Additional metadata
 */
export async function createFirestoreNotification(userId, title, body, type, metadata = {}) {
  try {
    console.log(`📝 Creating Firestore notification for user ${userId}`);
    
    const notificationRef = db.collection('notifications').doc(userId).collection('notifications').doc();
    
    const notificationData = {
      title,
      body,
      type,
      ...metadata, // listingId, bookingId, providerId, etc.
      createdAt: FieldValue.serverTimestamp(), // ✅ Fixed: Use FieldValue directly
      read: false,
      readAt: null
    };

    await notificationRef.set(notificationData);
    
    console.log(`✅ Firestore notification created: ${notificationRef.id}`);
    
    return {
      success: true,
      notificationId: notificationRef.id,
      data: notificationData
    };
  } catch (error) {
    console.error('❌ Firestore notification failed:', error);
    return {
      success: false,
      error: error.message
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
export async function createFirestoreNotificationForMultipleUsers(userIds, title, body, type, metadata = {}) {
  try {
    console.log(`📝 Creating Firestore notifications for ${userIds.length} users`);
    
    const batch = db.batch();
    const results = [];

    for (const userId of userIds) {
      const notificationRef = db.collection('notifications').doc(userId).collection('notifications').doc();
      
      const notificationData = {
        title,
        body,
        type,
        ...metadata,
        createdAt: FieldValue.serverTimestamp(), // ✅ Fixed: Use FieldValue directly
        read: false,
        readAt: null
      };

      batch.set(notificationRef, notificationData);
      results.push({
        userId,
        notificationId: notificationRef.id
      });
    }

    await batch.commit();
    
    console.log(`✅ Created ${results.length} Firestore notifications`);
    
    return {
      success: true,
      results,
      count: results.length
    };
  } catch (error) {
    console.error('❌ Error creating multiple Firestore notifications:', error);
    return {
      success: false,
      error: error.message,
      count: 0
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
    const notificationRef = db.collection('notifications')
      .doc(userId)
      .collection('notifications')
      .doc(notificationId);

    await notificationRef.update({
      read: true,
      readAt: FieldValue.serverTimestamp() // ✅ Fixed: Use FieldValue directly
    });

    console.log(`✅ Notification ${notificationId} marked as read for user ${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const notificationsRef = db.collection('notifications')
      .doc(userId)
      .collection('notifications')
      .where('read', '==', false);

    const unreadNotifications = await notificationsRef.get();
    
    if (unreadNotifications.empty) {
      return { success: true, count: 0 };
    }

    const batch = db.batch();
    
    unreadNotifications.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: FieldValue.serverTimestamp() // ✅ Fixed: Use FieldValue directly
      });
    });

    await batch.commit();
    
    console.log(`✅ Marked ${unreadNotifications.size} notifications as read for user ${userId}`);
    
    return { 
      success: true, 
      count: unreadNotifications.size 
    };
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enhanced notification service that combines FCM and Firestore
 * This integrates with your existing notificationService.js
 */
export async function sendCompleteNotification(userId, title, body, fcmData = {}, firestoreMetadata = {}) {
  const results = {
    fcm: { success: false },
    firestore: { success: false }
  };

  // Send FCM notification using your existing service
  try {
    const { sendNotificationToUser } = await import('./notificationService');
    results.fcm = await sendNotificationToUser(userId, title, body, fcmData);
    console.log('📱 FCM notification result:', results.fcm);
  } catch (error) {
    console.error('❌ FCM notification failed:', error);
    results.fcm = { success: false, error: error.message };
  }

  // Create Firestore notification
  try {
    results.firestore = await createFirestoreNotification(
      userId, 
      title, 
      body, 
      fcmData.action || 'general',
      {
        ...firestoreMetadata,
        ...fcmData // Include FCM data as metadata
      }
    );
    console.log('🔔 Firestore notification result:', results.firestore);
  } catch (error) {
    console.error('❌ Firestore notification failed:', error);
    results.firestore = { success: false, error: error.message };
  }

  return {
    success: results.fcm.success || results.firestore.success, // Success if either works
    fcm: results.fcm,
    firestore: results.firestore
  };
}

/**
 * Enhanced notification service for role-based notifications
 * For role notifications, we only use FCM (since we'd need to get all user IDs for Firestore)
 */
export async function sendCompleteNotificationToRole(role, title, body, fcmData = {}) {
  try {
    const { sendNotificationToRole } = await import('./notificationService');
    const fcmResult = await sendNotificationToRole(role, title, body, fcmData);
    
    console.log('📱 FCM role notification result:', fcmResult);
    
    // For role-based notifications, we primarily use FCM
    // Individual notifications (booking confirmations, etc.) will use both FCM + Firestore
    
    return {
      success: fcmResult.success,
      fcm: fcmResult,
      firestore: { 
        success: true, 
        message: 'Role notifications use FCM only. Individual notifications will use both FCM and Firestore.' 
      }
    };
  } catch (error) {
    console.error('❌ Role notification failed:', error);
    return {
      success: false,
      fcm: { success: false, error: error.message },
      firestore: { success: false, error: 'Skipped for role notifications' }
    };
  }
};