import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/common';
import { SettingsForm } from '@/components/settings';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <Box sx={{ pb: 10 }}>
      <Header title={t('settings.title')} />
      <SettingsForm />
    </Box>
  );
}
