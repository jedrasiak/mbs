import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import type { Departure } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { formatTime, formatMinutesUntil } from '@/utils/timeCalculations';
import { ACCENT_COLOR } from '@/theme/theme';

interface DepartureCardProps {
  departure: Departure;
  isNext?: boolean;
}

export function DepartureCard({ departure, isNext = false }: DepartureCardProps) {
  const { settings } = useSettings();
  const formattedTime = formatTime(departure.time, settings.timeFormat === '24h');
  const timeUntil = formatMinutesUntil(departure.minutesUntil);

  return (
    <Card
      sx={{
        mb: 1.5,
        ...(isNext && { border: `2px solid ${ACCENT_COLOR}` }),
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {isNext && (
        <Chip
          label="NEXT BUS"
          size="small"
          sx={{
            position: 'absolute',
            top: -10,
            right: 12,
            bgcolor: ACCENT_COLOR,
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      )}
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            <Chip
              label={departure.lineName}
              sx={{
                bgcolor: departure.lineColor,
                color: 'white',
                fontWeight: 600,
                minWidth: 70,
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" component="span">
                {formattedTime}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowForward sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  title={departure.destinationName}
                >
                  {departure.destinationName}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography
            variant="h6"
            component="span"
            sx={{
              color: isNext ? ACCENT_COLOR : 'text.secondary',
              fontWeight: isNext ? 700 : 500,
              flexShrink: 0,
              ml: 1,
            }}
          >
            {timeUntil}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
