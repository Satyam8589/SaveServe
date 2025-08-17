import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Download, Clock, MapPin, Package, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTimeCalculations } from '@/hooks/useTimeCalculations';

const QRCodeDisplay = ({ booking, onClose }) => {
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use the unified time calculations hook
  // Both main page and QR modal now use the same API-enriched data
  const { 
    getTimeRemaining, 
    getBadgeColor,
    getExpiryTime,
    formatExpiryTime,
    isExpired: checkExpired
  } = useTimeCalculations();

  // Use the enriched booking data passed from the main page
  const timeRemaining = getTimeRemaining(booking);
  const isExpired = checkExpired(booking);
  const expiryTime = getExpiryTime(booking);
  const badgeColor = getBadgeColor(booking);

  console.log('🔍 QR Modal - Using API-enriched data from main page:', {
    bookingId: booking._id,
    directExpiryTime: booking.expiryTime,
    listingExpiryTime: booking.listingId?.expiryTime,
    calculatedExpiryTime: expiryTime.toISOString(),
    timeRemainingText: timeRemaining.text,
    isExpired,
    enrichedBookingData: booking
  });

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

  // Use the same time display format as the main page
  const getStatusColor = () => {
    if (isExpired) {
      return 'bg-red-900/20 border-red-500/20 text-red-400';
    } else if (timeRemaining.totalMinutes < 60) {
      return 'bg-red-900/20 border-red-500/20 text-red-400';
    } else if (timeRemaining.totalMinutes < 120) {
      return 'bg-amber-900/20 border-amber-500/20 text-amber-400';
    } else if (timeRemaining.totalMinutes < 360) {
      return 'bg-yellow-900/20 border-yellow-500/20 text-yellow-400';
    } else {
      return 'bg-green-900/20 border-green-500/20 text-green-400';
    }
  };

  const shouldAnimate = isExpired || timeRemaining.totalMinutes < 60;

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
          {/* Consistent Expiry Warning - Using same logic as main page */}
          <div className={`p-3 rounded-lg border flex items-center space-x-2 ${getStatusColor()} ${shouldAnimate ? 'animate-pulse' : ''}`}>
            {isExpired ? (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                Food {timeRemaining.text}
              </p>
              <p className="text-xs opacity-80">
                {isExpired ? 'Food has expired - not safe to consume' : 'Collect before food expires'}
              </p>
              <p className="text-xs opacity-60 mt-1">
                Expires: {formatExpiryTime(booking)}
              </p>
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
                <span>{foodData.title || booking.title || 'Food Item'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>{foodData.location || booking.pickupLocation || 'Pickup Location'}</span>
              </div>
              {booking.scheduledPickupTime && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>
                    Pickup: {new Date(booking.scheduledPickupTime).toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Food Freshness Info - Using same data as main page */}
              <div className="bg-gray-700/50 p-3 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400"><strong>Freshness:</strong></span>
                  <span className="text-gray-300">{foodData.freshnessStatus || 'Fresh'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400"><strong>Safe Duration:</strong></span>
                  <span className="text-gray-300">
                    {foodData.freshnessHours || booking.listingId?.freshnessHours || 24} hours
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
                    {expiryTime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400"><strong>Time Remaining:</strong></span>
                  <span className={`font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                    {timeRemaining.text}
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
                      Collect your food before it expires at {expiryTime.toLocaleTimeString()}!
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