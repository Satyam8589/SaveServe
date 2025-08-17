// hooks/useNotifications.js (Fixed imports and fetchNotifications)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
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
  getDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseClient'; // ✅ Import auth from firebaseClient

const NOTIFICATIONS_QUERY_KEY = 'notifications';

/**
 * Custom hook for managing user notifications with Firestore real-time updates
 * @param {string} userId - The current user ID
 * @param {object} options - Configuration options
 */
export function useNotifications(userId, options = {}) {
  const {
    limit = 50,
    enableRealtime = true,
    filterUnread = false
  } = options;

  const { user: clerkUser } = useUser();
  const { firebaseUser, isFirebaseAuthenticated, isLoading: isAuthLoading } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef(null);
  const [isConnected, setIsConnected] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Query key for this user's notifications
  const queryKey = [NOTIFICATIONS_QUERY_KEY, userId];

  // Check if we're ready to make Firestore queries
  const isReady = !isAuthLoading && !!userId && !!firebaseUser && isFirebaseAuthenticated;

  // React Query for initial data and caching
  const {
    data: notifications = [],
    isLoading: isQueryLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(userId, { limit, filterUnread }),
    enabled: isReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry if it's an authentication error
      if (error?.code === 'permission-denied') {
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
        isAuthLoading,
        userId: !!userId,
        firebaseUser: !!firebaseUser,
        isFirebaseAuthenticated
      });
      return;
    }

    const notificationsRef = collection(db, 'notifications', userId, 'notifications');
    let q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    if (filterUnread) {
      q = query(q, where('read', '==', false));
    }

    console.log('🔄 Setting up real-time notification listener for user:', userId);
    console.log('🔍 Firebase user authenticated:', firebaseUser?.uid);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIsConnected(true);
        setAuthError(null);
        
        const updatedNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          readAt: doc.data().readAt?.toDate?.() || null
        }));

        // Update React Query cache with real-time data
        queryClient.setQueryData(queryKey, updatedNotifications);
        
        console.log(`📨 Real-time notification update: ${updatedNotifications.length} notifications`);
      },
      (error) => {
        console.error('❌ Notification listener error:', error);
        setIsConnected(false);
        
        if (error.code === 'permission-denied') {
          setAuthError(error);
          console.error('🔒 Permission denied - check Firebase Auth and Firestore rules');
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

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
  const isLoading = isAuthLoading || isQueryLoading;

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
 * Enhanced fetch notifications with detailed debugging (FIXED)
 */
async function fetchNotifications(userId, options = {}) {
  const { limit = 50, filterUnread = false, startAfterDoc = null } = options;

  try {
    console.log('🔍 Starting fetchNotifications debug...');
    console.log('🔍 User ID:', userId);
    console.log('🔍 Firebase Auth State:', auth.currentUser ? '✅ Authenticated' : '❌ Not authenticated');
    
    if (auth.currentUser) {
      console.log('🔍 Firebase UID:', auth.currentUser.uid);
      
      // Check if we can get an ID token
      try {
        const idToken = await auth.currentUser.getIdToken();
        console.log('🎟️ ID Token available:', !!idToken);
        console.log('🎟️ Token length:', idToken?.length);
        
        // Get token claims for debugging
        const tokenResult = await auth.currentUser.getIdTokenResult();
        console.log('🎟️ Token claims:', tokenResult.claims);
      } catch (tokenError) {
        console.error('❌ Token error:', tokenError);
      }
    }

    // First, try to access the parent document
    console.log('🔍 Checking parent document access...');
    const parentDocRef = doc(db, 'notifications', userId);
    
    try {
      const parentDoc = await getDoc(parentDocRef);
      console.log('🔍 Parent document exists:', parentDoc.exists());
      console.log('🔍 Parent document data:', parentDoc.data());
    } catch (parentError) {
      console.error('❌ Parent document access failed:', parentError);
      console.error('❌ Error code:', parentError.code);
      console.error('❌ Error message:', parentError.message);
      
      // This might be the issue - security rules might not allow reading the parent doc
      if (parentError.code === 'permission-denied') {
        console.error('🚨 PERMISSION DENIED on parent document! Check Firestore security rules.');
      }
    }

    // Now try the subcollection
    console.log('🔍 Accessing notifications subcollection...');
    const notificationsRef = collection(db, 'notifications', userId, 'notifications');
    console.log('🔍 Subcollection reference created');
    
    let q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );
    console.log('🔍 Query created with orderBy and limit');

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
      console.log('🔭 No notifications found');
      return [];
    }
    
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`🔍 Processing doc ${doc.id}:`, {
        hasCreatedAt: !!data.createdAt,
        createdAtType: typeof data.createdAt,
        read: data.read,
        title: data.title
      });
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        readAt: data.readAt?.toDate?.() || null
      };
    });

    console.log(`✅ Successfully fetched ${notifications.length} notifications for user ${userId}`);
    console.log('🔍 First notification sample:', notifications[0]);
    
    return notifications;
  } catch (error) {
    console.error('❌ fetchNotifications failed:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    if (error.code === 'permission-denied') {
      console.error('🚨 PERMISSION DENIED! Detailed debugging:');
      console.error('🔍 Current user:', auth.currentUser?.uid);
      console.error('🔍 Requested user:', userId);
      console.error('🔍 User ID match:', auth.currentUser?.uid === userId);
      console.error('🔍 Auth state:', auth.currentUser ? 'authenticated' : 'not authenticated');
      console.error('🔍 Suggestion: Check Firestore security rules for notifications subcollection');
    } else if (error.code === 'not-found') {
      console.error('🔍 Document/collection not found - this might be normal if no notifications exist yet');
    }
    
    throw error;
  }
}

/**
 * Hook for unread notifications count only (lighter weight)
 */
export function useUnreadNotificationsCount(userId) {
  const { firebaseUser, isFirebaseAuthenticated, isLoading: isAuthLoading } = useFirebaseAuth();
  const queryKey = [NOTIFICATIONS_QUERY_KEY, userId, 'unread-count'];
  const isReady = !isAuthLoading && !!userId && !!firebaseUser && isFirebaseAuthenticated;

  const { data: unreadCount = 0 } = useQuery({
    queryKey,
    queryFn: async () => {
      const notifications = await fetchNotifications(userId, { filterUnread: true, limit: 100 });
      return notifications.length;
    },
    enabled: isReady,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      if (error?.code === 'permission-denied') {
        return false;
      }
      return failureCount < 3;
    },
  });

  return unreadCount;
}