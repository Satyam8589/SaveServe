// components/DashboardLayout.jsx
"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const sidebarItems = [
    { 
      icon: BarChart3, 
      label: "Overview", 
      path: "/dashboard/overview",
      id: "overview" 
    },
    { 
      icon: Utensils, 
      label: "My Listings", 
      path: "/dashboard/listings",
      id: "listings" 
    },
    { 
      icon: TrendingUp, 
      label: "Analytics", 
      path: "/dashboard/analytics",
      id: "analytics" 
    },
    { 
      icon: Users, 
      label: "Recipients", 
      path: "/dashboard/recipients",
      id: "recipients" 
    },
    { 
      icon: Calendar, 
      label: "Schedule", 
      path: "/dashboard/schedule",
      id: "schedule" 
    },
    { 
      icon: Bell, 
      label: "Notifications", 
      path: "/dashboard/notifications",
      id: "notifications" 
    },
  ];

  const handleNavigation = (path) => {
    router.push(path);
    setSidebarOpen(false); // Close mobile sidebar after navigation
  };

  const getCurrentPageTitle = () => {
    const currentItem = sidebarItems.find(item => pathname === item.path);
    return currentItem ? currentItem.label : "Dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-100">SmartFood</h2>
                <p className="text-xs text-emerald-400">Provider Portal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-150",
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-gray-300 hover:text-gray-100 hover:bg-gray-700"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-700 px-4 py-4 space-y-2">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-gray-100 hover:bg-gray-700 transition-colors duration-150">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors duration-150">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0 flex flex-col">
          {/* Dashboard Header */}
          <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-300 hover:text-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-100">
                  {getCurrentPageTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
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
                className="text-gray-300 hover:text-gray-100 relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;