import { Box, Chip, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import type { Direction } from '@/types';
import { getDirectionsForLine, getLineById } from '@/utils/scheduleParser';

interface DirectionSelectorProps {
  lineId: number;
  selectedDirectionId: string | null;
  onChange: (directionId: string) => void;
}

export function DirectionSelector({
  lineId,
  selectedDirectionId,
  onChange,
}: DirectionSelectorProps) {
  const directions = getDirectionsForLine(lineId);
  const line = getLineById(lineId);

  if (directions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Select direction
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {directions.map((direction: Direction) => (
          <Chip
            key={direction.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowForward sx={{ fontSize: 16 }} />
                {direction.name}
              </Box>
            }
            onClick={() => onChange(direction.id)}
            variant={selectedDirectionId === direction.id ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 500,
              ...(selectedDirectionId === direction.id && {
                bgcolor: line?.color ?? 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: line?.color ?? 'primary.main',
                },
              }),
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
