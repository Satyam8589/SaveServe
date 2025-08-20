import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export const useBookingPermission = () => {
  const { userId, isLoaded } = useAuth();
  const [permission, setPermission] = useState({
    canBook: true,
    userStatus: 'ACTIVE',
    message: '',
    suspensionInfo: null,
    loading: true,
    error: null
  });

  const checkPermission = async () => {
    if (!userId || !isLoaded) {
      setPermission(prev => ({ ...prev, loading: true }));
      return;
    }

    try {
      setPermission(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/users/booking-permission');
      const data = await response.json();

      if (data.success) {
        setPermission({
          canBook: data.canBook,
          userStatus: data.userStatus,
          message: data.message || '',
          suspensionInfo: data.suspensionInfo,
          loading: false,
          error: null
        });
      } else {
        setPermission(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to check booking permission'
        }));
      }
    } catch (error) {
      console.error('Error checking booking permission:', error);
      setPermission(prev => ({
        ...prev,
        loading: false,
        error: 'Network error while checking permissions'
      }));
    }
  };

  useEffect(() => {
    checkPermission();
  }, [userId, isLoaded]);

  return {
    ...permission,
    refetch: checkPermission
  };
};
