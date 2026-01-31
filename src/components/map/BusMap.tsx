import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Box } from '@mui/material';
import type { DayType, PlatformId } from '@/types';
import { StopMarker } from './StopMarker';
import { RouteLayer } from './RouteLayer';
import { UserLocationMarker } from './UserLocationMarker';
import {
  getAllPlatformMarkers,
  getMapCenter,
  getTripById,
  getStopById,
  getLineForDirection,
  getTripRouteCoordinates,
} from '@/utils/scheduleParser';
import 'leaflet/dist/leaflet.css';

interface BusMapProps {
  directionId: string | null;
  tripId: string | null;
  dayType: DayType | null;
  userLocation: { lat: number; lng: number } | null;
  selectedStopId: number | null;
  selectedPlatform: PlatformId | null;
  onStopSelect: (stopId: number, platform: PlatformId) => void;
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
  directionId,
  tripId,
  dayType,
  userLocation,
  selectedStopId,
  selectedPlatform,
  onStopSelect,
  centerOnUser = false,
}: BusMapProps) {
  const defaultCenter = getMapCenter();
  const defaultZoom = 13;

  // Determine if we're showing a specific route or just stops
  const showRoute = directionId !== null;

  // Get the line for the selected direction
  const routeLine = useMemo(() => {
    if (!directionId) return null;
    return getLineForDirection(directionId);
  }, [directionId]);

  // Get trip-specific stops and coordinates if tripId is provided
  const { tripStops, tripCoordinates } = useMemo(() => {
    if (!directionId || !tripId || !dayType) {
      return { tripStops: null, tripCoordinates: null };
    }
    const trip = getTripById(directionId, tripId, dayType);
    if (!trip) {
      return { tripStops: null, tripCoordinates: null };
    }

    const stops = trip.stops.map(ts => ({
      stopId: ts.stopId,
      platform: ts.platform,
      stop: getStopById(ts.stopId),
    })).filter(s => s.stop !== undefined);

    // Get route coordinates (uses shapes if available, falls back to stop-to-stop)
    const coordinates = getTripRouteCoordinates(directionId, tripId, dayType);

    return { tripStops: stops, tripCoordinates: coordinates };
  }, [directionId, tripId, dayType]);

  // Get platform markers based on mode
  const platformMarkers = useMemo(() => {
    const allMarkers = getAllPlatformMarkers(dayType ?? 'weekday');

    if (tripStops && directionId) {
      // Show only stops from the specific trip with direction's line color
      return tripStops.map(ts => {
        const marker = allMarkers.find(
          m => m.stopId === ts.stopId && m.platform === ts.platform
        );
        if (!marker) return undefined;
        // Override directions to only include the viewed direction (for correct color)
        const tripDirection = marker.directions.find(d => d.directionId === directionId);
        return {
          ...marker,
          directions: tripDirection ? [tripDirection] : marker.directions,
        };
      }).filter((m): m is NonNullable<typeof m> => m !== undefined);
    }

    if (directionId) {
      // Show stops for the direction with direction's line color
      return allMarkers
        .filter(marker => marker.directions.some(dir => dir.directionId === directionId))
        .map(marker => {
          const tripDirection = marker.directions.find(d => d.directionId === directionId);
          return {
            ...marker,
            directions: tripDirection ? [tripDirection] : marker.directions,
          };
        });
    }

    // Default: show all stops
    return allMarkers;
  }, [tripStops, directionId, dayType]);

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

        {/* Route layer - only show if direction is specified */}
        {showRoute && routeLine && directionId && (
          <RouteLayer
            line={routeLine}
            visibleDirectionIds={[directionId]}
            customCoordinates={tripCoordinates ?? undefined}
          />
        )}

        {/* Stop markers */}
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
