import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, Schedule, Map, Settings } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Home', icon: <Home />, path: '/' },
  { label: 'Schedule', icon: <Schedule />, path: '/schedule' },
  { label: 'Map', icon: <Map />, path: '/map' },
  { label: 'Settings', icon: <Settings />, path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

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
            aria-label={`Navigate to ${item.label}`}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
