import { ToggleButtonGroup, ToggleButton, Box } from '@mui/material';

interface DayTypeToggleProps {
  value: 'weekday' | 'weekend';
  onChange: (value: 'weekday' | 'weekend') => void;
}

export function DayTypeToggle({ value, onChange }: DayTypeToggleProps) {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: 'weekday' | 'weekend' | null) => {
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
          Weekday
        </ToggleButton>
        <ToggleButton value="weekend" aria-label="Weekend schedule">
          Weekend
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
