
"use client";
import React from "react";
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

const sidebarItems = [
  {
    href: "/providerDashboard",
    icon: Home,
    label: "Overview",
  },
  {
    href: "/providerDashboard/listings",
    icon: Package,
    label: "My Listings",
  },
  {
    href: "/providerDashboard/analytics",
    icon: BarChart3,
    label: "Analytics",
  },
  {
    href: "/providerDashboard/recipients",
    icon: Users,
    label: "Recipients",
  },
  {
    href: "/providerDashboard/schedule",
    icon: Calendar,
    label: "Schedule",
  },
  {
    href: "/providerDashboard/notifications",
    icon: Bell,
    label: "Notifications",
  },
];

export default function ProviderDashboardLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="bg-slate-900 min-h-screen">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <Sidebar className="border-gray-700 bg-gray-800 w-64 flex-shrink-0 fixed left-0 top-16 bottom-0 z-50">
            <SidebarHeader className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-100">SmartFood</h2>
                  <p className="text-xs text-orange-400">Provider Portal</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-4">
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                      <SidebarMenuButton
                        className={`text-gray-300 hover:text-gray-100 hover:bg-gray-700 ${
                          (item.href === "/providerDashboard/listings" && pathname.startsWith(item.href)) || pathname === item.href
                            ? "bg-orange-500 text-white"
                            : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
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
                    {sidebarItems.find((item) => item.href === pathname)?.label || "Dashboard"}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search..."
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
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
