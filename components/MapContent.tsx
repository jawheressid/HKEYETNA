'use client';

import { useEffect, useMemo, useState } from 'react';
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

const createCustomIcon = (color: string, emoji: string, orderLabel?: string) =>
  L.divIcon({
    html: `<div style="
      background: ${color};
      border: 3px solid white;
      border-radius: 9999px;
      width: 38px;
      height: 38px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display:flex;
      align-items:center;
      justify-content:center;
      position:relative;
      font-size:16px;
    ">
      <span>${emoji}</span>
      ${orderLabel ? `<span style="position:absolute; bottom:-6px; right:-6px; background:#0f172a; color:#fff; width:18px; height:18px; border-radius:9999px; font-size:11px; display:flex; align-items:center; justify-content:center; border:2px solid white;">${orderLabel}</span>` : ''}
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    className: '',
  });

const walkerIcon = L.divIcon({
  html: `<div style="
      width:36px;
      height:36px;
      border-radius:9999px;
      background:#0f172a;
      color:white;
      border:3px solid white;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 6px 16px rgba(0,0,0,.25);
      font-size:18px;
    ">🚶</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

const CATEGORY_ICONS: Record<string, { color: string; emoji: string }> = {
  site: { color: '#7caedd', emoji: '🏛️' },
  destination: { color: '#97bee0', emoji: '📍' },
  hotel: { color: '#8da8c4', emoji: '🏨' },
  activity: { color: '#6c9bc9', emoji: '⚡' },
  visite: { color: '#5f96c7', emoji: '🗺️' },
  repas: { color: '#d59f52', emoji: '🍽️' },
  activité: { color: '#6c9bc9', emoji: '🎯' },
  transport: { color: '#4f7aa3', emoji: '🚌' },
};

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  time?: string;
  description?: string;
  image?: string;
}

interface Props {
  places?: Place[];
  center?: [number, number];
  zoom?: number;
  showPath?: boolean;
  animateWalker?: boolean;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapContent({ places = [], center = [33.8869, 9.5375], zoom = 6, showPath, animateWalker }: Props) {
  const polylinePath = useMemo(
    () =>
      showPath && places.length > 1
        ? places.map((place) => [place.lat, place.lng] as [number, number])
        : [],
    [places, showPath]
  );
  const [walkerPosition, setWalkerPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!animateWalker || polylinePath.length < 2) {
      setWalkerPosition(null);
      return;
    }

    let segmentIndex = 0;
    let segmentProgress = 0;
    setWalkerPosition(polylinePath[0]);

    const intervalId = window.setInterval(() => {
      const start = polylinePath[segmentIndex];
      const end = polylinePath[segmentIndex + 1];

      if (!start || !end) {
        segmentIndex = 0;
        segmentProgress = 0;
        setWalkerPosition(polylinePath[0]);
        return;
      }

      segmentProgress += 0.25;

      if (segmentProgress >= 1) {
        segmentIndex += 1;
        segmentProgress = 0;

        if (segmentIndex >= polylinePath.length - 1) {
          segmentIndex = 0;
        }
      }

      const from = polylinePath[segmentIndex];
      const to = polylinePath[segmentIndex + 1] || polylinePath[0];
      const lat = from[0] + (to[0] - from[0]) * segmentProgress;
      const lng = from[1] + (to[1] - from[1]) * segmentProgress;
      setWalkerPosition([lat, lng]);
    }, 900);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [animateWalker, polylinePath]);

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
        const icon = createCustomIcon(iconInfo.color, iconInfo.emoji, showPath ? String(idx + 1) : undefined);

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
                {place.time && (
                  <p className="text-xs text-terracotta-600 font-semibold mb-1">{place.time}</p>
                )}
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

      {showPath && animateWalker && walkerPosition && (
        <Marker position={walkerPosition} icon={walkerIcon}>
          <Popup>
            <p className="font-body text-sm">Guide en déplacement sur l&apos;itinéraire</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
