// app/onboarding/page.jsx
"use client";
import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { User, CheckCircle } from "lucide-react";
import RoleSelector from "./RoleSelector";

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [userRoles, setUserRoles] = useState({ mainRole: "", subRole: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const { user } = useUser();

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-4 text-white">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  // Helper function to call the API route
  const updateUserMetadata = async (data) => {
    try {
      const token = await getToken();

      const response = await fetch("/api/update-user-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user metadata");
      }

      return await response.json();
      
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  const handleRoleSelect = async (mainRole, subRole) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    console.log("Starting role selection process...", { mainRole, subRole });

    try {
      // Step 1: Update Clerk metadata
      console.log("Updating Clerk metadata...");
      const result = await updateUserMetadata({
        mainRole,
        subRole,
        hasOnboarded: true,
        hasCompleteProfile: false,
      });
      
      console.log("Metadata update result:", result);
      setUserRoles({ mainRole, subRole });

      // Step 2: Force reload user data to refresh session
      console.log("Reloading user session...");
      await user?.reload();
      
      // Step 3: Small delay to ensure metadata propagation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Force redirect with window.location for immediate effect
      console.log("Redirecting to profile...");
      window.location.href = "/profile";
      
    } catch (error) {
      console.error("Error during role selection:", error);
      setIsSubmitting(false);
      
      // Show error to user (you might want to add a toast notification here)
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.1),transparent_50%)]" />

      {/* Progress Indicator */}
      <div className="relative z-10 pt-8 pb-4">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                step >= 1
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-gray-600 text-gray-400"
              }`}
            >
              <User className="w-5 h-5" />
            </div>
          </div>

          <div className="flex justify-center gap-8 text-center">
            <div
              className={`transition-colors ${
                step >= 1 ? "text-emerald-400" : "text-gray-500"
              }`}
            >
              <div className="font-semibold">Choose Role</div>
              <div className="text-sm">Select your community role</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pb-12">
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-white text-xl mb-2">Setting up your account...</p>
            <p className="text-gray-400 text-sm">Please wait while we redirect you</p>
          </div>
        ) : (
          <RoleSelector onRoleSelect={handleRoleSelect} />
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;