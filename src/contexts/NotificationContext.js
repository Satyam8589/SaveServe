"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

// --- START: All helper functions are now centralized here ---

const READ_NOTIFICATIONS_KEY = 'readNotificationIds';

const getReadNotificationIds = () => {
  try {
    if (typeof window === 'undefined') return new Set();
    const item = window.localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return item ? new Set(JSON.parse(item)) : new Set();
  } catch (error) {
    console.error("Failed to read from localStorage", error);
    return new Set();
  }
};

const addReadNotificationId = (id) => {
  try {
    const readIds = getReadNotificationIds();
    readIds.add(id);
    window.localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readIds)));
  } catch (error) {
    console.error("Failed to write to localStorage", error);
  }
};

const addMultipleReadNotificationIds = (ids) => {
    try {
        const readIds = getReadNotificationIds();
        ids.forEach(id => readIds.add(id));
        window.localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readIds)));
    } catch (error) {
        console.error("Failed to write to localStorage", error);
    }
};

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const getListingStatus = (expiryTimeString, quantity = 0) => {
  const now = new Date();
  const expiryTime = new Date(expiryTimeString);
  const totalMinutes = Math.floor((expiryTime - now) / (1000 * 60));
  if (quantity === 0) return { text: "Unavailable" };
  if (totalMinutes <= 0) return { text: "Expired" };
  if (totalMinutes <= 60) return { text: "Urgent" };
  return { text: "Available" };
};

function generateNotificationsFromData(listingsData, bookingsData, currentUserId, userRole) {
    const combinedNotifications = [];
    const readIds = getReadNotificationIds();

    // Only show new food arrivals to recipients (not to providers)
    if (userRole === 'recipient' && listingsData.success && Array.isArray(listingsData.data)) {
        listingsData.data.forEach(listing => {
            // Don't show user's own listings as "new food available"
            if (listing.providerId === currentUserId) return;
            
            const timeSinceCreation = Date.now() - new Date(listing.createdAt).getTime();
            // Show listings created in the last 24 hours and are still available
            if (timeSinceCreation < 24 * 60 * 60 * 1000 && listing.status === 'available' && listing.quantity > 0) {
                const id = `listing-${listing._id}`;
                combinedNotifications.push({ 
                    listingId: listing._id, 
                    id, 
                    title: '✨ New Food Available', 
                    message: `${listing.title} at ${listing.location}`, 
                    time: getTimeAgo(listing.createdAt), 
                    createdAt: new Date(listing.createdAt), 
                    type: 'new-food', 
                    urgent: getListingStatus(listing.expiryTime, listing.quantity).text === 'Urgent', 
                    read: readIds.has(id), 
                    priority: 'medium'
                });
            }
            
            // Show urgent notifications for available listings (regardless of owner)
            if (getListingStatus(listing.expiryTime, listing.quantity).text === 'Urgent' && listing.status === 'available') {
                const id = `urgent-${listing._id}`;
                combinedNotifications.push({ 
                    listingId: listing._id, 
                    id, 
                    title: '🔥 Urgent: Food Expiring Soon', 
                    message: `${listing.title} is expiring soon`, 
                    time: getTimeAgo(listing.createdAt), 
                    createdAt: new Date(listing.createdAt), 
                    type: 'urgent', 
                    urgent: true, 
                    read: readIds.has(id), 
                    priority: 'high'
                });
            }
        });
    }
    
    // Handle booking notifications for both providers and recipients
    if (bookingsData.success && Array.isArray(bookingsData.data)) {
        bookingsData.data.forEach(booking => {
            const foodTitle = booking.listingId?.title || 'a food item';
            const listingId = booking.listingId?._id;
            if (!listingId) return;
            
            let notificationData;
            
            if (booking.userRole === 'recipient' && booking.recipientId === currentUserId) {
                switch (booking.status) {
                    case 'approved':
                        notificationData = { 
                            id: `booking-conf-${booking._id}`, 
                            title: '✅ Claim Confirmed', 
                            message: `Your claim for ${foodTitle} has been approved. You can now collect it.`, 
                            time: getTimeAgo(booking.approvedAt || booking.updatedAt), 
                            createdAt: new Date(booking.approvedAt || booking.updatedAt), 
                            type: 'confirmation', 
                            priority: 'high' 
                        };
                        break;
                    case 'cancelled':
                        notificationData = { 
                            id: `booking-cancel-${booking._id}`, 
                            title: '🚫 Claim Cancelled', 
                            message: `Your claim for ${foodTitle} was cancelled.`, 
                            time: getTimeAgo(booking.cancelledAt || booking.updatedAt), 
                            createdAt: new Date(booking.cancelledAt || booking.updatedAt), 
                            type: 'cancellation', 
                            priority: 'medium' 
                        };
                        break;
                    case 'rejected':
                        notificationData = { 
                            id: `booking-reject-${booking._id}`, 
                            title: '❌ Claim Rejected', 
                            message: `Unfortunately, your claim for ${foodTitle} was rejected.`, 
                            time: getTimeAgo(booking.rejectedAt || booking.updatedAt), 
                            createdAt: new Date(booking.rejectedAt || booking.updatedAt), 
                            type: 'rejection', 
                            priority: 'medium' 
                        };
                        break;
                    case 'completed':
                        notificationData = { 
                            id: `booking-comp-${booking._id}`, 
                            title: '🎉 Order Completed', 
                            message: `You have successfully received ${foodTitle}. Thank you for reducing food waste!`, 
                            time: getTimeAgo(booking.completedAt || booking.updatedAt), 
                            createdAt: new Date(booking.completedAt || booking.updatedAt), 
                            type: 'confirmation', 
                            priority: 'medium' 
                        };
                        break;
                }
            } else if (booking.userRole === 'provider' && booking.listingId?.providerId === currentUserId) {
                switch (booking.status) {
                    case 'pending':
                        notificationData = { 
                            id: `booking-req-${booking._id}`, 
                            title: '👤 New Claim Request', 
                            message: `You have a new claim request for ${foodTitle}. Please review and respond.`, 
                            time: getTimeAgo(booking.createdAt), 
                            createdAt: new Date(booking.createdAt), 
                            type: 'request', 
                            urgent: true, 
                            priority: 'high' 
                        };
                        break;
                    case 'cancelled':
                        notificationData = { 
                            id: `prov-booking-cancel-${booking._id}`, 
                            title: '🚫 Claim Cancelled', 
                            message: `The claim for your item "${foodTitle}" has been cancelled by the recipient.`, 
                            time: getTimeAgo(booking.cancelledAt || booking.updatedAt), 
                            createdAt: new Date(booking.cancelledAt || booking.updatedAt), 
                            type: 'cancellation', 
                            priority: 'medium' 
                        };
                        break;
                    case 'completed':
                        notificationData = { 
                            id: `prov-booking-comp-${booking._id}`, 
                            title: '🎉 Donation Completed', 
                            message: `Your donation of ${foodTitle} has been successfully collected. Great job reducing food waste!`, 
                            time: getTimeAgo(booking.completedAt || booking.updatedAt), 
                            createdAt: new Date(booking.completedAt || booking.updatedAt), 
                            type: 'confirmation', 
                            priority: 'medium' 
                        };
                        break;
                }
            }
            
            if (notificationData) {
                combinedNotifications.push({
                    ...notificationData, 
                    listingId, 
                    read: readIds.has(notificationData.id), 
                    urgent: notificationData.urgent || false,
                });
            }
        });
    }
    
    // Remove duplicates and sort by creation time
    const uniqueNotifications = Array.from(new Map(combinedNotifications.map(item => [item.id, item])).values());
    uniqueNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return uniqueNotifications;
}

// --- END: Helper functions ---

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allListings, setAllListings] = useState([]);
  const [userRole, setUserRole] = useState(null);

  // Determine user role based on current path
  useEffect(() => {
    if (pathname?.includes('/providerDashboard')) {
      setUserRole('provider');
    } else if (pathname?.includes('/recipientDashboard')) {
      setUserRole('recipient');
    } else {
      // Default to recipient if unclear
      setUserRole('recipient');
    }
  }, [pathname]);

  const fetchAndSetNotifications = useCallback(async () => {
    if (!user || !userRole) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    try {
      const [listingsRes, bookingsRes] = await Promise.all([
        fetch('/api/listings'),
        fetch(`/api/bookings?userId=${user.id}&role=all`)
      ]);
      
      if (!listingsRes.ok || !bookingsRes.ok) throw new Error('Failed to fetch data.');
      
      const listingsData = await listingsRes.json();
      const bookingsData = await bookingsRes.json();
      
      if(listingsData.success) setAllListings(listingsData.data);
      
      // Generate notifications based on user role and context
      const generated = generateNotificationsFromData(listingsData, bookingsData, user.id, userRole);
      setNotifications(generated);
      setUnreadCount(generated.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications in context", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (isLoaded && user && userRole) {
        fetchAndSetNotifications();
    }
  }, [isLoaded, user, userRole, fetchAndSetNotifications]);

  const markAsRead = useCallback((id) => {
    addReadNotificationId(id);
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    addMultipleReadNotificationIds(unreadIds);
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    allListings,
    markAsRead,
    markAllAsRead,
    refetch: fetchAndSetNotifications,
    userRole
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};