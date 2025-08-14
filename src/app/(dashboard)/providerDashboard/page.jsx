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

// Sample Provider Data
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
      image: null,
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
      image: null,
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
      image: null,
    },
  ],
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
  analytics: {
    weeklyData: [
      { day: "Mon", listed: 8, claimed: 6 },
      { day: "Tue", listed: 12, claimed: 10 },
      { day: "Wed", listed: 6, claimed: 5 },
      { day: "Thu", listed: 15, claimed: 12 },
      { day: "Fri", listed: 20, claimed: 18 },
      { day: "Sat", listed: 5, claimed: 4 },
      { day: "Sun", listed: 3, claimed: 2 },
    ],
    impact: {
      carbonSaved: 2.5,
      waterSaved: 1250,
      wasteReduced: 95,
    },
  },
};

export default function providerDashboard() {
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [newListing, setNewListing] = useState({
    title: "",
    quantity: "",
    type: "",
    freshness: "",
    location: "",
    description: "",
    image: null,
  });

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

  const sidebarItems = [
    { icon: BarChart3, label: "Overview", id: "overview" },
    { icon: Utensils, label: "My Listings", id: "listings" },
    { icon: TrendingUp, label: "Analytics", id: "analytics" },
    { icon: Users, label: "Recipients", id: "recipients" },
    { icon: Calendar, label: "Schedule", id: "schedule" },
    { icon: Bell, label: "Notifications", id: "notifications" },
  ];

  return (
    <div className="bg-slate-900 min-h-screen">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <Sidebar className="border-gray-700 bg-gray-800 w-64 flex-shrink-0 fixed left-0 top-0 h-screen z-50 mt-16">
            <SidebarHeader className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-100">SmartFood</h2>
                  <p className="text-xs text-emerald-400">Provider Portal</p>
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

            <SidebarFooter className="p-4 border-t border-gray-700">
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

          <SidebarInset className="flex-1">
            <header className="flex h-16 items-center justify-between border-b border-gray-700 bg-gray-800 px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-gray-300" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-100">
                    {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search listings..."
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

            <main className="bg-slate-900 flex-1 overflow-auto p-6">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Welcome Section */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-100">
                        Welcome back, {providerData.profile.name}!
                      </h2>
                      <p className="text-gray-400 mt-1">
                        Here's what's happening with your food redistribution
                        today
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
                            List your surplus food for redistribution to the
                            campus community
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
                              <Label
                                htmlFor="quantity"
                                className="text-gray-300"
                              >
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
                                  <SelectItem value="main-course">
                                    Main Course
                                  </SelectItem>
                                  <SelectItem value="snack">Snack</SelectItem>
                                  <SelectItem value="dessert">
                                    Dessert
                                  </SelectItem>
                                  <SelectItem value="bread">Bread</SelectItem>
                                  <SelectItem value="beverage">
                                    Beverage
                                  </SelectItem>
                                  <SelectItem value="fruits">Fruits</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label
                                htmlFor="freshness"
                                className="text-gray-300"
                              >
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
                              <Label
                                htmlFor="location"
                                className="text-gray-300"
                              >
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
                            <Label
                              htmlFor="description"
                              className="text-gray-300"
                            >
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
                            <Label className="text-gray-300">
                              Photo (Optional)
                            </Label>
                            <div className="mt-1 border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                              <Camera className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">
                                Click to add food photo
                              </p>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingFood(false)}
                            className="border-gray-600 text-gray-300"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6 text-center">
                        <Heart className="h-12 w-12 text-red-400 mx-auto mb-3" />
                        <div className="text-3xl font-bold text-red-400">
                          {providerData.analytics.impact.wasteReduced}%
                        </div>
                        <div className="text-sm text-gray-400">
                          Waste Reduction
                        </div>
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

                  {/* Weekly Performance Chart */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-100">
                        Weekly Performance
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Food listings vs successful claims this week
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">
                            Weekly performance chart
                          </p>
                          <p className="text-sm text-gray-500">
                            Integration with charting library
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Recipients Tab */}
                <TabsContent value="recipients" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Recipients & Community
                    </h2>
                    <p className="text-gray-400">
                      Connect with your food recipients
                    </p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Recipients Dashboard
                        </h3>
                        <p className="text-gray-400 mb-4">
                          View and manage your food recipients, feedback, and
                          community connections
                        </p>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          View Recipients
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Schedule & Events
                    </h2>
                    <p className="text-gray-400">
                      Plan your food listings around campus events
                    </p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Event Schedule
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Sync with campus events and schedule automatic food
                          listing reminders
                        </p>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Setup Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Notifications
                    </h2>
                    <p className="text-gray-400">
                      Manage your notification preferences
                    </p>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-100">
                        Notification Settings
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Choose how you want to be notified about food claims and
                        updates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Food Claimed</Label>
                          <p className="text-sm text-gray-400">
                            Get notified when someone claims your food
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">
                            Expiration Warnings
                          </Label>
                          <p className="text-sm text-gray-400">
                            Alert when food is about to expire
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Daily Summary</Label>
                          <p className="text-sm text-gray-400">
                            Daily report of your impact
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">New Features</Label>
                          <p className="text-sm text-gray-400">
                            Updates about new platform features
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-100">
                        Recent Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">
                              Your "Vegetable Biryani" was claimed by Student A
                            </p>
                            <p className="text-xs text-gray-500">
                              2 minutes ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                          <div className="w-2 h-2 bg-amber-400 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">
                              Your "Mixed Fruit Salad" expires in 45 minutes
                            </p>
                            <p className="text-xs text-gray-500">
                              15 minutes ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">
                              Weekly impact report: You've saved 15kg of food!
                            </p>
                            <p className="text-xs text-gray-500">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </main>
            {/* Footer Section */}
            <Footer />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
