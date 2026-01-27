import { Box, Typography, Paper } from '@mui/material';
import { Schedule } from '@mui/icons-material';
import type { Departure } from '@/types';
import { DepartureCard } from './DepartureCard';

interface DepartureListProps {
  departures: Departure[];
  stopName?: string;
}

export function DepartureList({ departures, stopName }: DepartureListProps) {
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
          key={`${departure.lineId}-${departure.time}`}
          departure={departure}
          isNext={index === 0}
        />
      ))}
    </Box>
  );
}
