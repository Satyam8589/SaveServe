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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Food Listing</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Fresh Sandwiches from Canteen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional details about the food..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Freshness Status *
            </label>
            <select
              name="freshnessStatus"
              value={formData.freshnessStatus}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FRESHNESS_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Main Campus Canteen"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available From *
            </label>
            <input
              type="datetime-local"
              name="availabilityWindow.startTime"
              value={formData.availabilityWindow.startTime}
              onChange={handleInputChange}
              required
              min={formatDateTimeLocal()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Until *
            </label>
            <input
              type="datetime-local"
              name="availabilityWindow.endTime"
              value={formData.availabilityWindow.endTime}
              onChange={handleInputChange}
              required
              min={formData.availabilityWindow.startTime}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Time *
            </label>
            <input
              type="datetime-local"
              name="expiryTime"
              value={formData.expiryTime}
              onChange={handleInputChange}
              required
              min={formatDateTimeLocal()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={createListingMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
          </button>
        </div>

        {createListingMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">
              {createListingMutation.error?.message || 'Failed to create listing'}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}