import { Box, Typography, Paper } from '@mui/material';
import { Schedule, EventBusy } from '@mui/icons-material';
import type { Departure, ServiceStatus } from '@/types';
import { DepartureCard } from './DepartureCard';
import { getServiceStatus, getNextOperatingDay, formatDate } from '@/utils/timeCalculations';

interface DepartureListProps {
  departures: Departure[];
  stopName?: string;
  serviceStatus?: ServiceStatus;
}

export function DepartureList({ departures, stopName, serviceStatus }: DepartureListProps) {
  const status = serviceStatus ?? getServiceStatus();

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
          No Service Today
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {status.reason ? `Buses do not operate on ${status.reason}` : 'Buses are not operating today'}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
          Next service: {formatDate(nextOperatingDay)}
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
          No more buses today
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Check back tomorrow for the schedule
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {stopName && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Departures from {stopName}
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
