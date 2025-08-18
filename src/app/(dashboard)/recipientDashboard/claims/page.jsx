"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import {
  Package,
  MapPin,
  Clock,
  Users,
  Navigation,
  Check,
  ShoppingCart,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Phone,
  Calendar,
  X,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import DirectionModal from "@/components/DirectionModal"; // Import the new modal
import { useRouter } from "next/navigation";
import {
  useUserBookings,
  useRateBooking,
  useCancelBooking,
} from "@/hooks/useBookings";
import { useTimeCalculations } from "@/hooks/useTimeCalculations";

const toast = (options) => {
  console.log("Toast:", options);
  alert(options.description);
};

const ContactModal = ({ provider, isLoading, onClose }) => {
  if (!provider && !isLoading) return null;

  const providerName = isLoading
    ? "Loading..."
    : provider?.fullName || "Not available";
  const providerPhone = isLoading
    ? "Loading..."
    : provider?.phoneNumber || "Not available";
  const providerEmail = isLoading
    ? "Loading..."
    : provider?.email || "Not available";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">
            Contact Provider
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">
                Provider Name
              </span>
            </div>
            <p className="text-gray-100 pl-6">{providerName}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">
                Phone Number
              </span>
            </div>
            <p className="text-gray-100 pl-6">{providerPhone}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">Email</span>
            </div>
            <p className="text-gray-100 pl-6">{providerEmail}</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const IntegratedClaimsPage = () => {
  const { user, isLoaded } = useUser();
  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
  } = useUserBookings(user?.id);
  const router = useRouter();

  // State for synchronized API data
  const [enrichedClaims, setEnrichedClaims] = useState([]);
  const [isEnrichingData, setIsEnrichingData] = useState(false);

  // Use the unified time calculations hook
  const {
    getTimeRemaining,
    getBadgeColor,
    isExpired: checkExpired,
    formatExpiryTime,
    getExpiryTime,
  } = useTimeCalculations();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [providerDetails, setProviderDetails] = useState(null);
  const [isFetchingProvider, setIsFetchingProvider] = useState(false);

  // State for the map modal
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocations, setMapLocations] = useState({ provider: null, recipient: null });

  const rateBookingMutation = useRateBooking();
  const cancelBookingMutation = useCancelBooking();

  // Function to enrich claims with fresh API data
  const enrichClaimsWithAPIData = async (claims) => {
    if (!claims || claims.length === 0) return [];

    try {
      setIsEnrichingData(true);
      console.log("🔄 Enriching claims with fresh API data...");

      // Fetch fresh food listings data
      const response = await fetch("/api/food-listings");

      if (!response.ok) {
        throw new Error("Failed to fetch food listings");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("API returned error");
      }

      const apiListings = data.data;
      console.log("📊 Fetched API listings:", apiListings.length);

      // Enrich each claim with fresh API data
      const enriched = claims.map((claim) => {
        const listingId =
          claim.listingId?._id ||
          claim.listingId ||
          claim.foodListing?._id ||
          claim.listing?._id;

        if (!listingId) {
          console.warn("⚠️ No listing ID found for claim:", claim._id);
          return claim;
        }

        // Find matching listing in API data
        const freshListing = apiListings.find(
          (listing) => listing.id === listingId.toString()
        );

        if (freshListing) {
          console.log("✅ Found fresh data for claim:", claim._id);

          // Create enriched claim with fresh API data
          const enrichedClaim = {
            ...claim,
            // Update the listingId object with fresh data
            listingId: {
              ...claim.listingId,
              expiryTime: freshListing.expiryTime,
              freshnessHours: freshListing.freshnessHours,
              freshnessStatus: freshListing.freshnessStatus,
              availabilityWindow: freshListing.availabilityWindow,
              title: freshListing.title,
              location: freshListing.location,
            },
            // Also update direct properties for consistency
            expiryTime: freshListing.expiryTime,
            freshnessHours: freshListing.freshnessHours,
            freshnessStatus: freshListing.freshnessStatus,
          };

          console.log("🔍 Enriched claim data:", {
            claimId: claim._id,
            originalExpiry: claim.expiryTime,
            freshExpiry: freshListing.expiryTime,
            enrichedExpiry: enrichedClaim.expiryTime,
          });

          return enrichedClaim;
        } else {
          console.warn("⚠️ No fresh data found for listing:", listingId);
          return claim;
        }
      });

      console.log("✅ Claims enrichment completed");
      return enriched;
    } catch (error) {
      console.error("❌ Error enriching claims with API data:", error);
      return claims; // Return original claims if enrichment fails
    } finally {
      setIsEnrichingData(false);
    }
  };

  // Enrich claims when bookings data changes
  useEffect(() => {
    const processClaims = async () => {
      if (bookingsData?.data) {
        const approvedClaims = bookingsData.data.filter(
          (claim) => claim.status === "approved"
        );
        const enriched = await enrichClaimsWithAPIData(approvedClaims);
        setEnrichedClaims(enriched);
      }
    };

    processClaims();
  }, [bookingsData]);

  const handleContactProvider = async (claim) => {
    if (!claim.providerId) {
      console.error("Provider ID is missing from the claim object.");
      toast({ title: "Error", description: "Cannot fetch provider details." });
      return;
    }

    setShowContactModal(true);
    setIsFetchingProvider(true);

    try {
      const response = await axios.get(
        `/api/profile?userId=${claim.providerId}`
      );
      if (response.data.success) {
        setProviderDetails(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error("Failed to fetch provider details:", err);
      setProviderDetails(null);
    } finally {
      setIsFetchingProvider(false);
    }
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setProviderDetails(null);
  };

  const handleDirectionsClick = async (claim) => {
    if (!user || !claim.providerId) {
      toast({ title: "Error", description: "Cannot get directions. User or provider information is missing." });
      return;
    }

    try {
      const response = await axios.get('/api/users/locations');
      if (response.data && response.data.validLocations) {
        const locations = response.data.validLocations;
        const provider = locations.find(loc => loc.id === claim.providerId);
        const recipient = locations.find(loc => loc.id === user.id);

        if (provider && recipient) {
          setMapLocations({ provider, recipient });
          setShowMapModal(true);
        } else {
          toast({ title: "Error", description: "Could not find location data for provider or recipient." });
        }
      }
    } catch (error) {
      console.error("Failed to fetch locations for directions:", error);
      toast({ title: "Error", description: "Failed to fetch location data." });
    }
  };

  // Helper functions using enriched data
  const claimsToShow = enrichedClaims;

  const getStatusColor = (status) => "bg-emerald-600 text-white";
  const getStatusIcon = (status) => <Check className="h-3 w-3" />;
  const getStatusText = (status) => "Ready for Pickup";

  const formatTime = (date) =>
    new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isQRExpired = (expiryDate) => new Date() > new Date(expiryDate);
  const handleViewQRCode = (claim) => {
    // Pass the enriched claim to QR modal for consistency
    setSelectedBooking(claim);
    setShowQRCode(true);
  };
  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (booking) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelBookingMutation.mutateAsync({
        bookingId: booking._id,
        reason: "Cancelled by user",
      });
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    await refetch();
    // Re-enrich data after refresh
    if (bookingsData?.data) {
      const approvedClaims = bookingsData.data.filter(
        (claim) => claim.status === "approved"
      );
      const enriched = await enrichClaimsWithAPIData(approvedClaims);
      setEnrichedClaims(enriched);
    }
  };

  const goToDashboard = () => router.push("/recipientDashboard");

  if (!isLoaded || isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading claims. Please try again.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Ready for Pickup</h2>
          <p className="text-gray-400">Items you need to collect.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-600 text-white">
            {claimsToShow.length} Ready for Pickup
          </Badge>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300"
            disabled={isLoading || isEnrichingData}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isLoading || isEnrichingData ? "animate-spin" : ""
              }`}
            />
            {isEnrichingData ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Loading indicator for data enrichment */}
      {isEnrichingData && (
        <div className="flex items-center justify-center p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent mr-2" />
          <span className="text-blue-400 text-sm">
            Synchronizing with latest data...
          </span>
        </div>
      )}

      <div className="space-y-4">
        {claimsToShow.map((claim) => {
          // DEBUG: Log the enriched claim data structure
          console.log("🔍 Enriched claim data structure:", {
            claimId: claim._id,
            directExpiryTime: claim.expiryTime,
            listingExpiryTime: claim.listingId?.expiryTime,
            freshnessHours: claim.listingId?.freshnessHours,
            freshnessStatus: claim.listingId?.freshnessStatus,
            availabilityStart: claim.listingId?.availabilityWindow?.startTime,
            availabilityEnd: claim.listingId?.availabilityWindow?.endTime,
            fullClaimData: claim,
          });

          // Use unified time calculations with enriched data
          const timeRemaining = getTimeRemaining(claim);
          const badgeColor = getBadgeColor(claim);
          const expired = checkExpired(claim);
          const actualExpiryTime = getExpiryTime(claim);

          console.log("⏰ Time calculation results for enriched claim:", {
            claimId: claim._id,
            timeRemainingText: timeRemaining.text,
            isExpired: expired,
            actualExpiryTime: actualExpiryTime.toISOString(),
            badgeColor,
          });

          return (
            <Card
              key={claim._id}
              className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors"
            >
              <CardHeader className="p-4 sm:p-6 pb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-gray-100 text-lg mb-2">
                      {claim.listingId?.title || claim.title || "Food Item"}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-400">
                      <div className="flex items-center space-x-1.5">
                        <Package className="h-4 w-4" />
                        <span>{claim.approvedQuantity} approved</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-4 w-4" />
                        <span>
                          Claimed{" "}
                          {formatTime(claim.requestedAt || claim.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
                    <Badge className={`${badgeColor} text-white`}>
                      {timeRemaining.text}
                    </Badge>
                    <Badge
                      className={`${getStatusColor(
                        claim.status
                      )} whitespace-nowrap`}
                    >
                      {getStatusIcon(claim.status)}
                      <span className="ml-1">
                        {getStatusText(claim.status)}
                      </span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-300 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      {claim.listingId?.location ||
                        claim.pickupLocation ||
                        "Location not specified"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>{claim.providerName || "Provider"}</span>
                  </div>
                  {claim.scheduledPickupTime && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span>
                        Pickup: {formatTime(claim.scheduledPickupTime)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Expires: {formatExpiryTime(claim)}</span>
                  </div>
                </div>
                <Separator className="bg-gray-700 my-4" />
                <div className="flex flex-wrap gap-2">
                  {claim.qrCode && !isQRExpired(claim.qrCodeExpiry) && (
                    <Button
                      size="sm"
                      onClick={() => handleViewQRCode(claim)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={expired}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR Code
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => handleDirectionsClick(claim)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => handleContactProvider(claim)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                    onClick={() => handleCancelBooking(claim)}
                    disabled={cancelBookingMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
                {expired && (
                  <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 text-sm font-medium">
                        This item has expired. Please contact the provider.
                      </span>
                    </div>
                  </div>
                )}
                {claim.qrCodeExpiry && isQRExpired(claim.qrCodeExpiry) && (
                  <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 text-sm font-medium">
                        QR Code has expired. Please contact the provider.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {claimsToShow.length === 0 && !isEnrichingData && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No Items Ready for Pickup
            </h3>
            <p className="text-gray-400 mb-4">
              Approved claims will appear here.
            </p>
            <Button
              onClick={goToDashboard}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Browse Food Listings
            </Button>
          </CardContent>
        </Card>
      )}

      {showQRCode && selectedBooking && (
        <QRCodeDisplay booking={selectedBooking} onClose={handleCloseQRCode} />
      )}

      {showContactModal && (
        <ContactModal
          provider={providerDetails}
          isLoading={isFetchingProvider}
          onClose={handleCloseContactModal}
        />
      )}

      {showMapModal && (
        <DirectionModal
          provider={mapLocations.provider}
          recipient={mapLocations.recipient}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </div>
  );
};

export default IntegratedClaimsPage;