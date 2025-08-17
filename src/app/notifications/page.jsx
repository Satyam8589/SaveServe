// app/notifications/page.jsx (FIXED - Corrected signInToFirebase usage)
"use client";

import { useUser } from "@clerk/nextjs";
import { useFirebaseAuth } from "@/components/FirebaseAuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationList from './components/NotificationList';
import { Loader2, AlertCircle, RefreshCw, Shield, Link, User } from "lucide-react";
import { useState, useEffect } from 'react';

export default function NotificationsPage() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { 
    firebaseUser, 
    isFirebaseAuthenticated, 
    isLoading: isAuthLoading, 
    error: authError, 
    signInToFirebase  // ✅ This function exists in FirebaseAuthProvider
  } = useFirebaseAuth();
  
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced authentication status tracking
  useEffect(() => {
    setDebugInfo({
      clerkLoaded: isClerkLoaded,
      clerkUser: !!user,
      clerkUserId: user?.id,
      firebaseUser: !!firebaseUser,
      firebaseUid: firebaseUser?.uid,
      isFirebaseAuthenticated,
      isAuthLoading,
      authError: authError?.code || authError?.message,
      retryCount
    });
  }, [isClerkLoaded, user, firebaseUser, isFirebaseAuthenticated, isAuthLoading, authError, retryCount]);

  // Auto-retry Firebase authentication if Clerk is ready but Firebase isn't
  useEffect(() => {
    if (isClerkLoaded && user && !isAuthLoading && !firebaseUser && !authError && retryCount < 3) {
      console.log('🔄 Auto-retrying Firebase authentication...');
      const timer = setTimeout(async () => {
        try {
          setRetryCount(prev => prev + 1);
          await signInToFirebase();
        } catch (error) {
          console.error('Auto-retry failed:', error);
        }
      }, 1000 * (retryCount + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [isClerkLoaded, user, isAuthLoading, firebaseUser, authError, retryCount, signInToFirebase]);

  const {
    notifications,
    unreadCount,
    hasUnread,
    isLoading: isNotificationsLoading,
    isConnected,
    error: notificationsError,
    authError: notificationAuthError,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead,
    isMarkingAllAsRead,
    markAsReadError,
    markAllAsReadError,
  } = useNotifications(user?.id, {
    limit: 50,
    enableRealtime: true,
  });

  // Manual retry function - ✅ FIXED: Use signInToFirebase correctly
  const handleRetry = async () => {
    try {
      setRetryCount(prev => prev + 1);
      if (!firebaseUser) {
        await signInToFirebase(); // ✅ This should work now
      }
      await refetch();
    } catch (error) {
      console.error('Manual retry failed:', error);
    }
  };

  // Reset retry count when authentication succeeds
  useEffect(() => {
    if (firebaseUser && isFirebaseAuthenticated) {
      setRetryCount(0);
    }
  }, [firebaseUser, isFirebaseAuthenticated]);

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
              <User className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
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

  // Show Firebase authentication loading (with timeout protection)
  const shouldShowAuthLoading = (isAuthLoading || (!firebaseUser && !authError)) && retryCount < 5;
  
  if (shouldShowAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Debug panel for development */}
          {showDebug && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-blue-800">🔧 Authentication Debug</h3>
                <button
                  onClick={() => setShowDebug(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </div>
              <pre className="text-xs text-blue-700 bg-blue-100 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              <div className="mt-2 space-x-2">
                <button
                  onClick={handleRetry}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Retry Auth
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                {retryCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {retryCount}
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-2">
                {retryCount === 0 ? 'Connecting to Firebase...' : `Retrying... (${retryCount}/5)`}
              </p>
              <p className="text-sm text-gray-500">
                Setting up secure access to your notifications
              </p>
              
              {retryCount > 2 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-yellow-600">
                    Taking longer than expected...
                  </p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication error handling
  if (authError || notificationAuthError) {
    const errorCode = authError?.code || notificationAuthError?.code;
    const errorMessage = authError?.message || notificationAuthError?.message;
    const isPermissionError = errorCode === 'permission-denied';
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {isPermissionError ? 'Access Denied' : 'Authentication Error'}
              </h2>
              <p className="text-gray-600 mb-4">
                {isPermissionError 
                  ? "Unable to access notifications. This might be a permissions issue."
                  : `Authentication failed: ${errorMessage}`
                }
              </p>
              
              {/* Debug info */}
              {showDebug && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left text-sm">
                  <div className="text-red-700">
                    <p><strong>Clerk User:</strong> {user ? '✅ ' + user.id : '❌ Not authenticated'}</p>
                    <p><strong>Firebase User:</strong> {firebaseUser ? '✅ ' + firebaseUser.uid : '❌ Not connected'}</p>
                    <p><strong>Error Code:</strong> {errorCode}</p>
                    <p><strong>Retry Count:</strong> {retryCount}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading notifications
  if (isNotificationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your notifications...</p>
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
                Connection lost. Notifications may not update in real-time.
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
                Clerk: {user?.id} | Firebase: {firebaseUser?.uid} | Notifications: {notifications.length}
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