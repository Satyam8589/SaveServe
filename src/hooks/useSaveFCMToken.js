// hooks/useSaveFCMToken.js
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

const saveFCMToken = async ({ token, userId, area }) => {
  const response = await fetch('/api/notifications/save-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      userId,
      area,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save FCM token');
  }

  return response.json();
};

export const useSaveFCMToken = (onSuccessCallback) => {
  // Memoize the success callback to prevent unnecessary re-renders
  const memoizedCallback = useCallback(onSuccessCallback, []);

  return useMutation({
    mutationFn: saveFCMToken,
    onSuccess: (data) => {
      console.log('FCM token saved successfully:', data);
      if (memoizedCallback) {
        memoizedCallback();
      }
    },
    onError: (error) => {
      console.error('Failed to save FCM token:', error);
    },
  });
};