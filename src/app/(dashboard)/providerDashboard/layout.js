"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  Home,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Leaf,
  Search,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import NotificationBell from "@/hooks/NotificationBell";;
const sidebarItems = [
  {
    href: "/providerDashboard/listings",
    icon: Package,
    label: "My Listings",
    badge: null,
  },
  {
    href: "/providerDashboard/analytics",
    icon: BarChart3,
    label: "Analytics",
    badge: null,
  },
  {
    href: "/providerDashboard/recipients",
    icon: Users,
    label: "Recipients",
    badge: null,
  },
  {
    href: "/providerDashboard/schedule",
    icon: Calendar,
    label: "Schedule",
    badge: null,
  },
  {
    href: "/providerDashboard/notifications",
    icon: Bell,
    label: "Notifications",
    badge: "3", // Example badge
  },
];

export default function ProviderDashboardLayout({ children }) {
  const pathname = usePathname();
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBellClick = () => {
    setIsNotificationPopupOpen(!isNotificationPopupOpen);
  };

  const handleCloseNotifications = () => {
    setIsNotificationPopupOpen(false);
  };

  const getCurrentPageLabel = () => {
    const currentItem = sidebarItems.find((item) => 
      pathname === item.href || (item.href !== "/providerDashboard" && pathname.startsWith(item.href))
    );
    return currentItem?.label || "Dashboard";
  };

  const isActiveRoute = (itemHref) => {
    if (itemHref === "/providerDashboard") {
      return pathname === itemHref;
    }
    return pathname === itemHref || pathname.startsWith(itemHref);
  };

  if (!isClient) {
    return (
      <div className="bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen">
      <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex min-h-screen  w-full">
          {/* Sidebar */}
          <Sidebar className="border-gray-900 bg-gray-800 w-64 flex-shrink-0 max-h-screen mt-16 bottom-1 flex flex-col">
            <SidebarHeader className="p-4 border-b bg-gray-800 border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-100 text-lg">SmartFood</h2>
                  <p className="text-xs text-orange-400 font-medium">Provider Portal</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="flex-1 px-3 py-5 bg-gray-800">
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref prefetch={true}>
                      <SidebarMenuButton
                        className={cn(
                          "relative w-full text-gray-300 hover:text-gray-100 hover:bg-gray-700/70 transition-all duration-200 rounded-lg p-3 group",
                          isActiveRoute(item.href)
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                            : ""
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t bg-gray-800 border-gray-700">
              <SidebarMenuButton className="w-full text-gray-300 hover:text-gray-100 hover:bg-gray-700/70 transition-all duration-200 rounded-lg p-3">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </SidebarMenuButton>
              <SidebarMenuButton className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 rounded-lg p-3">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </SidebarMenuButton>
            </SidebarFooter>
          </Sidebar>

          {/* Main Content */}
          <SidebarInset className="flex-1 h-full flex flex-col bg-gray-900">
            {/* Header */}
            <header className="h-16 border-b border-gray-700 bg-gray-800 flex items-center px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-gray-300" />
                <Link href="/providerDashboard" passHref prefetch={true}>
                  <h1 className="text-xl font-semibold text-gray-100 cursor-pointer hover:text-orange-400 transition-colors">
                    {getCurrentPageLabel()}
                  </h1>
                </Link>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3 ml-auto">
                {/* Search */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600/50 text-gray-100 text-sm focus:bg-gray-700 focus:border-orange-500 transition-all duration-200"
                  />
                </div>

                {/* Profile Button */}
                <Link href="/profile" passHref prefetch={true}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                
                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBellClick}
                    className="text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 transition-all duration-200 relative"
                  >
                    <NotificationBell />
                  </Button>
                  
                  {/* <NotificationPopup
                    isOpen={isNotificationPopupOpen}
                    onClose={handleCloseNotifications}
                    onBellClick={handleBellClick}
                  /> */}
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="bg-slate-900 flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}