import { useState, useEffect } from 'react';
import { Box, Container, Alert, Typography } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/common';
import {
  LineTabs,
  DayTypeToggle,
  DirectionSelector,
  TimeTable,
} from '@/components/schedule';
import {
  getAllLines,
  getDirectionsForLine,
  doesLineOperateOnDayType,
  getLineById,
} from '@/utils/scheduleParser';
import {
  getDayType,
  getServiceStatus,
  getNextOperatingDay,
} from '@/utils/timeCalculations';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';
import type { DayType, LineId, DirectionId } from '@/types';

export function SchedulePage() {
  const { t } = useTranslation();
  const { formatDate } = useLocalizedDate();
  const lines = getAllLines();
  const defaultLine = lines[0];
  const serviceStatus = getServiceStatus();

  const [selectedLineId, setSelectedLineId] = useState<LineId>(defaultLine?.id ?? 'line1');
  const [dayType, setDayType] = useState<DayType>(
    getDayType() ?? 'weekday'
  );
  const [selectedDirectionId, setSelectedDirectionId] = useState<DirectionId | null>(null);

  // When line changes, reset direction and check if line operates on current day type
  useEffect(() => {
    const line = getLineById(selectedLineId);
    if (line) {
      // If the line doesn't operate on the selected day type, switch to weekday
      if (!doesLineOperateOnDayType(line, dayType)) {
        setDayType('weekday');
      }
      // Select the first direction by default
      const directions = getDirectionsForLine(selectedLineId);
      const firstDirection = directions[0];
      if (firstDirection) {
        setSelectedDirectionId(firstDirection.id);
      } else {
        setSelectedDirectionId(null);
      }
    }
  }, [selectedLineId]);

  // When day type changes, verify the line operates on that day
  useEffect(() => {
    const line = getLineById(selectedLineId);
    if (line && !doesLineOperateOnDayType(line, dayType)) {
      // Switch to a line that operates on this day type
      const operatingLine = lines.find(l => doesLineOperateOnDayType(l, dayType));
      if (operatingLine) {
        setSelectedLineId(operatingLine.id);
      }
    }
  }, [dayType, selectedLineId, lines]);

  return (
    <Box sx={{ pb: 10 }}>
      <Header title={t('schedule.fullSchedule')} />
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        {/* Non-operating day alert */}
        {!serviceStatus.isOperating && (
          <Alert severity="warning" icon={<EventBusy />} sx={{ mb: 2 }}>
            {t('home.noServiceToday')} ({serviceStatus.reason}).{' '}
            {t('home.nextService', { date: formatDate(getNextOperatingDay()) })}
          </Alert>
        )}

        <LineTabs
          value={selectedLineId}
          onChange={setSelectedLineId}
          dayType={dayType}
        />

        <DayTypeToggle
          value={dayType}
          onChange={setDayType}
          lineId={selectedLineId}
        />

        <DirectionSelector
          lineId={selectedLineId}
          selectedDirectionId={selectedDirectionId}
          onChange={setSelectedDirectionId}
        />

        {selectedDirectionId ? (
          <TimeTable directionId={selectedDirectionId} dayType={dayType} />
        ) : (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {t('schedule.selectDirection')}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
