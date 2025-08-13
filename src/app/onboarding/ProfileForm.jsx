import React, { useState } from 'react';
import { User, MapPin, Bell, Utensils, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const ProfileForm = ({ onProfileSubmit, userRoles = {} }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    hostel: "",
    roomNumber: "",
    department: "",
    year: "",
    campusLocation: "",
    latitude: "",
    longitude: "",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationRadius: 1000,
    dietaryRestrictions: "",
    allergies: "",
    foodPreferences: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = "Longitude must be between -180 and 180";
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
      await onProfileSubmit(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
      // You could add error handling UI here
    } finally {
      setLoading(false);
    }
  };

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
        {/* Personal Information */}
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
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-600 focus:border-emerald-500'
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
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-600 focus:border-emerald-500'
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
                Phone Number
              </label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                           focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                  errors.phoneNumber 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-600 focus:border-emerald-500'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phoneNumber && (
                <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Department</label>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="Computer Science, Biology, etc."
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <MapPin className="w-6 h-6 text-orange-400" />
            Location Details
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 font-medium mb-2">Hostel</label>
              <input
                name="hostel"
                value={formData.hostel}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                placeholder="Hostel name or number"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Room Number</label>
              <input
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                placeholder="Room 123"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Campus Location</label>
              <input
                name="campusLocation"
                value={formData.campusLocation}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                placeholder="Main Campus, North Wing, etc."
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Academic Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="graduate">Graduate</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-gray-300 font-medium mb-2">Latitude</label>
              <input
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                           focus:ring-2 focus:ring-orange-500/20 transition-all ${
                  errors.latitude 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-600 focus:border-orange-500'
                }`}
                placeholder="12.9716"
              />
              {errors.latitude && (
                <p className="text-red-400 text-sm mt-1">{errors.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Longitude</label>
              <input
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                className={`w-full bg-gray-900/50 border rounded-lg px-4 py-3 text-white 
                           focus:ring-2 focus:ring-orange-500/20 transition-all ${
                  errors.longitude 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-600 focus:border-orange-500'
                }`}
                placeholder="77.5946"
              />
              {errors.longitude && (
                <p className="text-red-400 text-sm mt-1">{errors.longitude}</p>
              )}
            </div>
          </div>
        </div>

        {/* Food Preferences */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <Utensils className="w-6 h-6 text-amber-400" />
            Food Preferences
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 font-medium mb-2">Dietary Restrictions</label>
              <input
                name="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                placeholder="Vegetarian, Vegan, Halal, Kosher (comma separated)"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Allergies
              </label>
              <input
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                placeholder="Nuts, Dairy, Gluten, Shellfish (comma separated)"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">Food Preferences</label>
              <input
                name="foodPreferences"
                value={formData.foodPreferences}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white 
                           focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                placeholder="Italian, Spicy, Sweet, Indian (comma separated)"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-400" />
            Notification Preferences
          </h2>
          
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { key: "emailNotifications", label: "Email Notifications", icon: Mail },
                { key: "pushNotifications", label: "Push Notifications", icon: Bell },
                { key: "smsNotifications", label: "SMS Notifications", icon: Phone },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors cursor-pointer">
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
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>100m</span>
                  <span className="text-blue-400 font-semibold">{formData.notificationRadius}m</span>
                  <span>5km</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
        }
      `}</style>
    </div>
  );
};

export default ProfileForm;