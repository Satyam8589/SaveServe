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
// import NotificationPopup from "@/components/NotificationPopup";

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Handle mobile detection and sidebar behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when pathname changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen, isMobile]);

  const handleBellClick = () => {
    setIsNotificationPopupOpen(!isNotificationPopupOpen);
  };

  const handleCloseNotifications = () => {
    setIsNotificationPopupOpen(false);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
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

  return (
    <div className="bg-slate-900 min-h-screen">
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex min-h-screen w-full relative">
          {/* Mobile Backdrop */}
          {isMobileSidebarOpen && isMobile && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Desktop Sidebar */}
          <Sidebar className={cn(
            "border-gray-700 bg-gray-800/95 backdrop-blur-md transition-all duration-300 ease-in-out shadow-xl rounded-r-2xl",
            "hidden lg:flex lg:w-60 xl:w-72 lg:flex-shrink-0 lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:z-30"
          )}>
            <SidebarHeader className="p-4 sm:p-6 border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-100 text-lg truncate">SmartFood</h2>
                  <p className="text-xs text-orange-400 font-medium">Provider Portal</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3 sm:p-4 flex-1 overflow-y-auto custom-scrollbar">
              <SidebarMenu className="space-y-1">
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                      <SidebarMenuButton
                        className={cn(
                          "w-full flex items-center gap-3 text-gray-300 hover:text-orange-400 hover:bg-gray-700/70 transition-all duration-200 rounded-xl p-3 group relative",
                          isActiveRoute(item.href)
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                            : ""
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActiveRoute(item.href) ? "text-white" : "text-orange-400"
                        )} />
                        <span className="font-medium truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-3 sm:p-4 border-t border-gray-700/50">
              <div className="space-y-1">
                <SidebarMenuButton className="w-full flex items-center gap-3 text-gray-300 hover:text-orange-400 hover:bg-gray-700/70 transition-all duration-200 rounded-xl p-3">
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Settings</span>
                </SidebarMenuButton>
                <SidebarMenuButton className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 rounded-xl p-3">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </SidebarMenuButton>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* Mobile Sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-gray-800/95 backdrop-blur-md border-r border-gray-700/50 transform transition-transform duration-300 ease-in-out shadow-xl rounded-r-2xl lg:hidden",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex h-full flex-col">
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-100">SmartFood</h2>
                    <p className="text-xs text-orange-400 font-medium">Provider Portal</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMobileSidebar}
                  className="text-gray-400 hover:text-orange-400 hover:bg-gray-700/50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <div className="space-y-1">
                  {sidebarItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-xl p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-700/70 transition-all duration-200 group",
                          isActiveRoute(item.href)
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                            : ""
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActiveRoute(item.href) ? "text-white" : "text-orange-400"
                        )} />
                        <span className="font-medium flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="p-3 border-t border-gray-700/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 rounded-xl p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-700/70 transition-all duration-200">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Settings</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200">
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <SidebarInset className="flex-1 lg:ml-60 xl:ml-72">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-gray-700/50 bg-gray-800/95 backdrop-blur-md px-3 sm:px-4 lg:px-6">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMobileSidebar}
                  className="lg:hidden text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 flex-shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Desktop Sidebar Trigger */}
                <SidebarTrigger className="hidden lg:flex text-gray-300 hover:text-gray-100" />

                {/* Page Title */}
                <div className="min-w-0 flex-1">
                  <Link href="/providerDashboard" passHref prefetch={true}>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-100 cursor-pointer truncate hover:text-orange-400 transition-colors">
                      {getCurrentPageLabel()}
                    </h1>
                  </Link>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Search - Hidden on very small screens */}
                <div className={cn(
                  "relative transition-all duration-300 ease-in-out",
                  isSearchFocused ? "w-48 sm:w-64" : "w-32 sm:w-48 md:w-64",
                  "hidden sm:block"
                )}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 bg-gray-700/50 border-gray-600/50 text-gray-100 text-sm focus:bg-gray-700 focus:border-orange-500 transition-all duration-200"
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                </div>

                {/* Mobile Search Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-gray-300 hover:text-gray-100 hover:bg-gray-700/50"
                >
                  <Search className="h-5 w-5" />
                </Button>

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
                    <Bell className="h-5 w-5" />
                    {/* Notification Badge */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
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
            <main className="bg-slate-900 flex-1 overflow-auto p-3 sm:p-4 lg:p-8 xl:p-12">
              <div className="max-w-4xl mx-auto w-full">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}