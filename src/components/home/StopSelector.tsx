import { Autocomplete, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Stop } from '@/types';
import { getAllStops } from '@/utils/scheduleParser';

interface StopSelectorProps {
  value: number | null;
  onChange: (stopId: number | null) => void;
  label?: string;
}

export function StopSelector({ value, onChange, label }: StopSelectorProps) {
  const { t } = useTranslation();
  const stops = getAllStops();
  const selectedStop = stops.find(stop => stop.id === value) ?? null;
  const displayLabel = label ?? t('home.selectStop');

  return (
    <Autocomplete
      value={selectedStop}
      onChange={(_, newValue) => onChange(newValue?.id ?? null)}
      options={stops}
      getOptionLabel={(option: Stop) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
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
