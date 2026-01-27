import { ToggleButtonGroup, ToggleButton, Box, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DayType } from '@/types';
import { doesLineOperateOnDayType, getLineById } from '@/utils/scheduleParser';

interface DayTypeToggleProps {
  value: DayType;
  onChange: (value: DayType) => void;
  lineId?: number;
}

export function DayTypeToggle({ value, onChange, lineId }: DayTypeToggleProps) {
  const { t } = useTranslation();
  const line = lineId ? getLineById(lineId) : undefined;
  const weekendDisabled = line ? !doesLineOperateOnDayType(line, 'weekend') : false;

  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: DayType | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="Day type selection"
        size="small"
      >
        <ToggleButton value="weekday" aria-label="Weekday schedule">
          {t('schedule.weekday')}
        </ToggleButton>
        <Tooltip
          title={weekendDisabled ? t('schedule.lineNotOperatesWeekends') : ''}
          arrow
        >
          <span>
            <ToggleButton
              value="weekend"
              aria-label="Weekend schedule"
              disabled={weekendDisabled}
            >
              {t('schedule.weekend')}
            </ToggleButton>
          </span>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
}
