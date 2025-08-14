// pages/dashboard/overview/page.jsx
"use client";
import React, { useState } from "react";
import {
  Plus,
  Heart,
  BarChart3,
  Camera,
  AlertTriangle,
  Check,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const OverviewPage = () => {
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newListing, setNewListing] = useState({
    title: "",
    quantity: "",
    type: "",
    freshness: "",
    location: "",
    description: "",
    image: null,
  });

  // Sample data
  const providerData = {
    profile: {
      name: "Main Campus Canteen",
      type: "Canteen",
      rating: 4.8,
      totalListings: 156,
      activeListings: 12,
    },
    stats: {
      totalListed: 45,
      activeListings: 12,
      foodSaved: 158,
      peopleServed: 89,
      monthlyGrowth: 15,
      avgPickupTime: "1.2h",
      satisfactionRate: 96,
    },
    listings: [
      {
        id: 1,
        title: "Vegetable Biryani",
        quantity: "15 servings",
        location: "Main Canteen",
        timeLeft: "2h 30m",
        status: "active",
        freshness: "Safe for 4 hours",
        type: "Main Course",
        claims: 3,
        posted: "30 mins ago",
      },
      {
        id: 2,
        title: "Mixed Fruit Salad",
        quantity: "8 bowls",
        location: "Hostel Mess A",
        timeLeft: "45m",
        status: "urgent",
        freshness: "Safe for 1 hour",
        type: "Dessert",
        claims: 7,
        posted: "2 hours ago",
      },
      {
        id: 3,
        title: "Sandwich Platters",
        quantity: "25 pieces",
        location: "Conference Hall",
        timeLeft: "3h 15m",
        status: "active",
        freshness: "Safe for 5 hours",
        type: "Snack",
        claims: 1,
        posted: "1 hour ago",
      },
    ],
    analytics: {
      impact: {
        carbonSaved: 2.5,
        waterSaved: 1250,
        wasteReduced: 95,
      },
    },
    recentActivity: [
      {
        id: 1,
        action: "Food claimed",
        item: "Pasta Portions",
        user: "Student A",
        time: "10 mins ago",
      },
      { id: 2, action: "New listing", item: "Fruit Salad", time: "25 mins ago" },
      {
        id: 3,
        action: "Food expired",
        item: "Leftover Rice",
        time: "1 hour ago",
      },
    ],
  };

  const handleAddFood = () => {
    console.log("Adding new food listing:", newListing);
    setIsAddingFood(false);
    setNewListing({
      title: "",
      quantity: "",
      type: "",
      freshness: "",
      location: "",
      description: "",
      image: null,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "urgent":
        return "bg-red-500 text-white";
      case "active":
        return "bg-emerald-500 text-white";
      case "expired":
        return "bg-gray-500 text-white";
      default:
        return "bg-emerald-500 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "urgent":
        return <AlertTriangle className="h-3 w-3" />;
      case "active":
        return <Check className="h-3 w-3" />;
      case "expired":
        return <Clock className="h-3 w-3" />;
      default:
        return <Check className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            Welcome back, {providerData.profile.name}!
          </h2>
          <p className="text-gray-400 mt-1">
            Here's what's happening with your food redistribution today
          </p>
        </div>
        
        <Dialog open={isAddingFood} onOpenChange={setIsAddingFood}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Food Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-100">
                Add New Food Listing
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                List your surplus food for redistribution to the campus community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">
                  Food Title *
                </Label>
                <Input
                  id="title"
                  value={newListing.title}
                  onChange={(e) =>
                    setNewListing({
                      ...newListing,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g., Vegetable Biryani"
                  className="bg-gray-700 border-gray-600 text-gray-100 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quantity" className="text-gray-300">
                    Quantity *
                  </Label>
                  <Input
                    id="quantity"
                    value={newListing.quantity}
                    onChange={(e) =>
                      setNewListing({
                        ...newListing,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="15 servings"
                    className="bg-gray-700 border-gray-600 text-gray-100 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-gray-300">
                    Food Type *
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setNewListing({ ...newListing, type: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100 mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="main-course">Main Course</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="bread">Bread</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="fruits">Fruits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="freshness" className="text-gray-300">
                    Safe Duration *
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setNewListing({
                        ...newListing,
                        freshness: value,
                      })
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100 mt-1">
                      <SelectValue placeholder="Safe for..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="2h">2 Hours</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="6h">6 Hours</SelectItem>
                      <SelectItem value="12h">12 Hours</SelectItem>
                      <SelectItem value="24h">24 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="text-gray-300">
                    Pickup Location *
                  </Label>
                  <Input
                    id="location"
                    value={newListing.location}
                    onChange={(e) =>
                      setNewListing({
                        ...newListing,
                        location: e.target.value,
                      })
                    }
                    placeholder="Main Canteen"
                    className="bg-gray-700 border-gray-600 text-gray-100 mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newListing.description}
                  onChange={(e) =>
                    setNewListing({
                      ...newListing,
                      description: e.target.value,
                    })
                  }
                  placeholder="Additional details about the food, dietary info, etc."
                  className="bg-gray-700 border-gray-600 text-gray-100 mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-gray-300">Photo (Optional)</Label>
                <div className="mt-1 border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                  <Camera className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Click to add food photo</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingFood(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFood}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Create Listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Listings</p>
                <p className="text-2xl font-bold text-gray-100">
                  {providerData.stats.activeListings}
                </p>
              </div>
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Food Saved</p>
                <p className="text-2xl font-bold text-gray-100">
                  {providerData.stats.foodSaved}kg
                </p>
              </div>
              <div className="p-2 bg-blue-600 rounded-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">People Served</p>
                <p className="text-2xl font-bold text-gray-100">
                  {providerData.stats.peopleServed}
                </p>
              </div>
              <div className="p-2 bg-purple-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <Heart className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-400">
              {providerData.analytics.impact.wasteReduced}%
            </div>
            <div className="text-sm text-gray-400">Waste Reduction</div>
            <Progress
              value={providerData.analytics.impact.wasteReduced}
              className="mt-3"
            />
            <div className="text-xs text-gray-500 mt-1">
              Excellent performance!
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Recent Listings</CardTitle>
            <CardDescription className="text-gray-400">
              Your latest food offerings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {providerData.listings.slice(0, 3).map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-100">{listing.title}</h4>
                  <p className="text-sm text-gray-400">{listing.quantity}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getStatusColor(listing.status)} text-xs`}>
                      {getStatusIcon(listing.status)}
                      <span className="ml-1">{listing.status}</span>
                    </Badge>
                    <span className="text-xs text-gray-500">{listing.timeLeft} left</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-emerald-400">{listing.claims} claims</p>
                  <p className="text-xs text-gray-500">{listing.posted}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest updates and actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {providerData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">{activity.action}:</span>{" "}
                    {activity.item}
                    {activity.user && ` by ${activity.user}`}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Weekly Performance</CardTitle>
          <CardDescription className="text-gray-400">
            Food listings vs successful claims this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Weekly performance chart</p>
              <p className="text-sm text-gray-500">
                Integration with charting library
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPage;