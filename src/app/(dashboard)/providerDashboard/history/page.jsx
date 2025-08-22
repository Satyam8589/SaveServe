'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Clock, History, Search, TrendingDown, Archive, Calendar } from 'lucide-react';
import ExpiredListingsTable from '../_components/ExpiredListingsTable';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function HistoryContent() {
  const { userId } = useAuth(); // Get the current user's Clerk ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-300 bg-clip-text text-transparent">
                Listing History
              </h1>
              <p className="text-gray-400 text-lg">
                View all your expired and past food listings
              </p>
            </div>
            
            <div className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 rounded-xl border border-gray-600/50">
              <History className="w-5 h-5 mr-2 text-orange-400" />
              <span className="font-medium">Historical Records</span>
            </div>
          </div>
        </div>

        {/* Expired Listings Table */}
        <div className="mb-12">
          <ExpiredListingsTable providerId={userId} />
        </div>

        {/* Stats Section */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 hover:border-orange-500/30 hover:bg-gradient-to-br hover:from-orange-900/20 hover:to-gray-900">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <Archive className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-orange-400 mb-2">-</div>
            <div className="text-gray-400 text-lg">Total Expired</div>
          </div>
          <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 hover:border-red-500/30 hover:bg-gradient-to-br hover:from-red-900/20 hover:to-gray-900">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-red-400 mb-2">-</div>
            <div className="text-gray-400 text-lg">Food Waste Prevented</div>
          </div>
          <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-gray-900">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-purple-400 mb-2">-</div>
            <div className="text-gray-400 text-lg">Days Active</div>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-10">
          <h2 className="text-3xl font-bold text-gray-100 mb-10 text-center">About History</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="group text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Archive className="w-10 h-10 text-orange-400 group-hover:text-orange-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-300/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Expired Listings</h3>
              <p className="text-gray-400 leading-relaxed">View all your food listings that have passed their expiry time and are no longer available for booking.</p>
            </div>
            
            <div className="group text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Search className="w-10 h-10 text-red-400 group-hover:text-red-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-300/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Track Performance</h3>
              <p className="text-gray-400 leading-relaxed">Monitor how your listings performed, including booking rates and food waste reduction impact.</p>
            </div>
            
            <div className="group text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Clock className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-300/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Learn & Improve</h3>
              <p className="text-gray-400 leading-relaxed">Use historical data to optimize future listings and improve your food redistribution strategy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HistoryContent />
    </QueryClientProvider>
  );
}
