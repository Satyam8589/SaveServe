"use client"
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Package,
  MapPin,
  Clock,
  Users,
  Navigation,
  Star,
  Check,
  ShoppingCart,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Phone,
  Calendar,
  X,
  MessageCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// import { toast } from "@/hooks/use-toast"; // Assuming you have a toast component
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useRouter } from "next/navigation";
import { 
  useUserBookings, 
  useRateBooking, 
  useCancelBooking 
} from "@/hooks/useBookings";

// A placeholder for the toast function if not available
const toast = (options) => {
  console.log("Toast:", options);
  alert(options.description);
};

const IntegratedClaimsPage = () => {
  const { user, isLoaded } = useUser();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch
  } = useUserBookings(user?.id);

  const rateBookingMutation = useRateBooking();
  const cancelBookingMutation = useCancelBooking();

  // Update current time every minute to refresh time displays
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const allClaims = bookingsData?.data || [];

  // Filter claims to only show 'approved' status
  const claimsToShow = allClaims.filter(claim => claim.status === 'approved');

  // Get actual expiry time from multiple possible sources
  const getExpiryTime = (claim) => {
    // Priority order for finding expiry time
    return claim.listingId?.expiryTime || 
           claim.expiryTime || 
           claim.listingId?.availabilityWindow?.end ||
           claim.scheduledPickupTime ||
           null;
  };

  // Calculate actual time remaining
  const getActualTimeRemaining = (claim) => {
    const expiryTime = getExpiryTime(claim);
    
    if (!expiryTime) {
      // Fallback: calculate 6 hours from claim creation
      const createdAt = new Date(claim.createdAt || claim.requestedAt || Date.now());
      const fallbackExpiry = new Date(createdAt.getTime() + (6 * 60 * 60 * 1000));
      return calculateTimeLeft(fallbackExpiry);
    }
    
    return calculateTimeLeft(expiryTime);
  };

  // Helper function to calculate time left
  const calculateTimeLeft = (expiryTime) => {
    const now = currentTime;
    const expiry = new Date(expiryTime);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (totalMinutes < 60) {
      return `${minutes}m left`;
    } else if (hours < 24) {
      return `${hours}h ${minutes}m left`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h left`;
    }
  };

  // Get urgency-based badge color
  const getUrgencyBadgeColor = (claim) => {
    const expiryTime = getExpiryTime(claim);
    
    if (!expiryTime) {
      // Fallback calculation
      const createdAt = new Date(claim.createdAt || claim.requestedAt || Date.now());
      const fallbackExpiry = new Date(createdAt.getTime() + (6 * 60 * 60 * 1000));
      return getBadgeColorByTime(fallbackExpiry);
    }
    
    return getBadgeColorByTime(expiryTime);
  };

  // Helper to get badge color based on time remaining
  const getBadgeColorByTime = (expiryTime) => {
    const now = currentTime;
    const expiry = new Date(expiryTime);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "bg-red-600"; // Expired
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours <= 1) return "bg-red-600";     // Critical - 1 hour or less
    if (hours <= 3) return "bg-orange-600";  // Warning - 3 hours or less  
    if (hours <= 6) return "bg-yellow-600";  // Caution - 6 hours or less
    if (hours <= 12) return "bg-blue-600";   // Normal - 12 hours or less
    return "bg-green-600";                   // Good - more than 12 hours
  };

  // Check if item is expired
  const isExpired = (claim) => {
    const expiryTime = getExpiryTime(claim);
    
    if (!expiryTime) {
      const createdAt = new Date(claim.createdAt || claim.requestedAt || Date.now());
      const fallbackExpiry = new Date(createdAt.getTime() + (6 * 60 * 60 * 1000));
      return currentTime > fallbackExpiry;
    }
    
    return currentTime > new Date(expiryTime);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-600 text-white";
      case "collected":
        return "bg-gray-500 text-white";
      case "pending":
        return "bg-yellow-600 text-white";
      default:
        return "bg-emerald-500 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <Check className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusText = (status) => {
    return "Ready for Pickup";
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isQRExpired = (expiryDate) => {
    return currentTime > new Date(expiryDate);
  };

  const handleViewQRCode = (claim) => {
    setSelectedBooking(claim);
    setShowQRCode(true);
  };

  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setSelectedBooking(null);
  };

  const handleRateBooking = (booking) => {
    setSelectedBooking(booking);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!selectedBooking || rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }
    try {
      await rateBookingMutation.mutateAsync({
        bookingId: selectedBooking._id,
        rating,
        feedback: feedback.trim()
      });
      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });
      setShowRatingModal(false);
      setSelectedBooking(null);
      setRating(0);
      setFeedback("");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }
    try {
      await cancelBookingMutation.mutateAsync({
        bookingId: booking._id,
        reason: "Cancelled by user"
      });
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    setCurrentTime(new Date()); // Also update current time
  };

  const goToDashboard = () => {
    router.push('/recipientDashboard');
  };

  if (!isLoaded || isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading claims. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Ready for Pickup</h2>
          <p className="text-gray-400">Items you need to collect.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-600 text-white">
            {claimsToShow.length} Ready for Pickup
          </Badge>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {claimsToShow.map((claim) => (
          <Card key={claim._id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="p-4 sm:p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-3">
                <div className="flex-1">
                  <CardTitle className="text-gray-100 text-lg mb-2">
                    {claim.listingId?.title || claim.title || "Food Item"}
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-400">
                    <div className="flex items-center space-x-1.5">
                      <Package className="h-4 w-4" />
                      <span>
                        {claim.approvedQuantity} approved
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Claimed {formatTime(claim.requestedAt || claim.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
                  {/* Show actual time remaining from database */}
                  <Badge className={`${getUrgencyBadgeColor(claim)} text-white`}>
                    {getActualTimeRemaining(claim)}
                  </Badge>
                  
                  <Badge className={`${getStatusColor(claim.status)} whitespace-nowrap`}>
                    {getStatusIcon(claim.status)}
                    <span className="ml-1">{getStatusText(claim.status)}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-300 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{claim.listingId?.location || claim.pickupLocation || "Location not specified"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{claim.providerName || "Provider"}</span>
                </div>
                {claim.scheduledPickupTime && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Pickup: {formatTime(claim.scheduledPickupTime)}</span>
                  </div>
                )}
              </div>
              <Separator className="bg-gray-700 my-4" />
              <div className="flex flex-wrap gap-2">
                {claim.qrCode && !isQRExpired(claim.qrCodeExpiry) && (
                  <Button
                    size="sm"
                    onClick={() => handleViewQRCode(claim)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => {/* Implement directions */}}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Directions
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => {/* Implement contact */}}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                  onClick={() => handleCancelBooking(claim)}
                  disabled={cancelBookingMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
              
              {/* Show expiry warning for food items */}
              {isExpired(claim) && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">
                      This food item has expired. Please contact the provider.
                    </span>
                  </div>
                </div>
              )}
              
              {/* Show QR expiry warning separately */}
              {claim.qrCodeExpiry && isQRExpired(claim.qrCodeExpiry) && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">
                      QR Code has expired. Please contact the provider.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {claimsToShow.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No Items Ready for Pickup
            </h3>
            <p className="text-gray-400 mb-4">
              Approved claims will appear here. Find something new to claim!
            </p>
            <Button onClick={goToDashboard} className="bg-emerald-600 hover:bg-emerald-700">
              Browse Food Listings
            </Button>
          </CardContent>
        </Card>
      )}

      {showQRCode && selectedBooking && (
        <QRCodeDisplay
          booking={selectedBooking}
          onClose={handleCloseQRCode}
        />
      )}
      
      {showRatingModal && <div />} 
    </div>
  );
};

export default IntegratedClaimsPage;