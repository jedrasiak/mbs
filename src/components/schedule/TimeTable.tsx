import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, useTheme, ButtonBase } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DayType, Trip } from '@/types';
import {
  getStopSequenceForDirection,
  getTripsForDirection,
  getDirectionById,
  buildTripPositionMap,
  type StopEntry,
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
  const stopEntries = getStopSequenceForDirection(directionId, dayType);

  // Pre-compute position-to-time maps for all trips
  const tripTimeMaps = useMemo(() => {
    return trips.map(trip => buildTripPositionMap(stopEntries, trip));
  }, [trips, stopEntries]);

  const handleTripClick = (tripId: string) => {
    navigate(`/map?direction=${directionId}&trip=${tripId}&dayType=${dayType}`);
  };

  if (!direction || stopEntries.length === 0) {
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

          {/* Data rows - one per stop entry (may include duplicates for loop routes) */}
          {stopEntries.map((entry: StopEntry, rowIndex: number) => {
            const isEvenRow = rowIndex % 2 === 0;

            return (
              <Box key={`row-${entry.position}`} sx={{ display: 'contents' }}>
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
                  <Typography variant="body2" noWrap title={entry.stop.name}>
                    {entry.stop.name}
                  </Typography>
                </Box>

                {/* Time cells - one per trip */}
                {trips.map((trip: Trip, colIndex: number) => {
                  // Look up time from pre-computed map
                  const timeMap = tripTimeMaps[colIndex];
                  const time = timeMap?.get(entry.position) ?? null;

                  const hasTime = time !== null;
                  const past = hasTime ? isPastTime(time) : false;
                  const isCurrentTrip = colIndex === currentTripIndex;

                  return (
                    <Box
                      key={`time-${entry.position}-${trip.name}`}
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
                        ? formatTime(time, settings.timeFormat === '24h')
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
