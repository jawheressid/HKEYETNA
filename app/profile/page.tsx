'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { supabase, type Trip } from '@/lib/supabase';
import {
  MapPin, Clock, Wallet, Plus, Trash2, Eye, LogOut,
  Settings, Briefcase, Calendar, ChevronRight, Loader2, CreditCard
} from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-sand-100 text-sand-700',
  saved: 'bg-terracotta-50 text-terracotta-700',
  completed: 'bg-olive-50 text-olive-700',
  active: 'bg-olive-50 text-olive-700',
  archived: 'bg-sand-100 text-sand-600',
};

const STATUS_LABELS = {
  draft: 'Brouillon',
  saved: 'Sauvegardé',
  completed: 'Terminé',
  active: 'Actif',
  archived: 'Archivé',
};

const AVATAR_OPTIONS = [
  '/branding/sticker-khamsa.png',
  '/branding/sticker-tea.png',
  '/branding/sticker-door.png',
  '/branding/sticker-bag.png',
  '/branding/sticker-fan.png',
  '/branding/sticker-flowers.png',
];

const PROFILE_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
    title: 'Sidi Bou Saïd',
    caption: 'Grand Tunis, ruelles blanches et bleues',
  },
  {
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=80',
    title: 'Douz',
    caption: 'Kébili, dunes et nuits étoilées',
  },
  {
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    title: 'Djerba',
    caption: 'Médenine, mer et artisanat',
  },
];

function isBookedTrip(trip: Trip) {
  return trip.preferences?.booking?.status === 'confirmed';
}

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const mainDestination = trip.trip_data?.days?.[0]?.location ?? 'Tunisie';
  const bookingConfirmed = isBookedTrip(trip);
  const statusClass = bookingConfirmed ? 'bg-olive-50 text-olive-700' : STATUS_COLORS[trip.status];
  const statusLabel = bookingConfirmed ? 'Booking confirmé' : STATUS_LABELS[trip.status];

  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white rounded-4xl border border-sand-100 shadow-sm overflow-hidden group">
      <div className="relative h-36 bg-gradient-to-br from-terracotta-100 to-sand-200">
        {trip.cover_image && (
          <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-body font-medium px-2.5 py-1 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white text-xs font-body">
          <MapPin size={11} />
          {mainDestination}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-medium text-midnight mb-3 line-clamp-1">{trip.title}</h3>
        <div className="flex items-center gap-4 text-xs text-midnight/50 font-body mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {trip.duration} jours
          </div>
          {trip.budget && (
            <div className="flex items-center gap-1">
              <Wallet size={12} />
              {trip.budget} DT
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(trip.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/trip/${trip.id}`} className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5">
            <Eye size={13} />
            Voir
          </Link>
          <button
            onClick={() => onDelete(trip.id)}
            className="p-2 rounded-full border border-sand-200 text-midnight/40 hover:border-red-200 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyTrips() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-6">🗺️</div>
      <h3 className="font-display text-2xl font-light text-midnight mb-3">Aucun voyage pour l&apos;instant</h3>
      <p className="font-body text-midnight/50 text-sm mb-8 max-w-xs mx-auto">
        Créez votre premier itinéraire personnalisé avec l&apos;aide de l&apos;IA.
      </p>
      <Link href="/trip/new" className="btn-primary inline-flex items-center gap-2">
        <Plus size={16} />
        Créer mon premier voyage
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-parchment" />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { currency } = useCurrency();
  const initialTab = searchParams.get('tab') === 'bookings' ? 'bookings' : searchParams.get('tab') === 'settings' ? 'settings' : 'trips';
  const [tab, setTab] = useState<'trips' | 'bookings' | 'settings'>(initialTab);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
    }
  }, [profile]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((previous) => (previous + 1) % PROFILE_SLIDES.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const fetchTrips = async () => {
    if (!user) {
      return;
    }

    setTripsLoading(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setTrips(data ?? []);
    setTripsLoading(false);
  };

  useEffect(() => {
    if (user) {
      void fetchTrips();
    }
  }, [user]);

  const bookedTrips = trips.filter(isBookedTrip);
  const firstName = (profile?.full_name ?? profile?.email ?? 'Voyageur').split(' ')[0];

  const deleteTrip = async (id: string) => {
    if (!window.confirm('Supprimer ce voyage ?')) {
      return;
    }

    await supabase.from('trips').delete().eq('id', id);
    setTrips((previous) => previous.filter((trip) => trip.id !== id));
  };

  const saveSettings = async () => {
    if (!user) {
      return;
    }

    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl || null,
        preferred_currency: currency,
      })
      .eq('id', user.id);

    await refreshProfile();
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          <aside className="hidden md:block">
            <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-6 sticky top-32">
              <div className="flex flex-col items-center text-center mb-8 pt-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center mb-4 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profile?.full_name ?? 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-3xl text-white font-medium">
                      {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-xl font-medium text-midnight mb-1">
                  {profile?.full_name ?? 'Voyageur'}
                </h2>
                <p className="font-body text-xs text-midnight/40">{profile?.email}</p>
                <div className="mt-3">
                  <span className="tag text-xs">
                    {trips.length} voyage{trips.length !== 1 ? 's' : ''} sauvegardé{trips.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'trips', icon: Briefcase, label: 'Mes voyages' },
                  { id: 'bookings', icon: CreditCard, label: 'Mes bookings' },
                  { id: 'settings', icon: Settings, label: 'Paramètres' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id as 'trips' | 'bookings' | 'settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-body font-medium text-sm transition-all ${
                      tab === item.id
                        ? 'bg-terracotta-50 text-terracotta-700'
                        : 'text-midnight/60 hover:bg-sand-50 hover:text-midnight'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                    {tab === item.id && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                ))}

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-body font-medium text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-4"
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </nav>
            </div>
          </aside>

          <main>
            <div className="md:hidden mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profile?.full_name ?? 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl text-white font-medium">
                      {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg font-medium text-midnight">{profile?.full_name ?? 'Voyageur'}</h2>
                  <p className="font-body text-xs text-midnight/40">{profile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 bg-sand-100 rounded-2xl p-1 gap-1">
                {[
                  { id: 'trips', label: 'Mes voyages' },
                  { id: 'bookings', label: 'Bookings' },
                  { id: 'settings', label: 'Paramètres' },
                ].map((currentTab) => (
                  <button
                    key={currentTab.id}
                    onClick={() => setTab(currentTab.id as 'trips' | 'bookings' | 'settings')}
                    className={`py-2 rounded-xl font-body font-semibold text-xs sm:text-sm transition-all ${
                      tab === currentTab.id ? 'bg-white text-midnight shadow-sm' : 'text-midnight/50'
                    }`}
                  >
                    {currentTab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8 grid lg:grid-cols-[1fr_0.95fr] gap-5">
              <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-5 sm:p-7">
                <span className="tag mb-4 inline-flex">✦ Tableau de bord</span>
                <h1 className="font-display text-3xl sm:text-4xl font-light text-midnight mb-3">
                  Bienvenue {firstName}
                </h1>
                <p className="font-body text-midnight/55 max-w-xl">
                  Retrouvez vos voyages, vos bookings confirmés et personnalisez votre profil avant de repartir explorer la Tunisie.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="bg-sand-50 rounded-3xl border border-sand-200 p-4">
                    <p className="text-xs font-body text-midnight/40 mb-1">Voyages</p>
                    <p className="font-display text-2xl text-midnight">{trips.length}</p>
                  </div>
                  <div className="bg-sand-50 rounded-3xl border border-sand-200 p-4">
                    <p className="text-xs font-body text-midnight/40 mb-1">Bookings</p>
                    <p className="font-display text-2xl text-midnight">{bookedTrips.length}</p>
                  </div>
                  <div className="bg-sand-50 rounded-3xl border border-sand-200 p-4">
                    <p className="text-xs font-body text-midnight/40 mb-1">Devise</p>
                    <p className="font-display text-2xl text-midnight">{currency}</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-4xl overflow-hidden min-h-[260px] sm:min-h-[300px] border border-sand-100 shadow-sm bg-white">
                {PROFILE_SLIDES.map((slide, index) => (
                  <motion.img
                    key={slide.title}
                    src={slide.image}
                    alt={slide.title}
                    initial={false}
                    animate={{ opacity: activeSlide === index ? 1 : 0, scale: activeSlide === index ? 1 : 1.04 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/75 via-midnight/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <p className="font-display text-2xl sm:text-3xl text-white">{PROFILE_SLIDES[activeSlide].title}</p>
                  <p className="font-body text-white/75 mt-1">{PROFILE_SLIDES[activeSlide].caption}</p>
                  <div className="flex gap-2 mt-4">
                    {PROFILE_SLIDES.map((slide, index) => (
                      <button
                        key={slide.title}
                        onClick={() => setActiveSlide(index)}
                        className={`rounded-full transition-all ${activeSlide === index ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'trips' && (
                <motion.div key="trips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                    <div>
                      <span className="tag mb-2 inline-flex">✦ Mes itinéraires</span>
                      <h1 className="font-display text-3xl font-light text-midnight">Mes voyages</h1>
                    </div>
                    <Link href="/trip/new" className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
                      <Plus size={15} />
                      Nouveau voyage
                    </Link>
                  </div>

                  {tripsLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-sand-100 rounded-4xl h-60 animate-pulse" />
                      ))}
                    </div>
                  ) : trips.length === 0 ? (
                    <EmptyTrips />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {trips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'bookings' && (
                <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                    <div>
                      <span className="tag mb-2 inline-flex">✦ Confirmations</span>
                      <h1 className="font-display text-3xl font-light text-midnight">Mes bookings</h1>
                    </div>
                    <Link href="/trip/new" className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
                      <Plus size={15} />
                      Nouveau booking
                    </Link>
                  </div>

                  {tripsLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-sand-100 rounded-4xl h-60 animate-pulse" />
                      ))}
                    </div>
                  ) : bookedTrips.length === 0 ? (
                    <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-10 text-center">
                      <h3 className="font-display text-2xl font-light text-midnight mb-3">Aucun booking confirmé</h3>
                      <p className="font-body text-midnight/55 mb-6">
                        Confirmez un voyage depuis l&apos;écran Booking et il apparaîtra ici.
                      </p>
                      <Link href="/trip/new" className="btn-primary inline-flex items-center gap-2">
                        <CreditCard size={15} />
                        Lancer un booking
                      </Link>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {bookedTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="mb-8">
                    <span className="tag mb-2 inline-flex">⚙️ Compte</span>
                    <h1 className="font-display text-3xl font-light text-midnight">Paramètres</h1>
                  </div>

                  <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-5 sm:p-8 max-w-lg space-y-6">
                    <div>
                      <label className="font-body font-semibold text-sm text-midnight mb-2 block">Nom complet</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-2xl font-body text-sm text-midnight focus:outline-none focus:border-terracotta-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="font-body font-semibold text-sm text-midnight mb-2 block">Email</label>
                      <input
                        type="email"
                        value={profile?.email ?? ''}
                        disabled
                        className="w-full px-4 py-3 bg-sand-50 border border-sand-100 rounded-2xl font-body text-sm text-midnight/50 cursor-not-allowed"
                      />
                      <p className="text-xs text-midnight/40 font-body mt-1.5">L&apos;email ne peut pas être modifié ici.</p>
                    </div>

                    <div>
                      <label className="font-body font-semibold text-sm text-midnight mb-3 block">Devise préférée</label>
                      <CurrencySwitcher />
                      <p className="text-xs text-midnight/40 font-body mt-2">Cette devise sera utilisée pour l&apos;affichage des budgets.</p>
                    </div>

                    <div>
                      <label className="font-body font-semibold text-sm text-midnight mb-3 block">Choisir un avatar</label>
                      <div className="grid grid-cols-3 gap-3">
                        {AVATAR_OPTIONS.map((option) => (
                          <button
                            key={option}
                            onClick={() => setAvatarUrl(option)}
                            className={`rounded-3xl border-2 p-3 transition-all ${
                              avatarUrl === option
                                ? 'border-terracotta-500 bg-terracotta-50'
                                : 'border-sand-200 bg-sand-50'
                            }`}
                          >
                            <img src={option} alt="Avatar" className="w-16 h-16 object-cover mx-auto" />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setAvatarUrl('')}
                        className="mt-3 text-sm font-body text-midnight/55 hover:text-midnight"
                      >
                        Retirer l&apos;avatar
                      </button>
                    </div>

                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                      {saving ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
                    </button>
                  </div>

                  <div className="bg-white rounded-4xl border border-red-100 p-5 sm:p-8 max-w-lg mt-6">
                    <h3 className="font-body font-semibold text-sm text-red-600 mb-4">Zone de danger</h3>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-sm font-body font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                      <LogOut size={15} />
                      Se déconnecter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
