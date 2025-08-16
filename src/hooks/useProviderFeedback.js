// src/hooks/useProviderFeedback.js
"use client";

import { useQuery } from '@tanstack/react-query';

const fetchProviderFeedback = async () => {
  const response = await fetch('/api/provider-feedback');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    throw new Error(errorData.message || 'Failed to fetch provider feedback.');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'An unknown error occurred while fetching feedback.');
  }
  
  return data.data; // This will be null if no feedback is found, or the feedback object
};

/**
 * Custom hook to fetch the current provider's feedback.
 * @returns {object} The result from React Query's useQuery, including data, isLoading, isError, etc.
 */
export const useProviderFeedback = () => {
  return useQuery({
    queryKey: ['providerFeedback'],
    queryFn: fetchProviderFeedback,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Keep previous data while refetching in the background
    placeholderData: (previousData) => previousData,
  });
};
