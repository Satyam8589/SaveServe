
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
      hasOnboarded: true, // Mark onboarding complete
    });

    setUserRoles({ mainRole, subRole });

    // Redirect based on main role
    if (mainRole.toLowerCase() === "provider") {
      router.push("/providerDashboard");
    } else if (mainRole.toLowerCase() === "recipient") {
      router.push("/recipientDashboard");
    } else {
      // Fallback - if role doesn't match, go to a default dashboard
      router.push("/dashboard");
    }
  } catch (error) {
    console.error("Error updating user roles:", error);
  }
};


  // const handleProfileSubmit = async (profileData) => {
  //   try {
  //     // Call your API route instead of the server action directly
  //     const token = await getToken();

  //     const response = await fetch("/api/save-profile", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(profileData),
  //     });

  //     if (!response.ok) {
  //       const error = await response.json();
  //       throw new Error(error.error || "Failed to save profile");
  //     }

  //     const result = await response.json();

  //     // Also update Clerk metadata to mark onboarding as complete
  //     await updateUserMetadata({
  //       hasOnboarded: true,
  //     });

  //     // Redirect to dashboard
  //     router.push("/dashboard");
  //   } catch (error) {
  //     console.error("Error saving profile:", error);
  //     throw error;
  //   }
  // };

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
            {/* <div
              className={`h-1 w-24 transition-all ${
                step >= 2 ? "bg-emerald-500" : "bg-gray-600"
              }`}
            /> */}
            {/* <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                step >= 2
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-gray-600 text-gray-400"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
            </div> */}
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
            {/* <div
              className={`transition-colors ${
                step >= 2 ? "text-emerald-400" : "text-gray-500"
              }`}
            >
              <div className="font-semibold">Complete Profile</div>
              <div className="text-sm">Add your details</div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pb-12">
        <RoleSelector onRoleSelect={handleRoleSelect} />
        {/* {step === 1 && <RoleSelector onRoleSelect={handleRoleSelect} />} */}
        {/* {step === 2 && (
          <ProfileForm
            onProfileSubmit={handleProfileSubmit}
            userRoles={userRoles}
          />
        )} */}
      </div>
    </div>
  );
};

export default OnboardingPage;
