"use client"
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingChecker({ userData, children }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only run after Clerk has loaded and we have user data
    if (!isLoaded || !user) return;

    // If userData indicates this is a new user or they haven't completed onboarding
    if (userData?.isNewUser || (userData?.user && !userData.user.hasCompletedOnboarding)) {
      // Don't redirect if already on onboarding page
      if (window.location.pathname !== '/onboarding') {
        router.push('/onboarding');
      }
    }
  }, [isLoaded, user, userData, router]);

  // Show loading state while checking
  if (!isLoaded || (user && !userData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}