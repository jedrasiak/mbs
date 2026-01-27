import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Box } from '@mui/material';
import type { Line } from '@/types';
import { StopMarker } from './StopMarker';
import { RouteLayer } from './RouteLayer';
import { UserLocationMarker } from './UserLocationMarker';
import { getAllPlatformMarkers, getMapCenter } from '@/utils/scheduleParser';
import 'leaflet/dist/leaflet.css';

interface BusMapProps {
  lines: Line[];
  userLocation: { lat: number; lng: number } | null;
  selectedStopId: number | null;
  selectedPlatform: 'A' | 'B' | null;
  onStopSelect: (stopId: number, platform: 'A' | 'B') => void;
  centerOnUser?: boolean;
}

function MapController({
  centerOnUser,
  userLocation,
}: {
  centerOnUser: boolean;
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (centerOnUser && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [centerOnUser, userLocation, map]);

  return null;
}

export function BusMap({
  lines,
  userLocation,
  selectedStopId,
  selectedPlatform,
  onStopSelect,
  centerOnUser = false,
}: BusMapProps) {
  const defaultCenter = getMapCenter();
  const defaultZoom = 13;

  // Get all platform markers
  const platformMarkers = getAllPlatformMarkers();

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        '& .leaflet-container': {
          height: '100%',
          width: '100%',
        },
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController centerOnUser={centerOnUser} userLocation={userLocation} />

        {/* Route layers */}
        {lines.map(line => (
          <RouteLayer key={line.id} line={line} />
        ))}

        {/* Stop markers - one per platform */}
        {platformMarkers.map(marker => (
          <StopMarker
            key={`${marker.stopId}-${marker.platform}`}
            stopId={marker.stopId}
            platform={marker.platform}
            lat={marker.lat}
            lng={marker.lng}
            stopName={marker.stopName}
            directions={marker.directions}
            isSelected={
              marker.stopId === selectedStopId &&
              marker.platform === selectedPlatform
            }
            onClick={() => onStopSelect(marker.stopId, marker.platform)}
          />
        ))}

        {/* User location */}
        {userLocation && (
          <UserLocationMarker lat={userLocation.lat} lng={userLocation.lng} />
        )}
      </MapContainer>
    </Box>
  );
}
