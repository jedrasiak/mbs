import { Polyline } from 'react-leaflet';
import type { Line, Direction } from '@/types';
import { getRouteCoordinates } from '@/utils/scheduleParser';

interface RouteLayerProps {
  line: Line;
  visibleDirectionIds: string[];
  customCoordinates?: [number, number][];
}

export function RouteLayer({ line, visibleDirectionIds, customCoordinates }: RouteLayerProps) {
  // If custom coordinates are provided (for specific trip), render single polyline
  if (customCoordinates && customCoordinates.length >= 2) {
    return (
      <Polyline
        positions={customCoordinates}
        pathOptions={{
          color: line.color,
          weight: 4,
          opacity: 0.9,
        }}
      />
    );
  }

  // Filter directions based on visibility
  const directionsToShow = line.directions.filter(d =>
    visibleDirectionIds.includes(d.id)
  );

  // Check if both directions of this line are visible
  const bothVisible = directionsToShow.length === 2;

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
              opacity: bothVisible ? 0.7 : 0.9,
              // Use dashed line for second direction when both are visible
              dashArray: bothVisible && index === 1 ? '10, 10' : undefined,
            }}
          />
        );
      })}
    </>
  );
}
