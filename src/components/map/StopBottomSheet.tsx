import { Paper, Box, Typography, Chip, IconButton, Divider, Button } from '@mui/material';
import { Close, Directions } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Stop, Line } from '@/types';
import { useNextDepartures } from '@/hooks/useNextDepartures';
import { useSettings } from '@/contexts/SettingsContext';
import { formatDistance, calculateDistance } from '@/utils/scheduleParser';
import { formatTime, formatMinutesUntil } from '@/utils/timeCalculations';

interface StopBottomSheetProps {
  stop: Stop;
  lines: Line[];
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export function StopBottomSheet({ stop, lines, userLocation, onClose }: StopBottomSheetProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const departures = useNextDepartures(stop.id, 3);

  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, stop.lat, stop.lng)
    : null;

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 64, // Above bottom nav
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '50vh',
        overflow: 'auto',
      }}
      elevation={8}
    >
      {/* Handle bar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: 'grey.300',
            borderRadius: 2,
          }}
        />
      </Box>

      {/* Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {stop.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
              {lines.map(line => (
                <Chip
                  key={line.id}
                  label={line.name}
                  size="small"
                  sx={{
                    bgcolor: line.color,
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}
                />
              ))}
              {distance !== null && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <Directions sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDistance(distance)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <Close />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Departures */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Next Departures
        </Typography>

        {departures.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            No more departures today
          </Typography>
        ) : (
          departures.map((dep, index) => (
            <Box
              key={`${dep.lineId}-${dep.time}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                borderBottom: index < departures.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  label={dep.lineName}
                  size="small"
                  sx={{
                    bgcolor: dep.lineColor,
                    color: 'white',
                    fontWeight: 500,
                    minWidth: 60,
                  }}
                />
                <Typography variant="body1">
                  {formatTime(dep.time, settings.timeFormat === '24h')}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color={index === 0 ? 'warning.main' : 'text.secondary'}
                fontWeight={index === 0 ? 600 : 400}
              >
                {formatMinutesUntil(dep.minutesUntil)}
              </Typography>
            </Box>
          ))
        )}

        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => navigate('/schedule')}
        >
          View Full Schedule
        </Button>
      </Box>
    </Paper>
  );
}
