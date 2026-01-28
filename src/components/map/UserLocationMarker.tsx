import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface UserLocationMarkerProps {
  lat: number;
  lng: number;
}

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="position: relative;">
      <div style="
        width: 20px;
        height: 20px;
        background-color: #4285F4;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
      <div style="
        position: absolute;
        top: -5px;
        left: -5px;
        width: 30px;
        height: 30px;
        background-color: rgba(66, 133, 244, 0.3);
        border-radius: 50%;
        animation: pulse 2s infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.5; }
        100% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function UserLocationMarker({ lat, lng }: UserLocationMarkerProps) {
  return <Marker position={[lat, lng]} icon={userLocationIcon} />;
}
