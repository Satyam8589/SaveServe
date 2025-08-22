// lib/sendSSENotification.js - Updated to use MongoDB ObjectIds
// ==========================================
import { createMongoNotification } from './mongoNotificationService';

export const sendSSENotification = async (userId, notification) => {
  try {
    console.log(`
--- SSE SEND ATTEMPT ---`);
    console.log(`[${new Date().toISOString()}]`);
    console.log(`- Target User ID: ${userId}`);
    console.log(`- Notification Title: ${notification.title}`);

    if (!global.sseConnections) {
      console.error(`- ❌ CRITICAL: global.sseConnections object does not exist!`);
      console.log(`--- END SSE SEND ATTEMPT ---
`);
      return false;
    }

    const connectionKeys = Array.from(global.sseConnections.keys());
    console.log(`- 맵에 연결된 사용자 ID/Connections in map: [${connectionKeys.join(', ') || 'None'}]`);
    console.log(`- 전체 연결 수/Total connections: ${global.sseConnections.size}`);

    const controller = global.sseConnections.get(userId);

    if (!controller) {
      console.error(`- ❌ FAILED: No active SSE connection found for user: ${userId}`);
      console.log(`--- END SSE SEND ATTEMPT ---
`);
      return false;
    }

    console.log(`- ✅ SUCCESS: Found active SSE connection for user: ${userId}`);

    // First, create the notification in MongoDB to get a proper ObjectId
    const mongoResult = await createMongoNotification(
      userId,
      notification.title,
      notification.message,
      notification.type || 'general',
      notification.data || {}
    );

    if (!mongoResult.success) {
      console.error('- ❌ FAILED: Could not create MongoDB notification for SSE:', mongoResult.error);
      console.log(`--- END SSE SEND ATTEMPT ---
`);
      return false;
    }

    const notificationData = {
      id: mongoResult.notification._id.toString(),
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'general',
      data: notification.data || {},
      timestamp: new Date().toISOString(),
      read: false
    };

    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(notificationData)}

`;
    
    try {
      controller.enqueue(encoder.encode(data));
      console.log(`- 📤 SENT: SSE data enqueued for user: ${userId}`);
      console.log(`--- END SSE SEND ATTEMPT ---
`);
      return true;
    } catch (error) {
      console.error(`- 💔 FAILED: Could not enqueue data. Connection likely closed. Error: ${error.message}`);
      // Connection is broken, remove it from the map
      global.sseConnections.delete(userId);
      console.log(`- 🗑️ REMOVED: Broken connection for user ${userId} from map.`);
      console.log(`--- END SSE SEND ATTEMPT ---
`);
      return false;
    }
  } catch (error) {
    console.error(`- 🚨 UNEXPECTED ERROR in sendSSENotification: ${error.message}`);
    console.log(`--- END SSE SEND ATTEMPT ---
`);
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
