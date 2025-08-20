import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Package,
  MapPin,
  Clock,
  Users,
  Check,
  X,
  AlertTriangle,
  QrCode,
  Eye,
  MessageCircle,
  CheckCircle,
  RefreshCw,
  Camera,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import QRScanner from "./QRScanner";
import {
  useFoodListingBookings,
  useUpdateBookingStatus,
  useVerifyCollection,
} from "@/hooks/useBookings";

const ProviderDashboard = ({ listingId }) => {
  const { user } = useUser();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvedQuantity, setApprovedQuantity] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [collectionSuccess, setCollectionSuccess] = useState(null);

  // Fetch bookings for this listing
  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
  } = useFoodListingBookings(listingId, user?.id);

  // Mutations
  const updateBookingMutation = useUpdateBookingStatus();
  const verifyCollectionMutation = useVerifyCollection();

  const bookings = bookingsData?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-600 text-white";
      case "collected":
        return "bg-gray-500 text-white";
      case "pending":
        return "bg-yellow-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      case "cancelled":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApproveBooking = (booking) => {
    setSelectedBooking(booking);
    setApprovedQuantity(booking.requestedQuantity);
    setShowApproveModal(true);
  };

  const handleRejectBooking = (booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedBooking || approvedQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid approved quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateBookingMutation.mutateAsync({
        bookingId: selectedBooking._id,
        status: "approved",
        approvedQuantity,
      });

      toast({
        title: "Success",
        description: "Booking approved successfully!",
      });

      setShowApproveModal(false);
      setSelectedBooking(null);
      setApprovedQuantity(0);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve booking",
        variant: "destructive",
      });
    }
  };

  const confirmRejection = async () => {
    if (!selectedBooking) return;

    try {
      await updateBookingMutation.mutateAsync({
        bookingId: selectedBooking._id,
        status: "rejected",
        response: rejectReason.trim(),
      });

      toast({
        title: "Booking Rejected",
        description: "The user will be notified of your decision",
      });

      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive",
      });
    }
  };

  const handleOpenScanner = () => {
    setShowQRScanner(true);
    setCollectionSuccess(null);
  };

  const handleScanSuccess = (collectionData) => {
    setCollectionSuccess(collectionData);
    setShowQRScanner(false);

    toast({
      title: "Collection Verified!",
      description: `Successfully verified collection${
        collectionData?.booking?.recipientName
          ? ` for ${collectionData.booking.recipientName}`
          : ""
      }`,
    });

    // Refresh bookings to show updated status
    refetch();
  };

  const handleCloseScanner = () => {
    setShowQRScanner(false);
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const approvedBookings = bookings.filter((b) => b.status === "approved");
  const completedBookings = bookings.filter((b) => b.status === "collected");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-100">
            Loading bookings...
          </h3>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Failed to Load Bookings
        </h3>
        <p className="text-gray-400 mb-4">
          {error.message || "Something went wrong"}
        </p>
        <Button
          onClick={() => refetch()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl shadow-2xl border border-gray-600 p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-3 rounded-xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Booking Management
                </h1>
                <p className="text-gray-300 mt-1">
                  Review and manage food collection requests
                </p>
                <div className="flex items-center mt-2 text-sm text-gray-400">
                  <User className="w-4 h-4 mr-1" />
                  <span>Provider: {user?.fullName || user?.firstName}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center space-x-3">
                <Badge className="bg-yellow-600 text-white px-3 py-1 text-sm font-medium shadow-lg">
                  {pendingBookings.length} Pending
                </Badge>
                <Badge className="bg-emerald-600 text-white px-3 py-1 text-sm font-medium shadow-lg">
                  {approvedBookings.length} Ready
                </Badge>
                <Badge className="bg-blue-600 text-white px-3 py-1 text-sm font-medium shadow-lg">
                  {completedBookings.length} Completed
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={handleOpenScanner}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Success Message */}
        {collectionSuccess && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 p-3 rounded-full shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-green-400 font-bold text-lg">
                  Collection Completed Successfully!
                </h4>
                <p className="text-gray-300 text-sm mt-1">
                  {collectionSuccess.booking?.recipientName || 'Recipient'} collected{" "}
                  {collectionSuccess.booking?.approvedQuantity || 'N/A'} items
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Verified at{" "}
                  {collectionSuccess.collectionSummary?.verificationTime
                    ? formatTime(collectionSuccess.collectionSummary.verificationTime)
                    : new Date().toLocaleTimeString()
                  }
                </p>
              </div>
              <Button
                onClick={() => setCollectionSuccess(null)}
                variant="outline"
                size="sm"
                className="border-green-500 text-green-400 hover:bg-green-600 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {pendingBookings.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-yellow-500" />
                Pending Requests
                <Badge className="ml-3 bg-yellow-600 text-white">
                  {pendingBookings.length}
                </Badge>
              </h2>
            </div>
            <div className="grid gap-6">
              {pendingBookings.map((booking) => (
                <div key={booking._id} className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-emerald-600 p-2 rounded-full">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="text-white font-semibold text-lg">
                              {booking.recipientName || "Anonymous User"}
                            </span>
                            <Badge className="ml-3 bg-yellow-600 text-white px-3 py-1">
                              Pending Review
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Package className="h-4 w-4 text-emerald-400" />
                            <span>Requested Quantity: <strong className="text-white">{booking.requestedQuantity}</strong></span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span>Requested {formatTime(booking.requestedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

              <CardContent className="pt-0">
                    {booking.requestMessage && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MessageCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                          <div>
                            <p className="text-blue-400 font-medium text-sm mb-1">Recipient Message:</p>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {booking.requestMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => handleApproveBooking(booking)}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg"
                        disabled={updateBookingMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve Request
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectBooking(booking)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
                        disabled={updateBookingMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject Request
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Bookings */}
        {approvedBookings.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-emerald-500" />
                Ready for Collection
                <Badge className="ml-3 bg-emerald-600 text-white">
                  {approvedBookings.length}
                </Badge>
              </h2>
            </div>
            <div className="grid gap-6">
              {approvedBookings.map((booking) => (
                <div key={booking._id} className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-500/30 rounded-xl shadow-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-emerald-600 p-3 rounded-full shadow-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {booking.recipientName || "Anonymous User"}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4 text-emerald-400" />
                            <span>Approved: <strong className="text-white">{booking.approvedQuantity || booking.requestedQuantity}</strong> items</span>
                          </div>
                          {booking.scheduledPickupTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-blue-400" />
                              <span>Pickup: {formatTime(booking.scheduledPickupTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium shadow-lg">
                        Ready for Pickup
                      </Badge>
                      <div className="text-xs text-gray-400 text-center">
                        <div>Collection Code:</div>
                        <div className="font-mono text-emerald-400 font-bold">
                          {booking.collectionCode || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Completed Collections */}
      {completedBookings.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-200">
            Recently Completed
          </h4>
          {completedBookings.slice(0, 3).map((booking) => (
            <Card key={booking._id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-gray-100 font-medium">
                        {booking.recipientName || "Anonymous User"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Collected:{" "}
                        {booking.approvedQuantity || booking.requestedQuantity}{" "}
                        items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(booking.status)}>
                      Completed
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {booking.collectedAt && formatTime(booking.collectedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {bookings.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No Bookings Yet
            </h3>
            <p className="text-gray-400">
              When users book your food listing, their requests will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={handleCloseScanner}
          listingId={listingId}
          providerId={user?.id}
        />
      )}

      {/* Approve Booking Modal */}
      {showApproveModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center justify-between">
                Approve Booking
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowApproveModal(false)}
                  className="text-gray-400 hover:text-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-gray-300 text-sm">
                  <strong>Recipient:</strong> {selectedBooking.recipientName}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Requested:</strong>{" "}
                  {selectedBooking.requestedQuantity} items
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Approved Quantity
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedBooking.requestedQuantity}
                  value={approvedQuantity}
                  onChange={(e) =>
                    setApprovedQuantity(parseInt(e.target.value) || 0)
                  }
                  className="bg-gray-700 border-gray-600 text-gray-100 mt-2"
                  placeholder="Enter quantity to approve"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowApproveModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300"
                  disabled={updateBookingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmApproval}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    approvedQuantity <= 0 || updateBookingMutation.isPending
                  }
                >
                  {updateBookingMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Booking Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center justify-between">
                Reject Booking
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-gray-300 text-sm">
                  <strong>Recipient:</strong> {selectedBooking.recipientName}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Requested:</strong>{" "}
                  {selectedBooking.requestedQuantity} items
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Reason for rejection (optional)
                </Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Let the user know why you're rejecting their request..."
                  className="bg-gray-700 border-gray-600 text-gray-100 mt-2 resize-none"
                  rows={3}
                  maxLength={300}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowRejectModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300"
                  disabled={updateBookingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRejection}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={updateBookingMutation.isPending}
                >
                  {updateBookingMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
