import { Box, Typography, Paper, useTheme } from '@mui/material';
import type { Stop } from '@/types';
import { getStopsForLine, getTimesForStop } from '@/utils/scheduleParser';
import { useSettings } from '@/contexts/SettingsContext';
import { formatTime, isPastTime, getCurrentTimeString } from '@/utils/timeCalculations';

interface TimeTableProps {
  lineId: number;
  isWeekend: boolean;
}

export function TimeTable({ lineId, isWeekend }: TimeTableProps) {
  const theme = useTheme();
  const { settings } = useSettings();
  const stops = getStopsForLine(lineId);

  if (stops.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No schedule available</Typography>
      </Paper>
    );
  }

  // Get all times for the first stop to determine columns
  const firstStop = stops[0];
  const allTimes = firstStop ? getTimesForStop(lineId, firstStop.id, isWeekend) : [];
  const currentTime = getCurrentTimeString();

  return (
    <Paper
      sx={{
        overflow: 'auto',
        maxHeight: 'calc(100vh - 300px)',
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
        {allTimes.map((_, index) => (
          <Box
            key={`header-${index}`}
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              p: 1.5,
              textAlign: 'center',
              fontWeight: 500,
              fontSize: '0.85rem',
            }}
          >
            #{index + 101}
          </Box>
        ))}

        {/* Data rows */}
        {stops.map((stop: Stop, rowIndex: number) => {
          const times = getTimesForStop(lineId, stop.id, isWeekend);
          const isEvenRow = rowIndex % 2 === 0;

          return (
            <>
              {/* Stop name cell */}
              <Box
                key={`stop-${stop.id}`}
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
              {times.map((time, colIndex) => {
                const past = isPastTime(time);
                const isCurrentTime =
                  time === currentTime ||
                  (time > currentTime && (times[colIndex - 1] ?? '00:00') < currentTime);

                return (
                  <Box
                    key={`time-${stop.id}-${colIndex}`}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isCurrentTime
                        ? 'warning.light'
                        : isEvenRow
                          ? theme.palette.mode === 'dark'
                            ? 'grey.900'
                            : 'grey.50'
                          : 'background.paper',
                      color: past ? 'text.disabled' : 'text.primary',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    }}
                  >
                    {formatTime(time, settings.timeFormat === '24h')}
                  </Box>
                );
              })}
            </>
          );
        })}
      </Box>
    </Paper>
  );
}
