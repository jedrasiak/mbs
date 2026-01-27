import { useState, useCallback, Suspense, lazy } from 'react';
import { Box } from '@mui/material';
import { Header, LoadingSpinner } from '@/components/common';
import { MapFAB, SearchBar, StopBottomSheet } from '@/components/map';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getAllLines, getStopById } from '@/utils/scheduleParser';

// Lazy load the map component
const BusMap = lazy(() =>
  import('@/components/map/BusMap').then(module => ({ default: module.BusMap }))
);

export function MapPage() {
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'A' | 'B' | null>(null);
  const [centerOnUser, setCenterOnUser] = useState(false);

  const { latitude, longitude, refresh } = useGeolocation({ watch: true });

  const userLocation =
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : null;

  const lines = getAllLines();
  const selectedStop = selectedStopId ? getStopById(selectedStopId) : undefined;

  const handleCenterUser = useCallback(() => {
    refresh();
    setCenterOnUser(true);
    // Reset after centering
    setTimeout(() => setCenterOnUser(false), 100);
  }, [refresh]);

  const handleStopSelect = useCallback((stopId: number, platform: 'A' | 'B') => {
    setSelectedStopId(stopId);
    setSelectedPlatform(platform);
  }, []);

  const handleSearchSelect = useCallback((stopId: number) => {
    setSelectedStopId(stopId);
    // Default to platform A when selecting from search
    setSelectedPlatform('A');
  }, []);

  const handleClose = useCallback(() => {
    setSelectedStopId(null);
    setSelectedPlatform(null);
  }, []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="Route Map" />
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <BusMap
            lines={lines}
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
