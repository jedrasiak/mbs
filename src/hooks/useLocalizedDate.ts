import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl, uk, enUS } from 'date-fns/locale';

const locales = {
  en: enUS,
  pl: pl,
  uk: uk,
};

export function useLocalizedDate() {
  const { i18n } = useTranslation();
  const currentLocale = locales[i18n.language as keyof typeof locales] || enUS;

  const formatDate = (date: Date, formatStr: string = 'EEEE, MMMM d, yyyy'): string => {
    return format(date, formatStr, { locale: currentLocale });
  };

  const formatDateShort = (date: Date): string => {
    return format(date, 'EEEE, MMMM d', { locale: currentLocale });
  };

  return {
    formatDate,
    formatDateShort,
    locale: currentLocale,
  };
}
