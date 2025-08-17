"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  Leaf,
  Settings,
  LogOut,
  ShoppingCart,
  BarChart3,
  Bookmark,
  History,
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
import Footer from "@/components/Footer";
import { useClerk } from "@clerk/nextjs";

const sidebarItems = [
  {
    icon: Search,
    label: "Browse Food",
    id: "browse",
    href: "/recipientDashboard",
  },
  {
    icon: ShoppingCart,
    label: "My Claims",
    id: "claims",
    href: "/recipientDashboard/claims",
  },
  {
    icon: BarChart3,
    label: "My Impact",
    id: "impact",
    href: "/recipientDashboard/impact",
  },
  {
    icon: Bookmark,
    label: "Favorites",
    id: "favorites",
    href: "/recipientDashboard/favorites",
  },
  {
    icon: History,
    label: "History",
    id: "history",
    href: "/recipientDashboard/history",
  },
  {
    icon: Bell,
    label: "Notifications",
    id: "notifications",
    href: "/recipientDashboard/notifications",
  },
];

export default function RecipientLayout({ children }) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { signOut } = useClerk();

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const getPageTitle = () => {
    const currentItem = sidebarItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : "Browse Food";
  };

  const handleNavClick = (e, href) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      e.preventDefault();
      setSidebarOpen(false);
      setTimeout(() => {
        window.location.href = href;
      }, 150);
    }
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="bg-slate-900 min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen">
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

            <SidebarContent className="flex min-h-[250px] px-3 py-5 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden p-0 pl-3">
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <Link
                      href={item.href}
                      passHref
                      onClick={(e) => handleNavClick(e, item.href)}
                    >
                      <SidebarMenuButton
                        className={`text-gray-300 hover:text-gray-100 hover:bg-gray-700 cursor-pointer ${
                          pathname === item.href
                            ? "bg-emerald-600 text-white"
                            : ""
                        }`}
                        suppressHydrationWarning
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-4 mb-75 border-t border-gray-700">
              <div className="space-y-2">
                <SidebarMenuButton 
                  className="text-gray-300 hover:text-gray-100 hover:bg-gray-700"
                  suppressHydrationWarning
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>

                <SidebarMenuButton
                  className="text-red-400 hover:text-red-300 hover:bg-gray-700 cursor-pointer"
                  onClick={() => signOut()}
                  suppressHydrationWarning
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1 h-full flex flex-col bg-gray-900">
            <header className="h-16 border-b border-gray-700 bg-gray-800 flex items-center px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger 
                  className="text-gray-300" 
                  suppressHydrationWarning 
                />
                <div>
                  <h1 className="text-xl font-semibold text-gray-100">
                    {getPageTitle()}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="relative">
                  <Search className="px-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-gray-100 w-40"
                    suppressHydrationWarning
                    autoComplete="off"
                    data-form-type="other"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 relative"
                  asChild
                  suppressHydrationWarning
                >
                  <Link href="/recipient/notifications">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
                  </Link>
                </Button>
              </div>
            </header>

            <main className="bg-slate-900 flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}