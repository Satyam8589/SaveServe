import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import bookingService from '@/services/bookingService';

// Query Keys
const BOOKING_QUERY_KEY = 'booking';
const BOOKINGS_QUERY_KEY = 'bookings';
const USER_BOOKINGS_QUERY_KEY = 'userBookings';
const LISTING_BOOKINGS_QUERY_KEY = 'listingBookings';

// Hook to book a listing
export const useBookFoodListing = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: ({ listingId, bookingData }) => 
      bookingService.bookListing(listingId, bookingData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['listing', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [USER_BOOKINGS_QUERY_KEY, user.id] });
      }
      queryClient.invalidateQueries({ queryKey: [LISTING_BOOKINGS_QUERY_KEY, variables.listingId] });
    },
    onError: (error) => {
      console.error('Booking failed:', error.message);
    }
  });
};

// Hook to get user's bookings/claims
export const useUserBookings = (userId) => {
  return useQuery({
    queryKey: [USER_BOOKINGS_QUERY_KEY, userId],
    queryFn: () => bookingService.getUserBookings(userId),
    enabled: !!userId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });
};

// Hook to get bookings for a listing (for providers)
export const useFoodListingBookings = (listingId, providerId) => {
  return useQuery({
    queryKey: [LISTING_BOOKINGS_QUERY_KEY, listingId, providerId],
    queryFn: () => bookingService.getListingBookings(listingId, providerId),
    enabled: !!listingId && !!providerId,
    staleTime: 15000, // Consider data fresh for 15 seconds
    cacheTime: 60000, // Keep in cache for 1 minute
  });
};

// Hook to update booking status
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, status, response }) => 
      bookingService.updateBookingStatus(bookingId, status, response),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOOKING_QUERY_KEY, variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LISTING_BOOKINGS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Update booking status failed:', error.message);
    }
  });
};

// Hook to verify collection
export const useVerifyCollection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ qrData, collectionCode, providerId, listingId }) => 
      bookingService.verifyCollection(qrData, collectionCode, providerId, listingId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LISTING_BOOKINGS_QUERY_KEY, variables.listingId] });
    },
    onError: (error) => {
      console.error('Collection verification failed:', error.message);
    }
  });
};

// Hook to rate a booking
export const useRateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, rating, feedback }) => 
      bookingService.rateBooking(bookingId, rating, feedback),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOOKING_QUERY_KEY, variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: [USER_BOOKINGS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Rating booking failed:', error.message);
    }
  });
};

// Hook to cancel a booking
export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, reason }) => 
      bookingService.cancelBooking(bookingId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOOKING_QUERY_KEY, variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: [USER_BOOKINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LISTING_BOOKINGS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Cancel booking failed:', error.message);
    }
  });
};