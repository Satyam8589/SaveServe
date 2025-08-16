// hooks/useSaveFCMToken.js
import { useMutation } from '@tanstack/react-query';

const saveFCMToken = async ({ token, userId, role, area }) => {
  const response = await fetch('/api/notifications/save-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      userId,
      role,
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
  return useMutation({
    mutationFn: saveFCMToken,
    onSuccess: (data) => {
      console.log('FCM token saved successfully:', data);
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error) => {
      console.error('Failed to save FCM token:', error);
    },
  });
};