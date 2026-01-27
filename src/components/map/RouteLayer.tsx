import { Polyline } from 'react-leaflet';
import type { Line, Direction } from '@/types';
import { getRouteCoordinates } from '@/utils/scheduleParser';

interface RouteLayerProps {
  line: Line;
  selectedDirectionId?: string | null;
}

export function RouteLayer({ line, selectedDirectionId }: RouteLayerProps) {
  // If a specific direction is selected, only show that route
  // Otherwise, show all directions (both routes)
  const directionsToShow = selectedDirectionId
    ? line.directions.filter(d => d.id === selectedDirectionId)
    : line.directions;

  return (
    <>
      {directionsToShow.map((direction: Direction, index: number) => {
        const routeCoordinates = getRouteCoordinates(direction.id);

        if (routeCoordinates.length < 2) {
          return null;
        }

        return (
          <Polyline
            key={direction.id}
            positions={routeCoordinates}
            pathOptions={{
              color: line.color,
              weight: 4,
              opacity: selectedDirectionId ? 0.9 : 0.6,
              // Slightly offset the second direction if showing both
              dashArray: !selectedDirectionId && index === 1 ? '10, 10' : undefined,
            }}
          />
        );
      })}
    </>
  );
}
