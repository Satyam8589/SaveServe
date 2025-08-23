
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
      <Marker position={providerPosition}>
        <Popup>Provider: {provider.fullName}</Popup>
      </Marker>
      <Marker position={recipientPosition}>
        <Popup>Recipient: {recipient.fullName}</Popup>
      </Marker>
      {route.length > 0 && <Polyline positions={route} color="blue" />}
    </MapContainer>
  );
};

export default MapComponent;
