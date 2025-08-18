"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell, Search, Leaf, Settings, LogOut, ShoppingCart, BarChart3, Bookmark, History,
} from "lucide-react";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClerk } from "@clerk/nextjs";
// --- 1. IMPORT the context provider and hook ---
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";

const sidebarItems = [
  { icon: Search, label: "Browse Food", id: "browse", href: "/recipientDashboard" },
  { icon: ShoppingCart, label: "My Claims", id: "claims", href: "/recipientDashboard/claims" },
  { icon: BarChart3, label: "My Impact", id: "impact", href: "/recipientDashboard/impact" },
  { icon: Bookmark, label: "Favorites", id: "favorites", href: "/recipientDashboard/favorites" },
  { icon: History, label: "History", id: "history", href: "/recipientDashboard/history" },
  { icon: Bell, label: "Notifications", id: "notifications", href: "/recipientDashboard/notifications" },
];

// An inner component is used to access the context provided by its parent.
const LayoutContent = ({ children }) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useClerk();
  
  // --- 2. USE the context to get the unread count ---
  const { unreadCount } = useNotifications();

  const getPageTitle = () => {
    const currentItem = sidebarItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : "Browse Food";
  };

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-gray-700 bg-gray-800 w-64 flex-shrink-0 min-h-screen mt-16">
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
          <SidebarContent className="flex-1 px-3 py-5">
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton
                      className={`relative text-gray-300 hover:text-gray-100 hover:bg-gray-700 ${
                        pathname === item.href ? "bg-emerald-600 text-white" : ""
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {/* --- 3. RENDER the red dot conditionally --- */}
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-gray-800"></span>
                      )}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 mb-75 border-t border-gray-700">
             <SidebarMenuButton className="text-gray-300 hover:text-gray-100 hover:bg-gray-700">
               <Settings className="h-4 w-4" />
               <span>Settings</span>
             </SidebarMenuButton>
             <SidebarMenuButton className="text-red-400 hover:text-red-300 hover:bg-gray-700" onClick={() => signOut()}>
               <LogOut className="h-4 w-4" />
               <span>Sign Out</span>
             </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 h-full flex flex-col bg-gray-900">
          <header className="h-16 border-b border-gray-700 bg-gray-800 flex items-center px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-300" />
              <h1 className="text-xl font-semibold text-gray-100">{getPageTitle()}</h1>
            </div>
          </header>
          <main className="bg-slate-900 flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

// The main layout component now wraps everything with the provider
export default function RecipientLayout({ children }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    return (
        <div className="bg-slate-900 min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
        </div>
    );
  }

  return (
    <NotificationProvider>
      <LayoutContent>{children}</LayoutContent>
    </NotificationProvider>
  );
}
