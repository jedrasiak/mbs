import { Tabs, Tab, Box } from '@mui/material';
import type { Line } from '@/types';
import { getAllLines } from '@/utils/scheduleParser';

interface LineTabsProps {
  value: number;
  onChange: (lineId: number) => void;
}

export function LineTabs({ value, onChange }: LineTabsProps) {
  const lines = getAllLines();

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
        {lines.map((line: Line) => (
          <Tab
            key={line.id}
            value={line.id}
            label={line.name}
            sx={{
              fontWeight: 600,
              '&.Mui-selected': {
                color: line.color,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
