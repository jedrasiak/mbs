import { useTranslation } from 'react-i18next';

export function useLocalizedTime() {
  const { t } = useTranslation();

  const formatMinutesUntil = (minutes: number): string => {
    if (minutes < 0) return t('time.departed');
    if (minutes === 0) return t('time.now');
    if (minutes < 60) return t('time.minute', { count: minutes });

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return hours === 1 ? t('time.hour', { count: hours }) : t('time.hours', { count: hours });
    }

    return t('time.hourMinute', { hours, minutes: remainingMinutes });
  };

  return {
    formatMinutesUntil,
  };
}
