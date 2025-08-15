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

// 6. Hook to book a listing
export const useBookFoodListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, bookingData }) => listingService.bookListing(listingId, bookingData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LISTING_QUERY_KEY, variables.listingId] }); // Invalidate the specific listing to update its booked quantity/status
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] }); // Invalidate all listings
      queryClient.invalidateQueries({ queryKey: [LISTING_BOOKINGS_QUERY_KEY, variables.listingId] }); // Invalidate bookings for this listing
    },
  });
};

// 7. Hook to fetch bookings for a specific listing
export const useFoodListingBookings = (listingId, providerId) => {
  return useQuery({
    queryKey: [LISTING_BOOKINGS_QUERY_KEY, listingId, providerId],
    queryFn: () => listingService.getListingBookings(listingId, providerId),
    enabled: !!listingId && !!providerId, // Only run query if listingId and providerId are provided
  });
};
