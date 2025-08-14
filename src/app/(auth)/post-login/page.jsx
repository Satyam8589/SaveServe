// app/post-login/page.jsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PostLogin() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const hasOnboarded = user?.publicMetadata?.hasOnboarded;
    const mainRole = user?.publicMetadata?.mainRole?.toLowerCase();

    if (hasOnboarded === true) {
      // Redirect to correct dashboard based on role
      if (mainRole === "provider") {
        router.replace("/providerDashboard");
      } else if (mainRole === "recipient") {
        router.replace("/recipientDashboard");
      } else {
        router.replace("/dashboard");
      }
    } else {
      // Not onboarded → force onboarding
      router.replace("/onboarding");
    }
  }, [isLoaded, user, router]);

  return <p>Redirecting...</p>;
}
