'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useNotifications } from '@/hooks/useNotifications';
import useSSENotifications from '@/hooks/useSSENotifications';
import { Button } from '@/components/ui/button';

export default function TestNotificationsPage() {
  const { user } = useUser();
  const [testResult, setTestResult] = useState('');

  // Test both notification systems
  const mongoNotifications = useNotifications({
    limit: 10,
    enableRealtime: true,
  });

  const sseNotifications = useSSENotifications();

  const createTestNotification = async () => {
    if (!user?.id) {
      setTestResult('❌ User not logged in');
      return;
    }

    try {
      setTestResult('🔄 Creating test notification...');
      
      const response = await fetch('/api/notification/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: 'Test Notification',
          message: `Test notification created at ${new Date().toLocaleTimeString()}`,
          type: 'general',
          data: { test: true }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult('✅ Test notification created successfully! Check if it appears in real-time.');
      } else {
        setTestResult(`❌ Failed to create notification: ${result.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  const triggerSSENotification = async () => {
    if (!user?.id) {
      setTestResult('❌ User not logged in');
      return;
    }

    try {
      setTestResult('🔄 Triggering direct SSE notification...');

      // Call a direct SSE test endpoint
      const response = await fetch('/api/test-sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: 'Direct SSE Test',
          message: `Direct SSE test notification sent at ${new Date().toLocaleTimeString()}`,
          type: 'test'
        })
      });

      const result = await response.json();

      if (result.success) {
        setTestResult('✅ Direct SSE notification sent! Check if it appears in real-time.');
      } else {
        setTestResult(`❌ Failed to send SSE notification: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Test Notifications</h1>
          <p>Please log in to test notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Notifications</h1>
        
        {/* Connection Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>

          {/* MongoDB Notifications Hook */}
          <div className="mb-4 p-4 bg-gray-700 rounded">
            <h3 className="font-semibold text-blue-400 mb-2">MongoDB Hook (useNotifications)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${mongoNotifications.isSSEConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span>SSE: {mongoNotifications.isSSEConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {mongoNotifications.sseError && (
                <div className="text-red-400">Error: {mongoNotifications.sseError}</div>
              )}
              <div>Loading: {mongoNotifications.isLoading ? 'Yes' : 'No'}</div>
              <div>Unread: {mongoNotifications.unreadCount}</div>
              <div>Total: {mongoNotifications.notifications.length}</div>
            </div>
          </div>

          {/* SSE Notifications Hook */}
          <div className="p-4 bg-gray-700 rounded">
            <h3 className="font-semibold text-green-400 mb-2">SSE Hook (useSSENotifications)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${sseNotifications.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span>SSE: {sseNotifications.isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {sseNotifications.connectionError && (
                <div className="text-red-400">Error: {sseNotifications.connectionError}</div>
              )}
              <div>Unread: {sseNotifications.unreadCount}</div>
              <div>Total: {sseNotifications.notifications.length}</div>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <Button onClick={createTestNotification} className="mr-4">
              Create Test Notification (Direct DB)
            </Button>
            <Button onClick={triggerSSENotification} className="mr-4">
              Test Direct SSE Notification
            </Button>
            <Button onClick={mongoNotifications.refetch} variant="outline">
              Refresh MongoDB Notifications
            </Button>
            <Button onClick={sseNotifications.reconnect} variant="outline" className="ml-2">
              Reconnect SSE
            </Button>
          </div>
          {testResult && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <pre className="text-sm">{testResult}</pre>
            </div>
          )}
        </div>

        {/* Notifications Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MongoDB Notifications */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">MongoDB Notifications</h2>
            {mongoNotifications.notifications.length === 0 ? (
              <p className="text-gray-400">No MongoDB notifications found.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mongoNotifications.notifications.slice(0, 5).map((notification, index) => (
                  <div key={notification.id || index} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        <p className="text-gray-300 text-xs">{notification.message}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        notification.read ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-white'
                      }`}>
                        {notification.read ? 'Read' : 'Unread'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SSE Notifications */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">SSE Notifications</h2>
            {sseNotifications.notifications.length === 0 ? (
              <p className="text-gray-400">No SSE notifications found.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sseNotifications.notifications.slice(0, 5).map((notification, index) => (
                  <div key={notification.id || index} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        <p className="text-gray-300 text-xs">{notification.message}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        notification.read ? 'bg-gray-600 text-gray-300' : 'bg-green-600 text-white'
                      }`}>
                        {notification.read ? 'Read' : 'Unread'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
