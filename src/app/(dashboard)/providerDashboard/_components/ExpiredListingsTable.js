// File: /components/ExpiredListingsTable.js.
'use client';

import { useState, useEffect } from 'react';
import { useListings } from '@/hooks/useListings';
import { MapPin, Clock, User, Search, Package, Calendar, Star, Archive, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

export default function ExpiredListingsTable({ providerId }) {
  const [filters, setFilters] = useState({
    location: '',
    page: 1,
    limit: 20,
    providerId: providerId // Pass providerId to filters
  });

  // Keep filters in sync when providerId becomes available/changes
  useEffect(() => {
    if (providerId) {
      setFilters(prev => ({ ...prev, providerId }));
    }
  }, [providerId]);

  const { data, isLoading, isError, error } = useListings(filters);

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeExpired = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = now - expiry; // Time since expiry
    
    if (diff <= 0) return { text: 'Not Expired', expired: false };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return { text: `${days}d ${hours}h ago`, expired: true };
    }
    return { text: `${hours}h ago`, expired: true };
  };

  const getStatusBadge = (freshnessStatus) => {
    const baseClasses = "inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold";
    
    if (freshnessStatus === 'Fresh') {
      return `${baseClasses} bg-gradient-to-r from-gray-500/20 to-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
    return `${baseClasses} bg-gradient-to-r from-gray-500/20 to-gray-500/20 text-gray-400 border border-gray-500/30`;
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-700/50 rounded-lg mb-4 w-1/2 sm:w-1/3"></div>
            <div className="h-3 sm:h-4 bg-gray-700/50 rounded w-1/3 sm:w-1/4"></div>
          </div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <div className="animate-pulse">
                <div className="h-32 sm:h-48 bg-gray-700/50 rounded-xl mb-4"></div>
                <div className="h-4 sm:h-6 bg-gray-700/50 rounded mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-700/50 rounded mb-4 w-2/3"></div>
                <div className="space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-700/50 rounded"></div>
                  <div className="h-3 sm:h-4 bg-gray-700/50 rounded"></div>
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
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl shadow-2xl p-4 sm:p-8">
        <div className="text-center py-6 sm:py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-2xl mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2">Error Loading History</h3>
          <p className="text-sm sm:text-base text-gray-400">{error?.message || 'Failed to load expired listings'}</p>
        </div>
      </div>
    );
  }

  // Filter only expired listings for the current provider
  const allListings = (data?.data || []).filter(listing => !providerId || listing.providerId === providerId);
  const expiredListings = allListings.filter(listing => {
    const now = new Date();
    const expiry = new Date(listing.expiryTime);
    return expiry < now;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-4 sm:p-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-300 bg-clip-text text-transparent">
              Expired Food Listings
            </h2>
            <p className="text-gray-400 text-base sm:text-lg">
              {expiredListings.length} expired listings found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by location..."
                value={filters.location}
                onChange={handleLocationFilter}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all duration-300 text-gray-100 placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {expiredListings.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-8 sm:p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl mb-4 sm:mb-6">
              <Archive className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-2">No expired listings</h3>
            <p className="text-gray-400 text-base sm:text-lg">You don&apos;t have any expired food listings yet.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {expiredListings.map((listing) => {
              const timeInfo = formatTimeExpired(listing.expiryTime);
              
              return (
                <div 
                  key={listing._id} 
                  className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden opacity-75 hover:opacity-90"
                >
                  {/* Image Section */}
                  <div className="relative h-40 sm:h-56 overflow-hidden rounded-t-2xl">
                    {listing.imageUrl ? (
                      <Image
                        src={listing.imageUrl} 
                        alt={listing.title} 
                        fill
                        className="w-full h-full object-cover grayscale" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-600/50 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-400">No Image</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4">
                      <span className={getStatusBadge(listing.freshnessStatus)}>
                        <Star className="w-3 h-3 mr-1" />
                        {listing.freshnessStatus}
                      </span>
                    </div>
                    
                    {/* Expired Badge */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-red-500/20 text-red-400 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expired {timeInfo.text}
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-2 line-clamp-1">
                        {listing.title}
                      </h3>
                      {listing.description && (
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Mobile-Optimized Info Grid */}
                    <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1">
                        <div className="flex items-center gap-2 sm:gap-1">
                          <Package className="w-4 h-4 text-gray-500 shrink-0" />
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium sm:hidden">Quantity</div>
                        </div>
                        <div className="sm:hidden">:</div>
                        <div className="text-gray-400 font-semibold text-sm sm:text-base flex-1 sm:flex-none">
                          {typeof listing.available === 'number' ? listing.available : listing.quantity}
                          {listing.unit ? ` ${listing.unit}` : ''}
                        </div>
                        <div className="hidden sm:block text-xs text-gray-500 uppercase tracking-wide font-medium">Quantity</div>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1">
                        <div className="flex items-center gap-2 sm:gap-1">
                          <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium sm:hidden">Expired</div>
                        </div>
                        <div className="sm:hidden">:</div>
                        <div className="text-gray-400 font-medium text-sm truncate flex-1 sm:flex-none" title={formatDateTime(listing.expiryTime)}>
                          {formatDateTime(listing.expiryTime)}
                        </div>
                        <div className="hidden sm:block text-xs text-gray-500 uppercase tracking-wide font-medium">Expired On</div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-gray-400 pt-2 sm:pt-2 border-t border-gray-700/50">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                      <span className="text-sm truncate" title={listing.location}>{listing.location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination would go here if needed */}
        </>
      )}
    </div>
  );
}
