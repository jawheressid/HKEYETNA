'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import {
  MapPin, Star, Clock, Coffee, Camera, Utensils,
  Hotel, Bus, Sun, Cloud, CloudRain, Download, Share2, ChevronDown, ChevronUp
} from 'lucide-react';

interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'visite' | 'repas' | 'activité' | 'hébergement' | 'transport';
  price: number;
  location?: string;
}

interface DayPlan {
  day: number;
  location: string;
  hotel?: { name: string; price: number; stars: number; image: string };
  activities: Activity[];
  totalDayCost: number;
  weather?: { temperature: number; description: string; icon: string };
}

interface Trip {
  title: string;
  summary: string;
  days: DayPlan[];
  totalCost: number;
  highlights: string[];
}

const TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  visite: { icon: Camera, color: 'text-terracotta-700', bg: 'bg-terracotta-50' },
  repas: { icon: Utensils, color: 'text-olive-700', bg: 'bg-olive-50' },
  activité: { icon: Coffee, color: 'text-sand-700', bg: 'bg-sand-100' },
  hébergement: { icon: Hotel, color: 'text-midnight', bg: 'bg-sand-100' },
  transport: { icon: Bus, color: 'text-terracotta-600', bg: 'bg-terracotta-100' },
};

function WeatherBadge({ lat, lng }: { lat?: number; lng?: number }) {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    if (!lat || !lng) return;
    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {});
  }, [lat, lng]);

  if (!weather) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-body ${
      weather.isGoodWeather ? 'bg-olive-50 text-olive-700' : 'bg-sand-100 text-sand-700'
    }`}>
      <span>{weather.icon}</span>
      <span>{weather.temperature}°C</span>
      <span className="text-xs opacity-70">{weather.description}</span>
    </div>
  );
}

interface Props {
  trip: Trip;
}

export default function ItineraryView({ trip }: Props) {
  const { format } = useCurrency();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  const toggleDay = (day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  const CITY_COORDS: Record<string, [number, number]> = {
    Tunis: [36.8065, 10.1815],
    Djerba: [33.8075, 10.8451],
    Douz: [33.4569, 9.0200],
    Hammamet: [36.4002, 10.6148],
    Kairouan: [35.6784, 10.0963],
    Tabarka: [36.9545, 8.7587],
    Matmata: [33.5417, 9.9703],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-16 px-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Trip Header */}
        <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 rounded-5xl p-10 text-white mb-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <div className="relative z-10">
            <div className="flex flex-wrap gap-3 mb-6">
              {trip.highlights?.map((h, i) => (
                <span key={i} className="bg-white/20 text-white/90 text-xs font-body px-3 py-1.5 rounded-full backdrop-blur-sm">
                  ✦ {h}
                </span>
              ))}
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-light mb-4">{trip.title}</h2>
            <p className="font-body text-white/80 text-lg leading-relaxed max-w-2xl">{trip.summary}</p>
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-white/20">
              <div className="text-center">
                <div className="font-display text-3xl font-semibold">{trip.days.length}</div>
                <div className="text-white/70 text-sm font-body">Jours</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="font-display text-3xl font-semibold">{format(trip.totalCost)}</div>
                <div className="text-white/70 text-sm font-body">Budget total</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="font-display text-3xl font-semibold">{new Set(trip.days.map(d => d.location)).size}</div>
                <div className="text-white/70 text-sm font-body">Destinations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Day-by-Day */}
        <div className="space-y-4">
          {trip.days.map((day, idx) => {
            const coords = CITY_COORDS[day.location];
            const isExpanded = expandedDays.has(day.day);

            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-4xl border border-sand-100 overflow-hidden shadow-sm"
              >
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(day.day)}
                  className="w-full flex items-center gap-5 p-6 hover:bg-sand-50/50 transition-colors text-left"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-sand-300 to-sand-400 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-body font-medium text-sand-800">Jour</span>
                    <span className="font-display text-2xl font-bold text-sand-900">{day.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-2xl font-medium text-midnight">{day.location}</h3>
                      <div className="flex items-center gap-1.5 text-midnight/50 text-sm font-body">
                        <MapPin size={12} />
                        <span>Tunisie</span>
                      </div>
                      {coords && <WeatherBadge lat={coords[0]} lng={coords[1]} />}
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-midnight/50 font-body">
                      <span>{day.activities.length} activités</span>
                      <span>·</span>
                      <span>{format(day.totalDayCost)} / jour</span>
                    </div>
                  </div>
                  <div className="text-midnight/30 flex-shrink-0">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-sand-100"
                  >
                    {/* Hotel Card */}
                    {day.hotel && (
                      <div className="p-6 bg-sand-50/50 border-b border-sand-100">
                        <div className="flex gap-4 items-center">
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                            <Image
                              src={day.hotel.image}
                              alt={day.hotel.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs text-midnight/40 font-body uppercase tracking-wider mb-1">Hébergement</p>
                                <h4 className="font-body font-semibold text-midnight">{day.hotel.name}</h4>
                                <div className="flex items-center gap-1 mt-1">
                                  {Array.from({ length: day.hotel.stars }).map((_, i) => (
                                    <Star key={i} size={12} fill="currentColor" className="text-terracotta-500" />
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-display text-xl font-semibold text-terracotta-500">{format(day.hotel.price)}</span>
                                <p className="text-xs text-midnight/40 font-body">/ nuit</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Activities Timeline */}
                    <div className="p-6">
                      <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-sand-200" />
                        <div className="space-y-5">
                          {day.activities.map((act, i) => {
                            const typeInfo = TYPE_ICONS[act.type] || TYPE_ICONS.visite;
                            const Icon = typeInfo.icon;
                            return (
                              <div key={i} className="flex gap-4 relative">
                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-2xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0 z-10`}>
                                  <Icon size={20} className={typeInfo.color} />
                                </div>
                                {/* Content */}
                                <div className="flex-1 bg-sand-50/60 rounded-2xl p-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs text-midnight/40 bg-sand-200 px-2 py-0.5 rounded-md">{act.time}</span>
                                        <span className={`text-xs font-body ${typeInfo.color} capitalize`}>{act.type}</span>
                                      </div>
                                      <h4 className="font-body font-semibold text-midnight">{act.title}</h4>
                                      <p className="text-sm text-midnight/60 font-body mt-1 leading-relaxed">{act.description}</p>
                                    </div>
                                    {act.price > 0 && (
                                      <span className="font-body font-semibold text-sand-600 text-sm flex-shrink-0">
                                        {format(act.price)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center mt-10"
        >
          <button className="btn-primary flex items-center gap-2">
            <Download size={16} />
            Télécharger l'itinéraire
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Share2 size={16} />
            Partager ce voyage
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
