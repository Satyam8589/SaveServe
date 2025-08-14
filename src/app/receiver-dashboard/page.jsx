"use client"
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ReceiverDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    itemsReceived: 0,
    carbonSaved: 0,
    moneySaved: 0,
    nearbyListings: 5
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 p-4 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.firstName || 'Food Saver'}! 🍽️
          </h1>
          <p className="text-gray-400 text-lg">
            Discover fresh food and help fight waste in your community
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/browse" className="group">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">Find Food</h3>
              <p className="text-amber-100">Browse available food nearby</p>
            </div>
          </Link>

          <Link href="/my-requests" className="group">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-xl font-bold text-white mb-2">My Requests</h3>
              <p className="text-blue-100">Track your food requests</p>
            </div>
          </Link>

          <Link href="/notifications" className="group">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="text-xl font-bold text-white mb-2">Alerts</h3>
              <p className="text-purple-100">Food notifications near you</p>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-amber-400">{stats.itemsReceived}</div>
            <div className="text-gray-400">Items Received</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-green-400">{stats.carbonSaved}kg</div>
            <div className="text-gray-400">Carbon Saved</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-emerald-400">₹{stats.moneySaved}</div>
            <div className="text-gray-400">Money Saved</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-orange-400">{stats.nearbyListings}</div>
            <div className="text-gray-400">Nearby Listings</div>
          </div>
        </div>

        {/* Available Food Section */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Available Food Near You</h2>
            <Link 
              href="/browse"
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              View All →
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sample food listings */}
            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 hover:border-amber-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <span className="text-orange-400">🍕</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Pizza Slices</h3>
                  <p className="text-gray-400 text-sm">Student Cafeteria</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">Available until 6:00 PM</p>
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">Fresh</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">500m away</span>
              </div>
              <button className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
                Request Food
              </button>
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 hover:border-amber-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-green-400">🥗</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Fresh Salads</h3>
                  <p className="text-gray-400 text-sm">Main Library</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">Available until 4:30 PM</p>
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Vegetarian</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">200m away</span>
              </div>
              <button className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
                Request Food
              </button>
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 hover:border-amber-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-purple-400">🧁</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Event Snacks</h3>
                  <p className="text-gray-400 text-sm">Conference Hall</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">Available until 8:00 PM</p>
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">Mixed</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">800m away</span>
              </div>
              <button className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
                Request Food
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <span className="text-amber-400">🔍</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Start exploring food near you!</p>
                <p className="text-gray-400 text-sm">Find fresh food and help reduce waste in your community</p>
              </div>
              <Link 
                href="/browse"
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Browse Food
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}