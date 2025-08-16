import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import listingService from '@/services/listingService';

// Query Keys
const LISTINGS_QUERY_KEY = 'listings';
const LISTING_QUERY_KEY = 'listing';
const LISTING_BOOKINGS_QUERY_KEY = 'listingBookings';

// 1. Hook to fetch all listings
export const useFoodListings = () => {
  return useQuery({
    queryKey: [LISTINGS_QUERY_KEY],
    queryFn: listingService.getAllListings,
  });
};

// 2. Hook to fetch a single listing by ID
export const useFoodListing = (id) => {
  return useQuery({
    queryKey: [LISTING_QUERY_KEY, id],
    queryFn: () => listingService.getListingById(id),
    enabled: !!id, // Only run query if id is provided
  });
};

// 3. Hook to create a new listing
export const useCreateFoodListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: listingService.createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] }); // Invalidate all listings to refetch
    },
  });
};

// 4. Hook to update an existing listing
export const useUpdateFoodListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => listingService.updateListing(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] }); // Invalidate all listings
      queryClient.invalidateQueries({ queryKey: [LISTING_QUERY_KEY, variables.id] }); // Invalidate specific listing
    },
  });
};

// 5. Hook to delete a listing
export const useDeleteFoodListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: listingService.deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] }); // Invalidate all listings
    },
  });
};


