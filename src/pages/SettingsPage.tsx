import { Box } from '@mui/material';
import { Header } from '@/components/common';
import { SettingsForm } from '@/components/settings';

export function SettingsPage() {
  return (
    <Box sx={{ pb: 10 }}>
      <Header title="Settings" />
      <SettingsForm />
    </Box>
  );
}
