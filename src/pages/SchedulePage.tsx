import { useState } from 'react';
import { Box, Container } from '@mui/material';
import { Header } from '@/components/common';
import { LineTabs, DayTypeToggle, TimeTable } from '@/components/schedule';
import { getAllLines } from '@/utils/scheduleParser';
import { isWeekend } from '@/utils/timeCalculations';

export function SchedulePage() {
  const lines = getAllLines();
  const defaultLine = lines[0];
  const [selectedLineId, setSelectedLineId] = useState(defaultLine?.id ?? 1);
  const [dayType, setDayType] = useState<'weekday' | 'weekend'>(
    isWeekend() ? 'weekend' : 'weekday'
  );

  return (
    <Box sx={{ pb: 10 }}>
      <Header title="Full Schedule" />
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        <LineTabs value={selectedLineId} onChange={setSelectedLineId} />
        <DayTypeToggle value={dayType} onChange={setDayType} />
        <TimeTable lineId={selectedLineId} isWeekend={dayType === 'weekend'} />
      </Container>
    </Box>
  );
}
