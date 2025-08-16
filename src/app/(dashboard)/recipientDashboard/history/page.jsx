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
  const [sortBy, setSortBy] = useState('newest');
  const [imageErrors, setImageErrors] = useState(new Set());

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

  const stats = {
    total: claims.length,
    completed: claims.filter(c => c.status === 'collected').length,
    pending: claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    cancelled: claims.filter(c => ['cancelled', 'rejected', 'expired'].includes(c.status)).length,
    itemsSaved: claims
      .filter(c => c.status === 'collected')
      .reduce((sum, c) => sum + (c.approvedQuantity || 0), 0),
    averageRating: claims.filter(c => c.rating).reduce((sum, c, _, arr) => 
      sum + c.rating / arr.length, 0) || 0
  };

  const statusOptions = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'collected', label: 'Completed', count: stats.completed },
    { value: 'approved', label: 'Ready', count: stats.approved },
    { value: 'pending', label: 'Pending', count: stats.pending },
    { value: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  if (!isLoaded || isLoading) {
    // Simplified Loading Skeleton for brevity
    return <div className="p-4 text-white">Loading history...</div>
  }

  if (error) {
     // Simplified Error State
    return <div className="p-4 text-red-400">Error loading history. Please try again.</div>
  }

  return (
    <div className="space-y-6">
      {/* --- Responsive Header --- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Claim History</h2>
          <p className="text-gray-400">Your complete food claiming journey</p>
        </div>
        <Button
          onClick={refetch}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 self-start sm:self-auto"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* --- Responsive Statistics Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold text-white">{stats.itemsSaved}</p>
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

      {/* --- Responsive Filters --- */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-100 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Sort
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
                Newest
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
                Oldest
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
                Rating
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Responsive History List --- */}
      <div className="space-y-4">
        {sortedClaims.length > 0 ? (
          sortedClaims.map((claim) => (
            <Card key={claim._id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
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
                      <Badge className={`${getStatusColor(claim.status)} self-start`}>
                        {getStatusIcon(claim.status)}
                        <span className="ml-1">{getStatusText(claim.status)}</span>
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                       <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {claim.approvedQuantity > 0 
                            ? `${claim.approvedQuantity} items`
                            : `${claim.requestedQuantity} requested`
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{claim.providerName || "Provider"}</span>
                      </div>
                       <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>Claimed {formatTime(claim.requestedAt || claim.createdAt)}</span>
                      </div>
                      {claim.collectedAt && (
                        <div className="flex items-center space-x-2 text-green-400">
                          <Check className="h-4 w-4" />
                          <span>Collected: {formatTime(claim.collectedAt)}</span>
                        </div>
                      )}
                    </div>
                    
                    {claim.rating && (
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < claim.rating ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} />
                        ))}
                        <span className="text-sm text-gray-400">({claim.rating}/5)</span>
                      </div>
                    )}
                  </div>
                </div>
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
                  : `No claims found with the status: ${statusFilter}`
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