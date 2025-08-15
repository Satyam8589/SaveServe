'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FoodListingForm from '../_components/FoodListingForm';
import FoodListingTable from '../_components/FoodListingTable';
import { Plus, Utensils, Search, Heart } from 'lucide-react';

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

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Food Listings</h1>
              <p className="text-gray-400 mt-2">
                Share surplus food or find available meals in your area
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Listing
            </button>
          </div>
        </div>

        {/* Form Modal/Section */}
        {showForm && (
          <div className="mb-8">
            <FoodListingForm 
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Listings Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md">
          <FoodListingTable />
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">50+</div>
            <div className="text-gray-400">Active Listings</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">200+</div>
            <div className="text-gray-400">Meals Redistributed</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">25</div>
            <div className="text-gray-400">Active Providers</div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="mt-12 bg-gray-800 border border-gray-700 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">1. Create Listing</h3>
              <p className="text-gray-400">Food providers post details about surplus food including quantity, location, and expiry time.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">2. Browse & Find</h3>
              <p className="text-gray-400">Students and community members can browse available food listings and find meals near them.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">3. Collect & Enjoy</h3>
              <p className="text-gray-400">Coordinate pickup with providers and enjoy fresh meals while reducing food waste.</p>
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
