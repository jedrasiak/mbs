import { Polyline } from 'react-leaflet';
import type { Stop, Line } from '@/types';

interface RouteLayerProps {
  line: Line;
  stops: Stop[];
}

export function RouteLayer({ line, stops }: RouteLayerProps) {
  const routeCoordinates: [number, number][] = line.route
    .map(stopId => stops.find(s => s.id === stopId))
    .filter((stop): stop is Stop => stop !== undefined)
    .map(stop => [stop.lat, stop.lng]);

  if (routeCoordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={routeCoordinates}
      pathOptions={{
        color: line.color,
        weight: 4,
        opacity: 0.7,
      }}
    />
  );
}
