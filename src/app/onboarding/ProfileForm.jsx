import React, { useState } from "react";
import {
  User,
  MapPin,
  Bell,
  Phone,
  Mail,
  Building,
  CheckCircle,
  AlertCircle,
  Users,
  Utensils,
} from "lucide-react";

const ProfileForm = ({ onProfileSubmit, userRoles = {} }) => {
  const [formData, setFormData] = useState({
    // Common fields
    firstName: "",
    lastName: "",
    phoneNumber: "",
    profilePicture: "",

    // Location
    address: "",
    latitude: "",
    longitude: "",

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationRadius: 1000,

    // Provider specific
    organizationName: "",
    licenseNumber: "",
    avgDailyCapacity: "",

    // Recipient specific - Student/Staff
    campusId: "",
    department: "",
    yearOfStudy: "",
    hostel: "",

    // Recipient specific - NGO
    ngoName: "",
    registrationNumber: "",
    maxPickupCapacity: "",

    // Basic preferences
    dietaryRestrictions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get user type from userRoles
  const isProvider = userRoles.mainRole === "PROVIDER";
  const isNGO = userRoles.subRole === "NGO";
  const isStudent = userRoles.subRole === "STUDENT";
  const isStaff = userRoles.subRole === "STAFF";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    // Provider specific validations
    if (isProvider) {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = "Organization name is required";
      }
    }

    // Student/Staff specific validations
    if (isStudent || isStaff) {
      if (!formData.campusId.trim()) {
        newErrors.campusId = "Campus ID is required";
      }
      if (!formData.department.trim()) {
        newErrors.department = "Department is required";
      }
    }

    // NGO specific validations
    if (isNGO) {
      if (!formData.ngoName.trim()) {
        newErrors.ngoName = "NGO name is required";
      }
      if (!formData.registrationNumber.trim()) {
        newErrors.registrationNumber = "Registration number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        ...formData,
        userType: isProvider ? "PROVIDER" : "RECIPIENT",
        subType: isNGO ? "NGO" : isStudent ? "STUDENT" : "STAFF",
      };

      await onProfileSubmit(profileData);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCommonFields = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <User className="w-6 h-6 text-emerald-400" />
        Personal Information
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                         errors.firstName
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-emerald-500"
                       }`}
            placeholder="Enter your first name"
            required
          />
          {errors.firstName && (
            <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                         errors.lastName
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-emerald-500"
                       }`}
            placeholder="Enter your last name"
            required
          />
          {errors.lastName && (
            <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                         errors.phoneNumber
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-emerald-500"
                       }`}
            placeholder="+91 98765 43210"
            required
          />
          {errors.phoneNumber && (
            <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Profile Picture URL
          </label>
          <input
            name="profilePicture"
            value={formData.profilePicture}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder="https://example.com/profile.jpg"
          />
        </div>
      </div>
    </div>
  );

  const renderLocationFields = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <MapPin className="w-6 h-6 text-orange-400" />
        Location Details
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-gray-300 font-medium mb-2">
            Address
          </label>
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            placeholder="Full address"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Latitude (Optional)
          </label>
          <input
            name="latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            placeholder="12.9716"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Longitude (Optional)
          </label>
          <input
            name="longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            placeholder="77.5946"
          />
        </div>
      </div>
    </div>
  );

  const renderProviderFields = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <Building className="w-6 h-6 text-blue-400" />
        Provider Details
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Organization Name <span className="text-red-400">*</span>
          </label>
          <input
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-blue-500/20 transition-all ${
                         errors.organizationName
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-blue-500"
                       }`}
            placeholder="Organization/Restaurant name"
            required
          />
          {errors.organizationName && (
            <p className="text-red-400 text-sm mt-1">
              {errors.organizationName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            License Number
          </label>
          <input
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Food license number (if applicable)"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Average Daily Capacity (portions)
          </label>
          <input
            name="avgDailyCapacity"
            type="number"
            value={formData.avgDailyCapacity}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="50"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Dietary Information
          </label>
          <input
            name="dietaryRestrictions"
            value={formData.dietaryRestrictions}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="e.g., Vegetarian, Vegan, Halal"
          />
        </div>
      </div>
    </div>
  );

  const renderStudentStaffFields = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <Utensils className="w-6 h-6 text-purple-400" />
        {isStudent ? "Student" : "Staff"} Details
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Campus ID <span className="text-red-400">*</span>
          </label>
          <input
            name="campusId"
            value={formData.campusId}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-purple-500/20 transition-all ${
                         errors.campusId
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-purple-500"
                       }`}
            placeholder="Your campus ID"
            required
          />
          {errors.campusId && (
            <p className="text-red-400 text-sm mt-1">{errors.campusId}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Department <span className="text-red-400">*</span>
          </label>
          <input
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-purple-500/20 transition-all ${
                         errors.department
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-purple-500"
                       }`}
            placeholder="Department name"
            required
          />
          {errors.department && (
            <p className="text-red-400 text-sm mt-1">{errors.department}</p>
          )}
        </div>

        {isStudent && (
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              Year of Study
            </label>
            <select
              name="yearOfStudy"
              value={formData.yearOfStudy}
              onChange={handleChange}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                         focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Hostel/Building
          </label>
          <input
            name="hostel"
            value={formData.hostel}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="Hostel or building name"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Dietary Preferences
          </label>
          <input
            name="dietaryRestrictions"
            value={formData.dietaryRestrictions}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="e.g., Vegetarian, No dairy, etc."
          />
        </div>
      </div>
    </div>
  );

  const renderNGOFields = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <Users className="w-6 h-6 text-green-400" />
        NGO Details
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            NGO Name <span className="text-red-400">*</span>
          </label>
          <input
            name="ngoName"
            value={formData.ngoName}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-green-500/20 transition-all ${
                         errors.ngoName
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-green-500"
                       }`}
            placeholder="NGO name"
            required
          />
          {errors.ngoName && (
            <p className="text-red-400 text-sm mt-1">{errors.ngoName}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Registration Number <span className="text-red-400">*</span>
          </label>
          <input
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleChange}
            className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                       focus:ring-2 focus:ring-green-500/20 transition-all ${
                         errors.registrationNumber
                           ? "border-red-500 focus:border-red-500"
                           : "border-gray-600 focus:border-green-500"
                       }`}
            placeholder="Registration number"
            required
          />
          {errors.registrationNumber && (
            <p className="text-red-400 text-sm mt-1">
              {errors.registrationNumber}
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Max Pickup Capacity (kg)
          </label>
          <input
            name="maxPickupCapacity"
            type="number"
            value={formData.maxPickupCapacity}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            placeholder="50"
          />
        </div>
      </div>
    </div>
  );

  const renderEmergencyContact = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <Phone className="w-6 h-6 text-red-400" />
        Emergency Contact
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Contact Name
          </label>
          <input
            name="emergencyContactName"
            value={formData.emergencyContactName}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            placeholder="Emergency contact name"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Contact Phone
          </label>
          <input
            name="emergencyContactPhone"
            value={formData.emergencyContactPhone}
            onChange={handleChange}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                       focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            placeholder="+91 98765 43210"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationFields = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
        <Bell className="w-6 h-6 text-blue-400" />
        Notification Preferences
      </h2>

      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              key: "emailNotifications",
              label: "Email Notifications",
              icon: Mail,
            },
            {
              key: "pushNotifications",
              label: "Push Notifications",
              icon: Bell,
            },
            {
              key: "smsNotifications",
              label: "SMS Notifications",
              icon: Phone,
            },
          ].map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                name={key}
                checked={formData[key]}
                onChange={handleChange}
                className="w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500/20"
              />
              <Icon className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">{label}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-gray-300 font-medium mb-2">
            Notification Radius (meters)
          </label>
          <div className="relative">
            <input
              type="range"
              name="notificationRadius"
              min="100"
              max="5000"
              step="100"
              value={formData.notificationRadius}
              onChange={handleChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  ((formData.notificationRadius - 100) / 4900) * 100
                }%, #374151 ${
                  ((formData.notificationRadius - 100) / 4900) * 100
                }%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>100m</span>
              <span className="text-blue-400 font-semibold">
                {formData.notificationRadius}m
              </span>
              <span>5km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full">
            <User className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
          Complete Your Profile
        </h1>
        <p className="text-gray-300 text-lg">
          Help us personalize your food-sharing experience
        </p>
        {userRoles.mainRole && userRoles.subRole && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 border border-emerald-600 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm">
              Role: {userRoles.mainRole} - {userRoles.subRole}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Common fields for all users */}
        {renderCommonFields()}
        {renderLocationFields()}

        {/* Role-specific fields */}
        {isProvider && renderProviderFields()}
        {(isStudent || isStaff) && renderStudentStaffFields()}
        {isNGO && renderNGOFields()}

        {/* Emergency contact and notifications for all users */}
        {renderEmergencyContact()}
        {renderNotificationFields()}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg rounded-xl 
                       hover:from-orange-600 hover:to-amber-600 transition-all duration-300 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 
                       hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Complete Registration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
