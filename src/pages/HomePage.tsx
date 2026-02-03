import { useState, useMemo } from 'react';
import { Box, Container, Alert } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Header, InstallBanner } from '@/components/common';
import {
  StopSelector,
  CurrentTime,
  DepartureList,
  DepartureFilters,
  FILTER_ALL_VALUE,
} from '@/components/home';
import { useSettings } from '@/contexts/SettingsContext';
import { useNextDepartures } from '@/hooks/useNextDepartures';
import { getStopById } from '@/utils/scheduleParser';
import { getServiceStatus, getNextOperatingDay } from '@/utils/timeCalculations';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';
import type { StopId } from '@/types';

export function HomePage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { formatDate } = useLocalizedDate();
  const [selectedStopId, setSelectedStopId] = useState<StopId | null>(
    settings.defaultStopId
  );
  const [selectedRoute, setSelectedRoute] = useState<string>(FILTER_ALL_VALUE);
  const [selectedDirection, setSelectedDirection] = useState<string>(FILTER_ALL_VALUE);

  const serviceStatus = getServiceStatus();
  // Get all remaining departures for the day (use large limit)
  const departures = useNextDepartures(selectedStopId, 100);
  const selectedStop = selectedStopId ? getStopById(selectedStopId) : undefined;

  // Filter departures based on selected route and direction
  const filteredDepartures = useMemo(() => {
    let result = departures;

    if (selectedRoute !== FILTER_ALL_VALUE) {
      result = result.filter((d) => d.lineId === selectedRoute);
    }

    if (selectedDirection !== FILTER_ALL_VALUE) {
      result = result.filter((d) => d.destinationName === selectedDirection);
    }

    return result;
  }, [departures, selectedRoute, selectedDirection]);

  // Reset filters when stop changes
  const handleStopChange = (stopId: StopId | null) => {
    setSelectedStopId(stopId);
    setSelectedRoute(FILTER_ALL_VALUE);
    setSelectedDirection(FILTER_ALL_VALUE);
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Header title={t('app.title')} />
      <InstallBanner />
      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <CurrentTime />

        {/* Non-operating day alert */}
        {!serviceStatus.isOperating && (
          <Alert
            severity="warning"
            icon={<EventBusy />}
            sx={{ mb: 2 }}
          >
            {t('home.noServiceToday')} ({serviceStatus.reason}).{' '}
            {t('home.nextService', { date: formatDate(getNextOperatingDay()) })}
          </Alert>
        )}

        <StopSelector
          value={selectedStopId}
          onChange={handleStopChange}
          label={t('home.selectYourStop')}
        />

        {selectedStopId && departures.length > 0 && (
          <DepartureFilters
            departures={departures}
            selectedRoute={selectedRoute}
            selectedDirection={selectedDirection}
            onRouteChange={setSelectedRoute}
            onDirectionChange={setSelectedDirection}
          />
        )}

        <DepartureList
          departures={filteredDepartures}
          stopId={selectedStopId}
          stopName={selectedStop?.name}
          serviceStatus={serviceStatus}
        />

        {/* SEO footer text - only visible in Polish for search engines */}
        <Box
          component="footer"
          sx={{
            mt: 6,
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
            color: 'text.secondary',
            fontSize: '0.75rem',
            lineHeight: 1.5,
          }}
        >
          Autobusy Rawa Mazowiecka. Rozkład jazdy autobusów miejskich w Rawie
          Mazowieckiej. Sprawdź godziny odjazdów i mapę przystanków. Zainstaluj
          aplikację na telefon.
        </Box>
      </Container>
    </Box>
  );
}
