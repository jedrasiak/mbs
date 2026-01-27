import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Box } from '@mui/material';
import type { Stop, Line } from '@/types';
import { StopMarker } from './StopMarker';
import { RouteLayer } from './RouteLayer';
import { UserLocationMarker } from './UserLocationMarker';
import 'leaflet/dist/leaflet.css';

interface BusMapProps {
  stops: Stop[];
  lines: Line[];
  userLocation: { lat: number; lng: number } | null;
  selectedStopId: number | null;
  onStopSelect: (stopId: number | null) => void;
  centerOnUser?: boolean;
}

function MapController({ centerOnUser, userLocation }: { centerOnUser: boolean; userLocation: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (centerOnUser && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [centerOnUser, userLocation, map]);

  return null;
}

export function BusMap({
  stops,
  lines,
  userLocation,
  selectedStopId,
  onStopSelect,
  centerOnUser = false,
}: BusMapProps) {
  // Default center (Warsaw area based on sample data)
  const defaultCenter: [number, number] = [52.232, 21.0];
  const defaultZoom = 13;

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
          <RouteLayer key={line.id} line={line} stops={stops} />
        ))}

        {/* Stop markers */}
        {stops.map(stop => (
          <StopMarker
            key={stop.id}
            stop={stop}
            lines={lines.filter(line => line.route.includes(stop.id))}
            isSelected={stop.id === selectedStopId}
            onClick={() => onStopSelect(stop.id)}
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
