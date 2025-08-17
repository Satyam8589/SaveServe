// components/FirebaseAuthProvider.jsx (FIXED - Proper context value initialization)
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
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
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);

  console.log('🔥 FirebaseAuthProvider render:', {
    clerkUser: !!clerkUser,
    firebaseUser: !!firebaseUser,
    isLoading,
    isFirebaseAuthenticated,
    retryCount
  });

  // Clear error when Clerk user changes
  useEffect(() => {
    console.log('🔄 Clerk user changed, resetting error state');
    setError(null);
    setRetryCount(0);
  }, [clerkUser?.id]);

  // Firebase auth state listener
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Firebase auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setFirebaseUser(user);
      setIsFirebaseAuthenticated(!!user);
      
      // Only set loading to false if we have a definitive state
      if (isClerkLoaded) {
        if (clerkUser && !user) {
          // Clerk user exists but no Firebase user - keep loading until we try to authenticate
          console.log('🔍 Clerk user exists but no Firebase user - authentication needed');
        } else {
          console.log('🔍 Setting loading to false - definitive auth state reached');
          setIsLoading(false);
        }
      }
    });

    return () => {
      console.log('🔥 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, [isClerkLoaded, clerkUser]);

  // Sign in to Firebase function
  const signInToFirebase = useCallback(async (forceRetry = false) => {
    console.log('🔐 signInToFirebase called:', { 
      isClerkLoaded, 
      clerkUser: !!clerkUser, 
      firebaseUser: !!firebaseUser, 
      forceRetry 
    });

    if (!isClerkLoaded) {
      console.log('❌ Cannot sign in to Firebase: Clerk not loaded');
      throw new Error('Clerk not ready');
    }

    if (!clerkUser) {
      console.log('❌ Cannot sign in to Firebase: No Clerk user');
      throw new Error('No Clerk user');
    }

    if (firebaseUser && !forceRetry) {
      console.log('✅ Already signed in to Firebase:', firebaseUser.uid);
      return firebaseUser;
    }

    const attemptNumber = retryCount + 1;
    console.log(`🔑 Attempting Firebase sign-in for Clerk user: ${clerkUser.id} (attempt ${attemptNumber})`);
    
    setIsLoading(true);
    setError(null);

    try {
      const fbUser = await signInWithClerk(clerkUser);
      
      if (fbUser) {
        console.log('✅ Firebase sign-in successful:', fbUser.uid);
        setFirebaseUser(fbUser);
        setIsFirebaseAuthenticated(true);
        setError(null);
        setRetryCount(0);
        setIsLoading(false);
        return fbUser;
      } else {
        throw new Error('Firebase sign-in returned null');
      }
    } catch (error) {
      console.error('❌ Firebase sign-in failed:', error);
      setError(error);
      setRetryCount(prev => {
        const newCount = prev + 1;
        console.log(`🔄 Incrementing retry count to: ${newCount}`);
        return newCount;
      });
      setIsFirebaseAuthenticated(false);
      setIsLoading(false);
      throw error;
    }
  }, [isClerkLoaded, clerkUser, firebaseUser, retryCount]);

  // Auto-authenticate when Clerk user is available
  useEffect(() => {
    let timeoutId;

    if (isClerkLoaded && clerkUser && !firebaseUser && !error && retryCount < 3) {
      console.log('🔄 Auto-triggering Firebase authentication...', { retryCount });
      
      // Add a small delay to avoid rapid retries
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
      console.log(`⏱️ Scheduling auto-retry in ${delay}ms`);
      
      timeoutId = setTimeout(async () => {
        try {
          console.log('🚀 Executing auto-retry');
          await signInToFirebase();
        } catch (err) {
          console.error('❌ Auto sign-in failed:', err);
          // Error is already set by signInToFirebase
        }
      }, delay);
    }

    return () => {
      if (timeoutId) {
        console.log('🗑️ Cleaning up auto-retry timeout');
        clearTimeout(timeoutId);
      }
    };
  }, [isClerkLoaded, clerkUser, firebaseUser, error, retryCount, signInToFirebase]);

  // Set loading to false when we have a definitive state
  useEffect(() => {
    if (isClerkLoaded) {
      if (!clerkUser) {
        // No Clerk user - not loading
        console.log('🔍 No Clerk user - setting loading to false');
        setIsLoading(false);
        setIsFirebaseAuthenticated(false);
      } else if (firebaseUser) {
        // Have both Clerk and Firebase user - not loading
        console.log('🔍 Have both users - setting loading to false');
        setIsLoading(false);
        setIsFirebaseAuthenticated(true);
      } else if (error || retryCount >= 3) {
        // Have error or too many retries - not loading
        console.log('🔍 Error or max retries - setting loading to false');
        setIsLoading(false);
        setIsFirebaseAuthenticated(false);
      }
      // Otherwise, keep loading while we try to authenticate
    }
  }, [isClerkLoaded, clerkUser, firebaseUser, error, retryCount]);

  // Create context value - ✅ CRITICAL: All values must be defined
  const contextValue = {
    firebaseUser,
    isFirebaseAuthenticated,
    isLoading,
    error,
    retryCount,
    signInToFirebase: () => signInToFirebase(true), // Force retry wrapper
  };

  console.log('🎯 Context value being provided:', {
    firebaseUser: !!contextValue.firebaseUser,
    isFirebaseAuthenticated: contextValue.isFirebaseAuthenticated,
    isLoading: contextValue.isLoading,
    error: !!contextValue.error,
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
    isFirebaseAuthenticated: context.isFirebaseAuthenticated,
    isLoading: context.isLoading,
    error: !!context.error,
    retryCount: context.retryCount,
    signInToFirebase: typeof context.signInToFirebase
  });
  
  return context;
}