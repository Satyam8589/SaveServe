// components/notifications/NotificationPopup.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  CheckCircle, 
  Package, 
  Clock, 
  MapPin, 
  User, 
  ArrowRight, 
  Sparkles,
  CheckCheck,
  Eye,
  X
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@clerk/nextjs';

const NOTIFICATION_ICONS = {
  new_listing: Package,
  listing_created_confirmation: CheckCircle,
  booking_confirmed: CheckCircle,
  new_booking: Bell,
  collection_confirmed: CheckCircle,
  collection_completed_confirmation: CheckCircle,
};

const NOTIFICATION_THEMES = {
  new_listing: {
    gradient: 'from-emerald-500 to-green-600',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500'
  },
  booking_confirmed: {
    gradient: 'from-amber-500 to-orange-500',
    text: 'text-amber-400',
    badge: 'bg-amber-500'
  },
  new_booking: {
    gradient: 'from-orange-500 to-red-500',
    text: 'text-orange-400',
    badge: 'bg-orange-500'
  },
  collection_confirmed: {
    gradient: 'from-green-500 to-emerald-600',
    text: 'text-green-400',
    badge: 'bg-green-500'
  }
};

function NotificationPopupItem({ notification, onMarkAsRead, onNavigate }) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const theme = NOTIFICATION_THEMES[notification.type] || NOTIFICATION_THEMES.new_listing;

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNavigate) {
      onNavigate(notification);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-gray-700/50 ${
        notification.read 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-gray-800/50 border-gray-600/50 hover:border-gray-500/50'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className={`text-sm font-semibold ${notification.read ? 'text-gray-300' : 'text-gray-100'} truncate pr-2`}>
              {notification.title}
            </h4>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {!notification.read && (
                <div className={`w-2 h-2 ${theme.badge} rounded-full`}></div>
              )}
            </div>
          </div>
          
          <p className={`text-xs ${notification.read ? 'text-gray-400' : 'text-gray-300'} mb-2 line-clamp-2`}>
            {notification.body}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</span>
            </div>
            
            {(notification.listingId || notification.bookingId) && (
              <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-gray-400 transition-colors" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationPopup({ isOpen, onClose, onBellClick }) {
  const { user } = useUser();
  const router = useRouter();
  const popupRef = useRef(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
    error
  } = useNotifications(user?.id, {
    limit: 10,
    enableRealtime: true,
  });

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNavigate = (notification) => {
    onClose();
    if (notification.listingId) {
      router.push(`/providerDashboard/listings/${notification.listingId}/bookings`);
    } else if (notification.bookingId) {
      router.push(`/providerDashboard/bookings/${notification.bookingId}`);
    }
  };

  const handleViewAll = () => {
    onClose();
    router.push('/providerDashboard/notifications');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const recentNotifications = notifications.slice(0, 5);
  const hasMore = notifications.length > 5;

  return (
    <>
      {/* Bell Icon */}
      <button
        onClick={onBellClick}
        className="relative p-2 text-gray-300 hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-700/50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </div>
        )}
      </button>

      {/* Popup */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50" ref={popupRef}>
          <div className="w-96 bg-gray-800/95 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-amber-400">
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="p-6 text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-400 text-sm">Loading notifications...</p>
                </div>
              )}

              {error && (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 text-sm">Failed to load notifications</p>
                </div>
              )}

              {!isLoading && !error && recentNotifications.length === 0 && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-gray-100 font-semibold mb-2">All caught up!</h4>
                  <p className="text-gray-400 text-sm">No new notifications right now.</p>
                  <div className="flex items-center justify-center mt-4 space-x-2 text-xs text-gray-500">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Stay tuned for updates</span>
                  </div>
                </div>
              )}

              {!isLoading && !error && recentNotifications.length > 0 && (
                <div className="p-2">
                  <div className="space-y-2">
                    {recentNotifications.map((notification) => (
                      <NotificationPopupItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isLoading && !error && notifications.length > 0 && (
              <div className="border-t border-gray-700 p-3">
                <button
                  onClick={handleViewAll}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  <span>View all notifications</span>
                  {hasMore && (
                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                      +{notifications.length - 5} more
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}