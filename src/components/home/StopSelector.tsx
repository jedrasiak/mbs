import { Autocomplete, TextField, Box } from '@mui/material';
import { Favorite, Star } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Stop, StopId } from '@/types';
import { getAllStops } from '@/utils/scheduleParser';
import { useSettings } from '@/contexts/SettingsContext';

interface StopSelectorProps {
  value: StopId | null;
  onChange: (stopId: StopId | null) => void;
  label?: string;
}

export function StopSelector({ value, onChange, label }: StopSelectorProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const allStops = getAllStops();
  const selectedStop = allStops.find(stop => stop.id === value) ?? null;
  const displayLabel = label ?? t('home.selectStop');

  const favoriteSet = new Set(settings.favoriteStops);
  const defaultStopId = settings.defaultStopId;

  const sortedStops = [...allStops].sort((a, b) => {
    const aDefault = a.id === defaultStopId;
    const bDefault = b.id === defaultStopId;
    if (aDefault && !bDefault) return -1;
    if (!aDefault && bDefault) return 1;

    const aFav = favoriteSet.has(a.id);
    const bFav = favoriteSet.has(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;

    return a.name.localeCompare(b.name);
  });

  return (
    <Autocomplete
      value={selectedStop}
      onChange={(_, newValue) => onChange(newValue?.id ?? null)}
      options={sortedStops}
      getOptionLabel={(option: Stop) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        const isDefault = option.id === defaultStopId;
        const isFavorite = favoriteSet.has(option.id);
        return (
          <Box component="li" key={key} {...rest}>
            {isDefault && (
              <Star
                fontSize="small"
                color="warning"
                sx={{ mr: 1, flexShrink: 0 }}
              />
            )}
            {!isDefault && isFavorite && (
              <Favorite
                fontSize="small"
                color="error"
                sx={{ mr: 1, flexShrink: 0 }}
              />
            )}
            {option.name}
          </Box>
        );
      }}
      renderInput={(params) => {
        const { InputLabelProps, InputProps, inputProps, ...rest } = params;
        return (
          <TextField
            {...rest}
            label={displayLabel}
            variant="outlined"
            fullWidth
            InputLabelProps={InputLabelProps}
            InputProps={InputProps}
            inputProps={inputProps}
          />
        );
      }}
      sx={{ mb: 2 }}
    />
  );
}
