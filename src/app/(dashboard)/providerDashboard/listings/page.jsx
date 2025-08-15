'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FoodListingForm from '../_components/FoodListingForm';
import FoodListingTable from '../_components/FoodListingTable';
import { Plus, Utensils, Search, Heart, TrendingUp, Users, Clock } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function ListingsContent() {
  const [showForm, setShowForm] = useState(false);
  const { userId } = useAuth(); // Get the current user's Clerk ID

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                Food Listings
              </h1>
              <p className="text-gray-400 text-lg">
                Share surplus food or find available meals in your area
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90 duration-300" />
              Create Listing
            </button>
          </div>
        </div>

        {/* Form Modal/Section */}
        {showForm && (
          <div className="mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-1">
              <div className="bg-gray-800 rounded-xl">
                <FoodListingForm 
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Listings Table */}
        <div className="mb-12">
          <FoodListingTable providerId={userId} />
        </div>

        {/* Stats Section */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-emerald-900/20 hover:to-gray-900">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-emerald-400 mb-2">50+</div>
            <div className="text-gray-400 text-lg">Active Listings</div>
          </div>
          <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 hover:border-green-500/30 hover:bg-gradient-to-br hover:from-green-900/20 hover:to-gray-900">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-green-400 mb-2">200+</div>
            <div className="text-gray-400 text-lg">Meals Redistributed</div>
          </div>
          <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-gray-900">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-purple-400 mb-2">25</div>
            <div className="text-gray-400 text-lg">Active Providers</div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-10">
          <h2 className="text-3xl font-bold text-gray-100 mb-10 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="group text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Utensils className="w-10 h-10 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-emerald-300/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">1. Create Listing</h3>
              <p className="text-gray-400 leading-relaxed">Food providers post details about surplus food including quantity, location, and expiry time.</p>
            </div>
            
            <div className="group text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Search className="w-10 h-10 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-300/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">2. Browse & Find</h3>
              <p className="text-gray-400 leading-relaxed">Students and community members can browse available food listings and find meals near them.</p>
            </div>
            
            <div className="group text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Heart className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-300/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">3. Collect & Enjoy</h3>
              <p className="text-gray-400 leading-relaxed">Coordinate pickup with providers and enjoy fresh meals while reducing food waste.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ListingsContent />
    </QueryClientProvider>
  );
}