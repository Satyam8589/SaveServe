'use client';

import { useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

const LocationPermissionService = () => {
  const { user } = useUser();

  console.log('🔍 LocationPermissionService loaded, user:', user?.id);

  // Test alert to see if component is loading
  if (typeof window !== 'undefined' && user?.id) {
    console.log('🚨 LocationPermissionService: Component loaded with user!');
  }

  // Simple location permission request (exactly like notifications)
  const requestLocationPermission = useCallback(async () => {
    console.log('🚀 requestLocationPermission called for user:', user?.id);

    if (!user?.id) {
      console.log('❌ No user found, skipping location request');
      return false;
    }

    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      console.warn('⚠️ Geolocation is not supported by this browser');
      return false;
    }

    console.log('✅ Geolocation is supported, requesting permission...');

    // This triggers the native browser location permission prompt (like notifications)
    try {
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
      console.log('✅ Location obtained:', latitude, longitude);

      // Get address from coordinates (optional)
      let address = null;
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.display_name) {
            address = geocodeData.display_name;
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
          address
        }),
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        console.log('✅ Location permission granted and saved successfully');
        return true;
      } else {
        console.error('❌ Failed to save location:', updateData.error);
        return false;
      }

    } catch (error) {
      if (error.code === 1) { // PERMISSION_DENIED
        console.log('🚫 Location permission denied by user');
        localStorage.setItem(`location-denied-${user.id}`, 'true');
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        console.log('📍 Location information unavailable');
      } else if (error.code === 3) { // TIMEOUT
        console.log('⏰ Location request timed out');
      } else {
        console.error('❌ Location request failed:', error);
      }
      return false;
    }
  }, [user]);

  // 📍 Request location permission on first render (exactly like notifications)
  useEffect(() => {
    console.log('🔍 LocationPermissionService useEffect triggered, user:', user?.id);
    requestLocationPermission();
  }, [requestLocationPermission]);



  // This component doesn't render anything - it just handles the permission logic
  return null;
};

export default LocationPermissionService;
