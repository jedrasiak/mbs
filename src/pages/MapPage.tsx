import { useState, useCallback, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header, LoadingSpinner } from '@/components/common';
import { MapFAB, SearchBar, StopBottomSheet } from '@/components/map';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getStopById, getFirstAvailablePlatform } from '@/utils/scheduleParser';
import { getServiceStatus } from '@/utils/timeCalculations';
import type { PlatformId } from '@/types';

// Lazy load the map component
const BusMap = lazy(() =>
  import('@/components/map/BusMap').then(module => ({ default: module.BusMap }))
);

export function MapPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(null);
  const [centerOnUser, setCenterOnUser] = useState(false);

  const { latitude, longitude, refresh } = useGeolocation({ watch: true });

  const userLocation =
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : null;

  const selectedStop = selectedStopId ? getStopById(selectedStopId) : undefined;

  // Get route parameters from URL
  const directionId = searchParams.get('direction');
  const tripId = searchParams.get('trip');
  const urlDayType = searchParams.get('dayType') as 'weekday' | 'weekend' | null;
  // Use URL dayType if provided, otherwise use current day type
  const dayType = urlDayType ?? getServiceStatus().dayType;

  const handleCenterUser = useCallback(() => {
    refresh();
    setCenterOnUser(true);
    // Reset after centering
    setTimeout(() => setCenterOnUser(false), 100);
  }, [refresh]);

  const handleStopSelect = useCallback((stopId: number, platform: PlatformId) => {
    setSelectedStopId(stopId);
    setSelectedPlatform(platform);
  }, []);

  const handleSearchSelect = useCallback((stopId: number) => {
    setSelectedStopId(stopId);
    // Find the first available platform for this stop
    const stop = getStopById(stopId);
    const platform = stop ? getFirstAvailablePlatform(stop) : null;
    setSelectedPlatform(platform);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedStopId(null);
    setSelectedPlatform(null);
  }, []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title={t('map.routeMap')} />
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <BusMap
            directionId={directionId}
            tripId={tripId}
            dayType={dayType}
            userLocation={userLocation}
            selectedStopId={selectedStopId}
            selectedPlatform={selectedPlatform}
            onStopSelect={handleStopSelect}
            centerOnUser={centerOnUser}
          />
        </Suspense>

        <SearchBar onSelectStop={handleSearchSelect} />

        <MapFAB onCenterUser={handleCenterUser} />

        {selectedStop && selectedPlatform && (
          <StopBottomSheet
            stop={selectedStop}
            platform={selectedPlatform}
            userLocation={userLocation}
            onClose={handleClose}
          />
        )}
      </Box>
    </Box>
  );
}
