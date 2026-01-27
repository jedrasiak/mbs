import { Box, Fab, Tooltip } from '@mui/material';
import { MyLocation, Layers } from '@mui/icons-material';

interface MapFABProps {
  onCenterUser: () => void;
  onToggleLayers?: () => void;
  showLayersButton?: boolean;
}

export function MapFAB({ onCenterUser, onToggleLayers, showLayersButton = false }: MapFABProps) {
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
        <Tooltip title="Toggle layers" placement="left">
          <Fab
            size="small"
            color="default"
            onClick={onToggleLayers}
            aria-label="Toggle map layers"
            sx={{ bgcolor: 'background.paper' }}
          >
            <Layers />
          </Fab>
        </Tooltip>
      )}
      <Tooltip title="My location" placement="left">
        <Fab
          size="medium"
          color="primary"
          onClick={onCenterUser}
          aria-label="Center on my location"
        >
          <MyLocation />
        </Fab>
      </Tooltip>
    </Box>
  );
}
