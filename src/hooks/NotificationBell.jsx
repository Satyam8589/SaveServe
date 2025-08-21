// components/NotificationBell.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Wifi, WifiOff } from 'lucide-react';
import useSocketNotifications from '@/hooks/useSSENotifications';

/**
 * 🔔 Notification Bell Component
 * Displays real-time notifications with a bell icon and dropdown
 */
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isConnected,
    connectionError,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    reconnect,
    requestNotificationPermission
  } = useSocketNotifications();

  // 🔔 Request notification permission on first render
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // 📱 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationDropdown = document.getElementById('notification-dropdown');
      if (notificationDropdown && !notificationDropdown.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 🎨 Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'qr_collection_verified': return '🎯';
      default: return '🔔';
    }
  };

  // 🎨 Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  // ⏰ Format time for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" id="notification-dropdown">
      {/* 🔔 Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setShowConnectionStatus(true)}
        onMouseLeave={() => setShowConnectionStatus(false)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
      >
        <Bell size={24} className={isConnected ? 'text-gray-600' : 'text-red-500'} />
        
        {/* 🔴 Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* 📡 Connection status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </button>

      {/* 📡 Connection Status Tooltip */}
      {showConnectionStatus && (
        <div className="absolute top-12 right-0 z-50 bg-black text-white text-xs py-1 px-2 rounded flex items-center gap-1">
          {isConnected ? (
            <>
              <Wifi size={12} />
              Connected
            </>
          ) : (
            <>
              <WifiOff size={12} />
              {connectionError ? 'Connection Error' : 'Disconnected'}
            </>
          )}
        </div>
      )}

      {/* 📋 Notifications Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-0 z-40 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          
          {/* 📊 Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection status */}
              {isConnected ? (
                <Wifi size={16} className="text-green-500" title="Connected" />
              ) : (
                <button
                  onClick={reconnect}
                  className="text-red-500 hover:text-red-700"
                  title="Reconnect"
                >
                  <WifiOff size={16} />
                </button>
              )}
              
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 🛠️ Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-gray-25">
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>

              <button
                onClick={clearAllNotifications}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}

          {/* 📋 Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              // 📭 Empty state
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll see real-time updates here
                </p>
              </div>
            ) : (
              // 📋 Notification items
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-25 border-l-4 ' + getNotificationColor(notification.type) : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* 🎨 Notification icon */}
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                    
                    {/* 📝 Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        notification.read ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      
                      <p className={`text-xs mt-1 ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    
                    {/* ✅ Read status */}
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ⚠️ Connection Error */}
          {connectionError && (
            <div className="p-3 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-600 mb-2">
                Connection Error: {connectionError}
              </p>
              <button
                onClick={reconnect}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;