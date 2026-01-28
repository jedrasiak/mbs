import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useSettings } from '@/contexts/SettingsContext';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';
import { formatCurrentTime, isWeekend } from '@/utils/timeCalculations';

export function CurrentTime() {
  const { t } = useTranslation();
  const currentTime = useCurrentTime();
  const { settings } = useSettings();
  const { formatDateShort } = useLocalizedDate();

  const timeString = formatCurrentTime(settings.timeFormat === '24h');
  const dateString = formatDateShort(currentTime);
  const dayType = isWeekend(currentTime) ? t('home.weekendSchedule') : t('home.weekdaySchedule');

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
