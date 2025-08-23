// src/components/MapComponent.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Built-in polyline decoder to avoid external dependency
const decodePolyline = (str, precision = 5) => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let byte = null;
    let shift = 0;
    let result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
};

const providerIconSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
    <path d="M2 7h20"/>
    <path d="M22 7v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V7"/>
    <path d="M2 7v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7"/>
  </svg>
`;

const recipientIconSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
`;

// Custom provider icon
const createProviderIcon = () => {
  return L.divIcon({
    className: 'custom-provider-icon',
    html: `
      <div class="marker-pin-provider"></div>
      <div style="
        background-color: #10b981;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      ">
        ${providerIconSVG}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Custom recipient icon
const createRecipientIcon = () => {
  return L.divIcon({
    className: 'custom-recipient-icon',
    html: `
      <div class="marker-pin-recipient"></div>
      <div style="
        background-color: #60a5fa;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      ">
        ${recipientIconSVG}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const MapComponent = ({ provider, recipient }) => {
  const mapRef = useRef(null);
  const [route, setRoute] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    if (provider && recipient) {
      const providerLatLng = [provider.latitude, provider.longitude];
      const recipientLatLng = [recipient.latitude, recipient.longitude];

      setIsLoading(true);
      setError(null);

      // Fetch route from OSRM
      fetch(`https://router.project-osrm.org/route/v1/driving/${providerLatLng[1]},${providerLatLng[0]};${recipientLatLng[1]},${recipientLatLng[0]}?overview=full&geometries=polyline`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch route');
          }
          return res.json();
        })
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const decoded = decodePolyline(data.routes[0].geometry);
            setRoute(decoded);
          } else {
            setError('No route found between the locations');
          }
        })
        .catch(err => {
          console.error('Route fetch error:', err);
          setError('Failed to fetch route. Using direct line instead.');
          // Fallback to direct line
          setRoute([providerLatLng, recipientLatLng]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [provider, recipient]);

  useEffect(() => {
    if (mapRef.current && route.length > 0) {
      mapRef.current.fitBounds(route, { padding: [20, 20] });
    }
  }, [route]);

  if (!provider || !recipient) {
    return (
      <div className="w-full h-96 bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-6"></div>
          <p className="text-gray-300 text-lg font-semibold">Loading Map Data...</p>
        </div>
      </div>
    );
  }

  const providerPosition = [provider.latitude, provider.longitude];
  const recipientPosition = [recipient.latitude, recipient.longitude];

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
          }
          .marker-pin-provider {
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 8px solid #10b981;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: -2px;
          }
          .marker-pin-recipient {
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 8px solid #60a5fa;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: -2px;
          }
          .leaflet-container {
            border-radius: 12px;
          }
        `}
      </style>
      <div className="relative">
        {isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white px-4 py-2 rounded-lg z-[1000] shadow-lg">
            Loading route...
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-900 text-white px-4 py-2 rounded-lg z-[1000] shadow-lg text-sm max-w-xs text-center">
            {error}
          </div>
        )}
        <MapContainer
          center={providerPosition}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={providerPosition} icon={createProviderIcon()}>
            <Popup>
              <div className="text-center">
                <strong>Provider</strong><br />
                {provider.fullName}
                {provider.address && <><br /><small>{provider.address}</small></>}
              </div>
            </Popup>
          </Marker>
          <Marker position={recipientPosition} icon={createRecipientIcon()}>
            <Popup>
              <div className="text-center">
                <strong>Recipient</strong><br />
                {recipient.fullName}
                {recipient.address && <><br /><small>{recipient.address}</small></>}
              </div>
            </Popup>
          </Marker>
          {route.length > 0 && (
            <Polyline 
              positions={route} 
              color="#3b82f6" 
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>
    </>
  );
};

export default MapComponent;