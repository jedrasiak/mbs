import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Departure } from '@/types';

interface DepartureFiltersProps {
  departures: Departure[];
  selectedRoute: string;
  selectedDirection: string;
  onRouteChange: (route: string) => void;
  onDirectionChange: (direction: string) => void;
}

const ALL_VALUE = '__all__';

export function DepartureFilters({
  departures,
  selectedRoute,
  selectedDirection,
  onRouteChange,
  onDirectionChange,
}: DepartureFiltersProps) {
  const { t } = useTranslation();

  // Extract unique routes from departures
  const routes = Array.from(
    new Map(
      departures.map((d) => [d.lineId, { id: d.lineId, name: d.lineName, color: d.lineColor }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Extract unique directions from departures (filtered by selected route if applicable)
  const filteredForDirections = selectedRoute === ALL_VALUE
    ? departures
    : departures.filter((d) => d.lineId === selectedRoute);

  const directions = Array.from(
    new Map(
      filteredForDirections.map((d) => [d.destinationName, d.destinationName])
    ).values()
  ).sort((a, b) => a.localeCompare(b));

  // Get the selected route data for display in the select
  const selectedRouteData = routes.find((r) => r.id === selectedRoute);

  // Extract line number from line name for display (e.g., "Linia 1" -> "1")
  const getLineNumber = (lineName: string): string => {
    const match = lineName.match(/\d+/);
    return match ? match[0] : lineName;
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <FormControl sx={{ minWidth: 120, flex: 1 }}>
        <InputLabel id="route-filter-label">{t('home.filterRoute')}</InputLabel>
        <Select
          labelId="route-filter-label"
          value={selectedRoute}
          label={t('home.filterRoute')}
          onChange={(e) => {
            onRouteChange(e.target.value);
            // Reset direction when route changes
            onDirectionChange(ALL_VALUE);
          }}
          renderValue={(value) => {
            if (value === ALL_VALUE) {
              return t('home.allRoutes');
            }
            if (selectedRouteData) {
              const lineNum = getLineNumber(selectedRouteData.name);
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      bgcolor: selectedRouteData.color,
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {lineNum}
                  </Box>
                  {t('home.line')} {lineNum}
                </Box>
              );
            }
            return value;
          }}
        >
          <MenuItem value={ALL_VALUE}>{t('home.allRoutes')}</MenuItem>
          {routes.map((route) => {
            const lineNum = getLineNumber(route.name);
            return (
              <MenuItem key={route.id} value={route.id}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    bgcolor: route.color,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    mr: 1,
                  }}
                >
                  {lineNum}
                </Box>
                {t('home.line')} {lineNum}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120, flex: 1 }}>
        <InputLabel id="direction-filter-label">{t('home.filterDirection')}</InputLabel>
        <Select
          labelId="direction-filter-label"
          value={selectedDirection}
          label={t('home.filterDirection')}
          onChange={(e) => onDirectionChange(e.target.value)}
        >
          <MenuItem value={ALL_VALUE}>{t('home.allDirections')}</MenuItem>
          {directions.map((direction) => (
            <MenuItem key={direction} value={direction}>
              {direction}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export const FILTER_ALL_VALUE = ALL_VALUE;
