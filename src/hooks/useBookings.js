import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bookingService from '@/services/bookingService';

// Query Keys
const LISTING_QUERY_KEY = 'listing'; // Used for invalidation
const LISTINGS_QUERY_KEY = 'listings'; // Used for invalidation
const LISTING_BOOKINGS_QUERY_KEY = 'listingBookings';

// Hook to book a listing
export const useBookFoodListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, bookingData }) => bookingService.bookListing(listingId, bookingData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [LISTING_QUERY_KEY, variables.listingId] }); // Invalidate the specific listing to update its booked quantity/status
      queryClient.invalidateQueries({ queryKey: [LISTINGS_QUERY_KEY] }); // Invalidate all listings
      queryClient.invalidateQueries({ queryKey: [LISTING_BOOKINGS_QUERY_KEY, variables.listingId] }); // Invalidate bookings for this listing
    },
  });
};

// Hook to fetch bookings for a specific listing
export const useFoodListingBookings = (listingId, providerId) => {
  return useQuery({
    queryKey: [LISTING_BOOKINGS_QUERY_KEY, listingId, providerId],
    queryFn: () => bookingService.getListingBookings(listingId, providerId),
    enabled: !!listingId && !!providerId, // Only run query if listingId and providerId are provided
  });
};