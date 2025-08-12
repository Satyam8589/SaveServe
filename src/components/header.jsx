import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full p-2 font-bold text-lg">
              🍽
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              SaveServe
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
            <Link href="/listings" className="hover:text-purple-500 transition">
              Home
            </Link>
            <Link href="/listings" className="hover:text-purple-500 transition">
              Listings
            </Link>
            <Link href="/events" className="hover:text-purple-500 transition">
              Events
            </Link>
            <Link href="/about" className="hover:text-purple-500 transition">
              About
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton>
                <button className="px-4 py-2 rounded-full border border-purple-500 text-purple-500 font-medium hover:bg-purple-50 transition">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-medium px-4 py-2 hover:scale-105 transition">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-16 h-16 border-2 border-black rounded-full", // bigger avatar + black border
                    userButtonPopoverCard: "shadow-xl",
                    userPreviewMainIdentifier: "font-semibold",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
