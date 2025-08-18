// pages/map.js (or app/map/page.js for App Router)
'use client'; // Only needed if using App Router

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

/**
 * Map Page - Food Surplus Distribution Platform with Leaflet
 * 
 * This page demonstrates how to integrate the MapWithRouting component into your Next.js application.
 * Features:
 * - Dark themed layout matching the food platform design
 * - Dynamic import to handle Leaflet's dependency on window object
 * - Responsive design with loading states
 * - Instructions and feature highlights
 */

// Dynamic import for MapWithRouting component (SSR disabled)
const MapWithRouting = dynamic(
  () => import('@/components/MapComponent'), 
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-6"></div>
          <div className="space-y-2">
            <p className="text-gray-300 text-lg font-semibold">Loading Interactive Map</p>
            <p className="text-gray-400 text-sm">Initializing OpenStreetMap & Routing...</p>
          </div>
        </div>
      </div>
    )
  }
);

const MapPage = () => {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Page Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                <span className="text-4xl">🗺️</span>
                <span>Food Distribution Map</span>
              </h1>
              <p className="text-gray-400 mt-2">
                Interactive map with routing • Connect providers & recipients • Powered by OpenStreetMap
              </p>
            </div>
            
            {/* Navigation/Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                <span>➕</span>
                <span>Add Location</span>
              </button>
              <button 
                onClick={() => setShowInstructions(!showInstructions)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <span>ℹ️</span>
                <span>{showInstructions ? 'Hide' : 'Show'} Help</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Feature Overview */}
        <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🍲</div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">Food Providers</h3>
              <p className="text-gray-400 text-sm">
                Canteens, hostels, and event organizers
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Recipients</h3>
              <p className="text-gray-400 text-sm">
                Students, staff, and NGOs seeking donations
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🚗</div>
              <h3 className="text-lg font-semibold text-blue-500 mb-2">Smart Routing</h3>
              <p className="text-gray-400 text-sm">
                Automatic routes between providers & recipients
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="text-lg font-semibold text-amber-400 mb-2">OpenStreetMap</h3>
              <p className="text-gray-400 text-sm">
                Free, community-driven mapping platform
              </p>
            </div>
          </div>
        </div>

        {/* Instructions Panel - Collapsible */}
        {showInstructions && (
          <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <span>📋</span>
                <span>How to Use the Interactive Map</span>
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 text-gray-300">
              <div>
                <h4 className="font-semibold text-emerald-400 mb-3 flex items-center space-x-2">
                  <span>🔍</span>
                  <span>Exploring</span>
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400">•</span>
                    <span>Click markers to view detailed information</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400">•</span>
                    <span>🍲 Green markers = Food providers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400">•</span>
                    <span>👤 Blue markers = Food recipients</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400">•</span>
                    <span>Use mouse wheel to zoom in/out</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-400 mb-3 flex items-center space-x-2">
                  <span>🚗</span>
                  <span>Routing Features</span>
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400">•</span>
                    <span>Blue dashed line shows optimal route</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400">•</span>
                    <span>Routes connect nearest provider-recipient pairs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400">•</span>
                    <span>Real-time route calculation via OpenStreetMap</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400">•</span>
                    <span>Routes update automatically with new locations</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-amber-400 mb-3 flex items-center space-x-2">
                  <span>🤝</span>
                  <span>Connecting</span>
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-400">•</span>
                    <span>View complete user profiles in popups</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-400">•</span>
                    <span>See exact coordinates and location details</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-400">•</span>
                    <span>Identify role types (canteen, student, NGO, etc.)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-400">•</span>
                    <span>Plan efficient food distribution routes</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Technical Info */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="font-semibold text-gray-300 mb-2 flex items-center space-x-2">
                <span>⚙️</span>
                <span>Technical Features</span>
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <strong className="text-emerald-400">Map Engine:</strong> Leaflet.js + OpenStreetMap tiles
                </div>
                <div>
                  <strong className="text-blue-400">Routing:</strong> Leaflet Routing Machine with OSRM
                </div>
                <div>
                  <strong className="text-amber-400">Data Source:</strong> Live API endpoint `/api/users/locations`
                </div>
                <div>
                  <strong className="text-red-400">Cost:</strong> 100% Free (no Google Maps API billing)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Component Container */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
          <MapWithRouting />
        </div>

        {/* Map Statistics */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <span>📊</span>
            <span>Network Statistics</span>
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-400">12</p>
              <p className="text-gray-400">Active Providers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-400">45</p>
              <p className="text-gray-400">Registered Recipients</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">8</p>
              <p className="text-gray-400">Meals Shared Today</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-400">25 kg</p>
              <p className="text-gray-400">Food Saved</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapPage;
