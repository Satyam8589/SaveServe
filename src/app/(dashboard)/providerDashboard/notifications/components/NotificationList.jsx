// components/notifications/NotificationList.jsx
'use client';

import { useState, useMemo } from 'react';
import { CheckCheck, Filter, Inbox, Package } from 'lucide-react';
import NotificationItem from './NotificationItem';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All', icon: Inbox },
  { value: 'unread', label: 'Unread', icon: Filter },
  { value: 'read', label: 'Read', icon: CheckCheck },
];

export default function NotificationList({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  isMarkingAsRead, 
  isMarkingAllAsRead 
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No notifications yet
        </h3>
        <p className="text-gray-500">
          When you have new food listings, bookings, or updates, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            disabled={isMarkingAllAsRead}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{isMarkingAllAsRead ? 'Marking...' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {FILTER_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = activeFilter === option.value;
          const count = option.value === 'unread' ? unreadCount : 
                       option.value === 'read' ? notifications.length - unreadCount :
                       notifications.length;

          return (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{option.label}</span>
              {count > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
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
        <div className="text-center py-8">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeFilter} notifications
          </h3>
          <p className="text-gray-500">
            {activeFilter === 'unread' 
              ? "You're all caught up! No unread notifications."
              : activeFilter === 'read'
              ? "No read notifications yet."
              : "No notifications to show with current filters."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              isMarkingAsRead={isMarkingAsRead}
            />
          ))}
        </div>
      )}

      {/* Load more button (for future pagination) */}
      {filteredNotifications.length >= 50 && (
        <div className="text-center mt-8">
          <button className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}