import { Box, Typography, Paper, useTheme } from '@mui/material';
import type { Stop, DayType } from '@/types';
import {
  getStopsForDirection,
  getTimesForStopInDirection,
  getDirectionById,
} from '@/utils/scheduleParser';
import { useSettings } from '@/contexts/SettingsContext';
import { formatTime, isPastTime, getCurrentTimeString } from '@/utils/timeCalculations';

interface TimeTableProps {
  directionId: string;
  dayType: DayType;
}

export function TimeTable({ directionId, dayType }: TimeTableProps) {
  const theme = useTheme();
  const { settings } = useSettings();
  const direction = getDirectionById(directionId);
  const stops = getStopsForDirection(directionId);

  if (!direction || stops.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Select a direction to view the schedule
        </Typography>
      </Paper>
    );
  }

  // Get all unique departure times across all stops to determine columns
  const allTimesSet = new Set<string>();
  for (const stop of stops) {
    const times = getTimesForStopInDirection(stop.id, directionId, dayType);
    times.forEach(t => allTimesSet.add(t));
  }
  const allTimes = Array.from(allTimesSet).sort();

  const currentTime = getCurrentTimeString();

  if (allTimes.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No schedule available for this direction on {dayType}s
        </Typography>
      </Paper>
    );
  }

  // Find which column index is the "current" one
  const currentColumnIndex = allTimes.findIndex(time => time >= currentTime);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        To {direction.name}
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
            gridTemplateColumns: `180px repeat(${allTimes.length}, 70px)`,
            minWidth: 180 + allTimes.length * 70,
          }}
        >
          {/* Header row */}
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
            Stop
          </Box>
          {allTimes.map((time, index) => {
            const isCurrentColumn = index === currentColumnIndex;
            return (
              <Box
                key={`header-${index}`}
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  bgcolor: isCurrentColumn ? 'warning.main' : 'primary.main',
                  color: isCurrentColumn ? 'warning.contrastText' : 'primary.contrastText',
                  p: 1.5,
                  textAlign: 'center',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                }}
              >
                {formatTime(time, settings.timeFormat === '24h')}
              </Box>
            );
          })}

          {/* Data rows */}
          {stops.map((stop: Stop, rowIndex: number) => {
            const stopTimes = getTimesForStopInDirection(stop.id, directionId, dayType);
            const stopTimesSet = new Set(stopTimes);
            const isEvenRow = rowIndex % 2 === 0;

            return (
              <Box key={stop.id} sx={{ display: 'contents' }}>
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

                {/* Time cells */}
                {allTimes.map((columnTime, colIndex) => {
                  // Find the matching time for this stop at this column
                  const hasTime = stopTimesSet.has(columnTime);
                  const stopTime = hasTime ? columnTime : null;
                  const past = stopTime ? isPastTime(stopTime) : false;
                  const isCurrentColumn = colIndex === currentColumnIndex;

                  return (
                    <Box
                      key={`time-${stop.id}-${colIndex}`}
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isCurrentColumn
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
                        ? formatTime(columnTime, settings.timeFormat === '24h')
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
