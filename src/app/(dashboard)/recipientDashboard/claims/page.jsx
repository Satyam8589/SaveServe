"use client"
import React, { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  Clock,
  Users,
  Navigation,
  Star,
  Check,
  ShoppingCart,
  AlertTriangle,
  QrCode,
  Eye,
  RefreshCw,
  Phone,
  Calendar
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import QRCodeDisplay from "@/components/QRCodeDisplay";

const ClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Sample data - replace with actual API call
  const sampleClaims = [
    {
      _id: "1",
      title: "Pasta Portions",
      requestedQuantity: 5,
      approvedQuantity: 5,
      status: "approved",
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      scheduledPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      qrCode: JSON.stringify({
        bookingId: "1",
        recipientId: "user_123",
        listingId: "listing_456",
        timestamp: new Date().toISOString(),
        type: 'food_collection',
        hash: 'abc123'
      }),
      qrCodeImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // Placeholder
      qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      collectionCode: "123456",
      foodListing: {
        title: "Fresh Pasta with Marinara",
        location: "Main Canteen, Ground Floor",
        providerId: "provider_123",
        providerName: "Campus Canteen Team",
        pickupInstructions: "Ask for John at the counter"
      },
      providerName: "Campus Canteen Team"
    },
    {
      _id: "2",
      title: "Fresh Bread Loaves",
      requestedQuantity: 3,
      approvedQuantity: 2,
      status: "collected",
      requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      scheduledPickupTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      collectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      rating: 5,
      foodListing: {
        title: "Artisan Sourdough Bread",
        location: "Campus Bakery",
        providerId: "bakery_456",
        providerName: "Campus Bakery"
      },
      providerName: "Campus Bakery"
    },
    {
      _id: "3",
      title: "Vegetable Curry",
      requestedQuantity: 8,
      approvedQuantity: 0,
      status: "pending",
      requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      scheduledPickupTime: new Date(Date.now() + 13 * 60 * 60 * 1000),
      foodListing: {
        title: "Mixed Vegetable Curry",
        location: "Hostel B Mess",
        providerId: "hostel_789",
        providerName: "Hostel B Kitchen Staff"
      },
      providerName: "Hostel B Kitchen Staff"
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setClaims(sampleClaims);
      setLoading(false);
    }, 1000);
  }, []);

  const refreshClaims = async () => {
    setLoading(true);
    // Replace with actual API call
    setTimeout(() => {
      setClaims(sampleClaims);
      setLoading(false);
    }, 1000);
  };

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
      case "expired":
        return "bg-orange-600 text-white";
      case "cancelled":
        return "bg-gray-600 text-white";
      default:
        return "bg-emerald-500 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <Check className="h-3 w-3" />;
      case "collected":
        return <Package className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "rejected":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Ready for Pickup";
      case "collected":
        return "Completed";
      case "pending":
        return "Awaiting Approval";
      case "rejected":
        return "Rejected";
      case "expired":
        return "Expired";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isQRExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate);
  };

  const getTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) return `${minutes}m left`;
    return `${hours}h ${minutes}m left`;
  };

  const handleViewQRCode = (claim) => {
    setSelectedBooking(claim);
    setShowQRCode(true);
  };

  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setSelectedBooking(null);
  };

  const activeClaims = claims.filter(claim => 
    ['pending', 'approved'].includes(claim.status)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">My Claims</h2>
            <p className="text-gray-400">Loading your claimed food items...</p>
          </div>
        </div>
        <div className="space-y-4">
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">My Claims</h2>
          <p className="text-gray-400">Track your claimed food items</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-600 text-white">
            {activeClaims.length} Active
          </Badge>
          <Button
            onClick={refreshClaims}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {claims.map((claim) => (
          <Card key={claim._id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-gray-100 text-lg mb-2">
                    {claim.foodListing?.title || claim.title}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4" />
                      <span>
                        {claim.approvedQuantity > 0 
                          ? `${claim.approvedQuantity} approved`
                          : `${claim.requestedQuantity} requested`
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Claimed {formatTime(claim.requestedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {claim.status === 'approved' && claim.qrCodeExpiry && (
                    <Badge className={isQRExpired(claim.qrCodeExpiry) ? "bg-red-600" : "bg-blue-600"}>
                      {getTimeRemaining(claim.qrCodeExpiry)}
                    </Badge>
                  )}
                  <Badge className={getStatusColor(claim.status)}>
                    {getStatusIcon(claim.status)}
                    <span className="ml-1">{getStatusText(claim.status)}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>{claim.foodListing?.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>{claim.providerName}</span>
                </div>
                {claim.scheduledPickupTime && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Pickup: {formatTime(claim.scheduledPickupTime)}</span>
                  </div>
                )}
                {claim.collectedAt && (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Collected: {formatTime(claim.collectedAt)}</span>
                  </div>
                )}
              </div>

              <Separator className="bg-gray-700 my-4" />

              <div className="flex flex-wrap gap-2">
                {claim.status === "approved" && claim.qrCode && (
                  <Button
                    size="sm"
                    onClick={() => handleViewQRCode(claim)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                )}

                {claim.status === "approved" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Directions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </>
                )}

                {claim.status === "collected" && !claim.rating && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate Experience
                  </Button>
                )}

                {claim.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-600 text-yellow-400 cursor-default"
                    disabled
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Awaiting Approval
                  </Button>
                )}

                {claim.status === "rejected" && claim.providerResponse && (
                  <div className="w-full mt-2 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">
                      <strong>Provider Response:</strong> {claim.providerResponse}
                    </p>
                  </div>
                )}
              </div>

              {/* Special notices */}
              {claim.status === 'approved' && claim.qrCodeExpiry && isQRExpired(claim.qrCodeExpiry) && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">
                      QR Code has expired. Please contact the provider or make a new booking.
                    </span>
                  </div>
                </div>
              )}

              {claim.isUrgent && (
                <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400 text-sm font-medium">
                      Urgent pickup required - expires soon!
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {claims.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No Claims Yet
            </h3>
            <p className="text-gray-400 mb-4">
              Start browsing food listings to make your first claim
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Browse Food Listings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code Display Modal */}
      {showQRCode && selectedBooking && (
        <QRCodeDisplay
          booking={selectedBooking}
          onClose={handleCloseQRCode}
        />
      )}
    </div>
  );
};

export default ClaimsPage;