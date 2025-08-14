"use client";
import React, { useState } from "react";
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  Package,
  Plus,
  TrendingUp,
  Users,
  Utensils,
  Leaf,
  AlertTriangle,
  Check,
  Eye,
  Edit,
  Trash2,
  Heart,
  BarChart3,
  Globe,
  Droplet,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Upload,
  Camera,
  ShoppingCart,
  Star,
  Timer,
  User,
  BookOpen,
  Award,
  Navigation,
  Bookmark,
  History,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/Footer";
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
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

// Sample Recipient Data
const recipientData = {
  profile: {
    name: "Rahul Kumar",
    type: "Student",
    rating: 4.9,
    totalClaims: 45,
    activeClaims: 3,
    joinedDate: "Sept 2024",
  },
  stats: {
    foodClaimed: 45,
    activeClaims: 3,
    mealsSaved: 52,
    carbonSaved: 12.5,
    impactScore: 850,
    reliability: 96,
    favoriteSpots: ["Main Canteen", "Hostel Mess A"],
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
      image: null,
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
      image: null,
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
      image: null,
    },
  ],
  myClaims: [
    {
      id: 1,
      title: "Pasta Portions",
      quantity: "5 servings",
      location: "Main Canteen",
      provider: "Main Campus Canteen",
      status: "confirmed",
      pickupTime: "6:00 PM Today",
      claimedAt: "2 hours ago",
      type: "Main Course",
    },
    {
      id: 2,
      title: "Fresh Bread Loaves",
      quantity: "3 loaves",
      location: "Bakery Counter",
      provider: "Campus Bakery",
      status: "picked-up",
      pickupTime: "Yesterday 4:30 PM",
      claimedAt: "Yesterday",
      type: "Bread",
    },
  ],
  notifications: [
    {
      id: 1,
      title: "New Food Available",
      message: "Vegetable Biryani available at Main Canteen",
      time: "5 mins ago",
      type: "new-food",
      urgent: false,
    },
    {
      id: 2,
      title: "Pickup Reminder",
      message: "Don't forget to pickup Pasta Portions by 6:00 PM",
      time: "30 mins ago",
      type: "reminder",
      urgent: true,
    },
    {
      id: 3,
      title: "Food Expiring Soon",
      message: "Mixed Fruit Salad expires in 45 minutes",
      time: "1 hour ago",
      type: "urgent",
      urgent: true,
    },
  ],
  impactData: {
    weeklyData: [
      { day: "Mon", claimed: 2, meals: 3 },
      { day: "Tue", claimed: 1, meals: 1 },
      { day: "Wed", claimed: 3, meals: 4 },
      { day: "Thu", claimed: 2, meals: 2 },
      { day: "Fri", claimed: 4, meals: 5 },
      { day: "Sat", claimed: 1, meals: 1 },
      { day: "Sun", claimed: 2, meals: 3 },
    ],
    totalImpact: {
      mealsSaved: 52,
      carbonSaved: 12.5,
      waterSaved: 650,
      wasteReduced: 8.2,
    },
  },
};

export default function RecipientDashboardPage() {
  const [selectedTab, setSelectedTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
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
      case "claimed":
        return "bg-blue-500 text-white";
      case "confirmed":
        return "bg-emerald-600 text-white";
      case "picked-up":
        return "bg-gray-500 text-white";
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
      case "claimed":
        return <ShoppingCart className="h-3 w-3" />;
      case "confirmed":
        return <Check className="h-3 w-3" />;
      case "picked-up":
        return <Package className="h-3 w-3" />;
      default:
        return <Check className="h-3 w-3" />;
    }
  };

  const sidebarItems = [
    { icon: Search, label: "Browse Food", id: "browse" },
    { icon: ShoppingCart, label: "My Claims", id: "claims" },
    { icon: BarChart3, label: "My Impact", id: "impact" },
    { icon: Bookmark, label: "Favorites", id: "favorites" },
    { icon: History, label: "History", id: "history" },
    { icon: Bell, label: "Notifications", id: "notifications" },
  ];

  const filteredFood = recipientData.availableFood.filter((food) => {
    const matchesSearch =
      food.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.provider.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      food.type.toLowerCase().replace(" ", "-") === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-slate-900 min-h-screen">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <Sidebar className="border-gray-700 bg-gray-800 w-64 flex-shrink-0 mt-16">
            <SidebarHeader className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-100">SmartFood</h2>
                  <p className="text-xs text-emerald-400">Recipient Portal</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-4">
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      className={`text-gray-300 hover:text-gray-100 hover:bg-gray-700 ${
                        selectedTab === item.id
                          ? "bg-emerald-600 text-white"
                          : ""
                      }`}
                      onClick={() => setSelectedTab(item.id)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-4 mb-16 border-t border-gray-700">
              <div className="space-y-2">
                <SidebarMenuButton className="text-gray-300 hover:text-gray-100 hover:bg-gray-700">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
                <SidebarMenuButton className="text-red-400 hover:text-red-300 hover:bg-gray-700">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1 h-full flex flex-col bg-gray-900">
            <header className="h-16 border-b border-gray-700 bg-gray-800 flex items-center px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-gray-300" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-100">
                    {selectedTab === "browse" && "Browse Food"}
                    {selectedTab === "claims" && "My Claims"}
                    {selectedTab === "impact" && "My Impact"}
                    {selectedTab === "favorites" && "Favorites"}
                    {selectedTab === "history" && "History"}
                    {selectedTab === "notifications" && "Notifications"}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-gray-100 w-64"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 relative"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
              </div>
            </header>

            <main className="bg-slate-900 flex-1 overflow-y-auto p-6">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                {/* Browse Food Tab */}
                <TabsContent value="browse" className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Utensils className="h-5 w-5 text-emerald-400" />
                          <div>
                            <p className="text-sm text-gray-400">
                              Available Now
                            </p>
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
                            <p className="text-sm text-gray-400">
                              Expiring Soon
                            </p>
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
                            <p className="text-sm text-gray-400">
                              Impact Score
                            </p>
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
                          <SelectItem value="main-course">
                            Main Course
                          </SelectItem>
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
                </TabsContent>

                {/* My Claims Tab */}
                <TabsContent value="claims" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-100">
                        My Claims
                      </h2>
                      <p className="text-gray-400">
                        Track your claimed food items
                      </p>
                    </div>
                    <Badge className="bg-emerald-600 text-white">
                      {recipientData.stats.activeClaims} Active
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {recipientData.myClaims.map((claim) => (
                      <Card
                        key={claim.id}
                        className="bg-gray-800 border-gray-700"
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-100 text-lg mb-2">
                                {claim.title}
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-2">
                                  <Package className="h-4 w-4" />
                                  <span>{claim.quantity}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{claim.location}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{claim.pickupTime}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4" />
                                  <span>{claim.provider}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(claim.status)}>
                                {getStatusIcon(claim.status)}
                                <span className="ml-1 capitalize">
                                  {claim.status}
                                </span>
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 flex space-x-2">
                            {claim.status === "confirmed" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Get Directions
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-600 text-gray-300"
                                >
                                  Contact Provider
                                </Button>
                              </>
                            )}
                            {claim.status === "picked-up" && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Rate Experience
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* My Impact Tab */}
                <TabsContent value="impact" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      My Impact
                    </h2>
                    <p className="text-gray-400">
                      See how you're helping reduce food waste
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Utensils className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-emerald-400">
                          {recipientData.impactData.totalImpact.mealsSaved}
                        </div>
                        <div className="text-sm text-gray-400">Meals Saved</div>
                        <div className="text-xs text-gray-500 mt-1">
                          This month
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Globe className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-blue-400">
                          {recipientData.impactData.totalImpact.carbonSaved}kg
                        </div>
                        <div className="text-sm text-gray-400">CO₂ Saved</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Carbon footprint
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Droplet className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-cyan-400">
                          {recipientData.impactData.totalImpact.waterSaved}L
                        </div>
                        <div className="text-sm text-gray-400">Water Saved</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Virtual water
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Award className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-yellow-400">
                          {recipientData.stats.impactScore}
                        </div>
                        <div className="text-sm text-gray-400">
                          Impact Score
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Keep it up!
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-100">
                        Weekly Activity
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Your food claiming patterns this week
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">Weekly activity chart</p>
                          <p className="text-sm text-gray-500">
                            Integration with charting library
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Other placeholder tabs */}
                <TabsContent value="favorites" className="space-y-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                      <Bookmark className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        Favorite Foods
                      </h3>
                      <p className="text-gray-400">
                        Save your favorite food providers and get notified
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                      <History className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        Claim History
                      </h3>
                      <p className="text-gray-400">
                        View your complete food claiming history and statistics
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-100">
                        Notifications
                      </h2>
                      <p className="text-gray-400">
                        Stay updated on food availability and your claims
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Mark All Read
                    </Button>
                  </div>

                  {/* Notification Settings */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-100">
                        Notification Preferences
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Customize how you want to be notified about food
                        availability
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">
                            New Food Available
                          </Label>
                          <p className="text-sm text-gray-400">
                            Get notified when food is listed near you
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">
                            Urgent Food Alerts
                          </Label>
                          <p className="text-sm text-gray-400">
                            Priority notifications for food expiring soon
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">
                            Pickup Reminders
                          </Label>
                          <p className="text-sm text-gray-400">
                            Remind me about confirmed pickups
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">
                            Weekly Impact Report
                          </Label>
                          <p className="text-sm text-gray-400">
                            Summary of your food waste reduction impact
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">
                            Favorite Providers
                          </Label>
                          <p className="text-sm text-gray-400">
                            Get notified when your favorite providers list food
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Notifications */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-100">
                        Recent Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recipientData.notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg ${
                              notification.urgent
                                ? "bg-red-900/20 border border-red-500/20"
                                : "bg-gray-700"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                notification.type === "urgent"
                                  ? "bg-red-400"
                                  : notification.type === "reminder"
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                              }`}
                            ></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-300">
                                  {notification.title}
                                </h4>
                                {notification.urgent && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-gray-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

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
            </main>
            {/* Footer Section */}
            <Footer />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
