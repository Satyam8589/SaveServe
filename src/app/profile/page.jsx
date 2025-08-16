"use client";

import React, { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Icon Components
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);

const EmailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
      clipRule="evenodd"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
      clipRule="evenodd"
    />
  </svg>
);

const RoleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm1 6a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zm3 0a1 1 0 011-1h5a1 1 0 110 2H9a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
      clipRule="evenodd"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
      clipRule="evenodd"
    />
  </svg>
);

// UserProfileForm component with dark theme
const UserProfileForm = ({
  userId,
  userEmail,
  userName,
  userMainRole,
  userSubrole,
  onProfileSaved,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    userId: userId || "",
    email: userEmail || "",
    fullName: userName || "",
    role: userMainRole || "",
    subrole: userSubrole || "",
    phoneNumber: "",
    campusLocation: "",
    organizationName: "",
    description: "",
    isProfileComplete: false,
    isActive: true,
  });

  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  // Fetch existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setStatus({ loading: true, message: "Loading profile...", type: "info" });

      try {
        const response = await fetch(
          `/api/profile?userId=${encodeURIComponent(userId)}`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const mergedData = {
              ...formData,
              ...result.data,
              userId: userId || result.data.userId,
              email: userEmail || result.data.email,
              fullName: userName || result.data.fullName,
              role: userMainRole || result.data.role,
              subrole: userSubrole || result.data.subrole,
            };
            setFormData(mergedData);
          }
        }
        setStatus({ loading: false, message: "", type: "" });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setStatus({
          loading: false,
          message: "Could not load profile data.",
          type: "warning",
        });
      }
    };

    fetchProfile();
  }, [userId, userEmail, userName, userMainRole, userSubrole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const requiredFields = {
      userId: "User ID",
      fullName: "Full Name",
      email: "Email",
      role: "Role",
      subrole: "Subrole",
      phoneNumber: "Phone Number",
      campusLocation: "Campus Location",
    };

    const missingFields = Object.keys(requiredFields).filter((field) => {
      const value = formData[field];
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map((field) => requiredFields[field]);
      setStatus({
        loading: false,
        message: `Please fill in: ${fieldNames.join(", ")}`,
        type: "error",
      });
      return;
    }

    if (
      formData.subrole === "NGO" &&
      (!formData.organizationName || formData.organizationName.trim() === "")
    ) {
      setStatus({
        loading: false,
        message: "Organization name is required for NGO subrole.",
        type: "error",
      });
      return;
    }

    setStatus({
      loading: true,
      message: "Saving your profile...",
      type: "info",
    });

    try {
      const cleanedData = {
        userId: formData.userId.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role.trim(),
        subrole: formData.subrole.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        campusLocation: formData.campusLocation.trim(),
        organizationName: formData.organizationName
          ? formData.organizationName.trim()
          : "",
        description: formData.description ? formData.description.trim() : "",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      };

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      setStatus({
        loading: false,
        message: data.message || "Profile saved successfully!",
        type: "success",
      });

      if (onProfileSaved) {
        onProfileSaved(data.data);
      }

      setTimeout(() => {
        setStatus({ loading: false, message: "", type: "" });
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Profile save error:", error);
      setStatus({
        loading: false,
        message: error.message || "Failed to save profile. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-gray-800/95 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 p-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <UserIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Edit Profile</h2>
            <p className="text-white/80 text-sm">Update your information</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input (Read-only) */}
            <div className="group">
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-gray-300 mb-1"
              >
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon />
                </div>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName || ""}
                  readOnly
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-gray-300 cursor-not-allowed transition-all duration-200 text-sm focus:ring-0"
                  placeholder="Loading name..."
                />
              </div>
            </div>

            {/* Phone Number and Location Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label
                  htmlFor="phoneNumber"
                  className="block text-xs font-semibold text-gray-300 mb-1"
                >
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <PhoneIcon />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleChange}
                    required
                    maxLength={20}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-500 text-sm"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="group">
                <label
                  htmlFor="campusLocation"
                  className="block text-xs font-semibold text-gray-300 mb-1"
                >
                  Campus Location *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LocationIcon />
                  </div>
                  <input
                    type="text"
                    name="campusLocation"
                    id="campusLocation"
                    value={formData.campusLocation || ""}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-500 text-sm"
                    placeholder="e.g., North Campus, Building A"
                  />
                </div>
              </div>
            </div>

            {/* Conditional Field for NGO */}
            {formData.subrole === "NGO" && (
              <div className="group animate-fade-in">
                <label
                  htmlFor="organizationName"
                  className="block text-xs font-semibold text-gray-300 mb-1"
                >
                  Organization Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <BuildingIcon />
                  </div>
                  <input
                    type="text"
                    name="organizationName"
                    id="organizationName"
                    value={formData.organizationName || ""}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-500 text-sm"
                    placeholder="e.g., Helping Hands Foundation"
                  />
                </div>
              </div>
            )}

            {/* Description Field */}
            <div className="group">
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-gray-300 mb-1"
              >
                Tell us about yourself
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  id="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border-2 border-gray-600/50 rounded-lg bg-gray-700/50 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-gray-500 resize-none text-sm"
                  placeholder="Share your interests, specialties, or anything you'd like others to know about you..."
                />
                <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                  {(formData.description || "").length}/500
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={status.loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 hover:from-emerald-700 hover:via-orange-700 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group text-sm transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {status.loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      <span>Save Profile</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {status.message && (
            <div
              className={`mt-4 p-3 rounded-lg text-center font-medium text-sm transition-all duration-300 animate-fade-in ${
                status.type === "success"
                  ? "bg-green-900/50 text-green-300 border border-green-700/50"
                  : status.type === "warning"
                  ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50"
                  : status.type === "error"
                  ? "bg-red-900/50 text-red-300 border border-red-700/50"
                  : "bg-blue-900/50 text-blue-300 border border-blue-700/50"
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState(null);

  // Get user data from Clerk with proper fallbacks
  const userId = user?.id;
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userName = user?.fullName;
  const userMainRole =
    user?.publicMetadata?.mainRole || user?.unsafeMetadata?.mainRole;
  const userSubrole =
    user?.publicMetadata?.subRole || user?.unsafeMetadata?.subRole;

  const fetchProfile = async () => {
    if (!userId) {
      console.log("No userId available for profile fetch");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching profile for userId:", userId);
      const response = await fetch(
        `/api/profile?userId=${encodeURIComponent(userId)}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Profile fetch successful:", result);

        if (result.success && result.data) {
          setProfileData(result.data);
          setShowModal(false);
        } else {
          console.log("No profile data in successful response");
          setProfileData(null);
          setShowModal(true);
        }
      } else if (response.status === 404) {
        console.log(
          "Profile not found (404) - showing modal to create profile"
        );
        setProfileData(null);
        setShowModal(true);
      } else {
        const errorData = await response.json();
        console.error("Profile fetch failed:", response.status, errorData);
        setError(
          `Failed to load profile: ${errorData.message || response.statusText}`
        );
        setShowModal(true);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      setError(`Network error: ${error.message}`);
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for both Clerk to load AND user data to be available
  useEffect(() => {
    console.log(
      "ProfilePage useEffect - isLoaded:",
      isLoaded,
      "isSignedIn:",
      isSignedIn,
      "userId:",
      userId
    );

    if (isLoaded && isSignedIn && userId) {
      fetchProfile();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    } else if (isLoaded && isSignedIn && !userId) {
      console.warn("User is signed in but no userId available");
      setIsLoading(false);
      setError("User ID not available");
    }
  }, [isLoaded, isSignedIn, userId]);

  // Fixed handleProfileSaved function
  const handleProfileSaved = async (savedProfileData) => {
    console.log("Profile saved callback received:", savedProfileData);

    try {
      // Update Clerk metadata to mark profile as complete
      const response = await fetch("/api/update-user-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hasCompleteProfile: true,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Failed to update metadata:", result);
        throw new Error(result.error || "Failed to update profile completion status");
      }

      console.log("Metadata updated successfully:", result);

      // Update local state
      if (savedProfileData) {
        setProfileData(savedProfileData);
      } else {
        // Refetch profile if no data provided
        await fetchProfile();
      }

      setShowModal(false);
      setShowEditForm(false);

      // Small delay to ensure metadata propagation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to appropriate dashboard based on role
      const userMainRole =
        user?.publicMetadata?.mainRole || user?.unsafeMetadata?.mainRole;
      const role = userMainRole?.toLowerCase();

      if (role === "provider") {
        router.push("/providerDashboard");
      } else if (role === "recipient") {
        router.push("/recipientDashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error updating profile completion:", error);
      // Still allow the profile to be saved locally even if metadata update fails
      if (savedProfileData) {
        setProfileData(savedProfileData);
      }
      setShowModal(false);
      setShowEditForm(false);
    }
  };

  const handleRefresh = () => {
    fetchProfile();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getRoleBadgeColor = (role) => {
    return role === "PROVIDER"
      ? "from-emerald-500 to-green-500"
      : "from-blue-500 to-indigo-500";
  };

  const getSubroleBadgeColor = (subrole) => {
    const colors = {
      STUDENT: "from-purple-500 to-pink-500",
      STAFF: "from-orange-500 to-red-500",
      CANTEEN: "from-red-500 to-pink-500",
      HOSTEL: "from-yellow-500 to-orange-500",
      EVENTORGANIZER: "from-indigo-500 to-purple-500",
      NGO: "from-teal-500 to-green-500",
    };
    return colors[subrole] || "from-gray-500 to-gray-600";
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading your profile...</p>
          {userId && (
            <p className="text-sm text-gray-500 mt-2">
              User ID: {userId.substring(0, 8)}...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md animate-scale-in">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-300">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md animate-scale-in">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors mx-auto transform hover:scale-105"
          >
            <RefreshIcon />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-300 mt-2 text-lg">
                Manage your information and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 border border-gray-700/50 transform hover:scale-105"
              >
                <RefreshIcon />
                <span>Refresh</span>
              </button>
              {profileData && (
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 hover:from-emerald-700 hover:via-orange-700 hover:to-amber-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:-translate-y-1"
                >
                  <EditIcon />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profileData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Card */}
            <div className="lg:col-span-2 animate-fade-in-up">
              <div className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
                {/* Profile Header */}
                <div className="relative bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 p-8 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10 animate-scale-in">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <UserIcon />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {profileData.fullName}
                    </h2>
                    <p className="text-white/80 text-lg mb-4">
                      {profileData.email}
                    </p>
                    <div className="flex justify-center space-x-3 mt-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getRoleBadgeColor(
                          profileData.role
                        )} text-white`}
                      >
                        {profileData.role}
                      </span>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getSubroleBadgeColor(
                          profileData.subrole
                        )} text-white`}
                      >
                        {profileData.subrole}
                      </span>
                    </div>
                    {profileData.isProfileComplete && (
                      <div className="mt-3 animate-bounce-in">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                          ✓ Profile Complete
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        icon: PhoneIcon,
                        label: "Phone Number",
                        value: profileData.phoneNumber,
                        color: "blue",
                      },
                      {
                        icon: LocationIcon,
                        label: "Campus Location",
                        value: profileData.campusLocation,
                        color: "purple",
                      },
                      {
                        icon: RoleIcon,
                        label: "Main Role",
                        value: profileData.role,
                        color: "green",
                      },
                      {
                        icon: RoleIcon,
                        label: "Subrole",
                        value: profileData.subrole,
                        color: "indigo",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700/70 transition-all duration-200 border border-gray-600/30 transform hover:scale-105 hover:-translate-y-1 animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 bg-${item.color}-500/20 rounded-lg flex items-center justify-center`}
                        >
                          <item.icon />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-300">
                            {item.label}
                          </h3>
                          <p className="text-lg text-white mt-1">
                            {item.value || "Not provided"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {profileData.organizationName && (
                    <div className="flex items-start space-x-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700/70 transition-all duration-200 border border-gray-600/30 transform hover:scale-105 hover:-translate-y-1 animate-fade-in-up">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <BuildingIcon />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300">
                          Organization
                        </h3>
                        <p className="text-lg text-white mt-1">
                          {profileData.organizationName}
                        </p>
                      </div>
                    </div>
                  )}

                  {profileData.description && (
                    <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-orange-500/10 to-amber-500/10 rounded-xl border border-emerald-500/20 animate-fade-in-up">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        About Me
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {profileData.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-right">
                <h3 className="text-xl font-bold text-white mb-4">
                  Account Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Profile Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        profileData.isProfileComplete
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      }`}
                    >
                      {profileData.isProfileComplete
                        ? "Complete"
                        : "Incomplete"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Account Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        profileData.isActive
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {profileData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div
                className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-right"
                style={{ animationDelay: "200ms" }}
              >
                <h3 className="text-xl font-bold text-white mb-4">Activity</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Profile Created",
                      date: profileData.createdAt,
                      color: "blue",
                    },
                    {
                      label: "Last Updated",
                      date: profileData.updatedAt,
                      color: "green",
                    },
                    {
                      label: "Last Login",
                      date: profileData.lastLoginAt,
                      color: "purple",
                    },
                  ]
                    .filter((item) => item.date)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div
                          className={`flex-shrink-0 w-8 h-8 bg-${item.color}-500/20 rounded-full flex items-center justify-center`}
                        >
                          <CalendarIcon />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {item.label}
                          </p>
                          <p className="text-sm text-gray-300">
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div
                className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-right"
                style={{ animationDelay: "400ms" }}
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      icon: EditIcon,
                      label: "Edit Profile",
                      onClick: () => setShowEditForm(true),
                    },
                    {
                      icon: () => (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      ),
                      label: "Privacy Settings",
                      onClick: () => {},
                    },
                    {
                      icon: RefreshIcon,
                      label: "Refresh Data",
                      onClick: handleRefresh,
                    },
                    {
                      icon: () => (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ),
                      label: "Help & Support",
                      onClick: () => router.push("/profile/help-support"),
                    },
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-xl transition-all duration-200 flex items-center space-x-3 border border-gray-600/30 hover:border-gray-600/50 transform hover:scale-105 hover:-translate-y-1 animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <action.icon />
                      <span className="font-medium text-gray-300">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fun Stats */}
              <div
                className="bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 animate-fade-in-right"
                style={{ animationDelay: "600ms" }}
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Your Impact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { number: "42", label: "Meals Shared", emoji: "🍽️" },
                    { number: "18", label: "Lives Helped", emoji: "❤️" },
                    { number: "8.5kg", label: "Waste Saved", emoji: "♻️" },
                    { number: "156", label: "Green Points", emoji: "⭐" },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="text-center p-3 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 rounded-xl border border-emerald-500/20 transform hover:scale-105 transition-all duration-200 animate-bounce-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="text-2xl mb-1">{stat.emoji}</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                        {stat.number}
                      </div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="max-w-md mx-auto bg-gray-800/80 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
              <p className="text-gray-300 mb-6">
                Please complete your profile to get started with all the
                features.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-orange-600 to-amber-600 hover:from-emerald-700 hover:via-orange-700 hover:to-amber-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:-translate-y-1"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Form Modal */}
      {(showModal || showEditForm) && user && (
        <UserProfileForm
          userId={userId}
          userEmail={userEmail}
          userName={userName}
          userMainRole={userMainRole}
          userSubrole={userSubrole}
          onProfileSaved={handleProfileSaved}
          onClose={() => {
            setShowModal(false);
            setShowEditForm(false);
          }}
        />
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-right {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes bounce-in {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.6s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;