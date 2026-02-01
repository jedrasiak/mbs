import { Tabs, Tab, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Line, LineId, DayType } from '@/types';
import { getAllLines, doesLineOperateOnDayType } from '@/utils/scheduleParser';
import { getDayType } from '@/utils/timeCalculations';

interface LineTabsProps {
  value: LineId;
  onChange: (lineId: LineId) => void;
  dayType?: DayType;
}

export function LineTabs({ value, onChange, dayType }: LineTabsProps) {
  const { t } = useTranslation();
  const lines = getAllLines();
  const currentDayType = dayType ?? getDayType() ?? 'weekday';

  const handleChange = (_: React.SyntheticEvent, newValue: LineId) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="fullWidth"
        aria-label="Line selection tabs"
      >
        {lines.map((line: Line) => {
          const operates = doesLineOperateOnDayType(line, currentDayType);

          return (
            <Tab
              key={line.id}
              value={line.id}
              disabled={!operates}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{line.name}</span>
                  {!operates && (
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {t('schedule.weekdaysOnly')}
                    </Typography>
                  )}
                </Box>
              }
              sx={{
                fontWeight: 600,
                '&.Mui-selected': {
                  color: line.color,
                },
                '&.Mui-disabled': {
                  opacity: 0.5,
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}
