// lib/sendSSENotification.js - Updated to use MongoDB ObjectIds
// ==========================================
import { createMongoNotification } from './mongoNotificationService';

export const sendSSENotification = async (userId, notification) => {
  try {
    console.log(`🔍 Attempting to send SSE notification to user: ${userId}`);
    console.log(`📋 Notification title: ${notification.title}`);

    if (!global.sseConnections) {
      console.log('📭 No SSE connections initialized');
      return false;
    }

    console.log(`📊 Total SSE connections: ${global.sseConnections.size}`);
    console.log(`📋 Available user IDs: ${Array.from(global.sseConnections.keys()).join(', ')}`);

    const controller = global.sseConnections.get(userId);

    if (!controller) {
      console.log(`📭 No SSE connection found for user: ${userId}`);
      console.log(`❌ User ${userId} is not in the connections map`);
      return false;
    }

    console.log(`✅ Found SSE connection for user: ${userId}`);

    // First, create the notification in MongoDB to get a proper ObjectId
    const mongoResult = await createMongoNotification(
      userId,
      notification.title,
      notification.message,
      notification.type || 'general',
      notification.data || {}
    );

    if (!mongoResult.success) {
      console.error('❌ Failed to create MongoDB notification for SSE:', mongoResult.error);
      return false;
    }

    // Use the MongoDB ObjectId for the SSE notification
    const notificationData = {
      id: mongoResult.notification._id.toString(), // Use MongoDB ObjectId instead of custom string
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'general',
      data: notification.data || {},
      timestamp: new Date().toISOString(),
      read: false
    };

    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(notificationData)}\n\n`;
    
    try {
      controller.enqueue(encoder.encode(data));
      console.log(`📤 SSE notification sent to user: ${userId}`);
      console.log(`📋 Notification: ${notification.title}`);
      return true;
    } catch (error) {
      console.log(`💔 Failed to send SSE notification to user ${userId}:`, error.message);
      // Connection closed, remove from map
      global.sseConnections.delete(userId);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send SSE notification:', error);
    return false;
  }
};

// Send notification to multiple users by role (for recipients)
export const sendSSENotificationToRole = async (role, notification) => {
  if (!global.sseConnections) {
    console.log('📭 No SSE connections initialized for role notification');
    return { sent: 0, failed: 0 };
  }

  // In a real app, you'd query your database to get user IDs by role
  // For now, we'll send to all connected users (you should implement proper role filtering)
  
  let sent = 0;
  let failed = 0;

  for (const [userId, controller] of global.sseConnections.entries()) {
    const success = sendSSENotification(userId, {
      ...notification,
      data: {
        ...notification.data,
        targetRole: role
      }
    });
    
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  console.log(`📢 Role notification sent to ${sent} users, ${failed} failed`);
  return { sent, failed };
};