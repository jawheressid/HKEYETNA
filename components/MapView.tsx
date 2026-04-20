'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

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

// Dynamically import map to avoid SSR issues
const MapContent = dynamic(() => import('./MapContent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-sand-100 rounded-3xl">
      <div className="text-center">
        <div className="w-12 h-12 bg-sand-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <MapPin size={24} className="text-sand-500" />
        </div>
        <p className="font-body text-sm text-midnight/40">Chargement de la carte…</p>
      </div>
    </div>
  )
});

export default function MapView({ places, center, zoom, showPath }: Props) {
  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden">
      <MapContent places={places} center={center} zoom={zoom} showPath={showPath} />
    </div>
  );
}
