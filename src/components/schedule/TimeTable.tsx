import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, useTheme, ButtonBase } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Stop, DayType, Trip } from '@/types';
import {
  getStopsForDirection,
  getTripsForDirection,
  getDirectionById,
  getAllTimesForStopOnTrip,
} from '@/utils/scheduleParser';
import { useSettings } from '@/contexts/SettingsContext';
import { formatTime, isPastTime } from '@/utils/timeCalculations';

interface TimeTableProps {
  directionId: string;
  dayType: DayType;
}

export function TimeTable({ directionId, dayType }: TimeTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { settings } = useSettings();
  const direction = getDirectionById(directionId);
  const trips = getTripsForDirection(directionId, dayType);
  const stops = getStopsForDirection(directionId, dayType);

  const handleTripClick = (tripId: string) => {
    navigate(`/map?direction=${directionId}&trip=${tripId}&dayType=${dayType}`);
  };

  if (!direction || stops.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {t('schedule.selectDirection')}
        </Typography>
      </Paper>
    );
  }

  if (trips.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {t('schedule.noScheduleAvailable', { dayType })}
        </Typography>
      </Paper>
    );
  }

  // Find the current trip (first trip that hasn't fully departed)
  const currentTripIndex = trips.findIndex(trip => {
    // Check if any stage on this trip is in the future
    return trip.stages.some(stage => !isPastTime(stage.time));
  });

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        {t('schedule.to', { destination: direction.name })}
      </Typography>
      <Paper
        sx={{
          overflow: 'auto',
          maxHeight: 'calc(100vh - 350px)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: `180px repeat(${trips.length}, 70px)`,
              md: `minmax(180px, 1fr) repeat(${trips.length}, minmax(70px, 1fr))`,
            },
            minWidth: { xs: 180 + trips.length * 70, md: 'auto' },
          }}
        >
          {/* Header row with trip IDs */}
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              left: 0,
              zIndex: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              p: 1.5,
              fontWeight: 600,
            }}
          >
            {t('schedule.stop')}
          </Box>
          {trips.map((trip: Trip, index: number) => {
            const isCurrentTrip = index === currentTripIndex;
            return (
              <ButtonBase
                key={`header-${trip.name}`}
                onClick={() => handleTripClick(trip.name)}
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  bgcolor: isCurrentTrip ? 'warning.main' : 'primary.main',
                  color: isCurrentTrip ? 'warning.contrastText' : 'primary.contrastText',
                  p: 1.5,
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': {
                    bgcolor: isCurrentTrip ? 'warning.dark' : 'primary.dark',
                  },
                }}
              >
                {trip.name}
              </ButtonBase>
            );
          })}

          {/* Data rows - one per stop */}
          {stops.map((stop: Stop, rowIndex: number) => {
            const isEvenRow = rowIndex % 2 === 0;

            return (
              <Box key={`row-${stop.id}-${rowIndex}`} sx={{ display: 'contents' }}>
                {/* Stop name cell */}
                <Box
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    bgcolor: isEvenRow
                      ? theme.palette.mode === 'dark'
                        ? 'grey.900'
                        : 'grey.50'
                      : 'background.paper',
                    p: 1.5,
                    fontWeight: 500,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" noWrap title={stop.name}>
                    {stop.name}
                  </Typography>
                </Box>

                {/* Time cells - one per trip */}
                {trips.map((trip: Trip, colIndex: number) => {
                  // Get all times this stop appears on this trip (handles loop routes)
                  const timesOnTrip = getAllTimesForStopOnTrip(
                    stop.id,
                    directionId,
                    trip.name,
                    dayType
                  );

                  // For display, use first time if available
                  const firstTime = timesOnTrip[0];
                  const hasTime = firstTime !== undefined;
                  const past = hasTime ? isPastTime(firstTime) : false;
                  const isCurrentTrip = colIndex === currentTripIndex;

                  return (
                    <Box
                      key={`time-${stop.id}-${trip.name}-${colIndex}`}
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isCurrentTrip
                          ? 'warning.light'
                          : isEvenRow
                            ? theme.palette.mode === 'dark'
                              ? 'grey.900'
                              : 'grey.50'
                            : 'background.paper',
                        color: !hasTime
                          ? 'text.disabled'
                          : past
                            ? 'text.disabled'
                            : 'text.primary',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                      }}
                    >
                      {hasTime
                        ? formatTime(firstTime, settings.timeFormat === '24h')
                        : '—'}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
