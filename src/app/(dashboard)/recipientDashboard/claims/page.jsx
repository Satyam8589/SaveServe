"use client";
import React from "react";
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
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Sample claims data
const claimsData = {
  stats: {
    activeClaims: 3,
  },
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
    {
      id: 3,
      title: "Vegetable Curry",
      quantity: "8 servings",
      location: "Hostel Mess B",
      provider: "Hostel B Kitchen",
      status: "pending",
      pickupTime: "Tomorrow 1:00 PM",
      claimedAt: "1 hour ago",
      type: "Main Course",
    },
  ],
};

export default function ClaimsPage() {
  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-600 text-white";
      case "picked-up":
        return "bg-gray-500 text-white";
      case "pending":
        return "bg-yellow-600 text-white";
      default:
        return "bg-emerald-500 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <Check className="h-3 w-3" />;
      case "picked-up":
        return <Package className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      default:
        return <Check className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
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
          {claimsData.stats.activeClaims} Active
        </Badge>
      </div>

      <div className="space-y-4">
        {claimsData.myClaims.map((claim) => (
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
                      {claim.status === "picked-up" ? "Completed" : claim.status}
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
                {claim.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-400"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Waiting for Confirmation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {claimsData.myClaims.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No Claims Yet
            </h3>
            <p className="text-gray-400">
              Start browsing food to make your first claim
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}