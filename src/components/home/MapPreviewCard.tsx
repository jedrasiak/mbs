import { Card, CardContent, CardActionArea, Typography, Box } from '@mui/material';
import { Map as MapIcon, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function MapPreviewCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card sx={{ mt: 2 }}>
      <CardActionArea onClick={() => navigate('/map')}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MapIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={500}>
                  {t('home.viewRouteMap')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('home.seeAllStops')}
                </Typography>
              </Box>
            </Box>
            <ChevronRight color="action" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
