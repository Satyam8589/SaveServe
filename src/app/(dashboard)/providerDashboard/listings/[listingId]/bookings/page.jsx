'use client';

import { useParams } from 'next/navigation';
import { useFoodListing } from '@/hooks/useFoodListings';
import { useFoodListingBookings } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@clerk/nextjs';
import { 
  Calendar, 
  Clock, 
  User, 
  Package, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Eye,
  UserCheck
} from 'lucide-react';

export default function ListingBookingsPage() {
  const params = useParams();
  const listingId = params.listingId;
  const { userId } = useAuth();

  const { data: listing, isLoading: isListingLoading, isError: isListingError, error: listingError } = useFoodListing(listingId);
  const { data: bookings, isLoading: isBookingsLoading, isError: isBookingsError, error: bookingsError } = useFoodListingBookings(listingId, userId);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";
    
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30`;
      case 'pending':
        return `${baseClasses} bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30`;
      case 'rejected':
        return `${baseClasses} bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-500/20 to-gray-400/20 text-gray-400 border border-gray-500/30`;
    }
  };

  if (isListingLoading || isBookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700/50 rounded-lg w-2/3"></div>
              <div className="h-4 bg-gray-700/50 rounded w-1/3"></div>
            </div>
          </div>
          
          {/* Table Skeleton */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700/50">
              <div className="animate-pulse h-6 bg-gray-700/50 rounded w-1/4"></div>
            </div>
            <div className="divide-y divide-gray-700/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6">
                  <div className="animate-pulse grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isListingError || isBookingsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl shadow-2xl p-8">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-2xl mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Error Loading Data</h2>
              <p className="text-gray-400">{listingError?.message || bookingsError?.message || 'Failed to load listing or bookings.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-8">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-500/20 to-gray-400/20 rounded-2xl mb-6">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Listing Not Found</h2>
              <p className="text-gray-400">The requested listing could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-8">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                Bookings for "{listing.title}"
              </h1>
              <p className="text-gray-400 text-lg">
                Listing ID: <span className="font-mono text-emerald-400">{listing._id}</span>
              </p>
            </div>
            
            <button 
              onClick={() => window.history.back()}
              className="flex items-center px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl transition-all duration-200 text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-700/50">
            <h2 className="text-2xl font-bold text-gray-100">
              Booking Requests
              {bookings && (
                <span className="ml-3 text-lg font-normal text-gray-400">
                  ({bookings.length} {bookings.length === 1 ? 'request' : 'requests'})
                </span>
              )}
            </h2>
          </div>

          {bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Recipient
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Quantity
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Requested At
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Pickup Time
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Details
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {bookings.map((booking, index) => (
                    <tr key={booking._id} className="hover:bg-gray-700/20 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-100">{booking.recipientName}</div>
                          <div className="text-xs text-gray-400 font-mono">{booking.recipientId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-emerald-400 font-semibold">
                            {booking.approvedQuantity || booking.requestedQuantity}
                          </div>
                          {booking.approvedQuantity && booking.approvedQuantity !== booking.requestedQuantity && (
                            <div className="text-xs text-gray-400">
                              Requested: {booking.requestedQuantity}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(booking.status)}
                          <span className={getStatusBadge(booking.status)}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-300 text-sm">
                          {new Date(booking.requestedAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(booking.requestedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.scheduledPickupTime ? (
                          <div>
                            <div className="text-gray-300 text-sm">
                              {new Date(booking.scheduledPickupTime).toLocaleDateString()}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {new Date(booking.scheduledPickupTime).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs space-y-2">
                          {booking.requestMessage && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                              <div className="text-xs text-blue-400 font-semibold mb-1">Request Message:</div>
                              <div className="text-sm text-gray-300">{booking.requestMessage}</div>
                            </div>
                          )}
                          {booking.providerResponse && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                              <div className="text-xs text-emerald-400 font-semibold mb-1">Provider Response:</div>
                              <div className="text-sm text-gray-300">{booking.providerResponse}</div>
                            </div>
                          )}
                          {!booking.requestMessage && !booking.providerResponse && (
                            <span className="text-gray-500 text-sm">No messages</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl mb-6">
                  <UserCheck className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-100 mb-2">No bookings found</h3>
                <p className="text-gray-400 text-lg">No booking requests have been made for this listing yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}