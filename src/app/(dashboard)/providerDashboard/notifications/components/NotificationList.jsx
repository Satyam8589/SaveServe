// components/notifications/NotificationList.jsx (Fixed with proper null checks)
'use client';

import { useState, useMemo } from 'react';
import { CheckCheck, Filter, Inbox, Package, Sparkles, Bell } from 'lucide-react';
import NotificationItem from './NotificationItem';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All', icon: Inbox },
  { value: 'unread', label: 'Unread', icon: Bell },
  { value: 'read', label: 'Read', icon: CheckCheck },
];

export default function NotificationList({ 
  notifications = [], // ✅ Default to empty array
  onMarkAsRead, 
  onMarkAllAsRead, 
  isMarkingAsRead, 
  isMarkingAllAsRead 
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  // ✅ Add safety check for notifications
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return safeNotifications.filter(n => n && !n.read);
      case 'read':
        return safeNotifications.filter(n => n && n.read);
      default:
        return safeNotifications;
    }
  }, [safeNotifications, activeFilter]);

  // ✅ Use safeNotifications for counts
  const unreadCount = safeNotifications.filter(n => n && !n.read).length;
  const readCount = safeNotifications.filter(n => n && n.read).length;

  if (safeNotifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-gray-700">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-100 mb-4">
            Your notification center is ready! 
          </h3>
          <p className="text-gray-400 mb-6">
            When you have new food listings, bookings, or community updates, they'll appear here to keep you connected.
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Food listings</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Bookings</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span>Updates</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-100">Notifications</h1>
            {unreadCount > 0 && (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  {unreadCount} new
                </div>
              </div>
            )}
          </div>
          {safeNotifications.length > 0 && (
            <p className="text-gray-400">
              Stay updated with your SmartFood community activities
              {unreadCount > 0 && (
                <span className="text-amber-400 font-medium">
                  {' '}• {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            disabled={isMarkingAllAsRead}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{isMarkingAllAsRead ? 'Marking all...' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2 mb-8 bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700">
        {FILTER_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = activeFilter === option.value;
          const count = option.value === 'unread' ? unreadCount : 
                       option.value === 'read' ? readCount :
                       safeNotifications.length;

          return (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{option.label}</span>
              {count > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : option.value === 'unread' && count > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-gray-700">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-3">
              No {activeFilter} notifications
            </h3>
            <p className="text-gray-400">
              {activeFilter === 'unread' 
                ? "🎉 You're all caught up! No unread notifications."
                : activeFilter === 'read'
                ? "No read notifications yet."
                : "No notifications to show with current filters."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification, index) => (
            <div 
              key={notification.id}
              className="animate-in slide-in-from-bottom-2 fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                isMarkingAsRead={isMarkingAsRead}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load more button (for future pagination) */}
      {filteredNotifications.length >= 50 && (
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-all duration-200 border border-gray-700 hover:border-gray-600">
            Load More Notifications
          </button>
        </div>
      )}

      {/* Footer info */}
      {safeNotifications.length > 0 && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-500 bg-gray-800/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Real-time updates</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Secure connection</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span>Smart filtering</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}