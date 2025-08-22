// app/notifications/page.jsx (Updated to use MongoDB)
"use client";

import { useUser } from "@clerk/nextjs";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationList from './components/NotificationList';
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from 'react';

export default function NotificationsPage() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');

  const {
    notifications,
    unreadCount,
    hasUnread,
    isLoading: isNotificationsLoading,
    isConnected,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead,
    isMarkingAllAsRead,
    markAsReadError,
    markAllAsReadError,
  } = useNotifications({
    limit: 50,
    enableRealtime: true, // Enable real-time SSE notifications
  });

  // Manual retry function
  const handleRetry = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Manual retry failed:', error);
    }
  };


  // Show Clerk loading state
  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading application...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated with Clerk
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sign In Required
              </h2>
              <p className="text-gray-600">
                Please sign in to view your notifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isNotificationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // General error state
  if (notificationsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to load notifications
              </h2>
              <p className="text-gray-600 mb-4">
                {notificationsError.message || "Something went wrong while loading your notifications."}
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success! Show notifications
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Connection lost. Notifications may not update automatically.
              </span>
              <button
                onClick={handleRetry}
                className="ml-auto text-xs text-yellow-700 hover:text-yellow-900 underline"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {/* Debug panel (development only) */}
        {showDebug && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-green-800">
                <strong>✅ Successfully Connected!</strong><br/>
                User: {user?.id} | Notifications: {notifications.length}
              </div>
              <button
                onClick={() => setShowDebug(false)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Error alerts */}
        {(markAsReadError || markAllAsReadError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                {markAsReadError?.message || markAllAsReadError?.message || "Failed to update notification"}
              </span>
            </div>
          </div>
        )}

        {/* Main content */}
        <NotificationList
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          isMarkingAsRead={isMarkingAsRead}
          isMarkingAllAsRead={isMarkingAllAsRead}
        />
      </div>
    </div>
  );
}