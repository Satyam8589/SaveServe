// hooks/useNotifications.js (FIXED VERSION)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useUser, useAuth } from '@clerk/nextjs';
import { useFirebaseAuth } from '@/components/FirebaseAuthProvider';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  limit as firestoreLimit,
  startAfter,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseClient';

const NOTIFICATIONS_QUERY_KEY = 'notifications';

/**
 * Custom hook for managing user notifications with Firestore real-time updates
 */
export function useNotifications(options = {}) {
  const {
    limit = 50,
    enableRealtime = true,
    filterUnread = false
  } = options;

  // Get user ID from Clerk
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const userId = useAuth().userId; // This is the key fix - get userId from Clerk

  const { firebaseUser, isFirebaseAuthenticated, isLoading: isAuthLoading } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef(null);
  const [isConnected, setIsConnected] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Query key for this user's notifications
  const queryKey = [NOTIFICATIONS_QUERY_KEY, userId];

  // Check if we're ready to make Firestore queries
  const isReady = isClerkLoaded && 
                  !isAuthLoading && 
                  !!userId && 
                  !!firebaseUser && 
                  isFirebaseAuthenticated && 
                  firebaseUser.uid === userId;

  console.log('🔥 useNotifications state:', {
    isClerkLoaded,
    isAuthLoading,
    userId,
    firebaseUserId: firebaseUser?.uid,
    isFirebaseAuthenticated,
    isReady,
    userIdsMatch: firebaseUser?.uid === userId
  });

  // React Query for initial data and caching
  const {
    data: notifications = [],
    isLoading: isQueryLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(userId, { limit, filterUnread }),
    enabled: isReady, // Only run when everything is ready
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error) => {
      console.error('🔄 Query retry:', { failureCount, error: error?.code });
      // Don't retry if it's an authentication error
      if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
        setAuthError(error);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Set up real-time listener
  useEffect(() => {
    // Clear any previous auth errors when we retry
    setAuthError(null);

    if (!isReady || !enableRealtime) {
      console.log('🔄 Not ready for real-time listener:', {
        isReady,
        enableRealtime,
        isClerkLoaded,
        isAuthLoading,
        userId: !!userId,
        firebaseUser: !!firebaseUser,
        isFirebaseAuthenticated,
        userIdsMatch: firebaseUser?.uid === userId
      });
      return;
    }

    console.log('🔥 Setting up real-time notification listener for user:', userId);
    console.log('🔑 Firebase user authenticated:', firebaseUser?.uid);

    // Ensure parent document exists first
    ensureUserNotificationDocument(userId).then(() => {
      console.log('✅ Parent document ensured, setting up listener');
      
      const notificationsRef = collection(db, 'notifications', userId, 'notifications');
      let q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );

      if (filterUnread) {
        q = query(q, where('read', '==', false));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setIsConnected(true);
          setAuthError(null);
          
          console.log(`🔄 Real-time update: ${snapshot.size} documents`);
          
          const updatedNotifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              readAt: data.readAt?.toDate?.() || null
            };
          });

          // Update React Query cache with real-time data
          queryClient.setQueryData(queryKey, updatedNotifications);
          
          console.log(`🔨 Real-time notification update: ${updatedNotifications.length} notifications`);
        },
        (error) => {
          console.error('❌ Notification listener error:', error);
          setIsConnected(false);
          
          if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
            setAuthError(error);
            console.error('🔒 Permission denied - check Firebase Auth and Firestore rules');
            console.error('🔍 Debug info:', {
              firebaseUserId: firebaseUser?.uid,
              requestedUserId: userId,
              match: firebaseUser?.uid === userId,
              isAuthenticated: isFirebaseAuthenticated
            });
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    }).catch(error => {
      console.error('❌ Failed to ensure parent document:', error);
      setAuthError(error);
    });

    return () => {
      console.log('🔇 Cleaning up notification listener');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isReady, userId, limit, filterUnread, enableRealtime, queryClient, queryKey, firebaseUser?.uid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return response.json();
    },
    onSuccess: (data, notificationId) => {
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (oldData) =>
        oldData?.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );
    },
    onError: (error) => {
      console.error('❌ Error marking notification as read:', error);
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return response.json();
    },
    onSuccess: () => {
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (oldData) =>
        oldData?.map((notification) => ({
          ...notification,
          read: true,
          readAt: new Date()
        }))
      );
    },
    onError: (error) => {
      console.error('❌ Error marking all notifications as read:', error);
    },
  });

  // Helper functions
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;

  const markAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Combine loading states
  const isLoading = !isClerkLoaded || isAuthLoading || isQueryLoading;

  return {
    // Data
    notifications,
    unreadCount,
    hasUnread,
    
    // Loading states
    isLoading,
    isConnected,
    isReady,
    
    // Authentication state
    isFirebaseAuthenticated,
    firebaseUser,
    userId, // Include userId in return for debugging
    
    // Error handling
    error: error || authError,
    authError,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refetch,
    
    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    
    // Mutation errors
    markAsReadError: markAsReadMutation.error,
    markAllAsReadError: markAllAsReadMutation.error,
  };
}

/**
 * Ensure the parent notification document exists
 */
async function ensureUserNotificationDocument(userId) {
  try {
    const userNotificationDoc = doc(db, 'notifications', userId);
    await setDoc(userNotificationDoc, {
      createdAt: serverTimestamp(),
      lastAccessed: serverTimestamp()
    }, { merge: true });
    console.log('✅ Parent notification document ensured for user:', userId);
  } catch (error) {
    console.error('❌ Failed to ensure parent document:', error);
    throw error;
  }
}

/**
 * Enhanced fetch notifications with better error handling
 */
async function fetchNotifications(userId, options = {}) {
  const { limit = 50, filterUnread = false, startAfterDoc = null } = options;

  try {
    console.log('🔍 Starting fetchNotifications...');
    console.log('🔍 User ID:', userId);
    console.log('🔍 Firebase Auth State:', auth.currentUser ? '✅ Authenticated' : '❌ Not authenticated');
    
    if (!auth.currentUser) {
      throw new Error('Not authenticated to Firebase');
    }

    if (auth.currentUser.uid !== userId) {
      throw new Error(`User ID mismatch: Firebase=${auth.currentUser.uid}, Requested=${userId}`);
    }

    console.log('🔍 Firebase UID:', auth.currentUser.uid);
    
    // Ensure parent document exists
    await ensureUserNotificationDocument(userId);
    
    // Now query the subcollection
    console.log('🔍 Querying notifications subcollection...');
    const notificationsRef = collection(db, 'notifications', userId, 'notifications');
    
    let q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    if (filterUnread) {
      q = query(q, where('read', '==', false));
      console.log('🔍 Added unread filter to query');
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
      console.log('🔍 Added pagination to query');
    }

    console.log('🔍 Executing Firestore query...');
    const snapshot = await getDocs(q);
    console.log('🔍 Query completed. Document count:', snapshot.size);
    
    if (snapshot.empty) {
      console.log('🔭 No notifications found for user:', userId);
      return [];
    }
    
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        readAt: data.readAt?.toDate?.() || null
      };
    });

    console.log(`✅ Successfully fetched ${notifications.length} notifications for user ${userId}`);
    
    return notifications;
  } catch (error) {
    console.error('❌ fetchNotifications failed:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    
    if (error.code === 'permission-denied') {
      console.error('🚨 PERMISSION DENIED! Debug info:');
      console.error('🔍 Current user:', auth.currentUser?.uid);
      console.error('🔍 Requested user:', userId);
      console.error('🔍 User ID match:', auth.currentUser?.uid === userId);
    }
    
    throw error;
  }
}

/**
 * Hook for unread notifications count only (lighter weight)
 */
export function useUnreadNotificationsCount() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const userId = clerkUser?.id;
  const { firebaseUser, isFirebaseAuthenticated, isLoading: isAuthLoading } = useFirebaseAuth();
  const queryKey = [NOTIFICATIONS_QUERY_KEY, userId, 'unread-count'];
  
  const isReady = isClerkLoaded && 
                  !isAuthLoading && 
                  !!userId && 
                  !!firebaseUser && 
                  isFirebaseAuthenticated && 
                  firebaseUser.uid === userId;

  const { data: unreadCount = 0 } = useQuery({
    queryKey,
    queryFn: async () => {
      const notifications = await fetchNotifications(userId, { filterUnread: true, limit: 100 });
      return notifications.length;
    },
    enabled: isReady,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
        return false;
      }
      return failureCount < 3;
    },
  });

  return unreadCount;
}