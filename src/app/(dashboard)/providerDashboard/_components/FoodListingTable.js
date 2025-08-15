// File: /components/FoodListingTable.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/hooks/useListings';
import { MapPin, Clock, User, Search, Filter, ChevronDown, Eye } from 'lucide-react';

export default function FoodListingTable({ providerId }) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    location: '',
    page: 1,
    limit: 20,
    providerId: providerId // Pass providerId to filters
  });

  const { data, isLoading, isError, error } = useListings(filters);

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry - now;
    
    if (diff <= 0) return { text: 'Expired', urgent: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, urgent: hours < 2 };
    }
    return { text: `${minutes}m`, urgent: minutes < 60 };
  };

  const getStatusBadge = (freshnessStatus) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";
    
    if (freshnessStatus === 'Fresh') {
      return `${baseClasses} bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30`;
    }
    return `${baseClasses} bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30`;
  };

  const handleLocationFilter = (e) => {
    setFilters(prev => ({
      ...prev,
      location: e.target.value,
      page: 1
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700/50 rounded-lg mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
          </div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-700/50 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-700/50 rounded mb-2"></div>
                <div className="h-4 bg-gray-700/50 rounded mb-4 w-2/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700/50 rounded"></div>
                  <div className="h-4 bg-gray-700/50 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl shadow-2xl p-8">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-2xl mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-2">Error Loading Listings</h3>
          <p className="text-gray-400">{error?.message || 'Failed to load food listings'}</p>
        </div>
      </div>
    );
  }

  const listings = data?.data || [];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Available Food Listings
            </h2>
            <p className="text-gray-400 text-lg">
              {data?.pagination?.total || 0} listings found
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by location..."
                value={filters.location}
                onChange={handleLocationFilter}
                className="pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all duration-300 text-gray-100 placeholder-gray-400 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-100 mb-2">No listings available</h3>
            <p className="text-gray-400 text-lg">There are currently no active food listings.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const timeInfo = formatTimeRemaining(listing.expiryTime);
              
              return (
                <div 
                  key={listing._id} 
                  className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-emerald-900/10 hover:to-gray-900 overflow-hidden"
                  onClick={() => {
                    const url = `/providerDashboard/listings/${listing._id}/bookings`;
                    console.log('Navigating to:', url);
                    router.push(url);
                  }}
                >
                  {/* Image Section */}
                  <div className="relative h-56 overflow-hidden rounded-t-2xl">
                    {listing.imageUrl ? (
                      <img 
                        src={listing.imageUrl} 
                        alt={listing.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-600/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-400">No Image</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={getStatusBadge(listing.freshnessStatus)}>
                        {listing.freshnessStatus}
                      </span>
                    </div>
                    
                    {/* Time Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                        timeInfo.urgent 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {timeInfo.text}
                      </div>
                    </div>
                    
                    {/* View Button */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-2 transition-colors duration-200">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                        {listing.title}
                      </h3>
                      {listing.description && (
                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                          {listing.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Quantity</div>
                        <div className="text-emerald-400 font-semibold">{listing.quantity}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Provider</div>
                        <div className="text-gray-300 font-medium text-sm truncate">{listing.providerName}</div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-gray-400 pt-2 border-t border-gray-700/50">
                      <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                      <span className="text-sm">{listing.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="text-gray-300">
                  Showing page <span className="font-semibold text-emerald-400">{data.pagination.current}</span> of <span className="font-semibold text-emerald-400">{data.pagination.pages}</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={data.pagination.current === 1}
                    className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600/50 hover:border-gray-500/50 transition-all duration-200 text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={data.pagination.current === data.pagination.pages}
                    className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600/50 hover:border-gray-500/50 transition-all duration-200 text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}