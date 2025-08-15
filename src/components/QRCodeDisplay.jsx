import React, { useState } from 'react';
import { QrCode, Copy, Download, Clock, MapPin, Package, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const QRCodeDisplay = ({ booking, onClose }) => {
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const isExpired = new Date() > new Date(booking.qrCodeExpiry);
  const timeUntilExpiry = Math.max(0, new Date(booking.qrCodeExpiry).getTime() - Date.now());
  const hoursLeft = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

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
    if (hoursLeft < 1) return `${minutesLeft}m remaining`;
    return `${hoursLeft}h ${minutesLeft}m remaining`;
  };

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
          {/* Expiry Warning */}
          <div className={`p-3 rounded-lg border flex items-center space-x-2 ${
            isExpired ? 'bg-red-900/20 border-red-500/20' : 
            hoursLeft < 2 ? 'bg-amber-900/20 border-amber-500/20' :
            'bg-green-900/20 border-green-500/20'
          }`}>
            {isExpired ? (
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-green-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isExpired ? 'text-red-400' : 
                hoursLeft < 2 ? 'text-amber-400' : 'text-green-400'
              }`}>
                QR Code {formatExpiryTime()}
              </p>
              <p className="text-xs text-gray-400">
                {isExpired ? 'Please request a new booking' : 'Use before expiry for collection'}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg">
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
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
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
              >
                {showBackupCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-700 p-3 rounded-lg font-mono text-center text-lg tracking-wider">
                {showBackupCode ? booking.collectionCode : '••••••'}
              </div>
              <Button
                onClick={copyBackupCode}
                variant="outline"
                size="icon"
                className="border-gray-600"
                disabled={!showBackupCode}
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
                <span>{booking.foodListing?.title || 'Food Item'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>{booking.foodListing?.location || 'Pickup Location'}</span>
              </div>
              {booking.scheduledPickupTime && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>
                    Pickup: {new Date(booking.scheduledPickupTime).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Collection Instructions
            </h4>
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
                    Collect your food and enjoy!
                  </li>
                </>
              )}
            </ul>
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