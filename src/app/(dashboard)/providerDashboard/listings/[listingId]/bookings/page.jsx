'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFoodListing } from '@/hooks/useFoodListings';
import { useFoodListingBookings } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import QRScanner from '@/components/QRScanner';
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
  UserCheck,
  QrCode,
  BadgeCheck,
} from 'lucide-react';

export default function ListingBookingsPage() {
  const params = useParams();
  const listingId = params.listingId;
  const { userId } = useAuth();

  const { data: listing, isLoading: isListingLoading, isError: isListingError, error: listingError } = useFoodListing(listingId);
  const { data: bookingData, isLoading: isBookingsLoading, isError: isBookingsError, error: bookingsError } = useFoodListingBookings(listingId, userId);

  const [bookings, setBookings] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (bookingData?.data?.bookings) {
      setBookings(bookingData.data.bookings);
    }
  }, [bookingData]);

  const handleScanSuccess = (verifiedBooking) => {
    setBookings(currentBookings =>
      currentBookings.map(b =>
        b._id === verifiedBooking._id ? { ...b, status: 'collected' } : b
      )
    );
    setIsScannerOpen(false);
    // Optionally, show a success toast/notification here
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'collected':
        return <BadgeCheck className="w-5 h-5 text-indigo-400" />;
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
      case 'collected':
        return `${baseClasses} bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-500/20 to-gray-400/20 text-gray-400 border border-gray-500/30`;
    }
  };

  if (isListingLoading || isBookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700/50 rounded-lg w-2/3"></div>
              <div className="h-4 bg-gray-700/50 rounded w-1/3"></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700/50">
              <div className="animate-pulse h-6 bg-gray-700/50 rounded w-1/4"></div>
            </div>
            <div className="divide-y divide-gray-700/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded"></div>
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
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl shadow-2xl p-8 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Error Loading Data</h2>
            <p className="text-gray-400">{listingError?.message || bookingsError?.message || 'Failed to load listing or bookings.'}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!listing) {
      return <div className="text-center p-8 text-gray-400">Listing not found.</div>
  }

  return (
    <>
      {isScannerOpen && (
        <QRScanner
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          listingId={listingId}
          providerId={userId}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Bookings for "{listing.title}"</h1>
                    <p className="text-gray-400 text-lg mt-2">Listing ID: <span className="font-mono text-emerald-400">{listing._id}</span></p>
                </div>
                <Button onClick={() => setIsScannerOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    <QrCode className="w-5 h-5 mr-2" />
                    Verify Collection
                </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-700/50">
              <h2 className="text-2xl font-bold text-gray-100">
                Booking Requests
                {bookings && <span className="ml-3 text-lg font-normal text-gray-400">({bookings.length})</span>}
              </h2>
            </div>

            {bookings && bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Requested At</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-700/20 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-100">{booking.recipientName ?? 'N/A'}</div>
                          <div className="text-xs text-gray-400 font-mono">{booking.recipientId ?? 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-semibold">{booking.approvedQuantity ?? booking.requestedQuantity ?? 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={getStatusBadge(booking.status ?? 'unknown')}>
                            {getStatusIcon(booking.status ?? 'unknown')}
                            <span className="ml-2">{(booking.status ?? 'UNKNOWN').toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-300 text-sm">{booking.requestedAt ? new Date(booking.requestedAt).toLocaleDateString() : 'N/A'}</div>
                          <div className="text-gray-400 text-xs">{booking.requestedAt ? new Date(booking.requestedAt).toLocaleTimeString() : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {booking.requestMessage && <div className="text-sm text-gray-300">{booking.requestMessage}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.status === 'approved' && (
                            <Button onClick={() => setIsScannerOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                <QrCode className="w-4 h-4 mr-2" />
                                Verify
                            </Button>
                          )}
                          {booking.status === 'collected' && (
                            <div className="flex items-center text-indigo-400 font-semibold">
                                <BadgeCheck className="w-5 h-5 mr-2" />
                                Collected
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <UserCheck className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-100 mb-2">No bookings found</h3>
                <p className="text-gray-400 text-lg">No booking requests have been made for this listing yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
