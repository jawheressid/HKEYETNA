'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCustomIcon = (color: string, label: string) =>
  L.divIcon({
    html: `<div style="
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      width: 36px;
      height: 36px;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display:flex; align-items:center; justify-content:center;
    ">
      <span style="transform: rotate(45deg); font-size:14px; display:block; text-align:center; line-height:30px;">${label}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    className: '',
  });

const CATEGORY_ICONS: Record<string, { color: string; emoji: string }> = {
  site: { color: '#7caedd', emoji: '🏛️' },
  destination: { color: '#97bee0', emoji: '📍' },
  hotel: { color: '#b1c6da', emoji: '🏨' },
  activity: { color: '#6c9bc9', emoji: '⚡' },
};

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  description?: string;
  image?: string;
}

interface Props {
  places?: Place[];
  center?: [number, number];
  zoom?: number;
  showPath?: boolean;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapContent({ places = [], center = [33.8869, 9.5375], zoom = 6, showPath }: Props) {
  const polylinePath = showPath && places.length > 1
    ? places.map(p => [p.lat, p.lng] as [number, number])
    : [];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      className="rounded-3xl z-0"
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showPath && polylinePath.length > 1 && (
        <Polyline
          positions={polylinePath}
          color="#7caedd"
          weight={3}
          opacity={0.7}
          dashArray="8, 8"
        />
      )}

      {places.map((place, idx) => {
        const iconInfo = CATEGORY_ICONS[place.category] || CATEGORY_ICONS.destination;
        const icon = createCustomIcon(iconInfo.color, showPath ? String(idx + 1) : iconInfo.emoji);

        return (
          <Marker key={place.id} position={[place.lat, place.lng]} icon={icon}>
            <Popup className="custom-popup" maxWidth={260}>
              <div className="font-body p-1">
                {place.image && (
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-3">
                    <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="font-semibold text-midnight text-base mb-1">{place.name}</h3>
                {place.description && (
                  <p className="text-xs text-midnight/60 leading-relaxed">{place.description}</p>
                )}
                <div className="mt-2">
                  <span className="inline-block bg-sand-100 text-sand-700 text-xs px-2 py-1 rounded-lg">
                    {place.category}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
