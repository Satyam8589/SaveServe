"use client"
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from 'axios';
import {
  History,
  Package,
  MapPin,
  Clock,
  Users,
  Star,
  Check,
  AlertTriangle,
  X,
  RefreshCw,
  Calendar,
  Filter,
  TrendingUp,
  Award,
  Utensils,
  Archive,
  MessageCircle,
  Send
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
import { useUserBookings } from "@/hooks/useBookings";
import { useTimeCalculations } from "@/hooks/useTimeCalculations";

// Rating Modal Component
const RatingModal = ({ claim, isOpen, onClose, onSubmit, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    await onSubmit(claim._id, rating, feedback);
    setRating(0);
    setFeedback('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center">
            <Star className="mr-2 h-5 w-5" />
            Rate Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h4 className="text-gray-200 font-medium mb-2">
                {claim.listingId?.title || claim.title || "Food Item"}
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                From: {claim.providerName || "Provider"}
              </p>
            </div>

            <div>
              <label className="text-gray-300 text-sm mb-2 block">Rating *</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-500'
                      } hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-300 text-sm mb-2 block">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-gray-500 text-xs mt-1">{feedback.length}/500</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Rating
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function HistoryPage() {
  const { user, isLoaded } = useUser();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [imageErrors, setImageErrors] = useState(new Set());
  
  // API synchronization states
  const [enrichedClaims, setEnrichedClaims] = useState([]);
  const [isEnrichingData, setIsEnrichingData] = useState(false);
  
  // Rating modal states
  const [ratingModal, setRatingModal] = useState({ isOpen: false, claim: null });
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch
  } = useUserBookings(user?.id);

  // Use the unified time calculations hook
  const { 
    getTimeRemaining, 
    getBadgeColor, 
    isExpired: checkExpired, 
    formatExpiryTime,
    getExpiryTime
  } = useTimeCalculations();

  // Function to enrich claims with fresh API data (same as main claims page)
  const enrichClaimsWithAPIData = async (claims) => {
    if (!claims || claims.length === 0) return [];

    try {
      setIsEnrichingData(true);
      console.log('🔄 [History] Enriching claims with fresh API data...');

      // Fetch fresh food listings data
      const response = await fetch('/api/food-listings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch food listings');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('API returned error');
      }

      const apiListings = data.data;
      console.log('📊 [History] Fetched API listings:', apiListings.length);

      // Enrich each claim with fresh API data
      const enriched = claims.map(claim => {
        const listingId = claim.listingId?._id || claim.listingId || claim.foodListing?._id || claim.listing?._id;
        
        if (!listingId) {
          console.warn('⚠️ [History] No listing ID found for claim:', claim._id);
          return claim;
        }

        // Find matching listing in API data
        const freshListing = apiListings.find(listing => listing.id === listingId.toString());
        
        if (freshListing) {
          console.log('✅ [History] Found fresh data for claim:', claim._id);
          
          // Create enriched claim with fresh API data
          const enrichedClaim = {
            ...claim,
            // Update the listingId object with fresh data
            listingId: {
              ...claim.listingId,
              expiryTime: freshListing.expiryTime,
              freshnessHours: freshListing.freshnessHours,
              freshnessStatus: freshListing.freshnessStatus,
              availabilityWindow: freshListing.availabilityWindow,
              title: freshListing.title,
              location: freshListing.location
            },
            // Also update direct properties for consistency
            expiryTime: freshListing.expiryTime,
            freshnessHours: freshListing.freshnessHours,
            freshnessStatus: freshListing.freshnessStatus
          };

          console.log('🔍 [History] Enriched claim data:', {
            claimId: claim._id,
            originalExpiry: claim.expiryTime,
            freshExpiry: freshListing.expiryTime,
            enrichedExpiry: enrichedClaim.expiryTime
          });

          return enrichedClaim;
        } else {
          console.warn('⚠️ [History] No fresh data found for listing:', listingId);
          return claim;
        }
      });

      console.log('✅ [History] Claims enrichment completed');
      return enriched;

    } catch (error) {
      console.error('❌ [History] Error enriching claims with API data:', error);
      return claims; // Return original claims if enrichment fails
    } finally {
      setIsEnrichingData(false);
    }
  };

  // Enrich claims when bookings data changes
  useEffect(() => {
    const processClaims = async () => {
      if (bookingsData?.data) {
        const enriched = await enrichClaimsWithAPIData(bookingsData.data);
        setEnrichedClaims(enriched);
      }
    };

    processClaims();
  }, [bookingsData]);

  const handleImageError = (claimId) => {
    setImageErrors(prev => new Set([...prev, claimId]));
  };

  const getStatusColor = (status, claim = null) => {
    switch (status) {
      case "approved":
        return "bg-emerald-600 text-white";
      case "collected":
        return "bg-green-600 text-white";
      case "pending":
        return "bg-yellow-600 text-white";
      case "scanning":
        return "bg-blue-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      case "expired":
        return "bg-orange-600 text-white";
      case "cancelled":
        if (claim?.autoCancel) {
          return "bg-purple-600 text-white";
        }
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status, claim = null) => {
    switch (status) {
      case "approved":
        return <Check className="h-3 w-3" />;
      case "collected":
        return <Package className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "scanning":
        return <RefreshCw className="h-3 w-3" />;
      case "rejected":
        return <X className="h-3 w-3" />;
      case "expired":
        return <AlertTriangle className="h-3 w-3" />;
      case "cancelled":
        if (claim?.autoCancel) {
          return <Archive className="h-3 w-3" />;
        }
        return <X className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusText = (status, claim = null) => {
    switch (status) {
      case "approved":
        return "Ready for Pickup";
      case "collected":
        return "Successfully Completed";
      case "pending":
        return "Awaiting Approval";
      case "scanning":
        return "Scan QR Code";
      case "rejected":
        return "Request Rejected";
      case "expired":
        return "Listing Expired";
      case "cancelled":
        if (claim?.autoCancel) {
          switch (claim.cancelReason) {
            case 'pickup_timeout':
              return "Auto-cancelled (Pickup Timeout)";
            case 'approval_timeout':
              return "Auto-cancelled (Approval Timeout)";
            case 'scanning_timeout':
              return "Auto-cancelled (Scanning Timeout)";
            default:
              return "Auto-cancelled";
          }
        }
        return "Manually Cancelled";
      default:
        return status;
    }
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rating submission handler
  const handleRatingSubmit = async (claimId, rating, feedback) => {
    try {
      setIsSubmittingRating(true);
      
      const response = await axios.patch(`/api/bookings/${claimId}/rate`, {
        rating,
        feedback
      });

      if (response.data.success) {
        // Update the enriched claims with the new rating
        setEnrichedClaims(prev => prev.map(claim => 
          claim._id === claimId 
            ? { ...claim, rating, feedback }
            : claim
        ));
        
        // Also refetch to ensure consistency
        await refetch();
        
        console.log('✅ Rating submitted successfully');
      }
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Use enriched claims for display
  const claims = enrichedClaims;

  const filteredClaims = claims.filter(claim => {
    if (statusFilter === 'all') return true;
    return claim.status === statusFilter;
  });

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.requestedAt || 0);
    const dateB = new Date(b.createdAt || b.requestedAt || 0);
    switch (sortBy) {
      case 'newest':
        return dateB - dateA;
      case 'oldest':
        return dateA - dateB;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return dateB - dateA;
    }
  });

  // Calculate stats
  const stats = {
    total: claims.length,
    completed: claims.filter(c => c.status === 'collected').length,
    pending: claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    scanning: claims.filter(c => c.status === 'scanning').length,
    cancelled: claims.filter(c => ['cancelled', 'rejected', 'expired'].includes(c.status)).length,
    autoCancelled: claims.filter(c => c.status === 'cancelled' && c.autoCancel).length,
    manualCancelled: claims.filter(c => c.status === 'cancelled' && !c.autoCancel).length,
    itemsSaved: claims
      .filter(c => c.status === 'collected')
      .reduce((sum, c) => sum + (c.approvedQuantity || 0), 0),
    averageRating: claims.filter(c => c.rating).reduce((sum, c, _, arr) => 
      sum + c.rating / arr.length, 0) || 0
  };

  const statusOptions = [
    { value: 'all', label: 'All Items', count: stats.total },
    { value: 'collected', label: 'Completed', count: stats.completed },
    { value: 'approved', label: 'Ready', count: stats.approved },
    { value: 'scanning', label: 'Scanning', count: stats.scanning },
    { value: 'pending', label: 'Pending', count: stats.pending },
    { value: 'cancelled', label: 'Cancelled', count: stats.cancelled },
    { value: 'rejected', label: 'Rejected', count: claims.filter(c => c.status === 'rejected').length },
    { value: 'expired', label: 'Expired', count: claims.filter(c => c.status === 'expired').length },
  ];

  const handleRefresh = async () => { 
    await refetch();
    // Re-enrich data after refresh
    if (bookingsData?.data) {
      const enriched = await enrichClaimsWithAPIData(bookingsData.data);
      setEnrichedClaims(enriched);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading your food history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">Error loading history. Please try again.</p>
        <Button onClick={refetch} className="bg-emerald-600 hover:bg-emerald-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Food History</h2>
          <p className="text-gray-400">Your complete food claiming journey</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 self-start sm:self-auto"
          disabled={isLoading || isEnrichingData}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isEnrichingData) ? 'animate-spin' : ''}`} />
          {isEnrichingData ? 'Syncing...' : 'Refresh'}
        </Button>
      </div>

      {/* API Sync Indicator */}
      {isEnrichingData && (
        <div className="flex items-center justify-center p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent mr-2" />
          <span className="text-blue-400 text-sm">Synchronizing with latest data...</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium">Total Claims</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-emerald-300 text-xs">All time</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-900 to-green-800 border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-green-300 text-xs">{stats.itemsSaved} items saved</p>
              </div>
              <Check className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-white">
                  {stats.pending + stats.approved + stats.scanning}
                </p>
                <p className="text-blue-300 text-xs">Pending processing</p>
              </div>
              <Clock className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm font-medium">Avg Rating</p>
                <p className="text-2xl font-bold text-white">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                </p>
                <p className="text-yellow-300 text-xs">User satisfaction</p>
              </div>
              <Award className="h-8 w-8 text-yellow-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-100 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={statusFilter === option.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(option.value)}
                  className={`transition-colors ${statusFilter === option.value 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {option.label} ({option.count})
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="bg-gray-600 h-auto hidden md:block" />
            <Separator className="bg-gray-700 md:hidden" />

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={sortBy === 'newest' ? "default" : "outline"}
                onClick={() => setSortBy('newest')}
                className={`transition-colors ${sortBy === 'newest' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Newest First
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'oldest' ? "default" : "outline"}
                onClick={() => setSortBy('oldest')}
                className={`transition-colors ${sortBy === 'oldest' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Oldest First
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'rating' ? "default" : "outline"}
                onClick={() => setSortBy('rating')}
                className={`transition-colors ${sortBy === 'rating' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                By Rating
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {sortedClaims.length > 0 ? (
          sortedClaims.map((claim) => {
            const isCompleted = ['collected', 'cancelled', 'rejected', 'expired'].includes(claim.status);
            const isActive = ['pending', 'approved', 'scanning'].includes(claim.status);
            
            // Use unified time calculations for active claims with API-synced data
            let timeInfo = null;
            if (isActive) {
              const timeRemaining = getTimeRemaining(claim);
              const expired = checkExpired(claim);
              
              timeInfo = {
                expired,
                text: timeRemaining.text,
                urgent: timeRemaining.totalMinutes < 60 || expired
              };
              
              console.log('⏰ [History] Time calculation for claim:', {
                claimId: claim._id,
                status: claim.status,
                timeRemainingText: timeRemaining.text,
                isExpired: expired,
                expiryTime: getExpiryTime(claim).toISOString()
              });
            }
            
            return (
              <Card key={claim._id} className={`${isCompleted ? 'bg-gray-800/70' : 'bg-gray-800'} border-gray-700 hover:border-gray-600 transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      <div className="h-20 w-20 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {claim.listingId?.imageUrl && !imageErrors.has(claim._id) ? (
                          <img 
                            src={claim.listingId.imageUrl} 
                            alt={claim.listingId?.title || "Food item"}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(claim._id)}
                          />
                        ) : (
                          <Utensils className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                        <CardTitle className="text-gray-100 text-lg truncate">
                          {claim.listingId?.title || claim.title || "Food Item"}
                        </CardTitle>
                        <div className="flex flex-col items-start sm:items-end gap-1">
                          <Badge className={`${getStatusColor(claim.status, claim)} self-start sm:self-end`}>
                            {getStatusIcon(claim.status, claim)}
                            <span className="ml-1">{getStatusText(claim.status, claim)}</span>
                          </Badge>
                          {timeInfo && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              timeInfo.expired 
                                ? 'bg-red-900 text-red-200' 
                                : timeInfo.urgent
                                ? 'bg-red-800 text-red-200'
                                : 'bg-yellow-900 text-yellow-200'
                            }`}>
                              {timeInfo.text}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {claim.approvedQuantity > 0 
                              ? `${claim.approvedQuantity} items approved`
                              : `${claim.requestedQuantity || 1} requested`
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{claim.providerName || "Provider"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>Claimed: {formatTime(claim.requestedAt || claim.createdAt)}</span>
                        </div>
                        {claim.collectedAt && (
                          <div className="flex items-center space-x-2 text-green-400">
                            <Check className="h-4 w-4" />
                            <span>Collected: {formatTime(claim.collectedAt)}</span>
                          </div>
                        )}
                        {claim.cancelledAt && (
                          <div className="flex items-center space-x-2 text-red-400">
                            <X className="h-4 w-4" />
                            <span>
                              {claim.autoCancel ? 'Auto-Cancelled' : 'Cancelled'}: {formatTime(claim.cancelledAt)}
                            </span>
                          </div>
                        )}
                        {claim.rejectedAt && (
                          <div className="flex items-center space-x-2 text-red-400">
                            <X className="h-4 w-4" />
                            <span>Rejected: {formatTime(claim.rejectedAt)}</span>
                          </div>
                        )}
                        {claim.expiredAt && (
                          <div className="flex items-center space-x-2 text-orange-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Expired: {formatTime(claim.expiredAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Rating display and action button */}
                      <div className="flex items-center justify-between">
                        {claim.rating && (
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < claim.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-500"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-400 ml-2">
                              ({claim.rating}/5)
                            </span>
                            {claim.feedback && (
                              <MessageCircle className="h-4 w-4 text-gray-400 ml-1" />
                            )}
                          </div>
                        )}

                        {/* Rate button for completed items without rating */}
                        {claim.status === 'collected' && !claim.rating && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRatingModal({ isOpen: true, claim })}
                            className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/10"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Rate Experience
                          </Button>
                        )}
                      </div>

                      {/* Show feedback if exists */}
                      {claim.feedback && claim.rating && (
                        <div className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                          <p className="text-sm text-gray-300">
                            <MessageCircle className="h-4 w-4 inline mr-1" />
                            "{claim.feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <History className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                {statusFilter === "all"
                  ? "No Food History Yet"
                  : `No ${statusFilter} items found`}
              </h3>
              <p className="text-gray-400 mb-4">
                {statusFilter === "all"
                  ? "Start claiming food items to build your history"
                  : `No items found with the status: ${statusFilter}`}
              </p>
              {statusFilter !== "all" && (
                <Button
                  onClick={() => setStatusFilter("all")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  View All Items
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rating Modal */}
      <RatingModal
        claim={ratingModal.claim}
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, claim: null })}
        onSubmit={handleRatingSubmit}
        isSubmitting={isSubmittingRating}
      />
    </div>
  );
}