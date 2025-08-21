// 2. lib/sendSSENotification.js (Updated)
// ==========================================
export const sendSSENotification = (userId, notification) => {
  try {
    if (!global.sseConnections) {
      console.log('📭 No SSE connections initialized');
      return false;
    }

    const controller = global.sseConnections.get(userId);
    
    if (!controller) {
      console.log(`📭 No SSE connection found for user: ${userId}`);
      console.log(`📊 Available connections: ${Array.from(global.sseConnections.keys()).join(', ')}`);
      return false;
    }

    const notificationData = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'reminder',
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