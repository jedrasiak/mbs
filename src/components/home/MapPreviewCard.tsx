import { Card, CardContent, CardActionArea, Typography, Box } from '@mui/material';
import { Map as MapIcon, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export function MapPreviewCard() {
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
                  View Route Map
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  See all stops and your location
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
