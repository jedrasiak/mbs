import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
  Divider,
  Chip,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import {
  DarkMode,
  AccessTime,
  FavoriteBorder,
  Home,
  Info,
  Close,
} from '@mui/icons-material';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { StopSelector } from '@/components/home/StopSelector';
import { getStopById } from '@/utils/scheduleParser';

export function SettingsForm() {
  const { settings, updateSettings } = useSettings();
  const { toggleDarkMode } = useTheme();

  const handleAddFavorite = (stopId: number | null) => {
    if (stopId === null) return;
    if (settings.favoriteStops.includes(stopId)) return;
    if (settings.favoriteStops.length >= 3) return;

    updateSettings({
      favoriteStops: [...settings.favoriteStops, stopId],
    });
  };

  const handleRemoveFavorite = (stopId: number) => {
    updateSettings({
      favoriteStops: settings.favoriteStops.filter(id => id !== stopId),
    });
  };

  return (
    <Box>
      {/* Preferences */}
      <List
        subheader={
          <ListSubheader component="div">Preferences</ListSubheader>
        }
      >
        <ListItem>
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Default Home Stop
            </Typography>
            <StopSelector
              value={settings.defaultStopId}
              onChange={stopId => updateSettings({ defaultStopId: stopId })}
              label="Select default stop"
            />
          </Box>
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <AccessTime />
          </ListItemIcon>
          <ListItemText primary="24-hour time format" />
          <Switch
            edge="end"
            checked={settings.timeFormat === '24h'}
            onChange={e =>
              updateSettings({ timeFormat: e.target.checked ? '24h' : '12h' })
            }
            inputProps={{ 'aria-label': 'Toggle 24-hour time format' }}
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <DarkMode />
          </ListItemIcon>
          <ListItemText primary="Dark mode" />
          <Switch
            edge="end"
            checked={settings.darkMode}
            onChange={toggleDarkMode}
            inputProps={{ 'aria-label': 'Toggle dark mode' }}
          />
        </ListItem>
      </List>

      <Divider />

      {/* My Route */}
      <List
        subheader={
          <ListSubheader component="div">
            Favorite Stops ({settings.favoriteStops.length}/3)
          </ListSubheader>
        }
      >
        <ListItem>
          <ListItemIcon>
            <FavoriteBorder />
          </ListItemIcon>
          <Box sx={{ flex: 1 }}>
            {/* Current favorites */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {settings.favoriteStops.map(stopId => {
                const stop = getStopById(stopId);
                if (!stop) return null;
                return (
                  <Chip
                    key={stopId}
                    label={stop.name}
                    onDelete={() => handleRemoveFavorite(stopId)}
                    deleteIcon={
                      <IconButton size="small" aria-label={`Remove ${stop.name} from favorites`}>
                        <Close fontSize="small" />
                      </IconButton>
                    }
                  />
                );
              })}
              {settings.favoriteStops.length === 0 && (
                <Typography variant="body2" color="text.disabled">
                  No favorite stops yet
                </Typography>
              )}
            </Box>

            {/* Add favorite */}
            {settings.favoriteStops.length < 3 && (
              <StopSelector
                value={null}
                onChange={handleAddFavorite}
                label="Add favorite stop"
              />
            )}
          </Box>
        </ListItem>
      </List>

      <Divider />

      {/* About */}
      <List
        subheader={<ListSubheader component="div">About</ListSubheader>}
      >
        <ListItem>
          <ListItemIcon>
            <Info />
          </ListItemIcon>
          <ListItemText
            primary="Bus Schedule Helper"
            secondary="Version 1.0.0"
          />
        </ListItem>
      </List>

      <Paper sx={{ m: 2, p: 2 }} variant="outlined">
        <Typography variant="caption" color="text.secondary">
          This app provides municipal bus schedule information. Data may not reflect
          real-time conditions. Always verify with official sources.
        </Typography>
      </Paper>
    </Box>
  );
}
