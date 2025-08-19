"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Eye,
  Loader2,
  AlertCircle,
  Trash2,
  XCircle,
  CheckCircle2,
  UtensilsCrossed,
  Flame,
  BellRing,
  UserPlus,
  Slash,
  X,
  Package,
  MapPin,
  Clock,
  Info,
  Search,
  Calendar,
  CheckCheck,
  BellOff,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationContext";

// --- HELPERS needed for components in this file ---
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getListingStatus = (expiryTimeString, quantity = 0) => {
  const now = new Date();
  const expiryTime = new Date(expiryTimeString);
  const totalMinutes = Math.floor((expiryTime - now) / (1000 * 60));

  if (quantity === 0)
    return {
      text: "Unavailable",
      color: "bg-gray-600",
      textColor: "text-gray-300",
      isExpired: true,
    };
  if (totalMinutes <= 0)
    return {
      text: "Expired",
      color: "bg-red-600",
      textColor: "text-red-100",
      isExpired: true,
    };
  if (totalMinutes <= 60)
    return {
      text: "Urgent",
      color: "bg-orange-500",
      textColor: "text-orange-100",
      isExpired: false,
    };
  return {
    text: "Available",
    color: "bg-emerald-600",
    textColor: "text-emerald-100",
    isExpired: false,
  };
};

const notificationConfig = {
  "new-food": {
    Icon: UtensilsCrossed,
    color: "text-sky-400",
    bgColor: "bg-gradient-to-br from-sky-900/60 to-blue-900/40",
    accentColor: "border-l-sky-400",
  },
  urgent: {
    Icon: Flame,
    color: "text-red-400",
    bgColor: "bg-gradient-to-br from-red-900/60 to-orange-900/40",
    accentColor: "border-l-red-400",
  },
  reminder: {
    Icon: BellRing,
    color: "text-amber-400",
    bgColor: "bg-gradient-to-br from-amber-900/60 to-yellow-900/40",
    accentColor: "border-l-amber-400",
  },
  confirmation: {
    Icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-gradient-to-br from-emerald-900/60 to-green-900/40",
    accentColor: "border-l-emerald-400",
  },
  request: {
    Icon: UserPlus,
    color: "text-indigo-400",
    bgColor: "bg-gradient-to-br from-indigo-900/60 to-purple-900/40",
    accentColor: "border-l-indigo-400",
  },
  rejection: {
    Icon: XCircle,
    color: "text-rose-400",
    bgColor: "bg-gradient-to-br from-rose-900/60 to-pink-900/40",
    accentColor: "border-l-rose-400",
  },
  cancellation: {
    Icon: Slash,
    color: "text-gray-400",
    bgColor: "bg-gradient-to-br from-gray-800/60 to-gray-700/40",
    accentColor: "border-l-gray-400",
  },
  default: {
    Icon: Bell,
    color: "text-gray-400",
    bgColor: "bg-gradient-to-br from-gray-800/60 to-gray-700/40",
    accentColor: "border-l-gray-400",
  },
};

const getNotificationConfig = (type) =>
  notificationConfig[type] || notificationConfig.default;

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    allListings,
    markAsRead,
    markAllAsRead,
    refetch,
    userRole,
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [modalData, setModalData] = useState({ isOpen: false, listing: null });

  // Re-fetch notifications when page is visited
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleNotificationClick = useCallback(
    (listingId) => {
      if (!listingId) return;
      const listingDetails = allListings.find((l) => l._id === listingId);
      if (listingDetails) {
        setModalData({ isOpen: true, listing: listingDetails });
      } else {
        console.warn("Details for this listing were not found.");
      }
    },
    [allListings]
  );

  const handleViewAndMarkRead = useCallback(
    (notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      handleNotificationClick(notification.listingId);
    },
    [markAsRead, handleNotificationClick]
  );

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return (
          n.title.toLowerCase().includes(lowerSearch) ||
          n.message.toLowerCase().includes(lowerSearch)
        );
      })
      .filter((n) => {
        if (filterType === "all") return true;
        if (filterType === "unread") return !n.read;
        if (filterType === "urgent") return n.urgent;
        if (filterType === "completed")
          return (
            n.type === "confirmation" &&
            (n.title.includes("Completed") ||
              n.title.includes("Order Completed") ||
              n.title.includes("Donation Completed"))
          );
        return true;
      });
  }, [notifications, searchTerm, filterType]);

  // Get header message based on user role
  const getHeaderMessage = () => {
    if (userRole === "provider") {
      return unreadCount > 0
        ? `You have ${unreadCount} unread notifications about your donations.`
        : "All your donations are up to date!";
    }
    return unreadCount > 0
      ? `You have ${unreadCount} unread notifications.`
      : "You are all caught up!";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-10 w-10 text-blue-400" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-gray-400 text-lg mt-1">
                  {getHeaderMessage()}
                </p>
                {userRole && (
                  <div className="mt-2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                      {userRole === "provider"
                        ? "📦 Provider View"
                        : "🍽️ Recipient View"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read ({unreadCount})
                </Button>
              )}
              <Button
                onClick={refetch}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 rounded-lg p-4 border border-blue-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-100">
                    {notifications.length}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-900/50 to-red-800/30 rounded-lg p-4 border border-red-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm font-medium">Unread</p>
                  <p className="text-2xl font-bold text-red-100">
                    {unreadCount}
                  </p>
                </div>
                <BellRing className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-900/50 to-orange-800/30 rounded-lg p-4 border border-orange-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Urgent</p>
                  <p className="text-2xl font-bold text-orange-100">
                    {notifications.filter((n) => n.urgent).length}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-orange-400" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900/50 to-green-800/30 rounded-lg p-4 border border-green-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Today</p>
                  <p className="text-2xl font-bold text-green-100">
                    {
                      notifications.filter((n) => {
                        const today = new Date();
                        const notifDate = new Date(n.createdAt);
                        return (
                          notifDate.toDateString() === today.toDateString()
                        );
                      }).length
                    }
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications by title or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white min-w-[140px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="all">📋 All ({notifications.length})</option>
                <option value="unread">🔔 Unread ({unreadCount})</option>
                <option value="urgent">
                  ⚡ Urgent ({notifications.filter((n) => n.urgent).length})
                </option>
                <option value="completed">
                  ✅ Completed (
                  {
                    notifications.filter((n) => n.type === "confirmation")
                      .length
                  }
                  )
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Notifications List */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl border border-gray-600/50 shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-16 w-16 text-blue-400 animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6">
              {filterType === "all" ? (
                <BellOff className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              ) : filterType === "unread" ? (
                <CheckCheck className="h-20 w-20 text-green-400 mx-auto mb-4" />
              ) : (
                <Bell className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-200 mb-2">
              {filterType === "all"
                ? "No Notifications Yet"
                : filterType === "unread"
                ? "All Caught Up!"
                : `No ${
                    filterType.charAt(0).toUpperCase() + filterType.slice(1)
                  } Notifications`}
            </h3>
            <p className="text-gray-400 text-lg mb-6">
              {filterType === "all"
                ? "When you have new food notifications, they'll appear here."
                : filterType === "unread"
                ? "You've read all your notifications. Great job staying updated!"
                : `No ${filterType} notifications found. Try adjusting your filter.`}
            </p>
            {filterType !== "all" && (
              <Button
                onClick={() => setFilterType("all")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                View All Notifications
              </Button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-200">
                {filterType === "all"
                  ? `All Notifications (${filteredNotifications.length})`
                  : `${
                      filterType.charAt(0).toUpperCase() + filterType.slice(1)
                    } Notifications (${filteredNotifications.length})`}
              </h2>
              {filteredNotifications.length > 0 && (
                <div className="text-sm text-gray-400">
                  {filteredNotifications.filter((n) => !n.read).length} unread
                </div>
              )}
            </div>

            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onView={() => handleViewAndMarkRead(notification)}
                  onMarkRead={() => markAsRead(notification.id)}
                  onDelete={() => {
                    /* Optional: Implement delete logic in context */
                  }}
                  userRole={userRole}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <FoodDetailModal
        isOpen={modalData.isOpen}
        listing={modalData.listing}
        onClose={() => setModalData({ isOpen: false, listing: null })}
        userRole={userRole}
      />
    </div>
  );
}

// --- Child Components ---

const NotificationCard = React.memo(
  ({ notification, onView, onMarkRead, onDelete, userRole }) => {
    const config = getNotificationConfig(notification.type);

    // Show different styling for completed notifications
    const isCompleted =
      notification.type === "confirmation" &&
      (notification.title.includes("Completed") ||
        notification.title.includes("Order Completed") ||
        notification.title.includes("Donation Completed"));

    return (
      <div
        className={`group relative overflow-hidden rounded-xl border-l-4 ${
          config.accentColor
        } transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer ${
          notification.read
            ? "bg-gray-800/40 border-gray-700"
            : "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 shadow-lg"
        } ${isCompleted ? "ring-2 ring-emerald-500/30" : ""}`}
        onClick={onView}
      >
        {notification.priority === "high" && !notification.read && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )}

        {isCompleted && (
          <div className="absolute top-2 right-8 px-2 py-1 bg-emerald-600 text-white text-xs rounded-full">
            ✓ Completed
          </div>
        )}

        <div className="relative p-5">
          <div className="flex items-start gap-4">
            <div
              className={`relative flex h-12 w-12 flex-none items-center justify-center rounded-xl ${config.bgColor} shadow-lg`}
            >
              <config.Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-auto min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold truncate ${
                      notification.read ? "text-gray-300" : "text-white"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p
                    className={`mt-1 text-sm line-clamp-2 ${
                      notification.read ? "text-gray-500" : "text-gray-300"
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {notification.time}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="p-2 rounded-lg bg-gray-900/80 hover:bg-emerald-600 text-gray-400 hover:text-white"
                title="Mark as read"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg bg-gray-900/80 hover:bg-red-600 text-gray-400 hover:text-white"
              title="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

const FoodDetailModal = React.memo(({ isOpen, listing, onClose, userRole }) => {
  const router = useRouter();

  const handleClaimClick = useCallback(() => {
    if (userRole === "recipient") {
      router.push("/recipientDashboard");
    } else {
      router.push("/providerDashboard");
    }
  }, [router, userRole]);

  const handleContactProvider = useCallback(() => {
    // Navigate to a contact/message page or open a messaging modal
    console.log("Contact provider functionality");
  }, []);

  if (!isOpen || !listing) return null;

  const status = getListingStatus(listing.expiryTime, listing.quantity);
  const isPlaceholder = listing.isPlaceholder;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-300" />
          </button>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">
                {listing.title}
              </h2>
              <p className="text-gray-300 flex items-center gap-2">
                <Users className="h-4 w-4" />{" "}
                {listing.providerName || "Provider Name"}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${status.color} ${status.textColor}`}
            >
              {isPlaceholder ? "Unavailable" : status.text}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Food Image */}
            {listing.imageUrl && (
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-700">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                <Package className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {listing.quantity || 0}
                </div>
                <div className="text-sm text-gray-400">Portions</div>
              </div>

              <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                <Clock className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">
                  {formatDateTime(listing.expiryTime)}
                </div>
                <div className="text-sm text-gray-400">Expires</div>
              </div>

              <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                <MapPin className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-white truncate">
                  {listing.location || "Location"}
                </div>
                <div className="text-sm text-gray-400">Pickup</div>
              </div>

              <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                <UtensilsCrossed className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">
                  {listing.category || "Food"}
                </div>
                <div className="text-sm text-gray-400">Category</div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Description
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {listing.description ||
                  "No description available for this food listing."}
              </p>
            </div>

            {/* Allergen Information */}
            {listing.allergens && listing.allergens.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-amber-100 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  Allergen Information
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.allergens.map((allergen, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-amber-600/20 text-amber-100 border-amber-500"
                    >
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {listing.instructions && (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-100 mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Special Instructions
                </h3>
                <p className="text-blue-100 leading-relaxed">
                  {listing.instructions}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleContactProvider}
              className="border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white"
            >
              Contact Provider
            </Button>

            {userRole === "recipient" &&
              !status.isExpired &&
              !isPlaceholder && (
                <Button
                  onClick={handleClaimClick}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
                  disabled={status.isExpired || isPlaceholder}
                >
                  View in Dashboard
                </Button>
              )}

            {userRole === "provider" && (
              <Button
                onClick={handleClaimClick}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
              >
                Manage Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

NotificationCard.displayName = "NotificationCard";
FoodDetailModal.displayName = "FoodDetailModal";
