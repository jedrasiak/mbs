import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, Schedule, Map, Settings } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: t('nav.home'), icon: <Home />, path: '/' },
    { label: t('nav.schedule'), icon: <Schedule />, path: '/schedule' },
    { label: t('nav.map'), icon: <Map />, path: '/map' },
    { label: t('nav.settings'), icon: <Settings />, path: '/settings' },
  ];

  const currentIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <Paper
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}
      elevation={3}
    >
      <BottomNavigation
        value={currentIndex}
        onChange={(_, newValue) => {
          const item = navItems[newValue];
          if (item) {
            navigate(item.path);
          }
        }}
        showLabels
      >
        {navItems.map(item => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            aria-label={t('nav.navigateTo', { label: item.label })}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
