"use client"
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
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
  ImageIcon,
  Utensils
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

export default function HistoryPage() {
  const { user, isLoaded } = useUser();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, rating
  const [imageErrors, setImageErrors] = useState(new Set());

  // Fetch user's bookings (all history)
  const {
    data: bookingsData,
    isLoading,
    error,
    refetch
  } = useUserBookings(user?.id);

  const claims = bookingsData?.data || [];

  const handleImageError = (claimId) => {
    setImageErrors(prev => new Set([...prev, claimId]));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-600 text-white";
      case "collected":
        return "bg-green-600 text-white";
      case "pending":
        return "bg-yellow-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      case "expired":
        return "bg-orange-600 text-white";
      case "cancelled":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-500 text-white";
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
        return <X className="h-3 w-3" />;
      case "expired":
        return <AlertTriangle className="h-3 w-3" />;
      case "cancelled":
        return <X className="h-3 w-3" />;
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter claims based on status
  const filteredClaims = claims.filter(claim => {
    if (statusFilter === 'all') return true;
    return claim.status === statusFilter;
  });

  // Sort claims
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt || b.requestedAt) - new Date(a.createdAt || a.requestedAt);
      case 'oldest':
        return new Date(a.createdAt || a.requestedAt) - new Date(b.createdAt || b.requestedAt);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return new Date(b.createdAt || b.requestedAt) - new Date(a.createdAt || a.requestedAt);
    }
  });

  // Calculate statistics
  const stats = {
    total: claims.length,
    completed: claims.filter(c => c.status === 'collected').length,
    pending: claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    cancelled: claims.filter(c => ['cancelled', 'rejected', 'expired'].includes(c.status)).length,
    totalQuantity: claims.reduce((sum, c) => sum + (c.approvedQuantity || c.requestedQuantity || 0), 0),
    averageRating: claims.filter(c => c.rating).reduce((sum, c, _, arr) => 
      sum + c.rating / arr.length, 0) || 0
  };

  const statusOptions = [
    { value: 'all', label: 'All Claims', count: stats.total },
    { value: 'collected', label: 'Completed', count: stats.completed },
    { value: 'approved', label: 'Ready', count: stats.approved },
    { value: 'pending', label: 'Pending', count: stats.pending },
    { value: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Claim History</h2>
            <p className="text-gray-400">Loading your complete claim history...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="h-16 w-16 bg-gray-700 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                    </div>
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
            <h2 className="text-2xl font-bold text-gray-100">Claim History</h2>
            <p className="text-gray-400">Error loading your history</p>
          </div>
        </div>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              Failed to Load History
            </h3>
            <p className="text-gray-400 mb-4">
              {error.message || "Something went wrong"}
            </p>
            <Button onClick={refetch} className="bg-emerald-600 hover:bg-emerald-700">
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Claim History</h2>
          <p className="text-gray-400">Your complete food claiming journey</p>
        </div>
        <Button
          onClick={refetch}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium">Total Claims</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
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
              </div>
              <Check className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Items Saved</p>
                <p className="text-2xl font-bold text-white">{stats.totalQuantity}</p>
              </div>
              <Package className="h-8 w-8 text-blue-300" />
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
            Filters & Sort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={statusFilter === option.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(option.value)}
                  className={statusFilter === option.value 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "border-gray-600 text-gray-300"
                  }
                >
                  {option.label} ({option.count})
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="bg-gray-600 h-8" />

            {/* Sort Options */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === 'newest' ? "default" : "outline"}
                onClick={() => setSortBy('newest')}
                className={sortBy === 'newest' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-gray-600 text-gray-300"
                }
              >
                Newest First
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'oldest' ? "default" : "outline"}
                onClick={() => setSortBy('oldest')}
                className={sortBy === 'oldest' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-gray-600 text-gray-300"
                }
              >
                Oldest First
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'rating' ? "default" : "outline"}
                onClick={() => setSortBy('rating')}
                className={sortBy === 'rating' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "border-gray-600 text-gray-300"
                }
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
          sortedClaims.map((claim) => (
            <Card key={claim._id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex space-x-4">
                  {/* Food Image */}
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {claim.listingId?.imageUrl && !imageErrors.has(claim._id) ? (
                        <img 
                          src={claim.listingId.imageUrl} 
                          alt={claim.listingId?.title || claim.title || "Food item"}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(claim._id)}
                        />
                      ) : (
                        <Utensils className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-gray-100 text-lg mb-2 truncate">
                          {claim.listingId?.title || claim.title || "Food Item"}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 flex-wrap">
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>
                              {claim.approvedQuantity > 0 
                                ? `${claim.approvedQuantity} items`
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
                      <Badge className={getStatusColor(claim.status)}>
                        {getStatusIcon(claim.status)}
                        <span className="ml-1">{getStatusText(claim.status)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span className="truncate">{claim.listingId?.location || claim.pickupLocation || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span className="truncate">{claim.providerName || "Provider"}</span>
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

                {/* Food Description */}
                {claim.listingId?.description && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {claim.listingId.description}
                    </p>
                  </div>
                )}

                {/* Provider Response for rejected items */}
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
                      <span className="text-gray-300 text-sm">({claim.rating}/5)</span>
                    </div>
                    {claim.feedback && (
                      <p className="text-gray-300 text-sm">{claim.feedback}</p>
                    )}
                  </div>
                )}

                {/* Cancellation reason */}
                {claim.status === "cancelled" && claim.cancellationReason && (
                  <div className="mt-3 p-3 bg-gray-900/50 border border-gray-600/20 rounded-lg">
                    <p className="text-gray-400 text-sm">
                      <strong>Cancellation Reason:</strong> {claim.cancellationReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <History className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                {statusFilter === 'all' ? 'No Claims Yet' : `No ${statusFilter} claims`}
              </h3>
              <p className="text-gray-400 mb-4">
                {statusFilter === 'all' 
                  ? 'Start claiming food items to see your history here' 
                  : `No claims found with status: ${statusFilter}`
                }
              </p>
              {statusFilter !== 'all' && (
                <Button 
                  onClick={() => setStatusFilter('all')} 
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  View All Claims
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}