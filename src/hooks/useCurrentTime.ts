import { useState, useEffect } from 'react';

export function useCurrentTime(intervalMs: number = 60000): Date {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());

    // Calculate delay until the next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // First update at the start of the next minute
    const timeout = setTimeout(() => {
      updateTime();

      // Then update every interval
      const interval = setInterval(updateTime, intervalMs);

      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, [intervalMs]);

  return currentTime;
}
