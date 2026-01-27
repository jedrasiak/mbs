import { useMemo } from 'react';
import type { Departure } from '@/types';
import { getNextDepartures } from '@/utils/scheduleParser';
import { useCurrentTime } from './useCurrentTime';

export function useNextDepartures(
  stopId: number | null,
  limit: number = 5
): Departure[] {
  const currentTime = useCurrentTime();

  return useMemo(() => {
    if (stopId === null) return [];
    return getNextDepartures(stopId, limit, currentTime);
  }, [stopId, limit, currentTime]);
}
