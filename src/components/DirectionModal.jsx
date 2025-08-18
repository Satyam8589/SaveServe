// src/components/DirectionModal.jsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapWithRouting = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-800 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-6"></div>
        <p className="text-gray-300 text-lg font-semibold">Loading Map...</p>
      </div>
    </div>
  ),
});

const DirectionModal = ({ provider, recipient, onClose }) => {
  if (!provider || !recipient) return null;

  return (
    <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            Route from {provider.fullName} to {recipient.fullName}
          </h2>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <MapWithRouting provider={provider} recipient={recipient} />
        </div>
      </div>
    </div>
  );
};

export default DirectionModal;
