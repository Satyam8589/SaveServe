"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserBookings } from "@/hooks/useBookings";
import {
  QrCode,
  Copy,
  Download,
  Clock,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Phone,
  Mail,
  User,
  MessageCircle,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTimeCalculations } from "@/hooks/useTimeCalculations";

const ClaimsPage = () => {
  const { user } = useUser();
  const { data: bookingsData, isLoading, error } = useUserBookings(user?.id);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [contactProvider, setContactProvider] = useState(null);

  // Early loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Claims</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800/50 animate-pulse">
              <CardContent className="h-32"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-red-900/20 border-red-500/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Error Loading Claims
            </h2>
            <p className="text-red-300">
              Failed to load your claims. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const claims = bookingsData?.data || [];
  const filteredClaims =
    statusFilter === "all"
      ? claims
      : claims.filter((claim) => claim.status === statusFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="h-8 w-8 text-emerald-400" />
          <h1 className="text-3xl font-bold text-gray-100">My Claims</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Track your food collection requests and access QR codes
        </p>
      </div>

      {/* Enhanced Filter Section */}
      <div className="mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />
            Filter Claims
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { key: "all", label: "All Claims", icon: Package },
              { key: "pending", label: "Pending", icon: Clock },
              { key: "approved", label: "Approved", icon: CheckCircle },
              { key: "collected", label: "Collected", icon: CheckCircle },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-2 ${
                  statusFilter === key
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <Card className="bg-gray-800/50">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">No claims found</p>
            </CardContent>
          </Card>
        ) : (
          filteredClaims.map((claim) => (
            <Card
              key={claim._id}
              className="bg-gradient-to-r from-gray-800 to-gray-800/90 hover:from-gray-700 hover:to-gray-700/90 transition-all duration-300 border-gray-700 shadow-lg"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-xl font-bold text-gray-100">
                        {claim.listingId?.title || "Food Item"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <MapPin className="h-4 w-4" />
                      <p className="text-sm">
                        {claim.listingId?.location || "Location not specified"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <User className="h-4 w-4" />
                      <p className="text-sm">
                        Provider: {claim.providerName || "Unknown Provider"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedBooking(claim)}
                      disabled={
                        claim.status === "cancelled" ||
                        claim.status === "expired"
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR Code
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setContactProvider(claim)}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${
                        claim.status === "approved"
                          ? "bg-green-600 hover:bg-green-700"
                          : claim.status === "pending"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : claim.status === "collected"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-red-600 hover:bg-red-700"
                      } text-white`}
                    >
                      {claim.status.charAt(0).toUpperCase() +
                        claim.status.slice(1)}
                    </Badge>

                    {claim.requestedQuantity && (
                      <span className="text-sm text-gray-400">
                        Quantity: {claim.requestedQuantity}{" "}
                        {claim.listingId?.unit || "items"}
                      </span>
                    )}
                  </div>

                  {claim.scheduledPickupTime && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Pickup:{" "}
                        {new Date(claim.scheduledPickupTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* QR Code Modal */}
      {selectedBooking && (
        <QRCodeDisplay
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* Contact Provider Modal */}
      {contactProvider && (
        <ContactProviderModal
          booking={contactProvider}
          onClose={() => setContactProvider(null)}
        />
      )}
    </div>
  );
};

const QRCodeDisplay = ({ booking, onClose }) => {
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScanned, setIsScanned] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', null

  // Use the unified time calculations hook
  const { getTimeRemaining, getExpiryTime } = useTimeCalculations();

  // Update timer every second for real-time countdown in QR modal
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for precise countdown

    return () => clearInterval(timer);
  }, []);

  // Monitor QR code scan status
  useEffect(() => {
    if (!booking?._id) return;

    const checkScanStatus = async () => {
      try {
        const response = await fetch(
          `/api/bookings/${booking._id}/scan-status`
        );
        const data = await response.json();

        if (data.success && data.isScanned) {
          setIsScanned(true);
          setScanStatus("success");

          // Auto-close after 2 seconds and redirect to history
          setTimeout(() => {
            onClose();
            // Redirect to history page
            window.location.href = "/recipientDashboard/claims";
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking scan status:", error);
      }
    };

    // Check scan status every 2 seconds
    const scanTimer = setInterval(checkScanStatus, 2000);

    return () => clearInterval(scanTimer);
  }, [booking?._id, onClose]);

  // Safety check for booking properties
  const bookingId = booking?._id;
  const collectionCode = booking?.collectionCode;
  const qrCodeImage = booking?.qrCodeImage;

  // Calculate real-time countdown to food expiry - Use same logic as browse food page
  const foodExpiryTime = booking?.listingId?.expiryTime
    ? new Date(booking.listingId.expiryTime)
    : getExpiryTime(booking) || new Date();

  const timeUntilExpiry = Math.max(
    0,
    foodExpiryTime.getTime() - currentTime.getTime()
  );
  const isExpired = timeUntilExpiry <= 0;

  // Format countdown display with seconds for QR modal
  const formatCountdown = (milliseconds) => {
    if (milliseconds <= 0) return "Expired";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const countdownText = formatCountdown(timeUntilExpiry);
  const timeRemaining = getTimeRemaining(booking) || {
    text: countdownText,
    totalMinutes: Math.floor(timeUntilExpiry / 60000),
  };

  if (booking) {
    console.log("🔍 QR Modal - Using API-enriched data from main page:", {
      bookingId,
      directExpiryTime: booking.expiryTime,
      listingExpiryTime: booking.listingId?.expiryTime,
      calculatedExpiryTime: foodExpiryTime?.toISOString() || "Unknown",
      timeRemainingText: timeRemaining?.text,
      isExpired,
      enrichedBookingData: booking,
    });
  }

  const copyBackupCode = async () => {
    if (!collectionCode) {
      console.error("No collection code available");
      return;
    }
    try {
      await navigator.clipboard.writeText(collectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeImage || !bookingId) {
      console.error("Missing QR code image or booking ID");
      return;
    }
    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = `food-collection-qr-${bookingId}.png`;
    link.click();
  };

  // Simple close handler - just close the modal without any side effects
  const handleClose = () => {
    console.log("🔒 QR Modal closing normally");
    onClose();
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop, not the card content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Use the same time display format as the main page
  const getStatusColor = () => {
    if (isExpired) {
      return "bg-red-900/20 border-red-500/20 text-red-400";
    } else if (timeRemaining.totalMinutes < 60) {
      return "bg-red-900/20 border-red-500/20 text-red-400";
    } else if (timeRemaining.totalMinutes < 120) {
      return "bg-amber-900/20 border-amber-500/20 text-amber-400";
    } else if (timeRemaining.totalMinutes < 360) {
      return "bg-yellow-900/20 border-yellow-500/20 text-yellow-400";
    } else {
      return "bg-green-900/20 border-green-500/20 text-green-400";
    }
  };

  // Get food listing data for display
  const foodData =
    booking.listingId || booking.foodListing || booking.listing || {};

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-gray-100 flex items-center justify-center">
            <QrCode className="mr-2 h-6 w-6" />
            Collection QR Code
          </CardTitle>
          <Badge
            className={`mx-auto w-fit ${
              booking.status === "approved"
                ? "bg-green-600"
                : booking.status === "pending"
                ? "bg-yellow-600"
                : "bg-gray-600"
            }`}
          >
            {booking.status === "approved"
              ? "Ready for Pickup"
              : booking.status === "pending"
              ? "Awaiting Approval"
              : "Booking " + booking.status}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Scan Success Overlay */}
          {isScanned && (
            <div className="absolute inset-0 bg-green-900/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-2">
                  QR Code Scanned!
                </h3>
                <p className="text-green-300">
                  Food collection verified successfully
                </p>
                <p className="text-sm text-green-400 mt-2">
                  Redirecting to history...
                </p>
              </div>
            </div>
          )}

          {/* Real-time Food Expiry Countdown */}
          <div
            className={`p-4 rounded-lg border-2 ${
              isExpired
                ? "bg-red-900/30 border-red-500 text-red-300"
                : timeUntilExpiry < 3600000 // Less than 1 hour
                ? "bg-yellow-900/30 border-yellow-500 text-yellow-300 animate-pulse"
                : "bg-green-900/30 border-green-500 text-green-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isExpired ? (
                  <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                ) : (
                  <Clock className="h-6 w-6 flex-shrink-0" />
                )}
                <div>
                  <p className="text-lg font-bold">
                    {isExpired ? "EXPIRED" : "Time Left"}
                  </p>
                  <p className="text-sm opacity-80">
                    {isExpired
                      ? "Food has expired - not safe to consume"
                      : "Collect before food expires"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-3xl font-mono font-bold tracking-wider ${
                    isExpired
                      ? "text-red-400"
                      : timeUntilExpiry < 3600000
                      ? "text-yellow-400 animate-pulse"
                      : "text-green-400"
                  }`}
                >
                  {countdownText}
                </div>
                <p className="text-xs opacity-60 mt-1">
                  Expires: {foodExpiryTime.toLocaleString()}
                </p>
                {!isExpired && timeUntilExpiry < 3600000 && (
                  <p className="text-xs text-yellow-400 mt-1 font-medium">
                    ⚠️ Less than 1 hour remaining!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center relative">
            <div
              className={`inline-block p-4 bg-white rounded-lg relative ${
                isExpired ? "opacity-50 grayscale" : ""
              }`}
            >
              {booking.qrCodeImage ? (
                <img
                  src={booking.qrCodeImage}
                  alt="Collection QR Code"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-200">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              )}

              {/* Scan monitoring indicator */}
              {!isExpired && !isScanned && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-2 animate-pulse">
                  <Eye className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Scan status indicator */}
            {!isExpired && !isScanned && (
              <div className="mt-3 flex items-center justify-center gap-2 text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Monitoring for scan...</span>
              </div>
            )}
          </div>

          {/* QR Actions */}
          <div className="flex justify-center space-x-2 mt-4">
            <Button
              onClick={downloadQRCode}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
              disabled={isExpired}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>

            {/* Test scan button for development */}
            {process.env.NODE_ENV === "development" &&
              !isExpired &&
              !isScanned && (
                <Button
                  onClick={() => {
                    setIsScanned(true);
                    setScanStatus("success");
                    setTimeout(() => {
                      onClose();
                      window.location.href = "/recipientDashboard/claims";
                    }, 2000);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-300 hover:bg-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Test Scan
                </Button>
              )}
          </div>

          {isExpired && (
            <p className="text-red-400 text-sm mt-2 text-center">
              ⚠️ QR Code disabled - Food has expired
            </p>
          )}

          {/* Backup Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Backup Collection Code
              </label>
              <Button
                onClick={() => setShowBackupCode(!showBackupCode)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-100"
                disabled={isExpired}
              >
                {showBackupCode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div
                className={`flex-1 bg-gray-700 p-3 rounded-lg font-mono text-center text-lg tracking-wider ${
                  isExpired ? "opacity-50" : ""
                }`}
              >
                {showBackupCode ? booking.collectionCode : "••••••"}
              </div>
              <Button
                onClick={copyBackupCode}
                variant="outline"
                size="icon"
                className="border-gray-600"
                disabled={!showBackupCode || isExpired}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Use this 6-digit code if QR scanning doesn't work
            </p>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <Separator className="bg-gray-600" />
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <Package className="h-4 w-4 text-emerald-400" />
                <span>{foodData.title || booking.title || "Food Item"}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>
                  {foodData.location ||
                    booking.pickupLocation ||
                    "Pickup Location"}
                </span>
              </div>
              {booking.scheduledPickupTime && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>
                    Pickup:{" "}
                    {new Date(booking.scheduledPickupTime).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Food Freshness Info - Using same data as main page */}
              <div className="bg-gray-700/50 p-3 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    <strong>Freshness:</strong>
                  </span>
                  <span className="text-gray-300">
                    {foodData.freshnessStatus || "Fresh"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    <strong>Safe Duration:</strong>
                  </span>
                  <span className="text-gray-300">
                    {foodData.freshnessHours ||
                      booking.listingId?.freshnessHours ||
                      24}{" "}
                    hours
                  </span>
                </div>
                {foodData.availabilityWindow?.startTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      <strong>Available From:</strong>
                    </span>
                    <span className="text-gray-300">
                      {new Date(
                        foodData.availabilityWindow.startTime
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    <strong>Expires:</strong>
                  </span>
                  <span
                    className={`font-medium ${
                      isExpired ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {foodExpiryTime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    <strong>Time Remaining:</strong>
                  </span>
                  <span
                    className={`font-medium ${
                      isExpired ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {timeRemaining.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div
            className={`border p-4 rounded-lg ${
              isExpired
                ? "bg-red-900/20 border-red-500/20"
                : "bg-blue-900/20 border-blue-500/20"
            }`}
          >
            <h4
              className={`font-medium mb-2 flex items-center ${
                isExpired ? "text-red-400" : "text-blue-400"
              }`}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isExpired ? "Food Expired" : "Collection Instructions"}
            </h4>
            {isExpired ? (
              <div className="text-xs text-red-300 space-y-1">
                <p>⚠️ This food has expired and is no longer safe to consume</p>
                <p>• Do not collect this food</p>
                <p>• Contact the provider if you have questions</p>
                <p>• Look for fresh listings instead</p>
              </div>
            ) : (
              <ul className="text-xs text-gray-300 space-y-1">
                {booking.collectionInstructions?.steps?.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-400 mr-2">{index + 1}.</span>
                    {step}
                  </li>
                )) || (
                  <>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">1.</span>
                      Arrive at the pickup location on time
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">2.</span>
                      Show this QR code to the provider
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">3.</span>
                      If QR doesn't work, provide the backup code
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">4.</span>
                      Collect your food before it expires at{" "}
                      {foodExpiryTime.toLocaleTimeString()}!
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>

          {/* Close Button */}
          <Button
            onClick={handleClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Contact Provider Modal Component
const ContactProviderModal = ({ booking, onClose }) => {
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch provider contact information
  useEffect(() => {
    const fetchContactInfo = async () => {
      console.log("📞 ContactProviderModal - Booking data:", booking);
      console.log("📞 Provider ID:", booking?.providerId);
      console.log("📞 Listing ID:", booking?.listingId?._id);

      if (!booking?.providerId || !booking?.listingId?._id) {
        console.log("📞 Missing required IDs, skipping fetch");
        setLoading(false);
        return;
      }

      try {
        const url = `/api/providers/${booking.providerId}/contact?type=provider&listingId=${booking.listingId._id}`;
        console.log("📞 Fetching contact info from:", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log("📞 Contact info response:", data);

        if (data.success) {
          setContactInfo(data.contactInfo);
        } else {
          console.error("Failed to fetch contact info:", data.message);
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, [booking?.providerId, booking?.listingId?._id]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCall = () => {
    if (contactInfo?.phone) {
      window.open(`tel:${contactInfo.phone}`);
    }
  };

  const handleEmail = () => {
    if (contactInfo?.email) {
      window.open(`mailto:${contactInfo.email}`);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle className="text-gray-100 flex items-center justify-center">
            <MessageCircle className="mr-2 h-6 w-6 text-blue-400" />
            Contact Provider
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Provider Information */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-gray-100">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  contactInfo?.providerName ||
                  booking.providerName ||
                  "Provider"
                )}
              </h3>
            </div>

            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span>{booking.listingId?.title || "Food Item"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>
                  {booking.listingId?.location || "Location not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Contact Information
            </h4>

            {loading ? (
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg animate-pulse">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Phone</p>
                  <p className="text-xs text-gray-500">Loading...</p>
                </div>
              </div>
            ) : contactInfo?.phone ? (
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Phone</p>
                    <p className="text-sm text-gray-400">{contactInfo.phone}</p>
                  </div>
                </div>
                <Button
                  onClick={handleCall}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Call
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg opacity-50">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Phone</p>
                  <p className="text-xs text-gray-500">Not provided</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg animate-pulse">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Email</p>
                  <p className="text-xs text-gray-500">Loading...</p>
                </div>
              </div>
            ) : contactInfo?.email ? (
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Email</p>
                    <p className="text-sm text-gray-400">{contactInfo.email}</p>
                  </div>
                </div>
                <Button
                  onClick={handleEmail}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Email
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg opacity-50">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Email</p>
                  <p className="text-xs text-gray-500">Not provided</p>
                </div>
              </div>
            )}
          </div>

          {/* Pickup Instructions */}
          {booking.listingId?.pickupInstructions && (
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pickup Instructions
              </h4>
              <p className="text-sm text-gray-300">
                {booking.listingId.pickupInstructions}
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaimsPage;
