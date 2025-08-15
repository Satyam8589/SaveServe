"use client";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

export default function BrowseFoodPage() {
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("time");
  const [selectedFood, setSelectedFood] = useState(null);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [foodListings, setFoodListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipientStats, setRecipientStats] = useState({
    impactScore: 0,
    mealsSaved: 0,
  });

  useEffect(() => {
    fetchFoodListings();
  }, []);

  const fetchFoodListings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/food-listings');
      const data = await response.json();
      
      if (data.success) {
        setFoodListings(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch food listings');
      }
    } catch (err) {
      console.error('Error fetching food listings:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFood = (foodItem) => {
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
    try {
      console.log("Claiming food:", selectedFood);
      
      setIsClaimDialogOpen(false);
      setSelectedFood(null);
      
      fetchFoodListings();
      
    } catch (error) {
      console.error('Error claiming food:', error);
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
      food.type.toLowerCase().replace(" ", "-") === filterType;
    return matchesFilter;
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

  const urgentCount = foodListings.filter(f => f.status === "urgent").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="ml-2 text-gray-300">Loading food listings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-red-900/20 border-red-500/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 font-medium">Error Loading Food Listings</p>
            <p className="text-gray-300 text-sm mt-1">{error}</p>
            <Button 
              onClick={fetchFoodListings}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
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
                <p className="text-xl font-bold text-gray-100">
                  {urgentCount}
                </p>
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
                  {recipientStats.impactScore}
                </p>
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

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Food Type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="main-course">Main Course</SelectItem>
              <SelectItem value="snack">Snacks</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
              <SelectItem value="bread">Bread</SelectItem>
              <SelectItem value="fruits">Fruits</SelectItem>
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
            onClick={fetchFoodListings}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <Timer className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
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
            <p className="text-gray-300 text-lg font-medium">No Food Available</p>
            <p className="text-gray-400 text-sm mt-1">
              Check back later for new food listings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFood.map((food) => (
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
                    <h3 className="font-semibold text-gray-100 text-lg">
                      {food.title}
                    </h3>
                    <Badge className={getStatusColor(food.status)}>
                      {getStatusIcon(food.status)}
                      <span className="ml-1 capitalize">
                        {food.status}
                      </span>
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
                      <span>{food.quantity}</span>
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
                          food.status === "urgent"
                            ? "text-red-400"
                            : ""
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
                        <span>{food.rating}</span>
                        <span>({food.claims} claims)</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {food.posted}
                      </span>
                    </div>
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
                      size="sm"
                      className="border-gray-600"
                      onClick={() => handleViewFood(food)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                     <Badge className={getStatusColor(selectedFood.status) + " px-3 py-1 text-sm"}>
                        {getStatusIcon(selectedFood.status)}
                        <span className="ml-1.5 capitalize">{selectedFood.status}</span>
                     </Badge>
                  </div>
                </DialogHeader>
                
                <p className="text-gray-400 mb-6">
                  {selectedFood.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-300">
                    <div className="flex items-center space-x-3"><Package className="h-5 w-5 text-emerald-400" /><span>Quantity: <strong>{selectedFood.quantity}</strong></span></div>
                    <div className="flex items-center space-x-3"><MapPin className="h-5 w-5 text-emerald-400" /><span>Location: <strong>{selectedFood.location} ({selectedFood.distance})</strong></span></div>
                    <div className="flex items-center space-x-3"><Clock className="h-5 w-5 text-emerald-400" /><span>Time Left: <strong className={selectedFood.status === 'urgent' ? 'text-red-400' : ''}>{selectedFood.timeLeft}</strong></span></div>
                    <div className="flex items-center space-x-3"><AlertTriangle className="h-5 w-5 text-emerald-400" /><span>Freshness: <strong>{selectedFood.freshness}</strong></span></div>
                    <div className="flex items-center space-x-3"><Star className="h-5 w-5 text-yellow-400" /><span>Rating: <strong>{selectedFood.rating}</strong> ({selectedFood.claims} claims)</span></div>
                    <div className="flex items-center space-x-3"><Timer className="h-5 w-5 text-emerald-400" /><span>Posted: <strong>{selectedFood.posted}</strong></span></div>
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
      <Dialog
        open={isClaimDialogOpen}
        onOpenChange={setIsClaimDialogOpen}
      >
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
                    <span>{selectedFood.quantity}</span>
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
                  Please ensure you can pick up this food within the
                  specified time window. Failure to collect claimed food
                  affects your reliability score.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Pickup Method</Label>
                <Select defaultValue="self-pickup">
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="self-pickup">
                      Self Pickup
                    </SelectItem>
                    <SelectItem value="friend-pickup">
                      Friend/Representative
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">
                  Special Instructions (Optional)
                </Label>
                <Textarea
                  placeholder="Any special requirements or notes for the provider..."
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  rows={2}
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
    </div>
  );
}