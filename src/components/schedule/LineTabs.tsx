import { Tabs, Tab, Box, Typography } from '@mui/material';
import type { Line } from '@/types';
import { getAllLines, doesLineOperateOnDayType } from '@/utils/scheduleParser';
import { getDayType } from '@/utils/timeCalculations';
import type { DayType } from '@/types';

interface LineTabsProps {
  value: number;
  onChange: (lineId: number) => void;
  dayType?: DayType;
}

export function LineTabs({ value, onChange, dayType }: LineTabsProps) {
  const lines = getAllLines();
  const currentDayType = dayType ?? getDayType() ?? 'weekday';

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
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
                      (weekdays only)
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
