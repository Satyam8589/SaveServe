// hooks/useTimeCalculations.js
import { useState, useEffect } from 'react';

export const useTimeCalculations = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Unified function to get expiry time from any booking/claim object
  const getExpiryTime = (item) => {
    // Try direct expiry time first
    const directExpiry = item.expiryTime || 
                        item.listingId?.expiryTime || 
                        item.foodListing?.expiryTime || 
                        item.listing?.expiryTime;
    
    if (directExpiry) {
      return new Date(directExpiry);
    }

    // Try availability window end
    const availabilityEnd = item.listingId?.availabilityWindow?.end ||
                           item.foodListing?.availabilityWindow?.end ||
                           item.listing?.availabilityWindow?.end;
    
    if (availabilityEnd) {
      return new Date(availabilityEnd);
    }

    // Try scheduled pickup time
    if (item.scheduledPickupTime) {
      return new Date(item.scheduledPickupTime);
    }

    // Calculate from start time + freshness hours
    const foodData = item.listingId || item.foodListing || item.listing || item;
    const startTime = foodData.availabilityWindow?.startTime;
    let freshnessHours = foodData.freshnessHours;

    // If no direct freshness hours, parse from status
    if (!freshnessHours && foodData.freshnessStatus) {
      const freshnessHoursMap = {
        "Fresh": 24,
        "Safe to Eat for 12 hours": 12,
        "Safe to Eat for 8 hours": 8,
        "Safe to Eat for 6 hours": 6,
        "Safe to Eat for 4 hours": 4,
        "Safe to Eat for 2 hours": 2
      };
      freshnessHours = freshnessHoursMap[foodData.freshnessStatus] || 24;
    }

    if (startTime && freshnessHours) {
      const start = new Date(startTime);
      return new Date(start.getTime() + (freshnessHours * 60 * 60 * 1000));
    }

    // Final fallback - 6 hours from creation/request time
    const creationTime = item.createdAt || item.requestedAt || Date.now();
    return new Date(new Date(creationTime).getTime() + (6 * 60 * 60 * 1000));
  };

  // Unified function to calculate time remaining
  const calculateTimeRemaining = (expiryTime) => {
    const expiry = new Date(expiryTime);
    const diff = expiry.getTime() - currentTime.getTime();
    
    if (diff <= 0) return { text: "Expired", isExpired: true, totalMinutes: 0 };
    
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let text;
    if (totalMinutes < 60) {
      text = `${minutes}m left`;
    } else if (hours < 24) {
      text = `${hours}h ${minutes}m left`;
    } else {
      text = `${days}d ${remainingHours}h left`;
    }

    return { 
      text, 
      isExpired: false, 
      totalMinutes,
      hours,
      minutes,
      days,
      remainingHours
    };
  };

  // Get time remaining for any item
  const getTimeRemaining = (item) => {
    const expiryTime = getExpiryTime(item);
    return calculateTimeRemaining(expiryTime);
  };

  // Get badge color based on time remaining
  const getBadgeColor = (item) => {
    const timeRemaining = getTimeRemaining(item);
    
    if (timeRemaining.isExpired) return "bg-red-600";
    if (timeRemaining.hours <= 1) return "bg-red-600";
    if (timeRemaining.hours <= 3) return "bg-orange-600";
    if (timeRemaining.hours <= 6) return "bg-yellow-600";
    if (timeRemaining.hours <= 12) return "bg-blue-600";
    return "bg-green-600";
  };

  // Check if item is expired
  const isExpired = (item) => {
    return getTimeRemaining(item).isExpired;
  };

  // Format expiry time for display
  const formatExpiryTime = (item) => {
    const expiryTime = getExpiryTime(item);
    return expiryTime.toLocaleString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return {
    currentTime,
    getExpiryTime,
    getTimeRemaining,
    getBadgeColor,
    isExpired,
    formatExpiryTime,
    calculateTimeRemaining
  };
};