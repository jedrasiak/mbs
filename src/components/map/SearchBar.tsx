import { useState } from 'react';
import { Paper, InputBase, IconButton, List, ListItemButton, ListItemText, Box } from '@mui/material';
import { Search, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Stop } from '@/types';
import { getAllStops } from '@/utils/scheduleParser';

interface SearchBarProps {
  onSelectStop: (stopId: number) => void;
}

export function SearchBar({ onSelectStop }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const stops = getAllStops();
  const filteredStops = query.length > 0
    ? stops.filter(stop =>
        stop.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (stop: Stop) => {
    onSelectStop(stop.id);
    setQuery('');
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Paper
        component="form"
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
        }}
        elevation={3}
        onSubmit={e => e.preventDefault()}
      >
        <Search sx={{ color: 'text.secondary', mr: 1 }} />
        <InputBase
          placeholder={t('map.searchStops')}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowResults(e.target.value.length > 0);
          }}
          onFocus={() => query.length > 0 && setShowResults(true)}
          sx={{ flex: 1 }}
          inputProps={{ 'aria-label': t('map.searchStopsLabel') }}
        />
        {query && (
          <IconButton size="small" onClick={handleClear} aria-label={t('map.clearSearch')}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Paper>

      {showResults && filteredStops.length > 0 && (
        <Paper
          sx={{
            mt: 1,
            maxHeight: 200,
            overflow: 'auto',
          }}
          elevation={3}
        >
          <List dense>
            {filteredStops.map(stop => (
              <ListItemButton key={stop.id} onClick={() => handleSelect(stop)}>
                <ListItemText primary={stop.name} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
