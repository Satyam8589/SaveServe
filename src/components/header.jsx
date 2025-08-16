"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Header({ userData }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect logic
  useEffect(() => {
    if (isLoaded && user) {
      const hasOnboarded = user.publicMetadata?.hasOnboarded || false;
      const mainRole = user.publicMetadata?.mainRole;

      if (!hasOnboarded) {
        router.replace("/onboarding");
      } else {
        switch (mainRole) {
          case "PROVIDER":
            router.replace("/providerDashboard");
            break;
          case "RECIPIENT":
            router.replace("/recipientDashboard");
            break;
          case "ADMIN":
            router.replace("/adminDashboard");
            break;
          default:
            router.replace("/onboarding");
        }
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  const mainRole = user?.publicMetadata?.mainRole;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Navigation links
  const getNavigationLinks = () => {
    if (!user) {
      return [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/analytics", label: "Impact" },
      ];
    }

    if (mainRole === "PROVIDER") {
      return [
        { href: "/providerDashboard", label: "Dashboard" },
        { href: "/my-listings", label: "My Listings" },
        { href: "/add-listing", label: "Share Food" },
        { href: "/analytics", label: "My Impact" },
        { href: "/profile", label: "Profile" },
      ];
    }

    if (mainRole === "RECIPIENT") {
      return [
        { href: "/recipientDashboard", label: "Dashboard" },
        { href: "/browse", label: "Find Food" },
        { href: "/my-requests", label: "My Requests" },
        { href: "/notifications", label: "Alerts" },
        { href: "/profile", label: "Profile" },
      ];
    }

    return [
      { href: "/onboarding", label: "Onboarding" },
      { href: "/browse", label: "Browse" },
      { href: "/profile", label: "Profile" },
    ];
  };

  const navigationLinks = getNavigationLinks();

  return (
    <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src="/logo (2).svg" alt="Logo" className="h-20 w-20" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                SaveServe
              </span>
              <span className="text-xs text-gray-400 -mt-1">
                Zero Waste Campus
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex gap-8 text-gray-300 font-medium">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 rounded-lg hover:text-amber-400 transition-all duration-200 group"
              >
                <span className="relative z-10">{link.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton>
                <button className="px-6 py-2.5 rounded-full border border-emerald-500/50 text-emerald-400 font-medium hover:bg-emerald-500/10 hover:border-emerald-400 transition-all duration-200">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="relative px-6 py-2.5 rounded-full font-medium text-white overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-orange-500 to-amber-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative z-10">Get Started</span>
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-10 h-10 border-2 border-amber-500 rounded-full shadow-lg",
                    userButtonPopoverCard:
                      "bg-gray-800 border border-gray-700 shadow-2xl",
                    userPreviewMainIdentifier: "font-semibold text-amber-400",
                    userPreviewSecondaryIdentifier: "text-gray-400",
                    userButtonPopoverActionButton:
                      "text-gray-300 hover:text-amber-400 hover:bg-gray-700",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>

          {/* Mobile Section */}
          <div className="md:hidden flex items-center gap-3">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-9 h-9 border-2 border-amber-500 rounded-full shadow-lg",
                    userButtonPopoverCard:
                      "bg-gray-800 border border-gray-700 shadow-2xl",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>

            <button
              onClick={toggleMobileMenu}
              className="p-2.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-all duration-200"
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
          <div className="md:hidden border-t border-gray-800 bg-gray-900/98 backdrop-blur-sm">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 rounded-lg text-gray-300 hover:text-amber-400 hover:bg-gray-800 font-medium transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <SignedOut>
                <div className="pt-4 space-y-3 border-t border-gray-800 mt-4">
                  <SignInButton>
                    <button
                      className="w-full text-left px-4 py-3 rounded-lg border border-emerald-500/50 text-emerald-400 font-medium hover:bg-emerald-500/10 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button
                      className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 via-orange-500 to-amber-500 text-white font-medium hover:from-emerald-600 hover:via-orange-600 hover:to-amber-600 transition-all duration-200"
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

