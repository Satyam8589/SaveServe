"use client";
import React, { useState } from "react";
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

// Sample data
const recipientData = {
  stats: {
    impactScore: 850,
    mealsSaved: 52,
  },
  availableFood: [
    {
      id: 1,
      title: "Vegetable Biryani",
      quantity: "15 servings",
      location: "Main Canteen",
      provider: "Main Campus Canteen",
      timeLeft: "2h 30m",
      status: "available",
      freshness: "Safe for 4 hours",
      type: "Main Course",
      distance: "0.2 km",
      posted: "30 mins ago",
      rating: 4.8,
      claims: 3,
    },
    {
      id: 2,
      title: "Mixed Fruit Salad",
      quantity: "8 bowls",
      location: "Hostel Mess A",
      provider: "Hostel A Kitchen",
      timeLeft: "45m",
      status: "urgent",
      freshness: "Safe for 1 hour",
      type: "Dessert",
      distance: "0.5 km",
      posted: "2 hours ago",
      rating: 4.6,
      claims: 7,
    },
    {
      id: 3,
      title: "Sandwich Platters",
      quantity: "25 pieces",
      location: "Conference Hall",
      provider: "Event Catering",
      timeLeft: "3h 15m",
      status: "available",
      freshness: "Safe for 5 hours",
      type: "Snack",
      distance: "0.8 km",
      posted: "1 hour ago",
      rating: 4.5,
      claims: 1,
    },
  ],
};

export default function BrowseFoodPage() {
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("time");
  const [selectedFood, setSelectedFood] = useState(null);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);

  const handleClaimFood = (foodItem) => {
    setSelectedFood(foodItem);
    setIsClaimDialogOpen(true);
  };

  const confirmClaim = () => {
    console.log("Claiming food:", selectedFood);
    setIsClaimDialogOpen(false);
    setSelectedFood(null);
    // Add to myClaims and show success message
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

  const filteredFood = recipientData.availableFood.filter((food) => {
    const matchesFilter =
      filterType === "all" ||
      food.type.toLowerCase().replace(" ", "-") === filterType;
    return matchesFilter;
  });

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
                  {recipientData.availableFood.length}
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
                  {
                    recipientData.availableFood.filter(
                      (f) => f.status === "urgent"
                    ).length
                  }
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
                  {recipientData.stats.impactScore}
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
                  {recipientData.stats.mealsSaved}
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

        <Button
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Available Food Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFood.map((food) => (
          <Card
            key={food.id}
            className="bg-gray-800 border-gray-700 hover:border-emerald-500 transition-colors"
          >
            <CardContent className="p-0">
              {/* Food Image Placeholder */}
              <div className="h-48 bg-gray-700 rounded-t-lg flex items-center justify-center">
                <Utensils className="h-12 w-12 text-gray-500" />
              </div>

              <div className="p-4">
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

                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{food.rating}</span>
                    <span>({food.claims} claims)</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
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