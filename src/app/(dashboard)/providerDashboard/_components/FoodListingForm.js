// File: /components/FoodListingForm.js
'use client';

import { useState } from 'react';
import { useCreateListing } from '@/hooks/useListings';

const FRESHNESS_OPTIONS = [
  'Fresh',
  'Safe to Eat for 2 hours',
  'Safe to Eat for 4 hours',
  'Safe to Eat for 6 hours',
  'Safe to Eat for 12 hours'
];

export default function FoodListingForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    freshnessStatus: 'Fresh',
    availabilityWindow: {
      startTime: '',
      endTime: ''
    },
    location: '',
    expiryTime: '',
    providerId: 'temp-provider-id', // This should come from auth context
    providerName: 'Sample Provider' // This should come from auth context
  });

  const createListingMutation = useCreateListing();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('availabilityWindow.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        availabilityWindow: {
          ...prev.availabilityWindow,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createListingMutation.mutateAsync({
        ...formData,
        quantity: parseInt(formData.quantity)
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        quantity: '',
        freshnessStatus: 'Fresh',
        availabilityWindow: {
          startTime: '',
          endTime: ''
        },
        location: '',
        expiryTime: '',
        providerId: 'temp-provider-id',
        providerName: 'Sample Provider'
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  const formatDateTimeLocal = (date) => {
    const now = new Date(date || Date.now());
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 flex items-center">
          <span className="bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text text-transparent mr-3">
            🍽️
          </span>
          Create Food Listing
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-orange-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
              placeholder="e.g., Fresh Sandwiches from Canteen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
              placeholder="e.g., 10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-400 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
            placeholder="Additional details about the food..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Freshness Status *
            </label>
            <select
              name="freshnessStatus"
              value={formData.freshnessStatus}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              {FRESHNESS_OPTIONS.map(option => (
                <option key={option} value={option} className="bg-gray-700">{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 transition-colors"
              placeholder="e.g., Main Campus Canteen"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Available From *
            </label>
            <input
              type="datetime-local"
              name="availabilityWindow.startTime"
              value={formData.availabilityWindow.startTime}
              onChange={handleInputChange}
              required
              min={formatDateTimeLocal()}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Available Until *
            </label>
            <input
              type="datetime-local"
              name="availabilityWindow.endTime"
              value={formData.availabilityWindow.endTime}
              onChange={handleInputChange}
              required
              min={formData.availabilityWindow.startTime}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Expiry Time *
            </label>
            <input
              type="datetime-local"
              name="expiryTime"
              value={formData.expiryTime}
              onChange={handleInputChange}
              required
              min={formatDateTimeLocal()}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createListingMutation.isPending}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-orange-500 text-white rounded-lg hover:from-emerald-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {createListingMutation.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : 'Create Listing'}
          </button>
        </div>

        {createListingMutation.isError && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {createListingMutation.error?.message || 'Failed to create listing'}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
