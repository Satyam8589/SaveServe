"use client"
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from 'axios'; // Import axios to make API calls
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
  Mail
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
import { useRouter } from "next/navigation";
import { 
  useUserBookings, 
  useRateBooking, 
  useCancelBooking 
} from "@/hooks/useBookings";

const toast = (options) => {
  console.log("Toast:", options);
  alert(options.description);
};

// This modal is a simple component that displays the data it's given.
const ContactModal = ({ provider, isLoading, onClose }) => {
  if (!provider && !isLoading) return null;

  // Display "Loading..." text or the actual data from props
  const providerName = isLoading ? "Loading..." : provider?.fullName || "Not available";
  const providerPhone = isLoading ? "Loading..." : provider?.phoneNumber || "Not available";
  const providerEmail = isLoading ? "Loading..." : provider?.email || "Not available";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Contact Provider</h3>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-gray-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Provider Name */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">Provider Name</span>
            </div>
            <p className="text-gray-100 pl-6">{providerName}</p>
          </div>
          {/* Phone Number */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">Phone Number</span>
            </div>
            <p className="text-gray-100 pl-6">{providerPhone}</p>
          </div>
          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-300">Email</span>
            </div>
            <p className="text-gray-100 pl-6">{providerEmail}</p>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <Button onClick={onClose} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const IntegratedClaimsPage = () => {
  const { user, isLoaded } = useUser();
  const { data: bookingsData, isLoading, error, refetch } = useUserBookings(user?.id);
  const router = useRouter();
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // State to hold the fetched provider data and loading status
  const [providerDetails, setProviderDetails] = useState(null);
  const [isFetchingProvider, setIsFetchingProvider] = useState(false);

  const rateBookingMutation = useRateBooking();
  const cancelBookingMutation = useCancelBooking();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // This async function is called when the user clicks the "Contact" button.
  const handleContactProvider = async (claim) => {
    if (!claim.providerId) {
      console.error("Provider ID is missing from the claim object.");
      toast({ title: "Error", description: "Cannot fetch provider details." });
      return;
    }

    // Show the modal immediately and set loading to true
    setShowContactModal(true);
    setIsFetchingProvider(true);

    // Make the direct API call using axios
    try {
      const response = await axios.get(`/api/profile?userId=${claim.providerId}`);
      if (response.data.success) {
        setProviderDetails(response.data.data); // Store the fetched data in state
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error("Failed to fetch provider details:", err);
      setProviderDetails(null); // Clear data on failure
    } finally {
      setIsFetchingProvider(false); // Set loading to false
    }
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setProviderDetails(null); // Reset the provider data when closing
  };

  // --- Start of Implemented Helper Functions ---

  const allClaims = bookingsData?.data || [];
  const claimsToShow = allClaims.filter(claim => claim.status === 'approved');

  const getExpiryTime = (claim) => claim.listingId?.expiryTime || claim.expiryTime || claim.listingId?.availabilityWindow?.end || claim.scheduledPickupTime || null;

  const calculateTimeLeft = (expiryTime) => {
    const now = currentTime;
    const expiry = new Date(expiryTime);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (totalMinutes < 60) {
      return `${minutes}m left`;
    } else if (hours < 24) {
      return `${hours}h ${minutes}m left`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h left`;
    }
  };

  const getActualTimeRemaining = (claim) => {
    const expiryTime = getExpiryTime(claim);
    if (!expiryTime) {
      const createdAt = new Date(claim.createdAt || claim.requestedAt || Date.now());
      const fallbackExpiry = new Date(createdAt.getTime() + (6 * 60 * 60 * 1000));
      return calculateTimeLeft(fallbackExpiry);
    }
    return calculateTimeLeft(expiryTime);
  };

  const getBadgeColorByTime = (expiryTime) => {
    const now = currentTime;
    const expiry = new Date(expiryTime);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return "bg-red-600";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours <= 1) return "bg-red-600";
    if (hours <= 3) return "bg-orange-600";
    if (hours <= 6) return "bg-yellow-600";
    if (hours <= 12) return "bg-blue-600";
    return "bg-green-600";
  };
  
  const getUrgencyBadgeColor = (claim) => {
    const expiryTime = getExpiryTime(claim);
    if (!expiryTime) {
      const createdAt = new Date(claim.createdAt || claim.requestedAt || Date.now());
      const fallbackExpiry = new Date(createdAt.getTime() + (6 * 60 * 60 * 1000));
      return getBadgeColorByTime(fallbackExpiry);
    }
    return getBadgeColorByTime(expiryTime);
  };

  const isExpired = (claim) => {
    const expiryTime = getExpiryTime(claim);
    if (!expiryTime) {
      const createdAt = new Date(claim.createdAt || claim.requestedAt || Date.now());
      const fallbackExpiry = new Date(createdAt.getTime() + (6 * 60 * 60 * 1000));
      return currentTime > fallbackExpiry;
    }
    return currentTime > new Date(expiryTime);
  };

  const getStatusColor = (status) => "bg-emerald-600 text-white";
  const getStatusIcon = (status) => <Check className="h-3 w-3" />;
  const getStatusText = (status) => "Ready for Pickup";
  const formatTime = (date) => new Date(date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isQRExpired = (expiryDate) => currentTime > new Date(expiryDate);
  const handleViewQRCode = (claim) => { setSelectedBooking(claim); setShowQRCode(true); };
  const handleCloseQRCode = () => { setShowQRCode(false); setSelectedBooking(null); };
  const handleCancelBooking = async (booking) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelBookingMutation.mutateAsync({
        bookingId: booking._id,
        reason: "Cancelled by user"
      });
      toast({ title: "Success", description: "Booking cancelled successfully" });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to cancel booking", variant: "destructive" });
    }
  };
  const handleRefresh = () => { refetch(); setCurrentTime(new Date()); };
  const goToDashboard = () => router.push('/recipientDashboard');

  // --- End of Implemented Helper Functions ---

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
          <Badge className="bg-emerald-600 text-white">{claimsToShow.length} Ready for Pickup</Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="border-gray-600 text-gray-300" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {claimsToShow.map((claim) => (
          <Card key={claim._id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="p-4 sm:p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start w-full gap-3">
                <div className="flex-1">
                  <CardTitle className="text-gray-100 text-lg mb-2">
                    {claim.listingId?.title || claim.title || "Food Item"}
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-400">
                    <div className="flex items-center space-x-1.5"><Package className="h-4 w-4" /><span>{claim.approvedQuantity} approved</span></div>
                    <div className="flex items-center space-x-1.5"><Clock className="h-4 w-4" /><span>Claimed {formatTime(claim.requestedAt || claim.createdAt)}</span></div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
                  <Badge className={`${getUrgencyBadgeColor(claim)} text-white`}>{getActualTimeRemaining(claim)}</Badge>
                  <Badge className={`${getStatusColor(claim.status)} whitespace-nowrap`}>{getStatusIcon(claim.status)}<span className="ml-1">{getStatusText(claim.status)}</span></Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-300 mb-4">
                <div className="flex items-center space-x-2"><MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" /><span>{claim.listingId?.location || claim.pickupLocation || "Location not specified"}</span></div>
                <div className="flex items-center space-x-2"><Users className="h-4 w-4 text-emerald-400 flex-shrink-0" /><span>{claim.providerName || "Provider"}</span></div>
                {claim.scheduledPickupTime && (<div className="flex items-center space-x-2"><Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" /><span>Pickup: {formatTime(claim.scheduledPickupTime)}</span></div>)}
              </div>
              <Separator className="bg-gray-700 my-4" />
              <div className="flex flex-wrap gap-2">
                {claim.qrCode && !isQRExpired(claim.qrCodeExpiry) && (<Button size="sm" onClick={() => handleViewQRCode(claim)} className="bg-emerald-600 hover:bg-emerald-700"><QrCode className="h-4 w-4 mr-2" />Show QR Code</Button>)}
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700" onClick={() => { /* Implement directions */ }}><Navigation className="h-4 w-4 mr-2" />Directions</Button>
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700" onClick={() => handleContactProvider(claim)}>
                  <Phone className="h-4 w-4 mr-2" /> Contact
                </Button>
                <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/20" onClick={() => handleCancelBooking(claim)} disabled={cancelBookingMutation.isPending}><X className="h-4 w-4 mr-2" />Cancel</Button>
              </div>
               {isExpired(claim) && (<div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg"><div className="flex items-center space-x-2"><AlertTriangle className="h-4 w-4 text-red-400" /><span className="text-red-400 text-sm font-medium">This item has expired. Please contact the provider.</span></div></div>)}
              {claim.qrCodeExpiry && isQRExpired(claim.qrCodeExpiry) && (<div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg"><div className="flex items-center space-x-2"><AlertTriangle className="h-4 w-4 text-red-400" /><span className="text-red-400 text-sm font-medium">QR Code has expired. Please contact the provider.</span></div></div>)}
            </CardContent>
          </Card>
        ))}
      </div>

      {claimsToShow.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Items Ready for Pickup</h3>
            <p className="text-gray-400 mb-4">Approved claims will appear here.</p>
            <Button onClick={goToDashboard} className="bg-emerald-600 hover:bg-emerald-700">Browse Food Listings</Button>
          </CardContent>
        </Card>
      )}

      {showQRCode && selectedBooking && (<QRCodeDisplay booking={selectedBooking} onClose={handleCloseQRCode} />)}
      
      {showContactModal && (
        <ContactModal
          provider={providerDetails}
          isLoading={isFetchingProvider}
          onClose={handleCloseContactModal}
        />
      )}
    </div>
  );
};

export default IntegratedClaimsPage;