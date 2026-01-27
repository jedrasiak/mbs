import { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { Header } from '@/components/common';
import {
  StopSelector,
  CurrentTime,
  DepartureList,
  MapPreviewCard,
} from '@/components/home';
import { useSettings } from '@/contexts/SettingsContext';
import { useNextDepartures } from '@/hooks/useNextDepartures';
import { getStopById } from '@/utils/scheduleParser';

export function HomePage() {
  const { settings } = useSettings();
  const [selectedStopId, setSelectedStopId] = useState<number | null>(
    settings.defaultStopId
  );

  // Sync with settings when default stop changes
  useEffect(() => {
    if (settings.defaultStopId && !selectedStopId) {
      setSelectedStopId(settings.defaultStopId);
    }
  }, [settings.defaultStopId, selectedStopId]);

  const departures = useNextDepartures(selectedStopId, 4);
  const selectedStop = selectedStopId ? getStopById(selectedStopId) : undefined;

  return (
    <Box sx={{ pb: 10 }}>
      <Header title="Bus Schedule" />
      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <CurrentTime />

        <StopSelector
          value={selectedStopId}
          onChange={setSelectedStopId}
          label="Select your stop"
        />

        <DepartureList
          departures={departures}
          stopName={selectedStop?.name}
        />

        <MapPreviewCard />
      </Container>
    </Box>
  );
}
