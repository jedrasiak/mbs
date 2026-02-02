import { useState, useEffect, useRef } from 'react';
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
import { loadScheduleSelection, saveScheduleSelection } from '@/utils/storage';
import { useLocalizedDate } from '@/hooks/useLocalizedDate';
import type { DayType, LineId, DirectionId } from '@/types';

export function SchedulePage() {
  const { t } = useTranslation();
  const { formatDate } = useLocalizedDate();
  const lines = getAllLines();
  const defaultLine = lines[0];
  const serviceStatus = getServiceStatus();

  // Use lazy initialization to load saved selection only once
  const [selectedLineId, setSelectedLineId] = useState<LineId>(() => {
    const saved = loadScheduleSelection();
    return saved?.lineId ?? defaultLine?.id ?? 'line1';
  });
  const [dayType, setDayType] = useState<DayType>(() => {
    const saved = loadScheduleSelection();
    return saved?.dayType ?? getDayType() ?? 'weekday';
  });
  const [selectedDirectionId, setSelectedDirectionId] = useState<DirectionId | null>(() => {
    const saved = loadScheduleSelection();
    if (saved) {
      // Validate the saved direction still exists for this line
      const directions = getDirectionsForLine(saved.lineId);
      if (directions.some(d => d.id === saved.directionId)) {
        return saved.directionId;
      }
    }
    // No saved direction, use first direction of the default line
    const lineId = saved?.lineId ?? defaultLine?.id ?? 'line1';
    const directions = getDirectionsForLine(lineId);
    return directions[0]?.id ?? null;
  });

  // Track the previous lineId to detect user-initiated line changes
  const prevLineIdRef = useRef<LineId>(selectedLineId);

  // When line changes (by user), reset direction
  useEffect(() => {
    // Only reset direction if line actually changed (not on initial mount)
    if (prevLineIdRef.current !== selectedLineId) {
      prevLineIdRef.current = selectedLineId;

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
    }
  }, [selectedLineId, dayType]);

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

  // Save selection when it changes
  useEffect(() => {
    if (selectedDirectionId) {
      saveScheduleSelection({
        lineId: selectedLineId,
        dayType,
        directionId: selectedDirectionId,
      });
    }
  }, [selectedLineId, dayType, selectedDirectionId]);

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
