'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import MapView from '@/components/MapView';
import { useCurrency } from '@/context/CurrencyContext';
import {
  MapPin,
  Star,
  Users,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Repeat2,
  MapPinned,
  X,
  Route,
  HandCoins,
  Bell,
  BedDouble,
} from 'lucide-react';
import {
  type DayActivity,
  type GeneratedTrip,
  getHotelSuggestions,
} from '@/lib/tripGenerator';
import {
  buildActivityFromExperience,
  buildMapStops,
  calculateSocialImpact,
  formatDisplayDate,
  getReplacementSuggestions,
  type ExperienceRecord,
} from '@/lib/tripPlanner';

const TYPE_COLORS: Record<string, { badge: string; card: string }> = {
  visite: { badge: 'text-terracotta-700 bg-terracotta-50', card: 'border-terracotta-100' },
  repas: { badge: 'text-olive-700 bg-olive-50', card: 'border-olive-100' },
  activité: { badge: 'text-sand-700 bg-sand-100', card: 'border-sand-200' },
  hébergement: { badge: 'text-midnight bg-sand-100', card: 'border-sand-200' },
  transport: { badge: 'text-terracotta-600 bg-terracotta-100', card: 'border-terracotta-100' },
};

function WeatherBadge({ lat, lng }: { lat?: number; lng?: number }) {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    if (!lat || !lng) {
      return;
    }

    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then((response) => response.json())
      .then(setWeather)
      .catch(() => {});
  }, [lat, lng]);

  if (!weather) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-body ${
        weather.isGoodWeather ? 'bg-olive-50 text-olive-700' : 'bg-sand-100 text-sand-700'
      }`}
    >
      <span>{weather.icon}</span>
      <span>{weather.temperature}°C</span>
      <span className="text-xs opacity-70">{weather.description}</span>
    </div>
  );
}

function ReplacementCard({
  experience,
  onChoose,
  format,
}: {
  experience: ExperienceRecord;
  onChoose: () => void;
  format: (amount: number) => string;
}) {
  return (
    <button
      onClick={onChoose}
      className="text-left rounded-3xl overflow-hidden border border-sand-200 bg-white hover:border-terracotta-300 transition-colors"
    >
      <div className="h-28 relative">
        <img src={experience.image} alt={experience.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display text-lg text-white">{experience.name}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="font-body text-sm text-midnight/60 leading-relaxed mb-3">{experience.description}</p>
        <div className="flex flex-wrap gap-2 text-xs font-body">
          <span className="tag">{experience.region}</span>
          <span className="tag">{format(experience.price)}</span>
          <span className="tag bg-olive-50 text-olive-700">{experience.socialImpactPercent}% impact local</span>
        </div>
      </div>
    </button>
  );
}

interface Props {
  trip: GeneratedTrip;
}

export default function ItineraryView({ trip }: Props) {
  const { format } = useCurrency();
  const [plannedTrip, setPlannedTrip] = useState<GeneratedTrip>(trip);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [mapOpen, setMapOpen] = useState(false);
  const [activeMapDay, setActiveMapDay] = useState(1);
  const [replacementState, setReplacementState] = useState<{
    dayNumber: number;
    activityId: string;
    activityType: DayActivity['type'];
  } | null>(null);
  const [hotelReplacementDay, setHotelReplacementDay] = useState<number | null>(null);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  useEffect(() => {
    setPlannedTrip(trip);
    setActiveMapDay(trip.days[0]?.day ?? 1);
  }, [trip]);

  const socialImpact = useMemo(
    () => plannedTrip.socialImpact || calculateSocialImpact(plannedTrip.days),
    [plannedTrip]
  );

  const activeDay = plannedTrip.days.find((day) => day.day === activeMapDay) || plannedTrip.days[0];
  const mapStops = activeDay ? buildMapStops(activeDay) : [];
  const mapCenter =
    (mapStops[0] && [mapStops[0].lat, mapStops[0].lng]) ||
    (activeDay?.locationCoordinates && [activeDay.locationCoordinates.lat, activeDay.locationCoordinates.lng]) ||
    [33.8869, 9.5375];

  const toMinutes = (time?: string) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return null;
    }

    const [hours, minutes] = time.split(':').map((value) => Number(value));
    return hours * 60 + minutes;
  };

  const nextActivity = useMemo(() => {
    if (!activeDay) {
      return null;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const sorted = [...activeDay.activities]
      .map((activity) => ({
        activity,
        mins: toMinutes(activity.time),
      }))
      .filter((entry) => entry.mins !== null)
      .sort((left, right) => (left.mins as number) - (right.mins as number));

    return sorted.find((entry) => (entry.mins as number) >= nowMinutes)?.activity || sorted[0]?.activity || null;
  }, [activeDay]);

  useEffect(() => {
    if (!mapOpen || !activeDay) {
      return;
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    const sent = new Set<string>();
    const timer = window.setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const current = `${hh}:${mm}`;

      const matching = activeDay.activities.find((activity) => activity.time === current);
      if (!matching) {
        return;
      }

      const key = `${activeDay.day}-${matching.id || matching.title}-${matching.time}`;
      if (sent.has(key)) {
        return;
      }

      sent.add(key);
      const notice = `Il est ${matching.time} - ${matching.title}`;
      setScheduleNotice(notice);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Rappel HKEYETNA', {
          body: notice,
        });
      }

      window.setTimeout(() => {
        setScheduleNotice((previous) => (previous === notice ? null : previous));
      }, 9000);
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeDay, mapOpen]);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((previous) => {
      const next = new Set(previous);
      next.has(dayNumber) ? next.delete(dayNumber) : next.add(dayNumber);
      return next;
    });
  };

  const replaceActivity = (dayNumber: number, currentActivity: DayActivity, experience: ExperienceRecord) => {
    setPlannedTrip((previous) => {
      const nextDays = previous.days.map((day) => {
        if (day.day !== dayNumber) {
          return day;
        }

        const nextActivities = day.activities.map((activity) => {
          if ((activity.id || activity.title) !== (currentActivity.id || currentActivity.title)) {
            return activity;
          }

          return {
            ...buildActivityFromExperience(experience, activity.time, true),
            location: experience.location,
          };
        });

        return {
          ...day,
          activities: nextActivities,
          totalDayCost:
            nextActivities.reduce((sum, activity) => sum + activity.price, 0) + (day.hotel?.price || 0),
        };
      });

      return {
        ...previous,
        days: nextDays,
        totalCost: nextDays.reduce((sum, day) => sum + day.totalDayCost, 0),
        socialImpact: calculateSocialImpact(nextDays),
      };
    });

    setReplacementState(null);
  };

  const replaceHotel = (dayNumber: number, hotel: { name: string; price: number; stars: number; image: string; coordinates?: { lat: number; lng: number } }) => {
    setPlannedTrip((previous) => {
      const nextDays = previous.days.map((day) => {
        if (day.day !== dayNumber || !day.hotel) {
          return day;
        }

        return {
          ...day,
          hotel,
          totalDayCost: day.activities.reduce((sum, activity) => sum + activity.price, 0) + hotel.price,
        };
      });

      return {
        ...previous,
        days: nextDays,
        totalCost: nextDays.reduce((sum, day) => sum + day.totalDayCost, 0),
      };
    });

    setHotelReplacementDay(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-10 sm:py-16 px-4 sm:px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 rounded-[2rem] sm:rounded-5xl p-6 sm:p-10 text-white mb-8 sm:mb-10 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="relative z-10">
              <div className="flex flex-wrap gap-3 mb-6">
                {plannedTrip.highlights?.map((highlight, index) => (
                  <span
                    key={index}
                    className="bg-white/20 text-white/90 text-xs font-body px-3 py-1.5 rounded-full backdrop-blur-sm"
                  >
                    ✦ {highlight}
                  </span>
                ))}
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light mb-4">{plannedTrip.title}</h2>
              <p className="font-body text-base sm:text-lg text-white/80 leading-relaxed max-w-3xl">{plannedTrip.summary}</p>
              {plannedTrip.startDate && plannedTrip.endDate && (
                <p className="font-body text-white/80 text-sm mt-4">
                  Du {new Date(plannedTrip.startDate).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(plannedTrip.endDate).toLocaleDateString('fr-FR')}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold">{plannedTrip.days.length}</div>
                  <div className="text-white/70 text-sm font-body">Jours</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold">{format(plannedTrip.totalCost)}</div>
                  <div className="text-white/70 text-sm font-body">Budget total</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold">{socialImpact.localImpactPercent}%</div>
                  <div className="text-white/70 text-sm font-body">Impact local</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold">{socialImpact.artisansSupported}</div>
                  <div className="text-white/70 text-sm font-body">Artisans aidés</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {plannedTrip.days.map((day, index) => {
              const isExpanded = expandedDays.has(day.day);
              const replacementOptions =
                replacementState?.dayNumber === day.day
                  ? getReplacementSuggestions({
                      location: day.location,
                      interests: [],
                      regions: plannedTrip.regions || [],
                      activityType: replacementState.activityType,
                      excludeIds: day.activities.map((activity) => activity.id || activity.title),
                    })
                  : [];
              const hotelSuggestions = day.hotel
                ? getHotelSuggestions({
                    city: day.location,
                    budgetPerNight: day.hotel.price,
                    excludeName: day.hotel.name,
                    limit: 2,
                  })
                : [];

              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white rounded-4xl border border-sand-100 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleDay(day.day)}
                    className="w-full flex flex-col items-start sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 sm:p-6 hover:bg-sand-50/50 transition-colors text-left"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-sand-300 to-sand-400 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-body font-medium text-sand-800">Jour</span>
                      <span className="font-display text-2xl font-bold text-sand-900">{day.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-xl sm:text-2xl font-medium text-midnight">{day.location}</h3>
                        {day.locationCoordinates && (
                          <WeatherBadge lat={day.locationCoordinates.lat} lng={day.locationCoordinates.lng} />
                        )}
                        {day.date && <span className="tag">{formatDisplayDate(day.date)}</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-midnight/50 font-body">
                        <span>{day.activities.length} activités planifiées</span>
                        <span>{format(day.totalDayCost)} / jour</span>
                        <span>{day.activities.filter((activity) => activity.selectedByUser).length} choix confirmés</span>
                      </div>
                    </div>
                    <div className="text-midnight/30 flex-shrink-0 self-end sm:self-auto">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-sand-100"
                    >
                      {day.hotel && (
                        <div className="p-4 sm:p-6 bg-sand-50/50 border-b border-sand-100">
                          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                            <div className="relative w-full sm:w-24 h-44 sm:h-24 rounded-3xl overflow-hidden flex-shrink-0">
                              <Image src={day.hotel.image} alt={day.hotel.name} fill unoptimized className="object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div>
                                  <p className="text-xs text-midnight/40 font-body uppercase tracking-wider mb-1">Hébergement</p>
                                  <h4 className="font-body font-semibold text-midnight text-lg">{day.hotel.name}</h4>
                                  <div className="flex items-center gap-1 mt-1">
                                    {Array.from({ length: day.hotel.stars }).map((_, starIndex) => (
                                      <Star key={starIndex} size={12} fill="currentColor" className="text-terracotta-500" />
                                    ))}
                                  </div>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="font-display text-xl font-semibold text-terracotta-500">{format(day.hotel.price)}</span>
                                  <p className="text-xs text-midnight/40 font-body">/ nuit</p>
                                </div>
                              </div>
                              <div className="flex justify-end mt-4">
                                <button
                                  onClick={() =>
                                    setHotelReplacementDay((previous) =>
                                      previous === day.day ? null : day.day
                                    )
                                  }
                                  className="inline-flex items-center gap-2 text-sm font-body font-medium text-terracotta-600 hover:text-terracotta-700"
                                >
                                  <BedDouble size={14} />
                                  Remplacer l&apos;hébergement
                                </button>
                              </div>
                            </div>
                          </div>

                          {hotelReplacementDay === day.day && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {hotelSuggestions.map((hotelSuggestion) => (
                                <button
                                  key={hotelSuggestion.name}
                                  onClick={() => replaceHotel(day.day, hotelSuggestion)}
                                  className="text-left rounded-3xl overflow-hidden border border-sand-200 bg-white hover:border-terracotta-300 transition-colors"
                                >
                                  <div className="h-28 relative">
                                    <img src={hotelSuggestion.image} alt={hotelSuggestion.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3">
                                      <p className="font-display text-lg text-white">{hotelSuggestion.name}</p>
                                    </div>
                                  </div>
                                  <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: hotelSuggestion.stars }).map((_, starIndex) => (
                                        <Star key={`${hotelSuggestion.name}-${starIndex}`} size={12} fill="currentColor" className="text-terracotta-500" />
                                      ))}
                                    </div>
                                    <span className="font-body font-semibold text-terracotta-600">{format(hotelSuggestion.price)}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4 sm:p-6">
                        <div className="relative">
                          <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-sand-200" />
                          <div className="space-y-5">
                            {day.activities.map((activity) => {
                              const style = TYPE_COLORS[activity.type] || TYPE_COLORS.visite;
                              const isReplacementOpen =
                                replacementState?.dayNumber === day.day &&
                                replacementState?.activityId === (activity.id || activity.title);

                              return (
                                <div key={activity.id || activity.title} className="space-y-4 relative">
                                  <div className="flex gap-3 sm:gap-4 relative">
                                    <div className={`w-10 sm:w-16 h-10 sm:h-16 rounded-xl sm:rounded-2xl ${style.badge} flex items-center justify-center flex-shrink-0 z-10 font-body text-[10px] sm:text-xs font-semibold`}>
                                      {activity.time}
                                    </div>

                                    <div className={`flex-1 bg-sand-50/70 rounded-2xl sm:rounded-3xl p-4 border ${style.card}`}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-3 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-xs font-body px-2.5 py-1 rounded-full capitalize ${style.badge}`}>
                                              {activity.type}
                                            </span>
                                            {activity.selectedByUser && (
                                              <span className="inline-flex items-center gap-1 bg-olive-50 text-olive-700 text-xs font-body px-2.5 py-1 rounded-full">
                                                <CheckCircle2 size={12} />
                                                Choisie dans le formulaire
                                              </span>
                                            )}
                                            {typeof activity.socialImpactPercent === 'number' && (
                                              <span className="inline-flex items-center gap-1 bg-white text-midnight/65 text-xs font-body px-2.5 py-1 rounded-full border border-sand-200">
                                                <HandCoins size={12} />
                                                {activity.socialImpactPercent}% local
                                              </span>
                                            )}
                                            {typeof activity.artisansSupported === 'number' && activity.artisansSupported > 0 && (
                                              <span className="inline-flex items-center gap-1 bg-white text-midnight/65 text-xs font-body px-2.5 py-1 rounded-full border border-sand-200">
                                                <Users size={12} />
                                                {activity.artisansSupported} artisans
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div>
                                              <h4 className="font-body font-semibold text-midnight text-lg">{activity.title}</h4>
                                              <p className="text-sm text-midnight/60 font-body mt-1 leading-relaxed">{activity.description}</p>
                                              {activity.location && (
                                                <div className="flex items-center gap-1.5 text-xs text-midnight/40 font-body mt-3">
                                                  <MapPin size={12} />
                                                  <span>{activity.location}</span>
                                                </div>
                                              )}
                                            </div>

                                            {activity.price > 0 && (
                                              <span className="font-body font-semibold text-sand-700 text-sm flex-shrink-0">
                                                {format(activity.price)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-4 pt-4 border-t border-sand-200 flex justify-start sm:justify-end">
                                        <button
                                          onClick={() =>
                                            setReplacementState(
                                              isReplacementOpen
                                                ? null
                                                : {
                                                    dayNumber: day.day,
                                                    activityId: activity.id || activity.title,
                                                    activityType: activity.type,
                                                  }
                                            )
                                          }
                                          className="inline-flex items-center gap-2 text-sm font-body font-medium text-terracotta-600 hover:text-terracotta-700"
                                        >
                                          <Repeat2 size={14} />
                                          Remplacer cette activité
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {isReplacementOpen && (
                                    <div className="ml-0 sm:ml-20 bg-white border border-sand-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
                                      <div className="flex items-start sm:items-center gap-2 mb-4">
                                        <Route size={16} className="text-terracotta-500" />
                                        <p className="font-body font-semibold text-midnight">
                                          Deux alternatives prêtes à choisir
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {replacementOptions.length > 0 ? (
                                          replacementOptions.map((experience) => (
                                            <ReplacementCard
                                              key={experience.id}
                                              experience={experience}
                                              format={format}
                                              onChoose={() => replaceActivity(day.day, activity, experience)}
                                            />
                                          ))
                                        ) : (
                                          <div className="md:col-span-2 bg-sand-50 border border-sand-200 rounded-2xl p-4 font-body text-sm text-midnight/60">
                                            Aucune alternative trouvée pour le type &quot;{activity.type}&quot; dans cette zone. Essayez une autre activité ou une autre région.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4 justify-center mt-10"
          >
            <button className="btn-primary flex items-center gap-2">
              <Download size={16} />
              Télécharger l&apos;itinéraire
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Share2 size={16} />
              Partager ce voyage
            </button>
          </motion.div>
        </div>
      </motion.div>

      {plannedTrip.days.length > 0 && (
        <button
          onClick={() => setMapOpen(true)}
          className="fixed left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-40 btn-primary shadow-2xl rounded-full px-5 py-4 flex items-center justify-center gap-2"
        >
          <MapPinned size={18} />
          Voir sur map
        </button>
      )}

      <AnimatePresence>
        {mapOpen && activeDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-midnight/35 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="absolute right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl border-l border-sand-100 flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-sand-100">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="tag mb-3 inline-flex">Carte du séjour</span>
                    <h3 className="font-display text-2xl sm:text-3xl text-midnight">Étapes jour par jour</h3>
                    <p className="font-body text-sm text-midnight/55 mt-2">
                      Hôtels et activités géolocalisés, avec itinéraire pointillé entre les étapes.
                    </p>
                  </div>
                  <button
                    onClick={() => setMapOpen(false)}
                    className="w-10 h-10 rounded-2xl bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-midnight/60"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {plannedTrip.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveMapDay(day.day)}
                      className={`px-4 py-2 rounded-2xl text-sm font-body font-medium whitespace-nowrap ${
                        activeMapDay === day.day
                          ? 'bg-midnight text-white'
                          : 'bg-sand-50 border border-sand-200 text-midnight/70'
                      }`}
                    >
                      Jour {day.day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 border-b border-sand-100 font-body text-sm text-midnight/60">
                <p className="font-semibold text-midnight">{activeDay.location}</p>
                {activeDay.date && <p>{formatDisplayDate(activeDay.date)}</p>}
                {nextActivity && (
                  <p className="mt-2 inline-flex items-center gap-2 text-terracotta-600">
                    <Bell size={14} />
                    Prochaine activité: {nextActivity.time} - {nextActivity.title}
                  </p>
                )}
                {scheduleNotice && (
                  <div className="mt-3 bg-terracotta-50 text-terracotta-700 border border-terracotta-200 rounded-xl px-3 py-2 inline-flex items-center gap-2">
                    <Bell size={14} />
                    {scheduleNotice}
                  </div>
                )}
              </div>

              <div className="flex-1 p-4 sm:p-6">
                <div className="h-full rounded-4xl overflow-hidden border border-sand-200">
                  <MapView
                    places={mapStops}
                    center={mapCenter as [number, number]}
                    zoom={11}
                    showPath
                    animateWalker
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
