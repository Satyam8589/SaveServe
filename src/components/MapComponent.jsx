// MapWithRouting.jsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * MapWithRouting - Food Surplus Distribution Platform Map Component
 * Features:
 * - OpenStreetMap tiles with dark theme
 * - Provider/Recipient markers with custom icons
 * - Interactive popups with user details
 * - Automatic routing between providers and recipients
 * - Responsive dark-themed design
 */

// Custom provider icon (food/restaurant)
const createProviderIcon = (subrole) => {
  const iconColors = {
    CANTEEN: '#10b981', // emerald-500
    HOSTEL: '#fb923c',  // orange-400
    EVENTORGANIZER: '#fbbf24', // amber-400
  };
  
  const color = iconColors[subrole] || '#10b981';
  
  return L.divIcon({
    className: 'custom-provider-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        🍲
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Custom recipient icon (people/user)
const createRecipientIcon = (subrole) => {
  const iconColors = {
    STUDENT: '#60a5fa', // blue-400
    STAFF: '#3b82f6',   // blue-500
    NGO: '#34d399',     // emerald-400
  };
  
  const color = iconColors[subrole] || '#60a5fa';
  
  return L.divIcon({
    className: 'custom-recipient-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        👤
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

/**
 * Get role badge styling based on role
 */
const getRoleBadgeClass = (role) => {
  return role === 'PROVIDER' 
    ? 'background-color: #059669; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;' 
    : 'background-color: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;';
};

/**
 * Get subrole badge styling
 */
const getSubroleBadgeClass = (subrole) => {
  const subroleColors = {
    CANTEEN: '#10b981',
    HOSTEL: '#fb923c',
    EVENTORGANIZER: '#fbbf24',
    STUDENT: '#60a5fa',
    STAFF: '#3b82f6',
    NGO: '#34d399',
  };
  
  const color = subroleColors[subrole] || '#6b7280';
  return `background-color: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 4px;`;
};

/**
 * Routing component to handle route drawing
 */
const RoutingComponent = ({ providers, recipients }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!providers.length || !recipients.length) return;

    // Dynamic import for leaflet-routing-machine (client-side only)
    const loadRoutingMachine = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet-routing-machine/dist/leaflet-routing-machine.css');
        const routing = await import('leaflet-routing-machine');

        // Remove existing routing control
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
        }

        // Get first provider and first recipient
        const firstProvider = providers[0];
        const firstRecipient = recipients[0];

        console.log('🚗 Creating route between:', firstProvider.fullName, '→', firstRecipient.fullName);

        // Create routing control
        routingControlRef.current = routing.default.control({
          waypoints: [
            L.default.latLng(firstProvider.latitude, firstProvider.longitude),
            L.default.latLng(firstRecipient.latitude, firstRecipient.longitude)
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null, // Don't create default markers
          lineOptions: {
            styles: [
              {
                color: '#3b82f6', // blue-500
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10'
              }
            ]
          },
          show: false, // Hide the instruction panel
          collapsible: false,
          fitSelectedRoutes: false,
        }).addTo(map);

        // Hide the routing instructions container
        setTimeout(() => {
          const routingContainer = document.querySelector('.leaflet-routing-container');
          if (routingContainer) {
            routingContainer.style.display = 'none';
          }
        }, 100);

      } catch (error) {
        console.error('❌ Error loading routing machine:', error);
      }
    };

    loadRoutingMachine();

    // Cleanup function
    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, providers, recipients]);

  return null;
};

const MapWithRouting = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Separate providers and recipients
  const providers = users.filter(user => user.role === 'PROVIDER' && user.latitude && user.longitude);
  const recipients = users.filter(user => user.role === 'RECIPIENT' && user.latitude && user.longitude);

  /**
   * Fetch user locations from API
   */
  const fetchUserLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/locations');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch user locations');
      }

      // Handle both array response and object with data property
      const userData = Array.isArray(result) ? result : result.data || result.validLocations || [];
      
      if (userData.length > 0) {
        setUsers(userData);
        console.log(`📍 Loaded ${userData.length} user locations`);
      } else {
        console.warn('⚠️ No user locations found');
      }

    } catch (err) {
      console.error('❌ Error fetching user locations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchUserLocations();
  }, [fetchUserLocations]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    setMapLoaded(true);
    console.log('🗺️ Leaflet map loaded successfully');
  }, []);

  // Default map center (Kolkata area based on your coordinates)
  const defaultCenter = [22.5151549, 88.4104219];

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-96 bg-gray-800 rounded-xl flex items-center justify-center border-2 border-red-400">
        <div className="text-center p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">Map Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchUserLocations}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Map Header */}
      <div className="mb-4 p-4 bg-gray-800 rounded-t-xl border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Food Distribution Network</h2>
            <p className="text-gray-400 text-sm">
              {users.length} active locations • 🍲 Providers ({providers.length}) • 👤 Recipients ({recipients.length})
              {providers.length > 0 && recipients.length > 0 && (
                <span className="text-blue-400"> • 🚗 Route displayed</span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchUserLocations}
              className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="relative">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="h-96 w-full rounded-lg border-2 border-gray-700 shadow-lg"
          whenReady={handleMapReady}
        >
          {/* Dark themed tile layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            className="map-tiles"
          />

          {/* Provider Markers */}
          {providers.map((user) => (
            <Marker
              key={`provider-${user.id}`}
              position={[user.latitude, user.longitude]}
              icon={createProviderIcon(user.subrole)}
            >
              <Popup>
                <div style={{ 
                  minWidth: '200px', 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '8px'
                }}>
                  <h3 style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginBottom: '8px',
                    color: '#10b981'
                  }}>
                    {user.fullName}
                  </h3>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <span style={getRoleBadgeClass(user.role)}>
                      {user.role}
                    </span>
                    <span style={getSubroleBadgeClass(user.subrole)}>
                      {user.subrole}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', color: '#d1d5db' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <span style={{ color: '#fbbf24' }}>📍</span>
                      <span>{user.area}</span>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#10b981' 
                  }}>
                    ✅ Available for food sharing
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Recipient Markers */}
          {recipients.map((user) => (
            <Marker
              key={`recipient-${user.id}`}
              position={[user.latitude, user.longitude]}
              icon={createRecipientIcon(user.subrole)}
            >
              <Popup>
                <div style={{ 
                  minWidth: '200px', 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '8px'
                }}>
                  <h3 style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginBottom: '8px',
                    color: '#60a5fa'
                  }}>
                    {user.fullName}
                  </h3>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <span style={getRoleBadgeClass(user.role)}>
                      {user.role}
                    </span>
                    <span style={getSubroleBadgeClass(user.subrole)}>
                      {user.subrole}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', color: '#d1d5db' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <span style={{ color: '#fbbf24' }}>📍</span>
                      <span>{user.area}</span>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#60a5fa' 
                  }}>
                    🤝 Looking for food donations
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Routing Component */}
          {providers.length > 0 && recipients.length > 0 && (
            <RoutingComponent providers={providers} recipients={recipients} />
          )}
        </MapContainer>

        {/* Dark theme overlay for map */}
        <style jsx global>{`
          .leaflet-container {
            background-color: #1f2937 !important;
          }
          
          .leaflet-popup-content-wrapper {
            background-color: #1f2937 !important;
            color: white !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
          }
          
          .leaflet-popup-tip {
            background-color: #1f2937 !important;
          }
          
          .leaflet-control-container .leaflet-control {
            background-color: #374151 !important;
            border: 1px solid #4b5563 !important;
          }
          
          .leaflet-control-container .leaflet-control a {
            background-color: #374151 !important;
            color: white !important;
          }
          
          .leaflet-control-container .leaflet-control a:hover {
            background-color: #4b5563 !important;
          }
          
          .leaflet-bar a:first-child {
            border-top-left-radius: 4px !important;
            border-top-right-radius: 4px !important;
          }
          
          .leaflet-bar a:last-child {
            border-bottom-left-radius: 4px !important;
            border-bottom-right-radius: 4px !important;
          }
          
          .leaflet-routing-container {
            display: none !important;
          }
        `}</style>
      </div>

      {/* Map Footer Stats */}
      <div className="mt-2 p-3 bg-gray-800 rounded-b-xl border-t border-gray-700">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>
            Providers: {providers.length} • Recipients: {recipients.length}
            {providers.length > 0 && recipients.length > 0 && (
              <span className="text-blue-400"> • Route: {providers[0]?.fullName} → {recipients[0]?.fullName}</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {mapLoaded && <span className="text-emerald-400">🗺️ Map ready</span>}
            <span>Powered by OpenStreetMap</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapWithRouting;