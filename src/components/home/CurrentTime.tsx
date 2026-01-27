import { Typography, Box } from '@mui/material';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrentTime, isWeekend } from '@/utils/timeCalculations';
import { format } from 'date-fns';

export function CurrentTime() {
  const currentTime = useCurrentTime();
  const { settings } = useSettings();

  const timeString = formatCurrentTime(settings.timeFormat === '24h');
  const dateString = format(currentTime, 'EEEE, MMMM d');
  const dayType = isWeekend(currentTime) ? 'Weekend Schedule' : 'Weekday Schedule';

  return (
    <Box sx={{ textAlign: 'center', mb: 3 }}>
      <Typography
        variant="h1"
        component="div"
        sx={{
          fontSize: '3.5rem',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {timeString}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        {dateString}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: 'inline-block',
          mt: 1,
          px: 1.5,
          py: 0.5,
          bgcolor: 'action.selected',
          borderRadius: 1,
        }}
      >
        {dayType}
      </Typography>
    </Box>
  );
}
