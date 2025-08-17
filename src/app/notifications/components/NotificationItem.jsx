// components/notifications/NotificationItem.jsx
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, Package, Clock, MapPin, User } from 'lucide-react';

const NOTIFICATION_ICONS = {
  new_listing: Package,
  listing_created_confirmation: CheckCircle,
  booking_confirmed: CheckCircle,
  new_booking: Bell,
  collection_confirmed: CheckCircle,
  collection_completed_confirmation: CheckCircle,
};

export default function NotificationItem({ notification, onMarkAsRead, isMarkingAsRead }) {
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);

  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;

  const handleClick = async () => {
    setIsClicked(true);
    
    // Mark as read if not already read
    if (!notification.read && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }

    // Navigate to related content if available
    if (notification.listingId) {
      router.push(`/listings/${notification.listingId}`);
    } else if (notification.bookingId) {
      router.push(`/bookings/${notification.bookingId}`);
    }
  };

  const getNotificationColor = () => {
    if (notification.read) return 'text-gray-500';
    
    switch (notification.type) {
      case 'new_listing':
        return 'text-green-600';
      case 'booking_confirmed':
        return 'text-blue-600';
      case 'new_booking':
        return 'text-orange-600';
      case 'collection_confirmed':
        return 'text-purple-600';
      default:
        return 'text-gray-700';
    }
  };

  const getBgColor = () => {
    if (notification.read) return 'bg-gray-50';
    return 'bg-blue-50 border-l-4 border-l-blue-500';
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${getBgColor()} ${
        isClicked ? 'scale-98' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${getNotificationColor()}`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
            {notification.title}
          </h3>

          {/* Body */}
          <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.body}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {/* Time */}
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                </span>
              </div>

              {/* Location if available */}
              {notification.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{notification.location}</span>
                </div>
              )}

              {/* Provider/Recipient if available */}
              {(notification.providerName || notification.recipientName) && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{notification.providerName || notification.recipientName}</span>
                </div>
              )}
            </div>

            {/* Read status */}
            <div className="flex items-center">
              {isMarkingAsRead ? (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              ) : !notification.read ? (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              ) : (
                <CheckCircle className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

