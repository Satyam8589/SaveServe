import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Download, Clock, MapPin, Package, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const QRCodeDisplay = ({ booking, onClose }) => {
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actualExpiryTime, setActualExpiryTime] = useState(null);
  const [actualFreshnessHours, setActualFreshnessHours] = useState(null);
  const [isLoadingExpiry, setIsLoadingExpiry] = useState(true);

  // Update current time every minute to keep countdown accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch actual expiry time and freshness hours from database
  useEffect(() => {
    const fetchActualData = async () => {
      try {
        setIsLoadingExpiry(true);
        console.log('🔍 Fetching actual data for booking:', booking._id);
        
        // Get the listing ID from booking
        const listingId = booking.listingId?._id || booking.listingId || booking.foodListing?._id || booking.listing?._id;
        
        if (!listingId) {
          console.error('❌ No listing ID found in booking');
          setActualExpiryTime(calculateFallbackExpiryTime());
          setActualFreshnessHours(getFallbackFreshnessHours());
          setIsLoadingExpiry(false);
          return;
        }

        console.log('📋 Found listing ID:', listingId);

        // Fetch the listing data from the API
        const response = await fetch('/api/food-listings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch food listings');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error('API returned error');
        }

        // Find the specific listing
        const specificListing = data.data.find(listing => listing.id === listingId.toString());
        
        if (specificListing) {
          console.log('✅ Found listing data from DB:', specificListing);
          
          if (specificListing.expiryTime) {
            setActualExpiryTime(new Date(specificListing.expiryTime));
          } else {
            setActualExpiryTime(calculateFallbackExpiryTime());
          }
          
          // Set the actual freshness hours from DB
          if (specificListing.freshnessHours) {
            setActualFreshnessHours(specificListing.freshnessHours);
          } else {
            setActualFreshnessHours(getFallbackFreshnessHours());
          }
        } else {
          console.warn('⚠️ Listing not found in API response, using fallback calculation');
          setActualExpiryTime(calculateFallbackExpiryTime());
          setActualFreshnessHours(getFallbackFreshnessHours());
        }

      } catch (error) {
        console.error('❌ Error fetching data from DB:', error);
        setActualExpiryTime(calculateFallbackExpiryTime());
        setActualFreshnessHours(getFallbackFreshnessHours());
      } finally {
        setIsLoadingExpiry(false);
      }
    };

    fetchActualData();
  }, [booking._id]);

  // Fallback calculation method (as backup)
  const calculateFallbackExpiryTime = () => {
    console.log('🔄 Using fallback expiry calculation');
    
    const foodData = booking.listingId || booking.foodListing || booking.listing || {};
    
    // Try direct expiry time first
    if (foodData.expiryTime) {
      console.log('✅ Using direct expiryTime from booking data');
      return new Date(foodData.expiryTime);
    }

    // Calculate from start time + freshness hours
    if (foodData.availabilityWindow?.startTime && foodData.freshnessHours) {
      console.log('🧮 Calculating from startTime + freshnessHours');
      const startTime = new Date(foodData.availabilityWindow.startTime);
      const expiryTime = new Date(startTime.getTime() + (foodData.freshnessHours * 60 * 60 * 1000));
      return expiryTime;
    }

    // Parse freshness status
    if (foodData.availabilityWindow?.startTime && foodData.freshnessStatus) {
      const freshnessHoursMap = {
        "Fresh": 24,
        "Safe to Eat for 12 hours": 12,
        "Safe to Eat for 8 hours": 8,
        "Safe to Eat for 6 hours": 6,
        "Safe to Eat for 4 hours": 4,
        "Safe to Eat for 2 hours": 2
      };
      
      const hours = freshnessHoursMap[foodData.freshnessStatus] || 24;
      const startTime = new Date(foodData.availabilityWindow.startTime);
      return new Date(startTime.getTime() + (hours * 60 * 60 * 1000));
    }

    // Final fallback
    console.warn('⚠️ Using final fallback: 24 hours from now');
    return new Date(Date.now() + (24 * 60 * 60 * 1000));
  };

  // Get fallback freshness hours
  const getFallbackFreshnessHours = () => {
    const foodData = booking.listingId || booking.foodListing || booking.listing || {};
    
    // Try direct freshness hours first
    if (foodData.freshnessHours) {
      return foodData.freshnessHours;
    }

    // Parse from freshness status
    if (foodData.freshnessStatus) {
      const freshnessHoursMap = {
        "Fresh": 24,
        "Safe to Eat for 12 hours": 12,
        "Safe to Eat for 8 hours": 8,
        "Safe to Eat for 6 hours": 6,
        "Safe to Eat for 4 hours": 4,
        "Safe to Eat for 2 hours": 2
      };
      
      return freshnessHoursMap[foodData.freshnessStatus] || 24;
    }

    // Default fallback
    return 24;
  };

  // Use actual expiry time and freshness hours from DB or fallback
  const foodExpiryTime = actualExpiryTime || calculateFallbackExpiryTime();
  const freshnessHours = actualFreshnessHours || getFallbackFreshnessHours();
  const isExpired = currentTime > foodExpiryTime;
  const timeUntilExpiry = Math.max(0, foodExpiryTime.getTime() - currentTime.getTime());

  // Calculate time remaining
  const totalMinutesLeft = Math.floor(timeUntilExpiry / (1000 * 60));
  const hoursLeft = Math.floor(totalMinutesLeft / 60);
  const minutesLeft = totalMinutesLeft % 60;
  const daysLeft = Math.floor(hoursLeft / 24);
  const remainingHours = hoursLeft % 24;

  const copyBackupCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.collectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = booking.qrCodeImage;
    link.download = `food-collection-qr-${booking._id}.png`;
    link.click();
  };

  const formatExpiryTime = () => {
    if (isExpired) return "Expired";
    
    if (daysLeft > 0) {
      return `${daysLeft}d ${remainingHours}h remaining`;
    } else if (hoursLeft < 1) {
      return `${minutesLeft}m remaining`;
    } else {
      return `${hoursLeft}h ${minutesLeft}m remaining`;
    }
  };

  const getExpiryStatus = () => {
    if (isExpired) {
      return { color: 'red', urgent: true };
    } else if (hoursLeft < 1) {
      return { color: 'red', urgent: true };
    } else if (hoursLeft < 2) {
      return { color: 'amber', urgent: true };
    } else if (hoursLeft < 6) {
      return { color: 'yellow', urgent: false };
    } else {
      return { color: 'green', urgent: false };
    }
  };

  const expiryStatus = getExpiryStatus();

  // Get food listing data for display
  const foodData = booking.listingId || booking.foodListing || booking.listing || {};

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-gray-100 flex items-center justify-center">
            <QrCode className="mr-2 h-6 w-6" />
            Collection QR Code
          </CardTitle>
          <Badge 
            className={`mx-auto w-fit ${
              booking.status === 'approved' ? 'bg-green-600' : 
              booking.status === 'pending' ? 'bg-yellow-600' : 
              'bg-gray-600'
            }`}
          >
            {booking.status === 'approved' ? 'Ready for Pickup' : 
             booking.status === 'pending' ? 'Awaiting Approval' :
             'Booking ' + booking.status}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Enhanced Expiry Warning with Real-time DB Data */}
          <div className={`p-3 rounded-lg border flex items-center space-x-2 ${
            expiryStatus.color === 'red' ? 'bg-red-900/20 border-red-500/20' : 
            expiryStatus.color === 'amber' ? 'bg-amber-900/20 border-amber-500/20' :
            expiryStatus.color === 'yellow' ? 'bg-yellow-900/20 border-yellow-500/20' :
            'bg-green-900/20 border-green-500/20'
          } ${expiryStatus.urgent ? 'animate-pulse' : ''}`}>
            {isLoadingExpiry ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent flex-shrink-0" />
            ) : isExpired ? (
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-green-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              {isLoadingExpiry ? (
                <>
                  <p className="text-sm font-medium text-blue-400">Loading actual expiry time...</p>
                  <p className="text-xs text-gray-400">Fetching from database</p>
                </>
              ) : (
                <>
                  <p className={`text-sm font-medium ${
                    expiryStatus.color === 'red' ? 'text-red-400' : 
                    expiryStatus.color === 'amber' ? 'text-amber-400' :
                    expiryStatus.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    Food {formatExpiryTime()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isExpired ? 'Food has expired - not safe to consume' : 'Collect before food expires'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {foodExpiryTime.toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <div className={`inline-block p-4 bg-white rounded-lg ${isExpired ? 'opacity-50 grayscale' : ''}`}>
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
            </div>
            
            {isExpired && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ QR Code disabled - Food has expired
              </p>
            )}
          </div>

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
                {showBackupCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`flex-1 bg-gray-700 p-3 rounded-lg font-mono text-center text-lg tracking-wider ${isExpired ? 'opacity-50' : ''}`}>
                {showBackupCode ? booking.collectionCode : '••••••'}
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
                <span>{foodData.title || 'Food Item'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>{foodData.location || 'Pickup Location'}</span>
              </div>
              {booking.scheduledPickupTime && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>
                    Pickup: {new Date(booking.scheduledPickupTime).toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Enhanced Food Freshness Info - Now using actual DB data */}
              <div className="bg-gray-700/50 p-3 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400"><strong>Freshness:</strong></span>
                  <span className="text-gray-300">{foodData.freshnessStatus || 'Fresh'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400"><strong>Safe Duration:</strong></span>
                  <span className="text-gray-300">
                    {isLoadingExpiry ? (
                      <span className="inline-flex items-center">
                        <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent mr-1" />
                        Loading...
                      </span>
                    ) : (
                      `${freshnessHours} hours`
                    )}
                  </span>
                </div>
                {foodData.availabilityWindow?.startTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400"><strong>Available From:</strong></span>
                    <span className="text-gray-300">
                      {new Date(foodData.availabilityWindow.startTime).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400"><strong>Expires:</strong></span>
                  <span className={`font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                    {isLoadingExpiry ? 'Loading...' : foodExpiryTime.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className={`border p-4 rounded-lg ${
            isExpired ? 'bg-red-900/20 border-red-500/20' : 'bg-blue-900/20 border-blue-500/20'
          }`}>
            <h4 className={`font-medium mb-2 flex items-center ${
              isExpired ? 'text-red-400' : 'text-blue-400'
            }`}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isExpired ? 'Food Expired' : 'Collection Instructions'}
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
                      Collect your food before it expires at {isLoadingExpiry ? 'Loading...' : foodExpiryTime.toLocaleTimeString()}!
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeDisplay;