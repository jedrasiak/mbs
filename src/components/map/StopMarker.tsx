import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { DirectionInfo } from '@/types';

interface StopMarkerProps {
  stopId: number;
  platform: 'A' | 'B';
  lat: number;
  lng: number;
  stopName: string;
  directions: DirectionInfo[];
  isSelected: boolean;
  onClick: () => void;
}

function createStopIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 24 : 18;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isSelected ? 'transform: scale(1.2);' : ''}
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function StopMarker({
  platform,
  lat,
  lng,
  stopName,
  directions,
  isSelected,
  onClick,
}: StopMarkerProps) {
  // Use the color of the first direction's line, or default blue
  const primaryColor = directions[0]?.lineColor ?? '#1976D2';
  const icon = createStopIcon(primaryColor, isSelected);

  // Get unique line names
  const lineNames = [...new Set(directions.map(d => d.lineName))];

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <strong>{stopName}</strong>
        <br />
        <small style={{ color: '#666' }}>Platform {platform}</small>
        <br />
        <small>
          Lines: {lineNames.join(', ')}
        </small>
      </Popup>
    </Marker>
  );
}
