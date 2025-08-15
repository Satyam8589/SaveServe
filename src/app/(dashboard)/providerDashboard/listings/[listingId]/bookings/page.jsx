'use client';

import { useParams } from 'next/navigation';
import { useFoodListingBookings, useFoodListing } from '@/hooks/useFoodListings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@clerk/nextjs';

export default function ListingBookingsPage() {
  const params = useParams();
  const listingId = params.listingId;
  const { userId } = useAuth();

  const { data: listing, isLoading: isListingLoading, isError: isListingError, error: listingError } = useFoodListing(listingId);
  const { data: bookings, isLoading: isBookingsLoading, isError: isBookingsError, error: bookingsError } = useFoodListingBookings(listingId, userId);

  if (isListingLoading || isBookingsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isListingError || isBookingsError) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-xl font-bold">Error Loading Data</h2>
        <p>{listingError?.message || bookingsError?.message || 'Failed to load listing or bookings.'}</p>
      </div>
    );
  }

  if (!listing) {
    return <div className="p-6 text-gray-500">Listing not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Bookings for "{listing.title}"</h1>
      <p className="text-gray-600 mb-6">Listing ID: {listing._id}</p>

      <Separator className="my-6" />

      {bookings && bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <Card key={booking._id} className="shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-700">Booking ID: {booking._id}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Recipient:</span> {booking.recipientName} (ID: {booking.recipientId})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Requested Quantity:</span> {booking.requestedQuantity}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Approved Quantity:</span> {booking.approvedQuantity}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> <span className={`font-semibold ${
                    booking.status === 'approved' ? 'text-green-600' :
                    booking.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>{booking.status.toUpperCase()}</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Requested At:</span> {new Date(booking.requestedAt).toLocaleString()}
                </p>
                {booking.scheduledPickupTime && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Scheduled Pickup:</span> {new Date(booking.scheduledPickupTime).toLocaleString()}
                  </p>
                )}
                {booking.requestMessage && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Message:</span> {booking.requestMessage}
                  </p>
                )}
                {booking.providerResponse && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Provider Response:</span> {booking.providerResponse}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg">No bookings found for this listing yet.</p>
        </div>
      )}
    </div>
  );
}
