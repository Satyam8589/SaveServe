"use client";
import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useBookFoodListing } from "@/hooks/useBookings";
import { useBookingPermission } from "@/hooks/useBookingPermission";
import { useImpactScore } from "@/hooks/useImpactScore";
import { useUserProfile } from "@/hooks/useProfile";
import SuspensionNotification from "@/components/SuspensionNotification";
import {
  Utensils,
  Timer,
  Award,
  Heart,
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  Star,
  ShoppingCart,
  Eye,
  Bookmark,
  Check,
  Filter,
  Loader2,
  X,
  User,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

//result
// --- Mock API functions for favorites (replace with your actual API calls) ---
const fetchUserFavoritesAPI = async (userId) => {
  // In a real app, this would fetch from your database
  console.log(`Fetching favorites for user: ${userId}`);
  const favorites = JSON.parse(localStorage.getItem("userFavorites") || "[]");
  return { success: true, data: favorites };
};

const addToFavoritesAPI = async (userId, foodId) => {
  console.log(`Adding food ${foodId} to favorites for user ${userId}`);
  const favorites = JSON.parse(localStorage.getItem("userFavorites") || "[]");
  if (!favorites.includes(foodId)) {
    favorites.push(foodId);
    localStorage.setItem("userFavorites", JSON.stringify(favorites));
  }
  return { success: true };
};

const removeFromFavoritesAPI = async (userId, foodId) => {
  console.log(`Removing food ${foodId} from favorites for user ${userId}`);
  let favorites = JSON.parse(localStorage.getItem("userFavorites") || "[]");
  favorites = favorites.filter((id) => id !== foodId);
  localStorage.setItem("userFavorites", JSON.stringify(favorites));
  return { success: true };
};
// --- End of Mock API ---

export default function BrowseFoodPage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const bookFoodListingMutation = useBookFoodListing();

  const [filterType, setFilterType] = useState("all");
  const [foodTypeFilter, setFoodTypeFilter] = useState("all"); // Add food type filter
  const [sortBy, setSortBy] = useState("time");
  const [selectedFood, setSelectedFood] = useState(null);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [foodListings, setFoodListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recipientStats, setRecipientStats] = useState({
    impactScore: 0,
    mealsSaved: 0,
  });
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [requestMessage, setRequestMessage] = useState("");

  // --- New state for managing favorites ---
  const [favorites, setFavorites] = useState(new Set());
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(null); // Tracks which item is being updated

  // --- Booking permission and suspension notification ---
  const bookingPermission = useBookingPermission();
  const [showSuspensionNotification, setShowSuspensionNotification] =
    useState(false);

  // --- Impact Score ---
  const {
    impactScore,
    statistics,
    isLoading: impactLoading,
  } = useImpactScore(userId);

  // --- User Profile for role-based features ---
  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useUserProfile();

  useEffect(() => {
    fetchFoodListings();
    fetchFavorites();
  }, [userId]); // Re-fetch favorites if the user ID changes

  // Auto-refresh listings every 30 seconds to show updated quantities
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFoodListings();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchFoodListings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch("/api/food-listings");
      const data = await response.json();
      if (data.success) {
        setFoodListings(data.data);
        setLastUpdated(new Date());
        console.log("✅ Food listings refreshed successfully");
      } else {
        setError(data.message || "Failed to fetch listings");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // --- New function to fetch user's favorites ---
  const fetchFavorites = async () => {
    if (!userId) return;
    try {
      const response = await fetchUserFavoritesAPI(userId);
      if (response.success) {
        setFavorites(new Set(response.data));
      }
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  };

  // --- New function to handle adding/removing favorites ---
  const handleToggleFavorite = async (foodId) => {
    if (!userId) {
      alert("You must be logged in to save favorites.");
      return;
    }

    setIsTogglingFavorite(foodId);
    const isFavorited = favorites.has(foodId);

    try {
      if (isFavorited) {
        await removeFromFavoritesAPI(userId, foodId);
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(foodId);
          return newFavorites;
        });
      } else {
        await addToFavoritesAPI(userId, foodId);
        setFavorites((prev) => new Set(prev).add(foodId));
      }
    } catch (err) {
      console.error("Failed to update favorite status:", err);
      alert("Could not update your favorites. Please try again.");
    } finally {
      setIsTogglingFavorite(null);
    }
  };

  const handleClaimFood = (foodItem) => {
    // Check booking permissions first
    if (!bookingPermission.canBook) {
      setShowSuspensionNotification(true);
      return;
    }

    setSelectedFood(foodItem);
    setIsClaimDialogOpen(true);
  };

  const handleViewFood = (foodItem) => {
    setSelectedFood(foodItem);
    setIsViewDialogOpen(true);
  };

  const handleClaimFromView = () => {
    setIsViewDialogOpen(false);
    setTimeout(() => {
      setIsClaimDialogOpen(true);
    }, 150);
  };

  const confirmClaim = async () => {
    if (!selectedFood || !userId || !user?.fullName) {
      alert("Missing required information for booking.");
      return;
    }

    // Validate requested quantity against available quantity
    if (requestedQuantity > (selectedFood.availableNumeric || 0)) {
      alert(`Only ${selectedFood.availableNumeric || 0} ${selectedFood.quantity?.split(' ')[1] || 'units'} available. Please reduce your requested quantity.`);
      return;
    }

    if (requestedQuantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    try {
      const bookingData = {
        listingId: selectedFood.id,
        providerId: selectedFood.providerId,
        providerName: selectedFood.providerName,
        recipientId: userId,
        recipientName: user.fullName,
        requestedQuantity: requestedQuantity,
        requestMessage: requestMessage,
      };

      await bookFoodListingMutation.mutateAsync({
        listingId: selectedFood.id,
        bookingData,
      });

      alert("Food claimed successfully!");
      setIsClaimDialogOpen(false);
      setSelectedFood(null);
      setRequestedQuantity(1); // Reset quantity
      setRequestMessage(""); // Reset message

      // Refresh listings to show updated quantities and claims count
      console.log("🔄 Refreshing food listings after successful claim...");
      await fetchFoodListings();
      
      // Also trigger a refresh on the food listings API to update claims count
      try {
        await fetch("/api/food-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "refresh", listingId: selectedFood.id })
        });
      } catch (refreshError) {
        console.log("Refresh API call failed, but listings were updated:", refreshError);
      }
      
    } catch (error) {
      console.error("Error claiming food:", error);

      // Check if it's a suspension/blocking error
      if (
        error.message &&
        (error.message.includes("BOOKING_SUSPENDED") ||
          error.message.includes("BOOKING_BLOCKED"))
      ) {
        // Refresh permission status and show suspension notification
        bookingPermission.refetch();
        setShowSuspensionNotification(true);
        setIsClaimDialogOpen(false);
      } else {
        alert("Failed to claim food: " + (error.message || "Unknown error"));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "urgent":
        return "bg-red-500 text-white";
      case "available":
        return "bg-emerald-500 text-white";
      default:
        return "bg-emerald-500 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "urgent":
        return <AlertTriangle className="h-3 w-3" />;
      case "available":
        return <Check className="h-3 w-3" />;
      default:
        return <Check className="h-3 w-3" />;
    }
  };

  const filteredFood = foodListings.filter((food) => {
    const matchesFilter =
      filterType === "all" ||
      food.category === filterType ||
      food.type?.toLowerCase().replace(" ", "-") === filterType;

    const matchesFoodType =
      foodTypeFilter === "all" || food.foodType === foodTypeFilter;

    return matchesFilter && matchesFoodType;
  });

  const sortedFood = [...filteredFood].sort((a, b) => {
    switch (sortBy) {
      case "time":
        if (a.status === "urgent" && b.status !== "urgent") return -1;
        if (b.status === "urgent" && a.status !== "urgent") return 1;
        return new Date(a.expiryTime) - new Date(b.expiryTime);
      case "distance":
        return parseFloat(a.distance) - parseFloat(b.distance);
      case "rating":
        return b.rating - a.rating;
      case "quantity":
        return parseInt(b.quantity) - parseInt(a.quantity);
      default:
        return 0;
    }
  });

  const urgentCount = foodListings.filter((f) => f.status === "urgent").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="ml-2 text-gray-300">Loading food listings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-medium">
            Error Loading Food Listings
          </p>
          <p className="text-gray-300 text-sm mt-1">{error}</p>
          <Button
            onClick={fetchFoodListings}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Utensils className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-400">Available Now</p>
                <p className="text-xl font-bold text-gray-100">
                  {foodListings.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm text-gray-400">Expiring Soon</p>
                <p className="text-xl font-bold text-gray-100">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Impact Score</p>
                <p className="text-xl font-bold text-gray-100">
                  {impactLoading ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : (
                    `${impactScore}%`
                  )}
                </p>
                {!impactLoading && statistics && (
                  <p className="text-xs text-gray-500">
                    {statistics.totalBookings} bookings,{" "}
                    {statistics.positiveActions} completed
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Meals Saved</p>
                <p className="text-xl font-bold text-gray-100">
                  {recipientStats.mealsSaved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* NGO Priority Access Banner */}
      {userProfile?.subrole === 'NGO' && (
        <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Award className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-400">NGO Priority Access</h3>
                <p className="text-xs text-gray-300">
                  As an NGO, you get exclusive 30-minute early access to high-quantity food posts (50+ servings)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Enhanced Platform Statistics */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              Platform Statistics
            </h3>
            {lastUpdated && (
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Listings</p>
                  <p className="text-2xl font-bold text-gray-100">{foodListings.length}</p>
                  <p className="text-xs text-gray-500">
                    {urgentCount > 0 && `${urgentCount} urgent`}
                  </p>
                </div>
                <Package className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {(() => {
                      const ratedListings = foodListings.filter(f => f.rating && f.rating > 0);
                      if (ratedListings.length === 0) return "N/A";
                      const average = ratedListings.reduce((sum, f) => sum + f.rating, 0) / ratedListings.length;
                      return average.toFixed(1);
                    })()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(() => {
                      const ratedListings = foodListings.filter(f => f.rating && f.rating > 0);
                      return `${ratedListings.length} rated listings`;
                    })()}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Claims</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {foodListings.reduce((sum, f) => sum + (f.claims || f.totalClaims || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Across all listings
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {(() => {
                      const listingsWithSuccessRate = foodListings.filter(f => f.successRate);
                      if (listingsWithSuccessRate.length === 0) return "N/A";
                      const average = listingsWithSuccessRate.reduce((sum, f) => sum + f.successRate, 0) / listingsWithSuccessRate.length;
                      return `${Math.round(average)}%`;
                    })()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Average completion rate
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="rice_based">Rice Based</SelectItem>
              <SelectItem value="curry_gravy">Curry/Gravy</SelectItem>
              <SelectItem value="bread_roti">Bread/Roti</SelectItem>
              <SelectItem value="snacks">Snacks</SelectItem>
              <SelectItem value="sweets">Sweets</SelectItem>
              <SelectItem value="fruits">Fruits</SelectItem>
              <SelectItem value="beverages">Beverages</SelectItem>
              <SelectItem value="combo_meals">Combo Meals</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={foodTypeFilter} onValueChange={setFoodTypeFilter}>
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Food Type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all">🌱🍖 All Types</SelectItem>
              <SelectItem value="VEG">🌱 Vegetarian</SelectItem>
              <SelectItem value="NON_VEG">🍖 Non-Vegetarian</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="time">Time Left</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => fetchFoodListings(true)}
            variant="outline"
            className="border-gray-600 text-gray-300"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Timer className="h-4 w-4 mr-2" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Available Food Grid */}
      {sortedFood.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Utensils className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-medium">
              No Food Available
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Check back later for new food listings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFood.map((food) => {
            const isFavorited = favorites.has(food.id);
            return (
              <Card
                key={food.id}
                className="bg-gray-800 border-gray-700 hover:border-emerald-500 transition-colors flex flex-col"
              >
                <CardContent className="p-0 flex flex-col flex-grow">
                  <div className="h-48 bg-gray-700 rounded-t-lg flex items-center justify-center overflow-hidden">
                    {food.imageUrl ? (
                      <img
                        src={food.imageUrl}
                        alt={food.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Utensils className="h-12 w-12 text-gray-500" />
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-100 text-lg">
                            {food.title}
                          </h3>
                          {/* Veg/Non-Veg Indicator */}
                          {food.foodType && (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                food.foodType === "VEG"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {food.foodType === "VEG"
                                ? "🌱 Veg"
                                : "🍖 Non-Veg"}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(food.status)}>
                        {getStatusIcon(food.status)}
                        <span className="ml-1 capitalize">{food.status}</span>
                      </Badge>
                    </div>

                    {food.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {food.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span className={food.availableNumeric <= 2 ? "text-orange-400" : ""}>
                          {food.quantity}
                          {food.availableNumeric <= 2 && food.availableNumeric > 0 && (
                            <span className="text-orange-400 ml-1">⚠️ Low stock</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{food.location}</span>
                        <span className="text-emerald-400">
                          ({food.distance})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span
                          className={
                            food.status === "urgent" ? "text-red-400" : ""
                          }
                        >
                          {food.timeLeft} left
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{food.freshness}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="font-medium">
                            {food.rating ? `${food.rating.toFixed(1)}/5` : "No rating"}
                          </span>
                          {food.rating && (
                            <span className="text-xs text-gray-500">
                              ({food.totalRatings || food.claims || 0} reviews)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Package className="h-3 w-3" />
                          <span>
                            {food.claims || food.totalClaims || 0} claims
                          </span>
                        </div>
                      </div>
                      
                      {/* Enhanced Statistics Row */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700/30">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-blue-400" />
                          <span>
                            {food.status === "urgent" ? (
                              <span className="text-red-400 font-medium">Urgent</span>
                            ) : (
                              <span className="text-green-400 font-medium">Available</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-emerald-400" />
                          <span className="truncate">{food.distance}</span>
                        </div>
                      </div>
                      
                      {/* Success Rate and Provider Rating */}
                      {food.providerRating && (
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                          <span>Provider: {food.providerRating.toFixed(1)}⭐</span>
                          {food.successRate && (
                            <span className="text-emerald-400">
                              {food.successRate}% success
                            </span>
                          )}
                        </div>
                      )}
                      
                      <span className="text-xs text-gray-500">
                        {food.posted}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 flex space-x-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleClaimFood(food)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Claim Food
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-gray-600"
                        onClick={() => handleViewFood(food)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-gray-600"
                        onClick={() => handleToggleFavorite(food.id)}
                        disabled={isTogglingFavorite === food.id}
                      >
                        {isTogglingFavorite === food.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bookmark
                            className={`h-4 w-4 transition-colors ${
                              isFavorited ? "text-yellow-400" : "text-gray-300"
                            }`}
                            fill={isFavorited ? "currentColor" : "none"}
                          />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Screen View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 sm:max-w-3xl p-0">
          {selectedFood && (
            <div>
              <div className="relative">
                <div className="h-64 md:h-80 w-full bg-gray-700">
                  {selectedFood.imageUrl ? (
                    <img
                      src={selectedFood.imageUrl}
                      alt={selectedFood.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="h-24 w-24 text-gray-500" />
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 rounded-full"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  <X className="h-5 w-5 text-white" />
                </Button>
              </div>

              <div className="p-6">
                <DialogHeader className="mb-4">
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-2xl font-bold text-gray-100">
                      {selectedFood.title}
                    </DialogTitle>
                    <Badge
                      className={
                        getStatusColor(selectedFood.status) +
                        " px-3 py-1 text-sm"
                      }
                    >
                      {getStatusIcon(selectedFood.status)}
                      <span className="ml-1.5 capitalize">
                        {selectedFood.status}
                      </span>
                    </Badge>
                  </div>
                </DialogHeader>

                <p className="text-gray-400 mb-6">{selectedFood.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-300">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-emerald-400" />
                    <span>
                      Quantity: <strong>{selectedFood.quantity}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                    <span>
                      Location:{" "}
                      <strong>
                        {selectedFood.location} ({selectedFood.distance})
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-emerald-400" />
                    <span>
                      Time Left:{" "}
                      <strong
                        className={
                          selectedFood.status === "urgent" ? "text-red-400" : ""
                        }
                      >
                        {selectedFood.timeLeft}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-emerald-400" />
                    <span>
                      Freshness: <strong>{selectedFood.freshness}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span>
                      Rating: <strong>
                        {selectedFood.rating ? `${selectedFood.rating.toFixed(1)}/5` : "No rating"}
                      </strong>
                      {selectedFood.rating && (
                        <span className="text-sm text-gray-400 ml-2">
                          ({selectedFood.totalRatings || selectedFood.claims || 0} reviews)
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {/* Enhanced Claims and Success Statistics */}
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-emerald-400" />
                    <span>
                      Total Claims: <strong>{selectedFood.claims || selectedFood.totalClaims || 0}</strong>
                    </span>
                  </div>
                  
                  {/* Provider Statistics */}
                  {selectedFood.providerRating && (
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-blue-400" />
                      <span>
                        Provider Rating: <strong>{selectedFood.providerRating.toFixed(1)}⭐</strong>
                        {selectedFood.providerTotalRatings && (
                          <span className="text-sm text-gray-400 ml-2">
                            ({selectedFood.providerTotalRatings} reviews)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* Success Rate and Completion Stats */}
                  {selectedFood.successRate && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span>
                        Success Rate: <strong className="text-green-400">{selectedFood.successRate}%</strong>
                        {selectedFood.completedClaims && (
                          <span className="text-sm text-gray-400 ml-2">
                            ({selectedFood.completedClaims} completed)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Timer className="h-5 w-5 text-emerald-400" />
                    <span>
                      Posted: <strong>{selectedFood.posted}</strong>
                    </span>
                  </div>
                </div>

                <DialogFooter className="mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleClaimFromView}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Proceed to Claim
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim Confirmation Dialog */}
      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              Confirm Food Claim
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to claim this food item?
            </DialogDescription>
          </DialogHeader>

          {selectedFood && (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-100 mb-2">
                  {selectedFood.title}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Package className="h-3 w-3" />
                    <span>{selectedFood.quantity} available</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedFood.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{selectedFood.timeLeft} left</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{selectedFood.freshness}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-500/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-400 font-medium">
                    Important
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  Please ensure you can pick up this food within the specified
                  time window. Failure to collect claimed food affects your
                  reliability score.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedQuantity" className="text-gray-300">
                  Requested Quantity
                </Label>
                <input
                  id="requestedQuantity"
                  type="number"
                  min="1"
                  max={selectedFood?.availableNumeric || 1}
                  value={requestedQuantity}
                  onChange={(e) =>
                    setRequestedQuantity(parseInt(e.target.value) || 1)
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Available: {selectedFood?.availableNumeric || 0} {selectedFood?.quantity?.split(' ')[1] || 'units'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestMessage" className="text-gray-300">
                  Special Instructions (Optional)
                </Label>
                <Textarea
                  id="requestMessage"
                  placeholder="Any special requirements or notes for the provider..."
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  rows={2}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClaimDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmClaim}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Confirm Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspension Notification */}
      <SuspensionNotification
        isOpen={showSuspensionNotification}
        onClose={() => setShowSuspensionNotification(false)}
        message={bookingPermission.message}
        suspensionInfo={bookingPermission.suspensionInfo}
        userStatus={bookingPermission.userStatus}
      />
    </div>
  );
}
