// components/FirebaseAuthProvider.jsx (FIXED VERSION)
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs'; // Fixed: Use useUser instead of useAuth
import { signInWithClerk, auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

const FirebaseAuthContext = createContext({
  firebaseUser: null,
  isFirebaseAuthenticated: false,
  isLoading: true,
  error: null,
  retryCount: 0,
  signInToFirebase: () => Promise.resolve(null),
});

export function FirebaseAuthProvider({ children }) {
  // Fixed: Use useUser instead of useAuth for getting user info
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);

  console.log('🔥 FirebaseAuthProvider render:', {
    isClerkLoaded,
    isSignedIn,
    clerkUser: !!clerkUser,
    clerkUserId: clerkUser?.id,
    clerkEmail: clerkUser?.emailAddresses?.[0]?.emailAddress,
    firebaseUser: !!firebaseUser,
    firebaseUserId: firebaseUser?.uid,
    isLoading,
    isFirebaseAuthenticated,
    retryCount,
    error: error?.message
  });

  // Clear error when Clerk user changes
  useEffect(() => {
    if (clerkUser?.id) {
      console.log('🔄 Clerk user changed, resetting error state');
      setError(null);
      setRetryCount(0);
    }
  }, [clerkUser?.id]);

  // Firebase auth state listener
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Firebase auth state changed:', user ? `User: ${user.uid}` : 'No user');
      
      if (user) {
        // Check if the Firebase user matches the Clerk user
        const isCorrectUser = clerkUser?.id === user.uid;
        console.log('🔍 User match check:', {
          clerkUserId: clerkUser?.id,
          firebaseUserId: user.uid,
          match: isCorrectUser
        });
        
        if (isCorrectUser) {
          setFirebaseUser(user);
          setIsFirebaseAuthenticated(true);
          setError(null);
          setRetryCount(0);
          console.log('✅ Firebase user authenticated and matched with Clerk user');
        } else {
          console.warn('⚠️ Firebase user does not match Clerk user');
          setFirebaseUser(null);
          setIsFirebaseAuthenticated(false);
        }
      } else {
        console.log('🔍 No Firebase user - setting states to unauthenticated');
        setFirebaseUser(null);
        setIsFirebaseAuthenticated(false);
      }
      
      // Set loading to false when we have a definitive state and Clerk is loaded
      if (isClerkLoaded) {
        console.log('🔍 Setting loading to false - Clerk is loaded and Firebase state determined');
        setIsLoading(false);
      }
    });

    return () => {
      console.log('🔥 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, [isClerkLoaded, clerkUser?.id]);

  // Enhanced sign in to Firebase function with better error handling
  const signInToFirebase = useCallback(async (forceRetry = false) => {
    console.log('🔑 signInToFirebase called:', { 
      isClerkLoaded, 
      clerkUser: !!clerkUser, 
      firebaseUser: !!firebaseUser, 
      forceRetry,
      userMatch: firebaseUser?.uid === clerkUser?.id,
      retryCount
    });

    if (!isClerkLoaded) {
      console.log('❌ Cannot sign in to Firebase: Clerk not loaded');
      throw new Error('Clerk not ready');
    }

    if (!clerkUser) {
      console.log('❌ Cannot sign in to Firebase: No Clerk user');
      throw new Error('No Clerk user');
    }

    if (firebaseUser && firebaseUser.uid === clerkUser.id && !forceRetry) {
      console.log('✅ Already signed in to Firebase with correct user:', firebaseUser.uid);
      return firebaseUser;
    }

    const attemptNumber = retryCount + 1;
    console.log(`🔑 Attempting Firebase sign-in for Clerk user: ${clerkUser.id} (attempt ${attemptNumber}/3)`);
    
    setIsLoading(true);
    setError(null);

    try {
      // Use your custom API endpoint approach
      const fbUser = await signInWithClerk(clerkUser);
      
      if (fbUser && fbUser.uid === clerkUser.id) {
        console.log('✅ Firebase sign-in successful:', fbUser.uid);
        console.log('✅ User IDs match - authentication complete');
        setFirebaseUser(fbUser);
        setIsFirebaseAuthenticated(true);
        setError(null);
        setRetryCount(0);
        setIsLoading(false);
        return fbUser;
      } else {
        const errorMsg = fbUser 
          ? `User ID mismatch: Firebase=${fbUser.uid}, Clerk=${clerkUser.id}`
          : 'Firebase sign-in returned null user';
        console.error('❌ Firebase sign-in validation failed:', errorMsg);
        throw new Error(`Firebase sign-in failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Firebase sign-in failed:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
      
      // Enhanced error handling with specific guidance
      let enhancedError = error;
      
      if (error.code === 'auth/invalid-custom-token') {
        enhancedError = new Error(
          'Invalid Firebase custom token. Please check:\n' +
          '• Firebase service account key is correctly configured in Clerk\n' +
          '• Server-side token generation is working properly\n' +
          '• Project IDs match between client and server'
        );
        enhancedError.code = error.code;
      } else if (error.code === 'auth/configuration-not-found') {
        enhancedError = new Error(
          'Firebase configuration not found. This usually means:\n' +
          '• Project ID mismatch between client and server\n' +
          '• Check NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable\n' +
          '• Ensure Firebase project exists and is accessible'
        );
        enhancedError.code = error.code;
      } else if (error.message?.includes('Failed to get Firebase custom token')) {
        enhancedError = new Error(
          'API endpoint error getting custom token. Please check:\n' +
          '• /api/auth/firebase-token endpoint is working\n' +
          '• Server-side Firebase admin configuration\n' +
          '• Network connectivity'
        );
      }
      
      setError(enhancedError);
      
      // Increment retry count
      setRetryCount(prev => {
        const newCount = prev + 1;
        console.log(`🔄 Incrementing retry count to: ${newCount}/3`);
        return newCount;
      });
      
      setIsFirebaseAuthenticated(false);
      setIsLoading(false);
      throw enhancedError;
    }
  }, [isClerkLoaded, clerkUser, firebaseUser, retryCount]);

  // Auto-authenticate when Clerk user is available (with retry limit)
  useEffect(() => {
    let timeoutId;

    console.log('🔄 Auto-auth effect triggered:', {
      isClerkLoaded,
      isSignedIn,
      hasClerkUser: !!clerkUser,
      hasFirebaseUser: !!firebaseUser,
      hasError: !!error,
      retryCount,
      maxRetriesReached: retryCount >= 3,
      needsAuth: isClerkLoaded && isSignedIn && clerkUser && (!firebaseUser || firebaseUser.uid !== clerkUser.id)
    });

    // Only attempt auto-auth if conditions are met and we haven't exceeded retry limit
    if (isClerkLoaded && isSignedIn && clerkUser && !error && retryCount < 3) {
      // Check if we need to authenticate
      const needsAuth = !firebaseUser || firebaseUser.uid !== clerkUser.id;
      
      if (needsAuth) {
        console.log('🔄 Auto-triggering Firebase authentication...', { 
          retryCount,
          hasFirebaseUser: !!firebaseUser,
          userMatch: firebaseUser?.uid === clerkUser.id
        });
        
        // Add exponential backoff delay: 0ms, 1s, 2s, 4s
        const delay = retryCount === 0 ? 0 : Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(`⏱️ Scheduling auto-retry in ${delay}ms (attempt ${retryCount + 1}/3)`);
        
        timeoutId = setTimeout(async () => {
          try {
            console.log('🚀 Executing auto-retry');
            await signInToFirebase();
          } catch (err) {
            console.error('❌ Auto sign-in failed:', err);
            // Error is already handled in signInToFirebase
          }
        }, delay);
      }
    } else if (retryCount >= 3) {
      console.log('🛑 Max retries reached (3/3), stopping auto-authentication attempts');
      setIsLoading(false);
    } else if (error) {
      console.log('🛑 Error present, not attempting auto-authentication');
      setIsLoading(false);
    }

    return () => {
      if (timeoutId) {
        console.log('🗑️ Cleaning up auto-retry timeout');
        clearTimeout(timeoutId);
      }
    };
  }, [isClerkLoaded, isSignedIn, clerkUser?.id, firebaseUser?.uid, error, retryCount, signInToFirebase]);

  // Set loading states appropriately
  useEffect(() => {
    console.log('🔍 Loading state effect:', {
      isClerkLoaded,
      hasClerkUser: !!clerkUser,
      hasFirebaseUser: !!firebaseUser,
      userMatch: firebaseUser?.uid === clerkUser?.id,
      hasError: !!error,
      retryCount
    });

    if (isClerkLoaded) {
      if (!clerkUser) {
        // No Clerk user - not loading, not authenticated
        console.log('🔍 No Clerk user - setting states to not authenticated');
        setIsLoading(false);
        setIsFirebaseAuthenticated(false);
        setFirebaseUser(null);
      } else if (firebaseUser && firebaseUser.uid === clerkUser.id) {
        // Have matching users - not loading, authenticated
        console.log('🔍 Have matching users - setting states to authenticated');
        setIsLoading(false);
        setIsFirebaseAuthenticated(true);
      } else if (error || retryCount >= 3) {
        // Have error or too many retries - not loading, not authenticated
        console.log('🔍 Error or max retries - setting states to failed');
        setIsLoading(false);
        setIsFirebaseAuthenticated(false);
      }
      // Otherwise, keep loading while we try to authenticate
    }
  }, [isClerkLoaded, clerkUser?.id, firebaseUser?.uid, error, retryCount]);

  // Create context value
  const contextValue = {
    firebaseUser,
    isFirebaseAuthenticated,
    isLoading,
    error,
    retryCount,
    signInToFirebase: () => signInToFirebase(true),
  };

  console.log('🎯 Context value being provided:', {
    firebaseUser: !!contextValue.firebaseUser,
    firebaseUserId: contextValue.firebaseUser?.uid,
    isFirebaseAuthenticated: contextValue.isFirebaseAuthenticated,
    isLoading: contextValue.isLoading,
    error: contextValue.error?.message || null,
    retryCount: contextValue.retryCount,
    signInToFirebase: typeof contextValue.signInToFirebase
  });

  return (
    <FirebaseAuthContext.Provider value={contextValue}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  
  console.log('🎯 useFirebaseAuth called, returning:', {
    firebaseUser: !!context.firebaseUser,
    firebaseUserId: context.firebaseUser?.uid,
    isFirebaseAuthenticated: context.isFirebaseAuthenticated,
    isLoading: context.isLoading,
    error: context.error?.message || null,
    retryCount: context.retryCount,
    signInToFirebase: typeof context.signInToFirebase
  });
  
  return context;
}