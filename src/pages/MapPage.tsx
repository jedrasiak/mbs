import { useState, useCallback, Suspense, lazy } from 'react';
import { Box } from '@mui/material';
import { Header, LoadingSpinner } from '@/components/common';
import { MapFAB, SearchBar, StopBottomSheet } from '@/components/map';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getAllStops, getAllLines, getStopById, getLinesForStop } from '@/utils/scheduleParser';

// Lazy load the map component
const BusMap = lazy(() =>
  import('@/components/map/BusMap').then(module => ({ default: module.BusMap }))
);

export function MapPage() {
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [centerOnUser, setCenterOnUser] = useState(false);

  const { latitude, longitude, refresh } = useGeolocation({ watch: true });

  const userLocation =
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : null;

  const stops = getAllStops();
  const lines = getAllLines();

  const selectedStop = selectedStopId ? getStopById(selectedStopId) : undefined;
  const selectedStopLines = selectedStopId ? getLinesForStop(selectedStopId) : [];

  const handleCenterUser = useCallback(() => {
    refresh();
    setCenterOnUser(true);
    // Reset after centering
    setTimeout(() => setCenterOnUser(false), 100);
  }, [refresh]);

  const handleStopSelect = useCallback((stopId: number | null) => {
    setSelectedStopId(stopId);
  }, []);

  const handleSearchSelect = useCallback((stopId: number) => {
    setSelectedStopId(stopId);
    // Could also center map on the stop here
  }, []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="Route Map" />
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <BusMap
            stops={stops}
            lines={lines}
            userLocation={userLocation}
            selectedStopId={selectedStopId}
            onStopSelect={handleStopSelect}
            centerOnUser={centerOnUser}
          />
        </Suspense>

        <SearchBar onSelectStop={handleSearchSelect} />

        <MapFAB onCenterUser={handleCenterUser} />

        {selectedStop && (
          <StopBottomSheet
            stop={selectedStop}
            lines={selectedStopLines}
            userLocation={userLocation}
            onClose={() => setSelectedStopId(null)}
          />
        )}
      </Box>
    </Box>
  );
}
