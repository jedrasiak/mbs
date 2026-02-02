import { Box, Typography, Paper } from '@mui/material';
import { Schedule, EventBusy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Departure, ServiceStatus, StopId } from '@/types';
import { DepartureCard } from './DepartureCard';
import { getServiceStatus, getNextOperatingDay } from '@/utils/timeCalculations';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';

interface DepartureListProps {
  departures: Departure[];
  stopId: StopId | null;
  stopName?: string;
  serviceStatus?: ServiceStatus;
}

export function DepartureList({ departures, stopId, stopName, serviceStatus }: DepartureListProps) {
  const { t } = useTranslation();
  const { formatDate } = useLocalizedDate();
  const status = serviceStatus ?? getServiceStatus();

  // No stop selected
  if (stopId === null) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {t('home.selectStopToSeeDepartures')}
        </Typography>
      </Paper>
    );
  }

  // Non-operating day
  if (!status.isOperating) {
    const nextOperatingDay = getNextOperatingDay();

    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <EventBusy sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
        <Typography variant="h6" color="text.primary" gutterBottom>
          {t('home.noServiceToday')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {status.reason ? t('home.busesDoNotOperate', { reason: status.reason }) : t('home.busesNotOperatingToday')}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
          {t('home.nextService', { date: formatDate(nextOperatingDay) })}
        </Typography>
      </Paper>
    );
  }

  // No departures remaining today
  if (departures.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {t('home.noMoreBusesToday')}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t('home.checkBackTomorrow')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {stopName && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('home.departuresFrom', { stopName })}
        </Typography>
      )}
      {departures.map((departure, index) => (
        <DepartureCard
          key={`${departure.directionId}-${departure.time}`}
          departure={departure}
          isNext={index === 0}
        />
      ))}
    </Box>
  );
}
