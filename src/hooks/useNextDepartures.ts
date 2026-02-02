import { useMemo } from 'react';
import type { Departure, StopId } from '@/types';
import { getNextDepartures } from '@/utils/scheduleParser';
import { useCurrentTime } from './useCurrentTime';

export function useNextDepartures(
  stopId: StopId | null,
  limit: number = 5
): Departure[] {
  const currentTime = useCurrentTime();

  return useMemo(() => {
    if (stopId === null) return [];
    return getNextDepartures(stopId, limit, currentTime);
  }, [stopId, limit, currentTime]);
}
