"use client"
import Link from "next/link";
import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  
  // Get user type from user metadata (you'll need to set this during registration)
  const userType = user?.publicMetadata?.userType; // 'provider' or 'receiver'

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Navigation links based on authentication and user type
  const getNavigationLinks = () => {
    // Not logged in - show public pages
    if (!user) {
      return [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/analytics", label: "Analytics" },
      ];
    }

    // Logged in as provider
    if (userType === "provider") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/my-listings", label: "My Listings" },
        { href: "/add-listing", label: "Add Food" },
        { href: "/analytics", label: "My Analytics" },
        { href: "/profile", label: "Profile" },
      ];
    }

    // Logged in as receiver
    if (userType === "receiver") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/browse", label: "Browse Food" },
        { href: "/my-requests", label: "My Requests" },
        { href: "/notifications", label: "Notifications" },
        { href: "/profile", label: "Profile" },
      ];
    }

    // Default for logged in users without specific type
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/browse", label: "Browse" },
      { href: "/profile", label: "Profile" },
    ];
  };

  const navigationLinks = getNavigationLinks();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full p-2 font-bold text-lg">
              🍽️
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ZeroWaste
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-green-600 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            <SignedOut>
              <SignInButton>
                <button className="px-4 py-2 rounded-full border border-green-500 text-green-600 font-medium hover:bg-green-50 transition-all duration-200">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium px-4 py-2 hover:scale-105 transition-transform duration-200 shadow-md">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 border-2 border-green-500 rounded-full",
                    userButtonPopoverCard: "shadow-xl border border-green-100",
                    userPreviewMainIdentifier: "font-semibold text-green-700",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-3">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 border-2 border-green-500 rounded-full",
                    userButtonPopoverCard: "shadow-xl border border-green-100",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
            
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-green-100 bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              <SignedOut>
                <div className="pt-3 space-y-2">
                  <SignInButton>
                    <button 
                      className="w-full text-left px-3 py-2 rounded-md border border-green-500 text-green-600 font-medium hover:bg-green-50 transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button 
                      className="w-full text-left px-3 py-2 rounded-md bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:scale-105 transition-transform duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}