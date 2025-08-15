"use client";
import React from "react";
import { Bell, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Sample notifications data
const notificationsData = {
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
    {
      id: 4,
      title: "Claim Confirmed",
      message: "Your claim for Sandwich Platters has been confirmed",
      time: "2 hours ago",
      type: "confirmation",
      urgent: false,
    },
    {
      id: 5,
      title: "Weekly Impact Report",
      message: "You saved 8 meals this week! Keep up the great work.",
      time: "1 day ago",
      type: "report",
      urgent: false,
    },
  ],
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Notifications</h2>
          <p className="text-gray-400">
            Stay updated on food availability and your claims
          </p>
        </div>
        <Button variant="outline" className="border-gray-600 text-gray-300">
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
            Customize how you want to be notified about food availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">New Food Available</Label>
              <p className="text-sm text-gray-400">
                Get notified when food is listed near you
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Urgent Food Alerts</Label>
              <p className="text-sm text-gray-400">
                Priority notifications for food expiring soon
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Pickup Reminders</Label>
              <p className="text-sm text-gray-400">
                Remind me about confirmed pickups
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Weekly Impact Report</Label>
              <p className="text-sm text-gray-400">
                Summary of your food waste reduction impact
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Favorite Providers</Label>
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
          <CardTitle className="text-gray-100">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationsData.notifications.map((notification) => (
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
                      : notification.type === "confirmation"
                      ? "bg-emerald-400"
                      : notification.type === "report"
                      ? "bg-blue-400"
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

      {notificationsData.notifications.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No Notifications
            </h3>
            <p className="text-gray-400">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
