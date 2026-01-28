import { Alert, AlertTitle, Button, IconButton } from '@mui/material';
import { GetApp, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { usePWA } from '@/contexts/PWAContext';

export function InstallBanner() {
  const { t } = useTranslation();
  const { isInstallable, installDismissed, install, dismissInstallBanner } = usePWA();

  if (!isInstallable || installDismissed) {
    return null;
  }

  return (
    <Alert
      severity="info"
      icon={<GetApp />}
      sx={{ mb: 2 }}
      action={
        <>
          <Button color="inherit" size="small" onClick={install}>
            {t('settings.install')}
          </Button>
          <IconButton
            aria-label={t('map.close')}
            color="inherit"
            size="small"
            onClick={dismissInstallBanner}
          >
            <Close fontSize="small" />
          </IconButton>
        </>
      }
    >
      <AlertTitle>{t('settings.installApp')}</AlertTitle>
      {t('settings.installAppDescription')}
    </Alert>
  );
}
