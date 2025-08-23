
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

  useEffect(() => {
    if (provider && recipient) {
      const providerLatLng = [provider.latitude, provider.longitude];
      const recipientLatLng = [recipient.latitude, recipient.longitude];

      // Fetch route from OSRM
      fetch(`http://router.project-osrm.org/route/v1/driving/${providerLatLng[1]},${providerLatLng[0]};${recipientLatLng[1]},${recipientLatLng[0]}?overview=full&geometries=polyline`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const polyline = require('@mapbox/polyline');
            const decoded = polyline.decode(data.routes[0].geometry);
            setRoute(decoded);
          }
        });
    }
  }, [provider, recipient]);

  useEffect(() => {
    if (mapRef.current && route.length > 0) {
      mapRef.current.fitBounds(route);
    }
  }, [route]);

  if (!provider || !recipient) {
    return <div>Loading...</div>;
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
              box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
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
        `}
      </style>
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
          <Popup>Provider: {provider.fullName}</Popup>
        </Marker>
        <Marker position={recipientPosition} icon={createRecipientIcon()}>
          <Popup>Recipient: {recipient.fullName}</Popup>
        </Marker>
        {route.length > 0 && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </>
  );
};

export default MapComponent;
