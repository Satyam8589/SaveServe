// components/UserProfileForm.js
"use client";

import React, { useState, useEffect } from 'react';

// SVG Icon Components (unchanged)
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>;
const RoleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm1 6a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zm3 0a1 1 0 011-1h5a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const DescriptionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" /></svg>;

const UserProfileForm = ({ userId, userEmail, userName, userMainRole, userSubrole, onProfileSaved }) => {
  // Initialize state with proper fallbacks - matching MongoDB schema exactly
  const [formData, setFormData] = useState({
    userId: userId || '',
    email: userEmail || '',
    fullName: userName || '',
    role: userMainRole || '',
    subrole: userSubrole || '',
    phoneNumber: '',
    campusLocation: '',
    organizationName: '',
    description: '',
    isProfileComplete: false,
    isActive: true,
  });

  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  // Fetch existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        console.log('No userId provided, skipping fetch');
        return;
      }

      setStatus({ loading: true, message: 'Loading profile...', type: 'info' });

      // Start with props data as base
      const initialData = {
        userId: userId || '',
        email: userEmail || '',
        fullName: userName || '',
        role: userMainRole || '',
        subrole: userSubrole || '',
        phoneNumber: '',
        campusLocation: '',
        organizationName: '',
        description: '',
        isProfileComplete: false,
        isActive: true,
      };

      try {
        console.log('Fetching profile for userId:', userId);
        const response = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Fetched profile data:', result.data);
          
          if (result.success && result.data) {
            // Merge existing data with props data, ensuring all schema fields are present
            const mergedData = {
              ...initialData,
              ...result.data,
              // Ensure critical fields from props are not overridden if they're newer/different
              userId: userId || result.data.userId,
              email: userEmail || result.data.email,
              fullName: userName || result.data.fullName,
              role: userMainRole || result.data.role,
              subrole: userSubrole || result.data.subrole,
              // Ensure boolean fields have proper values
              isProfileComplete: result.data.isProfileComplete || false,
              isActive: result.data.isActive !== undefined ? result.data.isActive : true,
            };
            setFormData(mergedData);
            setStatus({ loading: false, message: '', type: '' });
          } else {
            setFormData(initialData);
            setStatus({ loading: false, message: '', type: '' });
          }
        } else if (response.status === 404) {
          // Profile doesn't exist yet, use initial data
          setFormData(initialData);
          setStatus({ loading: false, message: '', type: '' });
        } else {
          throw new Error('Failed to load profile');
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setFormData(initialData);
        setStatus({ 
          loading: false, 
          message: 'Could not load your profile. You can still save your information.', 
          type: 'warning' 
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

    // Enhanced client-side validation - matching MongoDB schema requirements
    const requiredFields = {
      userId: 'User ID',
      fullName: 'Full Name',
      email: 'Email',
      role: 'Role',
      subrole: 'Subrole',
      phoneNumber: 'Phone Number',
      campusLocation: 'Campus Location'
    };

    const missingFields = Object.keys(requiredFields).filter(field => {
      const value = formData[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => requiredFields[field]);
      setStatus({ 
        loading: false, 
        message: `Please fill in the following required fields: ${fieldNames.join(', ')}`, 
        type: 'error' 
      });
      return;
    }

    // Special validation for NGO organization name (matching schema requirement)
    if (formData.subrole === 'NGO' && (!formData.organizationName || formData.organizationName.trim() === '')) {
      setStatus({ 
        loading: false, 
        message: 'Organization name is required for NGO subrole.', 
        type: 'error' 
      });
      return;
    }

    // Phone number validation - matching schema pattern
    const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setStatus({ 
        loading: false, 
        message: 'Please enter a valid phone number (numbers only, 10-16 digits).', 
        type: 'error' 
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus({ 
        loading: false, 
        message: 'Please enter a valid email address.', 
        type: 'error' 
      });
      return;
    }

    // Description length validation (matching schema maxlength)
    if (formData.description && formData.description.length > 500) {
      setStatus({ 
        loading: false, 
        message: 'Description cannot exceed 500 characters.', 
        type: 'error' 
      });
      return;
    }

    setStatus({ loading: true, message: 'Saving your profile...', type: 'info' });
    
    try {
      // Clean and prepare data exactly as expected by MongoDB schema
      const cleanedData = {
        userId: formData.userId.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role.trim(),
        subrole: formData.subrole.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        campusLocation: formData.campusLocation.trim(),
        organizationName: formData.organizationName ? formData.organizationName.trim() : '',
        description: formData.description ? formData.description.trim() : '',
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        // lastLoginAt will be set by the pre-save middleware
      };

      console.log('Submitting profile data:', cleanedData);

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Update local state with saved data
      if (data.data) {
        setFormData(prevData => ({
          ...prevData,
          ...data.data,
        }));
      }

      setStatus({ 
        loading: false, 
        message: data.message || 'Profile saved successfully!', 
        type: 'success' 
      });
      
      // Call the callback to refresh parent component
      if (onProfileSaved) {
        onProfileSaved(data.data);
      }

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setStatus({ loading: false, message: '', type: '' });
      }, 3000);

    } catch (error) {
      console.error('Profile save error:', error);
      setStatus({ 
        loading: false, 
        message: error.message || 'Failed to save profile. Please try again.', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <UserIcon />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Your Profile</h2>
          <p className="text-blue-100 text-xs">Keep your details up to date</p>
          {formData.isProfileComplete && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Profile Complete
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input (Read-only) */}
          <div className="group">
            <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
            <div className="relative transform transition-all duration-200 group-hover:scale-[1.01]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon /></div>
              <input 
                type="text" 
                name="fullName" 
                id="fullName" 
                value={formData.fullName || ''} 
                readOnly 
                className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed transition-all duration-200 text-sm" 
                placeholder="Loading name..."
              />
            </div>
          </div>

          {/* Email Input (Read-only) */}
          <div className="group">
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
            <div className="relative transform transition-all duration-200 group-hover:scale-[1.01]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><EmailIcon /></div>
              <input 
                type="email" 
                name="email" 
                id="email" 
                value={formData.email || ''} 
                readOnly 
                className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed transition-all duration-200 text-sm" 
                placeholder="Loading email..."
              />
            </div>
          </div>

          {/* Role and Subrole (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Main Role *</label>
                  <div className="relative transform transition-all duration-200 group-hover:scale-[1.01]">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><RoleIcon /></div>
                      <input 
                        type="text" 
                        value={formData.role || 'Role not set'} 
                        readOnly 
                        className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed transition-all duration-200 text-sm" 
                        placeholder="Loading role..."
                      />
                  </div>
              </div>
              <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Sub Role *</label>
                  <div className="relative transform transition-all duration-200 group-hover:scale-[1.01]">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><RoleIcon /></div>
                      <input 
                        type="text" 
                        value={formData.subrole || 'Subrole not set'} 
                        readOnly 
                        className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed transition-all duration-200 text-sm"
                        placeholder="Loading subrole..."
                      />
                  </div>
              </div>
          </div>
          
          {/* Conditional Field for NGO */}
          {formData.subrole === 'NGO' && (
            <div className="group animate-fade-in">
              <label htmlFor="organizationName" className="block text-xs font-semibold text-gray-700 mb-1">Organization Name *</label>
              <div className="relative transform transition-all duration-200 group-hover:scale-[1.01] group-focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BuildingIcon /></div>
                  <input 
                    type="text" 
                    name="organizationName" 
                    id="organizationName" 
                    value={formData.organizationName || ''} 
                    onChange={handleChange} 
                    required 
                    maxLength={100}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 text-gray-900 text-sm" 
                    placeholder="e.g., Helping Hands Foundation" 
                  />
              </div>
            </div>
          )}

          {/* Phone Number and Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label htmlFor="phoneNumber" className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
              <div className="relative transform transition-all duration-200 group-hover:scale-[1.01] group-focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><PhoneIcon /></div>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    id="phoneNumber" 
                    value={formData.phoneNumber || ''} 
                    onChange={handleChange} 
                    required 
                    maxLength={20}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 text-gray-900 text-sm" 
                    placeholder="+1234567890 or 1234567890" 
                  />
              </div>
            </div>
            <div className="group">
              <label htmlFor="campusLocation" className="block text-xs font-semibold text-gray-700 mb-1">Campus Location *</label>
              <div className="relative transform transition-all duration-200 group-hover:scale-[1.01] group-focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LocationIcon /></div>
                  <input 
                    type="text" 
                    name="campusLocation" 
                    id="campusLocation" 
                    value={formData.campusLocation || ''} 
                    onChange={handleChange} 
                    required 
                    maxLength={100}
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 text-gray-900 text-sm" 
                    placeholder="e.g., North Campus, Building A" 
                  />
              </div>
            </div>
          </div>

          {/* Description Field */}
          <div className="group">
            <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-1">Tell us about yourself</label>
            <div className="relative transform transition-all duration-200 group-hover:scale-[1.01] group-focus-within:scale-[1.02]">
              <div className="absolute top-2.5 left-0 pl-3 flex items-start pointer-events-none"><DescriptionIcon /></div>
              <textarea
                name="description"
                id="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 resize-none text-gray-900 text-sm"
                placeholder="Share your interests, specialties, or anything you'd like others to know about you..."
              />
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {(formData.description || '').length}/500
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={status.loading} 
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group text-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {status.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Save Profile</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
        
        {status.message && (
          <div className={`mt-4 p-3 rounded-lg text-center font-medium text-sm transition-all duration-300 ${
            status.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : status.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : status.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileForm;