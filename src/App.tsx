import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BottomNav } from '@/components/common';
import { HomePage, SchedulePage, MapPage, SettingsPage } from '@/pages';
import { setLanguage } from '@/i18n';

function LanguageSync() {
  const { settings } = useSettings();

  useEffect(() => {
    // Sync language from settings on mount and when it changes
    // null means "Auto" - detect from browser
    setLanguage(settings.language);
  }, [settings.language]);

  return null;
}

function AppContent() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageSync />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNav />
      </Box>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SettingsProvider>
  );
}
