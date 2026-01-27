import { Paper, Box, Typography, Chip, IconButton, Divider, Button } from '@mui/material';
import { Close, Directions, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Stop } from '@/types';
import { useNextDepartures } from '@/hooks/useNextDepartures';
import { useSettings } from '@/contexts/SettingsContext';
import {
  formatDistance,
  calculateDistance,
  getDirectionsServingPlatform,
} from '@/utils/scheduleParser';
import { formatTime, formatMinutesUntil, getServiceStatus } from '@/utils/timeCalculations';

interface StopBottomSheetProps {
  stop: Stop;
  platform: 'A' | 'B';
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export function StopBottomSheet({
  stop,
  platform,
  userLocation,
  onClose,
}: StopBottomSheetProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const departures = useNextDepartures(stop.id, 5);
  const serviceStatus = getServiceStatus();

  // Get directions serving this specific platform
  const directions = getDirectionsServingPlatform(stop.id, platform);
  const platformInfo = stop.platforms[platform];

  // Calculate distance to this platform
  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        platformInfo.lat,
        platformInfo.lng
      )
    : null;

  // Filter departures to only those from this platform's directions
  const platformDirectionIds = new Set(directions.map(d => d.directionId));
  const platformDepartures = departures.filter(dep =>
    platformDirectionIds.has(dep.directionId)
  );

  // Get unique lines
  const uniqueLines = [...new Map(directions.map(d => [d.lineId, d])).values()];

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
            <Typography variant="caption" color="text.secondary">
              Platform {platform}
              {platformInfo.description && ` - ${platformInfo.description}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {uniqueLines.map(line => (
                <Chip
                  key={line.lineId}
                  label={line.lineName}
                  size="small"
                  sx={{
                    bgcolor: line.lineColor,
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
          Next Departures from Platform {platform}
        </Typography>

        {!serviceStatus.isOperating ? (
          <Typography variant="body2" color="warning.main">
            No service today ({serviceStatus.reason})
          </Typography>
        ) : platformDepartures.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            No more departures from this platform today
          </Typography>
        ) : (
          platformDepartures.slice(0, 4).map((dep, index) => (
            <Box
              key={`${dep.directionId}-${dep.time}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                borderBottom: index < Math.min(platformDepartures.length, 4) - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <Chip
                  label={dep.lineName}
                  size="small"
                  sx={{
                    bgcolor: dep.lineColor,
                    color: 'white',
                    fontWeight: 500,
                    minWidth: 60,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body1">
                    {formatTime(dep.time, settings.timeFormat === '24h')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ArrowForward sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {dep.destinationName}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography
                variant="body2"
                color={index === 0 ? 'warning.main' : 'text.secondary'}
                fontWeight={index === 0 ? 600 : 400}
                sx={{ flexShrink: 0, ml: 1 }}
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
