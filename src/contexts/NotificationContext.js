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

function generateNotificationsFromData(listingsData, bookingsData) {
    const combinedNotifications = [];
    const readIds = getReadNotificationIds();

    if (listingsData.success && Array.isArray(listingsData.data)) {
        listingsData.data.forEach(listing => {
            const timeSinceCreation = Date.now() - new Date(listing.createdAt).getTime();
            if (timeSinceCreation < 24 * 60 * 60 * 1000) {
                const id = `listing-${listing._id}`;
                combinedNotifications.push({ 
                    listingId: listing._id, id, title: '✨ New Food Available', 
                    message: `${listing.title} at ${listing.location}`, time: getTimeAgo(listing.createdAt), 
                    createdAt: new Date(listing.createdAt), type: 'new-food', 
                    urgent: getListingStatus(listing.expiryTime).text === 'Urgent', 
                    read: readIds.has(id), priority: 'medium'
                });
            }
            if (getListingStatus(listing.expiryTime).text === 'Urgent') {
                const id = `urgent-${listing._id}`;
                combinedNotifications.push({ 
                    listingId: listing._id, id, title: '🔥 Urgent: Food Expiring Soon', 
                    message: `${listing.title} is expiring soon`, time: getTimeAgo(listing.createdAt), 
                    createdAt: new Date(listing.createdAt), type: 'urgent', urgent: true, 
                    read: readIds.has(id), priority: 'high'
                });
            }
        });
    }
    
    if (bookingsData.success && Array.isArray(bookingsData.data)) {
        bookingsData.data.forEach(booking => {
            const foodTitle = booking.listingId?.title || 'a food item';
            const listingId = booking.listingId?._id;
            if (!listingId) return;
            let notificationData;
            if (booking.userRole === 'recipient') {
                switch (booking.status) {
                    case 'approved':
                        notificationData = { id: `booking-conf-${booking._id}`, title: '✅ Claim Confirmed', message: `Your claim for ${foodTitle} is confirmed.`, time: getTimeAgo(booking.approvedAt || booking.updatedAt), createdAt: new Date(booking.approvedAt || booking.updatedAt), type: 'confirmation', priority: 'medium' };
                        break;
                    case 'cancelled':
                        notificationData = { id: `booking-cancel-${booking._id}`, title: '🚫 Claim Cancelled', message: `Your claim for ${foodTitle} was cancelled.`, time: getTimeAgo(booking.cancelledAt || booking.updatedAt), createdAt: new Date(booking.cancelledAt || booking.updatedAt), type: 'cancellation', priority: 'medium' };
                        break;
                    case 'rejected':
                        notificationData = { id: `booking-reject-${booking._id}`, title: '❌ Claim Rejected', message: `Unfortunately, your claim for ${foodTitle} was rejected.`, time: getTimeAgo(booking.rejectedAt || booking.updatedAt), createdAt: new Date(booking.rejectedAt || booking.updatedAt), type: 'rejection', priority: 'medium' };
                        break;
                    // --- ADDED: Completed notification for recipient ---
                    case 'completed':
                        notificationData = { id: `booking-comp-${booking._id}`, title: '✅ Order Completed', message: `You have successfully received ${foodTitle}. Enjoy!`, time: getTimeAgo(booking.completedAt || booking.updatedAt), createdAt: new Date(booking.completedAt || booking.updatedAt), type: 'confirmation', priority: 'medium' };
                        break;
                }
            } else if (booking.userRole === 'provider') {
                switch (booking.status) {
                    case 'pending':
                        notificationData = { id: `booking-req-${booking._id}`, title: '👤 New Claim Request', message: `You have a new claim request for ${foodTitle}.`, time: getTimeAgo(booking.createdAt), createdAt: new Date(booking.createdAt), type: 'request', urgent: true, priority: 'high' };
                        break;
                    case 'cancelled':
                         notificationData = { id: `prov-booking-cancel-${booking._id}`, title: '🚫 Claim Cancelled', message: `The claim for your item "${foodTitle}" has been cancelled.`, time: getTimeAgo(booking.cancelledAt || booking.updatedAt), createdAt: new Date(booking.cancelledAt || booking.updatedAt), type: 'cancellation', priority: 'medium' };
                         break;
                    // --- ADDED: Completed notification for provider ---
                    case 'completed':
                        notificationData = { id: `prov-booking-comp-${booking._id}`, title: '🎉 Donation Completed', message: `Your donation of ${foodTitle} has been successfully collected.`, time: getTimeAgo(booking.completedAt || booking.updatedAt), createdAt: new Date(booking.completedAt || booking.updatedAt), type: 'confirmation', priority: 'medium' };
                        break;
                }
            }
            if (notificationData) {
                combinedNotifications.push({
                    ...notificationData, listingId, read: readIds.has(notificationData.id), urgent: notificationData.urgent || false,
                });
            }
        });
    }
    
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

  const fetchAndSetNotifications = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    };
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
      
      const generated = generateNotificationsFromData(listingsData, bookingsData);
      setNotifications(generated);
      setUnreadCount(generated.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications in context", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded && user) {
        fetchAndSetNotifications();
    }
  }, [isLoaded, user, fetchAndSetNotifications]);

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
  
  useEffect(() => {
    if (pathname === '/recipientDashboard/notifications' && unreadCount > 0) {
      // This effect is here in case you want to add logic
      // for automatically clearing the dot when the page is visited.
    }
  }, [pathname, unreadCount]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    allListings,
    markAsRead,
    markAllAsRead,
    refetch: fetchAndSetNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};