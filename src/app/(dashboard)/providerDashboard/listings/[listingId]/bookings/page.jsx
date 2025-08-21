"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFoodListing } from "@/hooks/useFoodListings";
import { useFoodListingBookings } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import QRScanner from "@/components/QRScanner";
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
  Filter,
  Download,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ListingBookingsPage() {
  const params = useParams();
  const listingId = params.listingId;
  const { userId } = useAuth();

  const {
    data: listing,
    isLoading: isListingLoading,
    isError: isListingError,
    error: listingError,
  } = useFoodListing(listingId);
  const {
    data: bookingData,
    isLoading: isBookingsLoading,
    isError: isBookingsError,
    error: bookingsError,
  } = useFoodListingBookings(listingId, userId);

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (bookingData?.data?.bookings) {
      setBookings(bookingData.data.bookings);
      setFilteredBookings(bookingData.data.bookings);
    }
  }, [bookingData]);

  useEffect(() => {
    let filtered = bookings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.recipientName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.recipientId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.requestMessage
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter]);

  const handleScanSuccess = (verifiedBooking) => {
    // Safety check to ensure verifiedBooking has an _id
    if (verifiedBooking && verifiedBooking._id) {
      setBookings((currentBookings) =>
        currentBookings.map((b) =>
          b._id === verifiedBooking._id ? { ...b, status: "collected" } : b
        )
      );
    }
    setIsScannerOpen(false);
  };

  const toggleBookingExpansion = (bookingId) => {
    setExpandedBookings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />;
      case "pending":
        return (
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
        );
      case "rejected":
        return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />;
      case "collected":
        return <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />;
      default:
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses =
      "inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30`;
      case "pending":
        return `${baseClasses} bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30`;
      case "rejected":
        return `${baseClasses} bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30`;
      case "collected":
        return `${baseClasses} bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-500/20 to-gray-400/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const getStatusStats = () => {
    const stats = {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      approved: bookings.filter((b) => b.status === "approved").length,
      collected: bookings.filter((b) => b.status === "collected").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
    };
    return stats;
  };

  if (isListingLoading || isBookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Skeleton */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 sm:h-8 bg-gray-700/50 rounded-lg w-full sm:w-2/3"></div>
              <div className="h-3 sm:h-4 bg-gray-700/50 rounded w-full sm:w-1/3"></div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-700/50">
              <div className="animate-pulse h-4 sm:h-6 bg-gray-700/50 rounded w-1/4"></div>
            </div>
            <div className="divide-y divide-gray-700/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 text-center">
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-100 mb-2">
              Error Loading Data
            </h2>
            <p className="text-sm sm:text-base text-gray-400">
              {listingError?.message ||
                bookingsError?.message ||
                "Failed to load listing or bookings."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Listing not found.</p>
        </div>
      </div>
    );
  }

  const stats = getStatusStats();

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent break-words">
                  Bookings for "{listing.title}"
                </h1>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg mt-2">
                  Listing ID:{" "}
                  <span className="font-mono text-emerald-400 break-all">
                    {listing._id}
                  </span>
                </p>

                {/* Status Stats - Mobile Optimized */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-4">
                  {Object.entries(stats).map(([status, count]) => (
                    <div
                      key={status}
                      className="bg-gray-700/30 rounded-lg p-2 sm:p-3 text-center"
                    >
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {count}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 capitalize">
                        {status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto"
                  size="sm"
                >
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">Verify Collection</span>
                  <span className="sm:hidden">Verify</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-10"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="collected">Collected</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bookings Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-700/50">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-100">
                Booking Requests
                {filteredBookings && (
                  <span className="ml-3 text-sm sm:text-base lg:text-lg font-normal text-gray-400">
                    ({filteredBookings.length})
                  </span>
                )}
              </h2>
            </div>

            {filteredBookings && filteredBookings.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Requested At
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {filteredBookings.map((booking) => (
                        <tr
                          key={booking._id}
                          className="hover:bg-gray-700/20 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-100">
                              {booking.recipientName ?? "N/A"}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {booking.recipientId ?? "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-semibold">
                            {booking.approvedQuantity ??
                              booking.requestedQuantity ??
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={getStatusBadge(
                                booking.status ?? "unknown"
                              )}
                            >
                              {getStatusIcon(booking.status ?? "unknown")}
                              <span className="ml-2">
                                {(booking.status ?? "UNKNOWN").toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-300 text-sm">
                              {booking.requestedAt
                                ? new Date(
                                    booking.requestedAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {booking.requestedAt
                                ? new Date(
                                    booking.requestedAt
                                  ).toLocaleTimeString()
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            {booking.requestMessage && (
                              <div className="text-sm text-gray-300 truncate">
                                {booking.requestMessage}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {booking.status === "approved" && (
                              <Button
                                onClick={() => setIsScannerOpen(true)}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <QrCode className="w-4 h-4 mr-2" />
                                Verify
                              </Button>
                            )}
                            {booking.status === "collected" && (
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

                {/* Mobile Card View */}
                <div className="lg:hidden">
                  <div className="divide-y divide-gray-700/50">
                    {filteredBookings.map((booking) => {
                      const isExpanded = expandedBookings.has(booking._id);
                      return (
                        <div key={booking._id} className="p-4 sm:p-6">
                          <div className="space-y-3">
                            {/* Header Row */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-100 truncate">
                                  {booking.recipientName ?? "N/A"}
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                  {booking.recipientId ?? "N/A"}
                                </div>
                              </div>
                              <div
                                className={getStatusBadge(
                                  booking.status ?? "unknown"
                                )}
                              >
                                {getStatusIcon(booking.status ?? "unknown")}
                                <span className="ml-2">
                                  {(booking.status ?? "UNKNOWN").toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Key Info Row */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-emerald-400 font-semibold">
                                Qty:{" "}
                                {booking.approvedQuantity ??
                                  booking.requestedQuantity ??
                                  "N/A"}
                              </div>
                              <div className="text-gray-400">
                                {booking.requestedAt
                                  ? new Date(
                                      booking.requestedAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </div>
                            </div>

                            {/* Expandable Content */}
                            {(booking.requestMessage || isExpanded) && (
                              <>
                                <button
                                  onClick={() =>
                                    toggleBookingExpansion(booking._id)
                                  }
                                  className="flex items-center text-gray-400 hover:text-gray-300 text-sm transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-4 h-4 mr-1" />
                                      Show Less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4 mr-1" />
                                      Show Details
                                    </>
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="space-y-2 pt-2 border-t border-gray-700/50">
                                    {booking.requestMessage && (
                                      <div>
                                        <div className="text-xs text-gray-400 mb-1">
                                          Message:
                                        </div>
                                        <div className="text-sm text-gray-300">
                                          {booking.requestMessage}
                                        </div>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-400">
                                      Requested:{" "}
                                      {booking.requestedAt
                                        ? new Date(
                                            booking.requestedAt
                                          ).toLocaleString()
                                        : "N/A"}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Action Row */}
                            <div className="flex items-center justify-end pt-2">
                              {booking.status === "approved" && (
                                <Button
                                  onClick={() => setIsScannerOpen(true)}
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                                >
                                  <QrCode className="w-4 h-4 mr-2" />
                                  Verify Collection
                                </Button>
                              )}
                              {booking.status === "collected" && (
                                <div className="flex items-center text-indigo-400 font-semibold justify-center w-full sm:w-auto">
                                  <BadgeCheck className="w-5 h-5 mr-2" />
                                  Collected
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No matching bookings"
                    : "No bookings found"}
                </h3>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "No booking requests have been made for this listing yet."}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    variant="outline"
                    className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
