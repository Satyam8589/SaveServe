"use client"
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <span className="bg-gradient-to-r from-emerald-500 via-orange-500 to-amber-500 text-white rounded-xl p-2.5 font-bold text-lg shadow-lg">
                  🍽️
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-orange-500 to-amber-500 rounded-xl blur opacity-20"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  SaveServe
                </span>
                <span className="text-xs text-gray-500">Zero Waste Campus</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Transforming campus food waste into community nourishment. Every meal saved is a step towards a sustainable future.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-emerald-400">Actively Reducing Waste</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-6 text-lg">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm hover:text-amber-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-amber-400 transition-colors"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-amber-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-amber-400 transition-colors"></span>
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-sm hover:text-amber-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-amber-400 transition-colors"></span>
                  Impact Dashboard
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-amber-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-amber-400 transition-colors"></span>
                  Get In Touch
                </Link>
              </li>
            </ul>
          </div>

          {/* For Contributors */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-6 text-lg">Share Food</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/provider-guide" className="text-sm hover:text-emerald-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                  Quick Start Guide
                </Link>
              </li>
              <li>
                <Link href="/safety-guidelines" className="text-sm hover:text-emerald-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                  Food Safety Standards
                </Link>
              </li>
              <li>
                <Link href="/provider-benefits" className="text-sm hover:text-emerald-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                  Environmental Benefits
                </Link>
              </li>
              <li>
                <Link href="/campus-partners" className="text-sm hover:text-emerald-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                  Campus Partnerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Community */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-6 text-lg">Community</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm hover:text-orange-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-orange-400 transition-colors"></span>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:text-orange-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-orange-400 transition-colors"></span>
                  Common Questions
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="text-sm hover:text-orange-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-orange-400 transition-colors"></span>
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-sm hover:text-orange-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-gray-600 rounded-full group-hover:bg-orange-400 transition-colors"></span>
                  Share Feedback
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-gray-800 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                🌱 Carbon Footprint
              </div>
              <div className="text-sm text-gray-400">Reducing environmental impact daily</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                🤝 Community Driven
              </div>
              <div className="text-sm text-gray-400">Connecting campus communities</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                🎯 Zero Waste Goal
              </div>
              <div className="text-sm text-gray-400">Working towards sustainable campus</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-500">
              © 2025 SaveServe Platform. Built with 💚 for sustainability.
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-amber-400 transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-amber-400 transition-colors duration-200">
              Terms of Service
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>System Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}