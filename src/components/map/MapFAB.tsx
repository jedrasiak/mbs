import { Box, Fab, Tooltip } from '@mui/material';
import { MyLocation, Layers } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MapFABProps {
  onCenterUser: () => void;
  onToggleLayers?: () => void;
  showLayersButton?: boolean;
}

export function MapFAB({ onCenterUser, onToggleLayers, showLayersButton = false }: MapFABProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: 'absolute',
        right: 16,
        bottom: 80, // Above bottom nav
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {showLayersButton && onToggleLayers && (
        <Tooltip title={t('map.toggleLayers')} placement="left">
          <Fab
            size="small"
            color="default"
            onClick={onToggleLayers}
            aria-label={t('map.toggleMapLayers')}
            sx={{ bgcolor: 'background.paper' }}
          >
            <Layers />
          </Fab>
        </Tooltip>
      )}
      <Tooltip title={t('map.myLocation')} placement="left">
        <Fab
          size="medium"
          color="primary"
          onClick={onCenterUser}
          aria-label={t('map.centerOnMyLocation')}
        >
          <MyLocation />
        </Fab>
      </Tooltip>
    </Box>
  );
}
