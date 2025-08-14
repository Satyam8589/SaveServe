// File: /hooks/useListings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import listingService from '@/services/listingService';

// Query keys
export const LISTING_KEYS = {
  all: ['listings'],
  lists: () => [...LISTING_KEYS.all, 'list'],
  list: (filters) => [...LISTING_KEYS.lists(), { filters }],
};

// Hook to fetch listings
export function useListings(params = {}) {
  return useQuery({
    queryKey: LISTING_KEYS.list(params),
    queryFn: () => listingService.getListings(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// Hook to create a new listing
export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingData) => listingService.createListing(listingData),
    onSuccess: () => {
      // Invalidate and refetch listings
      queryClient.invalidateQueries({
        queryKey: LISTING_KEYS.lists()
      });
    },
    onError: (error) => {
      console.error('Failed to create listing:', error);
    },
  });
}