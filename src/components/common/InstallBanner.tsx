import { Box, Typography, IconButton } from '@mui/material';
import { GetApp, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { usePWA } from '@/contexts/PWAContext';
import { trackEvent } from '@/hooks/usePlausible';

export function InstallBanner() {
  const { t } = useTranslation();
  const { isInstallable, installDismissed, install, dismissInstallBanner } = usePWA();

  if (!isInstallable || installDismissed) {
    return null;
  }

  const handleInstall = () => {
    trackEvent('App Install', { props: { source: 'home_banner' } });
    install();
  };

  return (
    <Box
      onClick={handleInstall}
      sx={{
        py: 1,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'rgba(16, 185, 129, 0.9)',
        color: '#fff',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'rgba(16, 185, 129, 1)',
        },
      }}
    >
      <GetApp fontSize="small" />
      <Typography variant="body2" sx={{ flex: 1 }}>
        {t('settings.installApp')}
      </Typography>
      <IconButton
        aria-label={t('map.close')}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          dismissInstallBanner();
        }}
        sx={{ color: 'inherit' }}
      >
        <Close fontSize="small" />
      </IconButton>
    </Box>
  );
}
