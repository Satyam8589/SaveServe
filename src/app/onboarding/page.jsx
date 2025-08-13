// app/onboarding/page.jsx
"use client";
import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { User, CheckCircle } from "lucide-react";
import RoleSelector from "./RoleSelector";
// import ProfileForm from "./ProfileForm";

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [userRoles, setUserRoles] = useState({ mainRole: "", subRole: "" });
  const router = useRouter();
  const { getToken, userId } = useAuth();

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
    try {
      await updateUserMetadata({
        mainRole,
        subRole,
        hasOnboarded: true, // Still need to complete profile
      });

      setUserRoles({ mainRole, subRole });
      setStep(2);
    } catch (error) {
      console.error("Error updating user roles:", error);
      throw error;
    }
  };

  // For now, let's complete onboarding after role selection
  // You can uncomment and implement this when ProfileForm is ready
  const handleProfileSubmit = async (profileData) => {
    try {
      await updateUserMetadata({
        mainRole: userRoles.mainRole,
        subRole: userRoles.subRole,
        profileData,
        hasOnboarded: true,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      throw error;
    }
  };

  // Temporary: Complete onboarding immediately after role selection
  // Remove this when ProfileForm is implemented
  const handleSkipProfile = async () => {
    try {
      await updateUserMetadata({
        mainRole: userRoles.mainRole,
        subRole: userRoles.subRole,
        hasOnboarded: true, // Complete onboarding
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("Error completing onboarding. Please try again.");
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
            <div
              className={`h-1 w-24 transition-all ${
                step >= 2 ? "bg-emerald-500" : "bg-gray-600"
              }`}
            />
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                step >= 2
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-gray-600 text-gray-400"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
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
            <div
              className={`transition-colors ${
                step >= 2 ? "text-emerald-400" : "text-gray-500"
              }`}
            >
              <div className="font-semibold">Complete Profile</div>
              <div className="text-sm">Add your details</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pb-12">
        {step === 1 && <RoleSelector onRoleSelect={handleRoleSelect} />}
        {step === 2 && (
          <div className="max-w-2xl mx-auto px-8 text-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">
                Profile Setup (Coming Soon)
              </h2>
              <p className="text-gray-300 mb-6">
                You've selected:{" "}
                <span className="text-emerald-400 font-semibold">
                  {userRoles.mainRole}
                </span>{" "}
                -{" "}
                <span className="text-emerald-400 font-semibold">
                  {userRoles.subRole}
                </span>
              </p>
              <p className="text-gray-400 mb-8">
                Profile form will be implemented here. For now, you can skip to
                the dashboard.
              </p>
              <button
                onClick={handleSkipProfile}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Uncomment when ProfileForm is ready
        {step === 2 && (
          <ProfileForm
            onProfileSubmit={handleProfileSubmit}
            userRoles={userRoles}
          />
        )}
        */}
      </div>
    </div>
  );
};

export default OnboardingPage;
