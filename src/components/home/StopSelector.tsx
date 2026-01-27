import { Autocomplete, TextField } from '@mui/material';
import type { Stop } from '@/types';
import { getAllStops } from '@/utils/scheduleParser';

interface StopSelectorProps {
  value: number | null;
  onChange: (stopId: number | null) => void;
  label?: string;
}

export function StopSelector({ value, onChange, label = 'Select Stop' }: StopSelectorProps) {
  const stops = getAllStops();
  const selectedStop = stops.find(stop => stop.id === value) ?? null;

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
            label={label}
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
