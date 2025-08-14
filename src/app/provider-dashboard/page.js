"use client"
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ProviderDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    activeListing: 0,
    totalShared: 0,
    peopleHelped: 0,
    carbonSaved: 0
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 p-4 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.firstName || 'Food Provider'}! 🏪
          </h1>
          <p className="text-gray-400 text-lg">
            Ready to make a difference by sharing surplus food?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/add-listing" className="group">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-xl font-bold text-white mb-2">Share Food</h3>
              <p className="text-emerald-100">Post surplus food for pickup</p>
            </div>
          </Link>

          <Link href="/my-listings" className="group">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-xl font-bold text-white mb-2">My Listings</h3>
              <p className="text-orange-100">Manage your food posts</p>
            </div>
          </Link>

          <Link href="/analytics" className="group">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">My Impact</h3>
              <p className="text-purple-100">View your contribution</p>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-emerald-400">{stats.activeListing}</div>
            <div className="text-gray-400">Active Listings</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-orange-400">{stats.totalShared}</div>
            <div className="text-gray-400">Items Shared</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-amber-400">{stats.peopleHelped}</div>
            <div className="text-gray-400">People Helped</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl">
            <div className="text-2xl font-bold text-green-400">{stats.carbonSaved}kg</div>
            <div className="text-gray-400">Carbon Saved</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-400">📦</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">No recent activity</p>
                <p className="text-gray-400 text-sm">Start by sharing your first food item!</p>
              </div>
              <Link 
                href="/add-listing"
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Share Food
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}