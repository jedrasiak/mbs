import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/common';

export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ pb: 10 }}>
      <Header title="404" />
      <Container
        maxWidth="sm"
        sx={{
          pt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
          404
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('notFound.message', 'Strona nie została znaleziona')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('notFound.goHome', 'Wróć do strony głównej')}
        </Button>
      </Container>
    </Box>
  );
}
