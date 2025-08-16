import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const QRScanner = ({ onScanSuccess, onClose, listingId, providerId }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraPermission, setCameraPermission] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      setCameraPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraPermission(false);
      setScanError('Camera access is required to scan QR codes');
    }
  }, [facingMode]);

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopCamera();
    };
  }, [requestCameraPermission, stopCamera]);

  const handleQRDetection = useCallback(async (qrData) => {
    try {
      stopCamera();
      setScanError(null);
      
      const response = await fetch(`/api/bookings/verify-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData, providerId, listingId }),
      });

      const result = await response.json();
      
      if (result.success) {
        onScanSuccess(result.data);
      } else {
        setScanError(result.message || 'Invalid QR code');
        setTimeout(() => setScanError(null), 5000);
      }
    } catch (error) {
      console.error('QR verification error:', error);
      setScanError('Failed to verify QR code');
    }
  }, [listingId, onScanSuccess, providerId, stopCamera]);

  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        handleQRDetection(code.data);
        return;
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [handleQRDetection]);

  const startCamera = useCallback(async () => {
    try {
      setScanError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsScanning(true);
            requestRef.current = requestAnimationFrame(tick);
        };
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setScanError('Failed to start camera. It might be in use by another application.');
    }
  }, [facingMode, tick]);

  const handleManualCodeSubmit = async () => {
    if (manualCode.length !== 6) {
      setScanError('Please enter a valid 6-digit code');
      return;
    }
    try {
      const response = await fetch(`/api/bookings/verify-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionCode: manualCode, providerId, listingId }),
      });
      const result = await response.json();
      if (result.success) {
        onScanSuccess(result.data);
      } else {
        setScanError(result.message || 'Invalid collection code');
      }
    } catch (error) {
      console.error('Manual code verification error:', error);
      setScanError('Failed to verify collection code');
    }
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };
  
  useEffect(() => {
      if(isScanning) {
          startCamera();
      }
  }, [facingMode, isScanning, startCamera]);


  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-100 flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Scan QR Code
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanError && (
            <div className="bg-red-900/20 border border-red-500/20 p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{scanError}</span>
            </div>
          )}
          <div className="relative">
            <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative">
              {cameraPermission === false && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Camera className="h-16 w-16 mb-4" />
                      <p className="text-center">Camera access is required.</p>
                      <p className="text-xs text-center mt-1">Please allow camera permissions in your browser settings.</p>
                  </div>
              )}
              {cameraPermission && <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-gray-600 rounded-lg">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-400 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400"></div>
                  </div>
                </div>
                {isScanning && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-emerald-400 opacity-75 animate-pulse"></div>}
              </div>
              <div className="absolute top-2 right-2">
                <Badge className={isScanning ? "bg-green-600" : "bg-gray-600"}>
                  {isScanning ? "Scanning..." : "Ready"}
                </Badge>
              </div>
            </div>
            <div className="flex justify-center space-x-2 mt-4">
              {!isScanning ? (
                <Button onClick={startCamera} disabled={!cameraPermission} className="bg-emerald-600 hover:bg-emerald-700">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </Button>
              ) : (
                <>
                  <Button onClick={stopCamera} variant="outline" className="border-gray-600">Stop</Button>
                  <Button onClick={toggleCamera} variant="outline" size="icon" className="border-gray-600">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-600">
            <Label className="text-gray-300 text-sm">Or enter 6-digit collection code manually:</Label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
              <Button onClick={handleManualCodeSubmit} disabled={manualCode.length !== 6} className="bg-emerald-600 hover:bg-emerald-700">
                Verify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
