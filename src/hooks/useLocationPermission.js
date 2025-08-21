'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

/**
 * Custom hook to manage user location permissions and data
 * Provides location status, coordinates, and utility functions
 */
export const useLocationPermission = () => {
  const { user } = useUser();
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking', 'granted', 'denied', 'unavailable'
  const [coordinates, setCoordinates] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check user's current location status
  useEffect(() => {
    const checkLocationStatus = async () => {
      if (!user?.id) {
        setLocationStatus('unavailable');
        return;
      }

      try {
        const response = await fetch(`/api/profile?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.data?.area) {
          // Parse coordinates from area string
          const coordinateRegex = /Lat:\s*(-?\d+\.?\d*),\s*Lon:\s*(-?\d+\.?\d*)/i;
          const match = data.data.area.match(coordinateRegex);
          
          if (match && match[1] && match[2]) {
            const latitude = parseFloat(match[1]);
            const longitude = parseFloat(match[2]);
            
            setCoordinates({ latitude, longitude });
            setLocationStatus('granted');
            
            // Extract address if available
            const addressMatch = data.data.area.replace(coordinateRegex, '').trim();
            if (addressMatch && addressMatch !== '()') {
              setAddress(addressMatch.replace(/^\(|\)$/g, ''));
            }
            
            return;
          }
        }

        // Check if user has previously denied location
        const locationDenied = localStorage.getItem(`location-denied-${user.id}`);
        if (locationDenied) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('unavailable');
        }

      } catch (error) {
        console.error('Error checking location status:', error);
        setLocationStatus('unavailable');
      }
    };

    checkLocationStatus();
  }, [user?.id]);

  // Request location permission and update database
  const requestLocation = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Request location permission
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Try to get address from coordinates (optional)
      let addressResult = null;
      try {
        // Using a free geocoding service (you can replace with your preferred service)
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.display_name) {
            addressResult = geocodeData.display_name;
          }
        }
      } catch (geocodeError) {
        console.log('Geocoding failed, proceeding without address:', geocodeError);
      }

      // Update user location in database
      const updateResponse = await fetch('/api/users/locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          latitude,
          longitude,
          address: addressResult
        }),
      });

      const updateData = await updateResponse.json();

      if (!updateData.success) {
        throw new Error(updateData.error || 'Failed to update location');
      }

      // Update local state
      setCoordinates({ latitude, longitude });
      setAddress(addressResult);
      setLocationStatus('granted');

      // Remove any previous denial flag
      localStorage.removeItem(`location-denied-${user.id}`);

      return { latitude, longitude, address: addressResult };

    } catch (error) {
      console.error('Location request failed:', error);
      
      if (error.code === 1) { // PERMISSION_DENIED
        setError('Location access denied');
        localStorage.setItem(`location-denied-${user.id}`, 'true');
        setLocationStatus('denied');
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        setError('Location information is unavailable');
      } else if (error.code === 3) { // TIMEOUT
        setError('Location request timed out');
      } else {
        setError(error.message || 'Failed to get location');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear location data
  const clearLocation = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/users/locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          latitude: null,
          longitude: null,
          address: null
        }),
      });

      if (response.ok) {
        setCoordinates(null);
        setAddress(null);
        setLocationStatus('unavailable');
        localStorage.removeItem(`location-denied-${user.id}`);
      }
    } catch (error) {
      console.error('Failed to clear location:', error);
    }
  };

  // Reset denial status (allow user to be prompted again)
  const resetDenialStatus = () => {
    if (user?.id) {
      localStorage.removeItem(`location-denied-${user.id}`);
      setLocationStatus('unavailable');
    }
  };



  // Check if location features are available
  const hasLocationAccess = locationStatus === 'granted' && coordinates;

  // Get formatted location string
  const getLocationString = () => {
    if (!coordinates) return null;
    
    if (address) {
      return `${address} (Lat: ${coordinates.latitude}, Lon: ${coordinates.longitude})`;
    }
    
    return `Lat: ${coordinates.latitude}, Lon: ${coordinates.longitude}`;
  };

  return {
    // Status
    locationStatus,
    hasLocationAccess,
    loading,
    error,
    
    // Data
    coordinates,
    address,
    
    // Actions
    requestLocation,
    clearLocation,
    resetDenialStatus,
    
    // Utilities
    getLocationString,
  };
};

export default useLocationPermission;
