// app/post-login/page.jsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PostLogin() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const checkUserStatus = async () => {
      try {
        let hasOnboarded = user?.publicMetadata?.hasOnboarded;
        let hasCompleteProfile = user?.publicMetadata?.hasCompleteProfile;
        const mainRole = user?.publicMetadata?.mainRole;

        console.log("Post-login check:", {
          hasOnboarded,
          hasCompleteProfile,
          mainRole,
          userId: user?.id
        });

        // Step 0: Initialize new users if they have no metadata
        if (hasOnboarded === undefined && hasCompleteProfile === undefined && !mainRole) {
          console.log("New user detected - initializing...");
          try {
            const response = await fetch("/api/initialize-user", {
              method: "POST",
            });

            if (response.ok) {
              const result = await response.json();
              console.log("User initialized:", result);
              // Reload user to get updated metadata
              await user?.reload();
              hasOnboarded = user?.publicMetadata?.hasOnboarded;
              hasCompleteProfile = user?.publicMetadata?.hasCompleteProfile;
            }
          } catch (initError) {
            console.error("Failed to initialize user:", initError);
            // Continue with default behavior
          }
        }

        // Step 1: Check if user needs onboarding (role selection)
        if (hasOnboarded !== "true" && hasOnboarded !== true) {
          console.log("User needs onboarding - redirecting to onboarding");
          router.replace("/onboarding");
          return;
        }

        // Step 2: Check if user needs profile completion
        if ((hasOnboarded === "true" || hasOnboarded === true) &&
            (hasCompleteProfile !== "true" && hasCompleteProfile !== true)) {
          console.log("User onboarded but needs profile completion - redirecting to profile");
          router.replace("/profile");
          return;
        }

        // Step 3: User has completed both onboarding and profile - check their status and redirect to dashboard
        if ((hasOnboarded === "true" || hasOnboarded === true) &&
            (hasCompleteProfile === "true" || hasCompleteProfile === true)) {
          console.log("User has completed onboarding and profile - checking status and redirecting to dashboard");

          // Admin users go to admin dashboard
          if (mainRole === "ADMIN") {
            router.replace("/admin");
            return;
          }

          // Check if user is blocked (optional - you can remove this if not needed)
          try {
            const response = await fetch(`/api/profile?userId=${user.id}`);
            if (response.ok) {
              const data = await response.json();
              const profile = data.profile;

              if (profile?.userStatus === "BLOCKED") {
                router.replace("/blocked");
                return;
              }
            }
          } catch (error) {
            console.warn("Could not check user status:", error);
            // Continue to dashboard even if status check fails
          }

          // Redirect to appropriate dashboard based on role
          if (mainRole === "PROVIDER") {
            router.replace("/providerDashboard");
          } else if (mainRole === "RECIPIENT") {
            router.replace("/recipientDashboard");
          } else {
            router.replace("/dashboard");
          }
          return;
        }

        // Fallback: If we reach here, something is wrong - send to onboarding
        console.log("Fallback: Redirecting to onboarding");
        router.replace("/onboarding");

      } catch (error) {
        console.error("Error checking user status:", error);
        // On error, redirect to onboarding as fallback
        router.replace("/onboarding");
      } finally {
        setChecking(false);
      }
    };

    checkUserStatus();
  }, [isLoaded, user, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-4 text-white">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xl">Checking your account status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-4 text-white">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xl">Redirecting...</span>
      </div>
    </div>
  );
}
