// components/notifications/NotificationItem.jsx (Individual notification item)
'use client';

import { useState } from 'react';
import { 
  Check, 
  Clock, 
  MapPin, 
  User, 
  Package, 
  Heart, 
  MessageCircle, 
  Star,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Notification type configurations
const NOTIFICATION_TYPES = {
  booking: {
    icon: Calendar,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400'
  },
  food_listing: {
    icon: Package,
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400'
  },
  review: {
    icon: Star,
    color: 'from-amber-500 to-yellow-600',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400'
  },
  message: {
    icon: MessageCircle,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400'
  },
  like: {
    icon: Heart,
    color: 'from-pink-500 to-red-600',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-400'
  },
  payment: {
    icon: DollarSign,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400'
  },
  warning: {
    icon: AlertTriangle,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400'
  },
  info: {
    icon: Info,
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400'
  },
  success: {
    icon: CheckCircle,
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400'
  },
  error: {
    icon: XCircle,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400'
  }
};

export default function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  isMarkingAsRead 
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Safety check for notification object
  if (!notification) {
    return null;
  }

  const {
    id,
    title = 'Notification',
    message = '',
    type = 'info',
    read = false,
    createdAt,
    data = {}
  } = notification;

  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
  const Icon = config.icon;

  const handleMarkAsRead = () => {
    if (!read && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  return (
    <div
      className={`relative p-6 rounded-xl border transition-all duration-200 cursor-pointer group ${
        read 
          ? 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600' 
          : 'bg-gray-800/50 border-gray-600 hover:border-gray-500 shadow-lg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleMarkAsRead}
    >
      {/* Unread indicator */}
      {!read && (
        <div className="absolute left-2 top-6 w-2 h-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse" />
      )}

      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg bg-gradient-to-br ${config.color} flex-shrink-0 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-semibold text-lg leading-tight ${
              read ? 'text-gray-300' : 'text-gray-100'
            }`}>
              {title}
            </h3>
            
            {/* Time and read status */}
            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
              {createdAt && (
                <div className="flex items-center space-x-1 text-gray-500 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(createdAt)}</span>
                </div>
              )}
              
              {!read && (isHovered || isMarkingAsRead) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead();
                  }}
                  disabled={isMarkingAsRead}
                  className="p-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 transform hover:scale-110 disabled:opacity-50"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <p className={`text-base leading-relaxed mb-3 ${
              read ? 'text-gray-400' : 'text-gray-200'
            }`}>
              {message}
            </p>
          )}

          {/* Additional data (location, user, etc.) */}
          {data && Object.keys(data).length > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {data.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{data.location}</span>
                </div>
              )}
              {data.user && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{data.user}</span>
                </div>
              )}
              {data.amount && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{data.amount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isMarkingAsRead && (
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Hover effect */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-5 transition-opacity duration-200`} />
    </div>
  );
}