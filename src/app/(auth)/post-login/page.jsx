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

    if (hasOnboarded) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [isLoaded, user, router]);

  return <p>Redirecting...</p>;
}
