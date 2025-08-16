// hooks/useProfile.js
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

// Function to fetch the user profile from your API
const fetchUserProfile = async (userId) => {
  if (!userId) {
    // Return null or throw an error if userId is not available
    return null;
  }
  
  // Making a GET request to your API endpoint
  const { data } = await axios.get(`/api/profile?userId=${userId}`);
  
  // The 'data' from axios corresponds to the JSON response from your API
  // which is { success: true, message: '...', data: profile }
  return data.data; // We return the actual profile object
};

// The React Query custom hook
export const useUserProfile = () => {
  // Get the current user's ID from Clerk authentication
  const { userId } = useAuth();
  
  // useQuery hook manages fetching, caching, and state management
  return useQuery({
    // A unique key for this query. React Query uses this for caching.
    // It's an array, and when `userId` changes, React Query will refetch the data.
    queryKey: ['userProfile', userId],
    
    // The function that will be executed to fetch the data
    queryFn: () => fetchUserProfile(userId),
    
    // An option to disable the query from running automatically if there's no userId
    enabled: !!userId,
    
    // You can add other options here, like:
    staleTime: 5 * 60 * 1000, // The data will be considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevents refetching when the window gains focus
  });
};