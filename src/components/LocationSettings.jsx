'use client';

import React, { useState } from 'react';
import { MapPin, RefreshCw, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocationPermission } from '@/hooks/useLocationPermission';

const LocationSettings = () => {
  const {
    locationStatus,
    hasLocationAccess,
    loading,
    error,
    coordinates,
    address,
    requestLocation,
    clearLocation,
    resetDenialStatus,
    getLocationString
  } = useLocationPermission();

  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleRequestLocation = async () => {
    setActionLoading('request');
    setActionError(null);
    setActionSuccess(null);

    try {
      await requestLocation();
      setActionSuccess('Location updated successfully!');
    } catch (error) {
      setActionError(error.message || 'Failed to get location');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearLocation = async () => {
    setActionLoading('clear');
    setActionError(null);
    setActionSuccess(null);

    try {
      await clearLocation();
      setActionSuccess('Location data cleared successfully!');
    } catch (error) {
      setActionError('Failed to clear location data');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetDenial = () => {
    resetDenialStatus();
    setActionSuccess('Location permission reset. You can now enable location access.');
  };

  const handleUpdateCurrentLocation = async () => {
    setActionLoading('update');
    setActionError(null);
    setActionSuccess(null);

    try {
      await requestLocation();
      setActionSuccess('Location updated successfully!');
    } catch (error) {
      setActionError(error.message || 'Failed to get current location');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = () => {
    switch (locationStatus) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded-full border border-green-600/30">
            <CheckCircle className="h-3 w-3" />
            Enabled
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded-full border border-red-600/30">
            <AlertCircle className="h-3 w-3" />
            Denied
          </span>
        );
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-900/20 text-gray-400 text-xs rounded-full border border-gray-600/30">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-900/20 text-yellow-400 text-xs rounded-full border border-yellow-600/30">
            <AlertCircle className="h-3 w-3" />
            Not Set
          </span>
        );
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-100 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-blue-400" />
          Location Settings
          {getStatusBadge()}
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Manage your location data for better food distribution services
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Location Display */}
        {hasLocationAccess && (
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Current Location
            </h4>
            <div className="space-y-2">
              {address && (
                <p className="text-gray-300 text-sm">
                  <strong>Address:</strong> {address}
                </p>
              )}
              <p className="text-gray-300 text-sm">
                <strong>Coordinates:</strong> {coordinates.latitude}, {coordinates.longitude}
              </p>
              <p className="text-gray-400 text-xs">
                This location is used for directions and nearby food recommendations
              </p>
            </div>

            <div className="mt-3 p-2 bg-blue-900/20 border border-blue-600/30 rounded">
              <p className="text-blue-400 text-xs">
                <strong>💡 Tip:</strong> Traveling or moved? Use "Update Current Location" to get your current position using the browser's native location prompt.
              </p>
            </div>
          </div>
        )}

        {/* Location Denied Message */}
        {locationStatus === 'denied' && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
            <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Location Access Denied
            </h4>
            <p className="text-gray-300 text-sm mb-3">
              Location access was previously denied. You can enable it again to use direction features.
            </p>
            <Button
              onClick={handleResetDenial}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Enable Location Access
            </Button>
          </div>
        )}

        {/* No Location Message */}
        {locationStatus === 'unavailable' && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Location Not Set
            </h4>
            <p className="text-gray-300 text-sm mb-3">
              Set your location to enable directions and find nearby food providers.
            </p>
          </div>
        )}

        {/* Action Messages */}
        {actionSuccess && (
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {actionSuccess}
            </p>
          </div>
        )}

        {actionError && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {actionError}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!hasLocationAccess && locationStatus !== 'denied' && (
            <Button
              onClick={handleRequestLocation}
              disabled={actionLoading === 'request'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionLoading === 'request' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Set Location
                </>
              )}
            </Button>
          )}

          {hasLocationAccess && (
            <>
              <Button
                onClick={handleUpdateCurrentLocation}
                disabled={actionLoading === 'update'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
              >
                {actionLoading === 'update' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Current Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Update Current Location
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={handleRequestLocation}
                  disabled={actionLoading === 'request'}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {actionLoading === 'request' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Stored Location
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleClearLocation}
                  disabled={actionLoading === 'clear'}
                  variant="outline"
                  className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  {actionLoading === 'clear' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Location
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Privacy Information */}
        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
          <h4 className="text-gray-300 font-medium mb-2">Privacy & Security</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Your location is stored securely and encrypted</li>
            <li>• Only used for food distribution and direction services</li>
            <li>• You can update or remove your location anytime</li>
            <li>• Location data is not shared with third parties</li>
            <li>• Used to improve service recommendations and routing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationSettings;
