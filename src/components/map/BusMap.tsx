import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Box } from '@mui/material';
import type { DayType, PlatformId, StopId } from '@/types';
import { StopMarker } from './StopMarker';
import { RouteLayer } from './RouteLayer';
import { UserLocationMarker } from './UserLocationMarker';
import {
  getAllPlatformMarkers,
  getMapCenter,
  getTripById,
  getPlatformById,
  getLineForDirection,
  getTripRouteCoordinates,
} from '@/utils/scheduleParser';
import 'leaflet/dist/leaflet.css';

interface BusMapProps {
  directionId: string | null;
  tripId: string | null;
  dayType: DayType | null;
  userLocation: { lat: number; lng: number } | null;
  selectedStopId: StopId | null;
  selectedPlatformId: PlatformId | null;
  onStopSelect: (stopId: StopId, platformId: PlatformId) => void;
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
  selectedPlatformId,
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

  // Get trip-specific platforms and coordinates if tripId is provided
  const { tripPlatforms, tripCoordinates } = useMemo(() => {
    if (!directionId || !tripId || !dayType) {
      return { tripPlatforms: null, tripCoordinates: null };
    }
    const trip = getTripById(directionId, tripId, dayType);
    if (!trip) {
      return { tripPlatforms: null, tripCoordinates: null };
    }

    const platforms = trip.stages.map(stage => ({
      platformId: stage.platform,
      platform: getPlatformById(stage.platform),
    })).filter(p => p.platform !== undefined);

    // Get route coordinates (uses shapes if available, falls back to platform-to-platform)
    const coordinates = getTripRouteCoordinates(directionId, tripId, dayType);

    return { tripPlatforms: platforms, tripCoordinates: coordinates };
  }, [directionId, tripId, dayType]);

  // Get platform markers based on mode
  const platformMarkers = useMemo(() => {
    const allMarkers = getAllPlatformMarkers(dayType ?? 'weekday');

    if (tripPlatforms && directionId) {
      // Show only platforms from the specific trip with direction's line color
      return tripPlatforms.map(tp => {
        const marker = allMarkers.find(m => m.platformId === tp.platformId);
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
      // Show platforms for the direction with direction's line color
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

    // Default: show all platforms
    return allMarkers;
  }, [tripPlatforms, directionId, dayType]);

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
            key={marker.platformId}
            stopId={marker.stopId}
            platformId={marker.platformId}
            lat={marker.lat}
            lng={marker.lng}
            stopName={marker.stopName}
            directions={marker.directions}
            isSelected={
              marker.stopId === selectedStopId &&
              marker.platformId === selectedPlatformId
            }
            onClick={() => onStopSelect(marker.stopId, marker.platformId)}
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
