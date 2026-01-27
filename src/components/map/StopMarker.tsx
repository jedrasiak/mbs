import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Stop, Line } from '@/types';

interface StopMarkerProps {
  stop: Stop;
  lines: Line[];
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

export function StopMarker({ stop, lines, isSelected, onClick }: StopMarkerProps) {
  // Use the color of the first line, or default blue
  const primaryColor = lines[0]?.color ?? '#1976D2';
  const icon = createStopIcon(primaryColor, isSelected);

  return (
    <Marker
      position={[stop.lat, stop.lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <strong>{stop.name}</strong>
        <br />
        <small>
          Lines: {lines.map(l => l.name).join(', ')}
        </small>
      </Popup>
    </Marker>
  );
}
