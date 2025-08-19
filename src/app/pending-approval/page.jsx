"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  Phone,
  FileText,
  Calendar,
  User,
  Shield,
  Sparkles,
} from "lucide-react";

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && user?.id) {
      console.log("User loaded, fetching profile for:", user.id);

      // Check if user is already approved in Clerk metadata
      const approvalStatus = user.publicMetadata?.approvalStatus;

      if (approvalStatus === "APPROVED") {
        const role = user.publicMetadata?.mainRole?.toLowerCase();
        if (role === "provider") {
          window.location.href = "/providerDashboard";
        } else if (role === "recipient") {
          window.location.href = "/recipientDashboard";
        } else {
          window.location.href = "/dashboard";
        }
        return;
      }

      fetchUserProfile();
    } else if (isLoaded && !user) {
      console.log("User not found, redirecting to sign-in");
      window.location.href = "/sign-in";
    }
  }, [isLoaded, user]);

  const fetchUserProfile = async () => {
    if (!user?.id) {
      setError("User not properly loaded");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching profile for user:", user.id);

      const response = await fetch(`/api/profile?userId=${user.id}`);
      console.log("API Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Profile data received:", data);
        if (data.profile) {
          setUserProfile(data.profile);
        } else {
          // Profile doesn't exist yet, redirect to profile creation
          console.log("No profile found, redirecting to profile page");
          window.location.href = "/profile";
        }
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);

        // If profile not found (404), redirect to profile creation
        if (response.status === 404) {
          console.log("Profile not found (404), redirecting to profile page");
          window.location.href = "/profile";
        } else {
          setError(
            `Failed to fetch profile data: ${
              errorData.message || "Unknown error"
            }`
          );
        }
      }
    } catch (err) {
      console.error("Network/Parse Error:", err);
      setError(`Error fetching profile data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "REJECTED":
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Clock className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "PENDING":
        return {
          title: "Your Request is Under Review",
          message:
            "Thank you for completing your profile! Our admin team is currently reviewing your information. You'll receive an email notification once your account has been approved.",
          color: "text-yellow-600",
        };
      case "APPROVED":
        return {
          title: "Account Approved!",
          message:
            "Congratulations! Your account has been approved. You can now access your dashboard and start using all features.",
          color: "text-green-600",
        };
      case "REJECTED":
        return {
          title: "Account Needs Attention",
          message:
            "Your account application needs some updates. Please review the feedback below and resubmit your profile.",
          color: "text-red-600",
        };
      default:
        return {
          title: "Status Unknown",
          message:
            "We're having trouble determining your account status. Please contact support.",
          color: "text-gray-600",
        };
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-4 text-white">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error Loading Profile</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchUserProfile}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const status = userProfile?.approvalStatus || "PENDING";
  const statusInfo = getStatusMessage(status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(139,92,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(251,146,60,0.1),transparent_50%)]" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full">
          {/* Enhanced Main Status Card */}
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-3xl border border-gray-600/50 shadow-2xl overflow-hidden">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-600/20 via-purple-600/20 to-orange-600/20 p-8 text-center relative">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                {/* Animated Status Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {getStatusIcon(status)}
                    {status === "PENDING" && (
                      <div className="absolute inset-0 rounded-full border-2 border-yellow-400/30 animate-ping"></div>
                    )}
                  </div>
                </div>

                {/* Enhanced Status Title */}
                <h1
                  className={`text-4xl font-bold mb-4 ${statusInfo.color} flex items-center justify-center gap-3`}
                >
                  <Sparkles className="w-8 h-8" />
                  {statusInfo.title}
                  <Sparkles className="w-8 h-8" />
                </h1>

                {/* Status Message */}
                <p className="text-gray-200 text-xl mb-6 leading-relaxed max-w-2xl mx-auto">
                  {statusInfo.message}
                </p>
              </div>
            </div>

            {/* Enhanced Profile Information */}
            <div className="p-8">
              {userProfile && (
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-8 mb-8 border border-gray-600/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <User className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-bold text-xl">
                      Your Profile Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <span className="text-emerald-400 font-medium text-sm">
                          Full Name
                        </span>
                        <p className="text-white text-lg font-semibold">
                          {userProfile.fullName}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <span className="text-emerald-400 font-medium text-sm">
                          Email Address
                        </span>
                        <p className="text-white text-lg">
                          {userProfile.email}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <span className="text-emerald-400 font-medium text-sm">
                          Phone Number
                        </span>
                        <p className="text-white text-lg">
                          {userProfile.phoneNumber || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <span className="text-emerald-400 font-medium text-sm">
                          Role
                        </span>
                        <p className="text-white text-lg font-semibold">
                          {userProfile.role}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <span className="text-emerald-400 font-medium text-sm">
                          Sub-role
                        </span>
                        <p className="text-white text-lg">
                          {userProfile.subrole}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <span className="text-emerald-400 font-medium text-sm">
                          Campus Location
                        </span>
                        <p className="text-white text-lg">
                          {userProfile.campusLocation || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {userProfile.submittedForApprovalAt && (
                    <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <div>
                        <span className="text-blue-400 font-medium text-sm">
                          Submitted for Approval
                        </span>
                        <p className="text-white">
                          {new Date(
                            userProfile.submittedForApprovalAt
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Rejection Reason (if rejected) */}
              {status === "REJECTED" && userProfile?.rejectionReason && (
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/40 rounded-2xl p-8 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-red-400 font-bold text-xl">
                      Feedback from Admin
                    </h3>
                  </div>
                  <div className="bg-red-950/50 rounded-lg p-6 border border-red-500/20">
                    <p className="text-red-100 text-lg leading-relaxed">
                      {userProfile.rejectionReason}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-red-300 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>
                      Please address the above feedback and resubmit your
                      profile
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                {status === "REJECTED" && (
                  <button
                    onClick={() => (window.location.href = "/profile")}
                    className="group bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-10 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <User className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Update Profile
                    </div>
                  </button>
                )}

                {status === "APPROVED" && (
                  <button
                    onClick={async () => {
                      try {
                        // Force refresh user session to get latest metadata
                        const refreshResponse = await fetch(
                          "/api/refresh-session",
                          {
                            method: "POST",
                          }
                        );

                        if (refreshResponse.ok) {
                          // Small delay to ensure any pending metadata updates are complete
                          await new Promise((resolve) =>
                            setTimeout(resolve, 500)
                          );
                        }

                        const role =
                          user?.publicMetadata?.mainRole?.toLowerCase();

                        if (role === "provider") {
                          window.location.href = "/providerDashboard";
                        } else if (role === "recipient") {
                          window.location.href = "/recipientDashboard";
                        } else {
                          window.location.href = "/dashboard";
                        }
                      } catch (error) {
                        console.error(
                          "Error during dashboard redirect:",
                          error
                        );
                        // Fallback to direct navigation
                        window.location.href = "/dashboard";
                      }
                    }}
                    className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-10 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Go to Dashboard
                    </div>
                  </button>
                )}

                <button
                  onClick={fetchUserProfile}
                  className="group bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-xl transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-gray-500/25 transform hover:scale-105 flex items-center gap-3 justify-center"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Refresh Status
                </button>
              </div>

              {/* Enhanced Contact Information */}
              <div className="mt-12 pt-8 border-t border-gradient-to-r from-transparent via-gray-600 to-transparent">
                <div className="text-center mb-6">
                  <h4 className="text-white font-semibold text-lg mb-2">
                    Need Assistance?
                  </h4>
                  <p className="text-gray-300">
                    Our support team is here to help you through the approval
                    process
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                  <a
                    href="mailto:support@smartfoodredistribution.com"
                    className="group bg-gray-800/50 hover:bg-emerald-600/20 border border-gray-600 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300 flex items-center gap-3"
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                      <Mail className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-emerald-400 font-medium text-sm">
                        Email Support
                      </div>
                      <div className="text-gray-300 text-xs">
                        Get help via email
                      </div>
                    </div>
                  </a>
                  <a
                    href="tel:+1234567890"
                    className="group bg-gray-800/50 hover:bg-purple-600/20 border border-gray-600 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-300 flex items-center gap-3"
                  >
                    <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                      <Phone className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-purple-400 font-medium text-sm">
                        Phone Support
                      </div>
                      <div className="text-gray-300 text-xs">
                        Call us directly
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
