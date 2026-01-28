import { useState } from 'react';
import { Box, Container, Alert } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/common';
import {
  StopSelector,
  CurrentTime,
  DepartureList,
} from '@/components/home';
import { useSettings } from '@/contexts/SettingsContext';
import { useNextDepartures } from '@/hooks/useNextDepartures';
import { getStopById } from '@/utils/scheduleParser';
import { getServiceStatus, getNextOperatingDay } from '@/utils/timeCalculations';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';

export function HomePage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { formatDate } = useLocalizedDate();
  const [selectedStopId, setSelectedStopId] = useState<number | null>(
    settings.defaultStopId
  );

  const serviceStatus = getServiceStatus();
  // Get all remaining departures for the day (use large limit)
  const departures = useNextDepartures(selectedStopId, 100);
  const selectedStop = selectedStopId ? getStopById(selectedStopId) : undefined;

  return (
    <Box sx={{ pb: 10 }}>
      <Header title={t('app.title')} />
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
          onChange={setSelectedStopId}
          label={t('home.selectYourStop')}
        />

        <DepartureList
          departures={departures}
          stopId={selectedStopId}
          stopName={selectedStop?.name}
          serviceStatus={serviceStatus}
        />
      </Container>
    </Box>
  );
}
