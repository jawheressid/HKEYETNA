'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { supabase, type Trip } from '@/lib/supabase';
import {
  MapPin, Clock, Wallet, Plus, Trash2, Eye, LogOut,
  Settings, Briefcase, Calendar, ChevronRight, Loader2
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

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const mainDestination = trip.trip_data?.days?.[0]?.location ?? 'Tunisie';

  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white rounded-4xl border border-sand-100 shadow-sm overflow-hidden group">
      <div className="relative h-36 bg-gradient-to-br from-terracotta-100 to-sand-200">
        {trip.cover_image && (
          <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-body font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[trip.status]}`}>
            {STATUS_LABELS[trip.status]}
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
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { currency } = useCurrency();
  const [tab, setTab] = useState<'trips' | 'settings'>('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
    }
  }, [profile]);

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
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          <aside className="hidden md:block">
            <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-6 sticky top-32">
              <div className="flex flex-col items-center text-center mb-8 pt-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center mb-4">
                  <span className="font-display text-3xl text-white font-medium">
                    {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
                  </span>
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
                  { id: 'settings', icon: Settings, label: 'Paramètres' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id as 'trips' | 'settings')}
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center">
                  <span className="font-display text-2xl text-white font-medium">
                    {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-medium text-midnight">{profile?.full_name ?? 'Voyageur'}</h2>
                  <p className="font-body text-xs text-midnight/40">{profile?.email}</p>
                </div>
              </div>

              <div className="flex bg-sand-100 rounded-2xl p-1">
                {[
                  { id: 'trips', label: 'Mes voyages' },
                  { id: 'settings', label: 'Paramètres' },
                ].map((currentTab) => (
                  <button
                    key={currentTab.id}
                    onClick={() => setTab(currentTab.id as 'trips' | 'settings')}
                    className={`flex-1 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
                      tab === currentTab.id ? 'bg-white text-midnight shadow-sm' : 'text-midnight/50'
                    }`}
                  >
                    {currentTab.label}
                  </button>
                ))}
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
                    <Link href="/trip/new" className="btn-primary flex items-center gap-2 text-sm">
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

              {tab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="mb-8">
                    <span className="tag mb-2 inline-flex">⚙️ Compte</span>
                    <h1 className="font-display text-3xl font-light text-midnight">Paramètres</h1>
                  </div>

                  <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-8 max-w-lg space-y-6">
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

                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                      {saving ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
                    </button>
                  </div>

                  <div className="bg-white rounded-4xl border border-red-100 p-8 max-w-lg mt-6">
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
