"use client"
import React, { useState } from "react";
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
// import { toast } from "@/hooks/use-toast";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useRouter } from "next/navigation";import { 
  useUserBookings, 
  useRateBooking, 
  useCancelBooking 
} from "@/hooks/useBookings";

const IntegratedClaimsPage = () => {
  const { user, isLoaded } = useUser();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();


  // Fetch user's bookings
  const {
    data: bookingsData,
    isLoading,
    error,
    refetch
  } = useUserBookings(user?.id);

  // Mutations
  const rateBookingMutation = useRateBooking();
  const cancelBookingMutation = useCancelBooking();

  const claims = bookingsData?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-600 text-white";
      case "collected":
        return "bg-gray-500 text-white";
      case "pending":
        return "bg-yellow-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      case "expired":
        return "bg-orange-600 text-white";
      case "cancelled":
        return "bg-gray-600 text-white";
      default:
        return "bg-emerald-500 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <Check className="h-3 w-3" />;
      case "collected":
        return <Package className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "rejected":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Ready for Pickup";
      case "collected":
        return "Completed";
      case "pending":
        return "Awaiting Approval";
      case "rejected":
        return "Rejected";
      case "expired":
        return "Expired";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
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
    return new Date() > new Date(expiryDate);
  };

  const getTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) return `${minutes}m left`;
    return `${hours}h ${minutes}m left`;
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
  };

  const activeClaims = claims.filter(claim => 
    ['pending', 'approved'].includes(claim.status)
  );

  const goToDashboard = () => {
    router.push('/recipientDashboard');
  };

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">My Claims</h2>
            <p className="text-gray-400">Loading your claimed food items...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">My Claims</h2>
            <p className="text-gray-400">Error loading your claims</p>
          </div>
        </div>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              Failed to Load Claims
            </h3>
            <p className="text-gray-400 mb-4">
              {error.message || "Something went wrong"}
            </p>
            <Button onClick={handleRefresh} className="bg-emerald-600 hover:bg-emerald-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">My Claims</h2>
          <p className="text-gray-400">Track your claimed food items</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-600 text-white">
            {activeClaims.length} Active
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
        {claims.map((claim) => (
          <Card key={claim._id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-gray-100 text-lg mb-2">
                    {claim.listingId?.title || claim.title || "Food Item"}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4" />
                      <span>
                        {claim.approvedQuantity > 0 
                          ? `${claim.approvedQuantity} approved`
                          : `${claim.requestedQuantity} requested`
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Claimed {formatTime(claim.requestedAt || claim.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {claim.status === 'approved' && claim.qrCodeExpiry && (
                    <Badge className={isQRExpired(claim.qrCodeExpiry) ? "bg-red-600" : "bg-blue-600"}>
                      {getTimeRemaining(claim.qrCodeExpiry)}
                    </Badge>
                  )}
                  <Badge className={getStatusColor(claim.status)}>
                    {getStatusIcon(claim.status)}
                    <span className="ml-1">{getStatusText(claim.status)}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>{claim.listingId?.location || claim.pickupLocation || "Location not specified"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>{claim.providerName || "Provider"}</span>
                </div>
                {claim.scheduledPickupTime && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Pickup: {formatTime(claim.scheduledPickupTime)}</span>
                  </div>
                )}
                {claim.collectedAt && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Collected: {formatTime(claim.collectedAt)}</span>
                  </div>
                )}
              </div>

              <Separator className="bg-gray-700 my-4" />

              <div className="flex flex-wrap gap-2">
                {claim.status === "approved" && claim.qrCode && !isQRExpired(claim.qrCodeExpiry) && (
                  <Button
                    size="sm"
                    onClick={() => handleViewQRCode(claim)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                )}

                {claim.status === "approved" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => {
                        // Implement directions functionality
                        toast({
                          title: "Directions",
                          description: "Opening directions to pickup location...",
                        });
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Directions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => {
                        // Implement contact functionality
                        toast({
                          title: "Contact",
                          description: "Contact feature coming soon...",
                        });
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </>
                )}

                {claim.status === "collected" && !claim.rating && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleRateBooking(claim)}
                    disabled={rateBookingMutation.isPending}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate Experience
                  </Button>
                )}

                {claim.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-600 text-yellow-400 cursor-default"
                      disabled
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Awaiting Approval
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
                  </>
                )}

                {claim.status === "approved" && (
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
                )}
              </div>

              {/* Provider Response */}
              {claim.status === "rejected" && claim.providerResponse && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    <strong>Provider Response:</strong> {claim.providerResponse}
                  </p>
                </div>
              )}

              {/* Rating Display */}
              {claim.rating && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-400 text-sm font-medium">Your Rating:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < claim.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {claim.feedback && (
                    <p className="text-gray-300 text-sm">{claim.feedback}</p>
                  )}
                </div>
              )}

              {/* Special notices */}
              {claim.status === 'approved' && claim.qrCodeExpiry && isQRExpired(claim.qrCodeExpiry) && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">
                      QR Code has expired. Please contact the provider or make a new booking.
                    </span>
                  </div>
                </div>
              )}

              {claim.isUrgent && (
                <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400 text-sm font-medium">
                      Urgent pickup required - expires soon!
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {claims.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No Claims Yet
            </h3>
            <p className="text-gray-400 mb-4">
              Start browsing food listings to make your first claim
            </p>
            <Button onClick={goToDashboard} className="bg-emerald-600 hover:bg-emerald-700">
              Browse Food Listings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code Display Modal */}
      {showQRCode && selectedBooking && (
        <QRCodeDisplay
          booking={selectedBooking}
          onClose={handleCloseQRCode}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center justify-between">
                Rate Your Experience
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Rating (1-5 stars)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-400 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:border-emerald-500 focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {feedback.length}/500 characters
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowRatingModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300"
                  disabled={rateBookingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitRating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={rating === 0 || rateBookingMutation.isPending}
                >
                  {rateBookingMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Submit Rating
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IntegratedClaimsPage;