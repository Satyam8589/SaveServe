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
        const hasOnboarded = user?.publicMetadata?.hasOnboarded;
        const mainRole = user?.publicMetadata?.mainRole?.toLowerCase();

        if (hasOnboarded === true) {
          // User has completed onboarding, now check approval status
          const response = await fetch(`/api/profile?userId=${user.id}`);

          if (response.ok) {
            const data = await response.json();
            const profile = data.profile;

            if (profile) {
              // Admin users bypass approval system
              if (mainRole === "admin") {
                router.replace("/admin");
                return;
              }

              // For all other users, check user status (new system)
              const userStatus = profile.userStatus || "ACTIVE"; // Default to ACTIVE for backward compatibility

              switch (userStatus) {
                case "BLOCKED":
                  // User is blocked, redirect to blocked page
                  router.replace("/blocked");
                  break;

                case "ACTIVE":
                case "APPROVED":
                case "REJECTED":
                default:
                  // In new system, all non-blocked users can access dashboard
                  try {
                    // Ensure Clerk metadata is up to date
                    await fetch("/api/refresh-session", {
                      method: "POST",
                    });
                  } catch (error) {
                    console.warn("Failed to refresh session:", error);
                  }

                  if (mainRole === "provider") {
                    router.replace("/providerDashboard");
                  } else if (mainRole === "recipient") {
                    router.replace("/recipientDashboard");
                  } else {
                    router.replace("/dashboard");
                  }
                  break;
              }
            } else {
              // No profile found, redirect to onboarding
              router.replace("/onboarding");
            }
          } else {
            // Error fetching profile, redirect to onboarding
            router.replace("/onboarding");
          }
        } else {
          // Not onboarded → force onboarding
          router.replace("/onboarding");
        }
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
