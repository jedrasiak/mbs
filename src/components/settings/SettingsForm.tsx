import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
  Divider,
  Chip,
  IconButton,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Link,
  type SelectChangeEvent,
} from '@mui/material';
import {
  DarkMode,
  AccessTime,
  FavoriteBorder,
  Home,
  Info,
  Close,
  Language,
  Person,
  GetApp,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { StopSelector } from '@/components/home/StopSelector';
import { getStopById } from '@/utils/scheduleParser';
import { setLanguage, supportedLanguages, detectBrowserLanguage, type SupportedLanguage } from '@/i18n';
import type { Language as LanguageType } from '@/types';
import { usePWA } from '@/contexts/PWAContext';

export function SettingsForm() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { toggleDarkMode } = useTheme();
  const { isInstallable, isInstalled, install } = usePWA();

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

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === 'auto') {
      setLanguage(null);
      updateSettings({ language: null });
    } else {
      const lang = value as SupportedLanguage;
      setLanguage(lang);
      updateSettings({ language: lang as LanguageType });
    }
  };

  const currentLanguageValue = settings.language ?? 'auto';

  return (
    <Box>
      {/* Preferences */}
      <List
        subheader={
          <ListSubheader component="div">{t('settings.preferences')}</ListSubheader>
        }
      >
        <ListItem>
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('settings.defaultHomeStop')}
            </Typography>
            <StopSelector
              value={settings.defaultStopId}
              onChange={stopId => updateSettings({ defaultStopId: stopId })}
              label={t('settings.selectDefaultStop')}
            />
          </Box>
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <AccessTime />
          </ListItemIcon>
          <ListItemText primary={t('settings.timeFormat24h')} />
          <Switch
            edge="end"
            checked={settings.timeFormat === '24h'}
            onChange={e =>
              updateSettings({ timeFormat: e.target.checked ? '24h' : '12h' })
            }
            inputProps={{ 'aria-label': t('settings.toggleTimeFormat') }}
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <DarkMode />
          </ListItemIcon>
          <ListItemText primary={t('settings.darkMode')} />
          <Switch
            edge="end"
            checked={settings.darkMode}
            onChange={toggleDarkMode}
            inputProps={{ 'aria-label': t('settings.toggleDarkMode') }}
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <Language />
          </ListItemIcon>
          <ListItemText primary={t('settings.language')} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={currentLanguageValue}
              onChange={handleLanguageChange}
              aria-label={t('settings.selectLanguage')}
            >
              <MenuItem value="auto">
                Auto ({t(`languages.${detectBrowserLanguage()}`)})
              </MenuItem>
              {supportedLanguages.map(lang => (
                <MenuItem key={lang} value={lang}>
                  {t(`languages.${lang}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>
      </List>

      <Divider />

      {/* My Route */}
      <List
        subheader={
          <ListSubheader component="div">
            {t('settings.favoriteStops', { count: settings.favoriteStops.length })}
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
                      <IconButton size="small" aria-label={t('settings.removeFavorite', { stopName: stop.name })}>
                        <Close fontSize="small" />
                      </IconButton>
                    }
                  />
                );
              })}
              {settings.favoriteStops.length === 0 && (
                <Typography variant="body2" color="text.disabled">
                  {t('settings.noFavoriteStops')}
                </Typography>
              )}
            </Box>

            {/* Add favorite */}
            {settings.favoriteStops.length < 3 && (
              <StopSelector
                value={null}
                onChange={handleAddFavorite}
                label={t('settings.addFavoriteStop')}
              />
            )}
          </Box>
        </ListItem>
      </List>

      <Divider />

      {/* App */}
      {(isInstallable || isInstalled) && (
        <>
          <List
            subheader={<ListSubheader component="div">{t('settings.app')}</ListSubheader>}
          >
            {isInstallable ? (
              <ListItemButton onClick={install}>
                <ListItemIcon>
                  <GetApp />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.installApp')}
                  secondary={t('settings.installAppDescription')}
                />
              </ListItemButton>
            ) : (
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.appInstalled')}
                  secondary={t('settings.appInstalledDescription')}
                />
              </ListItem>
            )}
          </List>
          <Divider />
        </>
      )}

      {/* About */}
      <List
        subheader={<ListSubheader component="div">{t('settings.about')}</ListSubheader>}
      >
        <ListItem>
          <ListItemIcon>
            <Info />
          </ListItemIcon>
          <ListItemText
            primary={t('app.name')}
            secondary={t('app.version')}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText
            primary={
              <Link
                href="https://www.jedrasiak.eu/"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                Łukasz Jędrasiak
              </Link>
            }
            secondary={t('settings.author')}
          />
        </ListItem>
      </List>
    </Box>
  );
}
