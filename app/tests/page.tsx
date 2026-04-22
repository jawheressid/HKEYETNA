'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  User, MapPin, Calendar, DollarSign, Plus, LogOut,
  Compass, Clock, ChevronRight, Trash2, Archive, Globe,
  Edit3, Save, X, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import type { Trip } from '@/lib/database.types';

const CURRENCY_LABELS = { TND: 'DT', EUR: '€', USD: '$' };

function TripCard({ trip, onDelete, onArchive }: { trip: Trip; onDelete: (id: string) => void; onArchive: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColors: Record<string, string> = {
    active: 'bg-olive-50 text-olive-700',
    archived: 'bg-sand-100 text-sand-600',
    draft: 'bg-terracotta-50 text-terracotta-600',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl border border-sand-100 shadow-sm overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full ${statusColors[trip.status]}`}>
                {trip.status === 'active' ? 'Actif' : trip.status === 'archived' ? 'Archivé' : 'Brouillon'}
              </span>
              {trip.is_public && (
                <span className="text-xs font-body font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                  Public
                </span>
              )}
            </div>
            <h3 className="font-display text-lg font-medium text-midnight line-clamp-1">{trip.title}</h3>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-xl bg-sand-50 hover:bg-sand-100 flex items-center justify-center transition-colors text-midnight/40 hover:text-midnight"
            >
              ···
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white border border-sand-100 rounded-2xl shadow-lg shadow-sand-500/10 overflow-hidden z-10 min-w-36">
                <button
                  onClick={() => { onArchive(trip.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left font-body text-sm text-midnight/70 hover:bg-sand-50 transition-colors"
                >
                  <Archive size={14} /> Archiver
                </button>
                <button
                  onClick={() => { onDelete(trip.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left font-body text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {trip.summary && (
          <p className="font-body text-sm text-midnight/55 line-clamp-2 mb-4">{trip.summary}</p>
        )}

        <div className="flex items-center gap-4 text-xs font-body text-midnight/50">
          {trip.duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {trip.duration} jours
            </span>
          )}
          {trip.total_cost && (
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              {trip.total_cost} DT
            </span>
          )}
          {trip.start_city && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {trip.start_city}
            </span>
          )}
        </div>

        {trip.interests && trip.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {trip.interests.slice(0, 3).map(tag => (
              <span key={tag} className="tag text-xs">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-5">
        <Link
          href={`/trip/${trip.id}`}
          className="flex items-center justify-between w-full bg-sand-50 hover:bg-terracotta-50 hover:text-terracotta-600 rounded-2xl px-4 py-3 font-body text-sm font-semibold text-midnight/70 transition-all group"
        >
          Voir l&apos;itinéraire
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', bio: '', preferred_currency: 'TND' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'all'>('active');

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        preferred_currency: profile.preferred_currency || 'TND',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    setLoadingTrips(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setTrips(data || []);
    setLoadingTrips(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: profileForm.full_name,
      bio: profileForm.bio,
      preferred_currency: profileForm.preferred_currency as any,
      updated_at: new Date().toISOString(),
    }).eq('id', user!.id);
    await refreshProfile();
    setEditingProfile(false);
    setSaving(false);
  };

  const handleDeleteTrip = async (id: string) => {
    if (!confirm('Supprimer ce voyage définitivement ?')) return;
    await supabase.from('trips').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  const handleArchiveTrip = async (id: string) => {
    await supabase.from('trips').update({ status: 'archived' }).eq('id', id);
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'archived' as const } : t));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const filteredTrips = activeTab === 'all' ? trips : trips.filter(t => t.status === activeTab);
  const stats = {
    total: trips.length,
    active: trips.filter(t => t.status === 'active').length,
    totalDays: trips.reduce((sum, t) => sum + (t.duration || 0), 0),
    totalBudget: trips.reduce((sum, t) => sum + (t.budget || 0), 0),
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header profil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Carte profil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-white rounded-4xl border border-sand-100 shadow-sm p-7"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-terracotta-100 rounded-2xl flex items-center justify-center text-2xl font-display font-semibold text-terracotta-600">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex gap-2">
                {!editingProfile ? (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="w-9 h-9 rounded-xl bg-sand-50 hover:bg-sand-100 flex items-center justify-center text-midnight/50 hover:text-midnight transition-all"
                  >
                    <Edit3 size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="w-9 h-9 rounded-xl bg-sand-50 flex items-center justify-center text-midnight/40 hover:text-midnight transition-all"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-9 h-9 rounded-xl bg-sand-50 hover:bg-red-50 flex items-center justify-center text-midnight/40 hover:text-red-500 transition-all"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>

            {editingProfile ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Votre nom"
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2.5 font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400"
                />
                <textarea
                  value={profileForm.bio}
                  onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Bio courte..."
                  rows={3}
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2.5 font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 resize-none"
                />
                <select
                  value={profileForm.preferred_currency}
                  onChange={e => setProfileForm(p => ({ ...p, preferred_currency: e.target.value }))}
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-terracotta-400"
                >
                  <option value="TND">Dinar tunisien (DT)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar ($)</option>
                </select>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                  Sauvegarder
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold text-midnight mb-0.5">
                  {profile?.full_name || 'Voyageur'}
                </h2>
                <p className="font-body text-sm text-midnight/50 mb-3">{user?.email}</p>
                {profile?.bio && (
                  <p className="font-body text-sm text-midnight/65 mb-4 leading-relaxed">{profile.bio}</p>
                )}
                <div className="flex items-center gap-2 text-xs font-body text-midnight/40">
                  <Calendar size={12} />
                  Membre depuis {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : ''}
                </div>
              </>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { label: 'Voyages', value: stats.total, icon: Compass, color: 'text-terracotta-500' },
              { label: 'Actifs', value: stats.active, icon: Globe, color: 'text-olive-600' },
              { label: 'Jours planifiés', value: stats.totalDays, icon: Calendar, color: 'text-midnight' },
              { label: 'Budget total', value: `${stats.totalBudget} DT`, icon: DollarSign, color: 'text-terracotta-500' },
            ].map((stat, i) => (
              <div key={stat.label} className="bg-white rounded-3xl border border-sand-100 shadow-sm p-5">
                <stat.icon size={20} className={`${stat.color} mb-3`} />
                <p className="font-display text-2xl font-semibold text-midnight">{stat.value}</p>
                <p className="font-body text-xs text-midnight/50 mt-0.5">{stat.label}</p>
              </div>
            ))}

            {/* CTA nouveau voyage */}
            <Link
              href="/trip/new"
              className="col-span-2 sm:col-span-4 bg-terracotta-500 hover:bg-terracotta-600 rounded-3xl p-5 flex items-center justify-between transition-colors group"
            >
              <div>
                <p className="font-display text-xl font-medium text-white mb-0.5">Nouveau voyage</p>
                <p className="font-body text-sm text-white/70">Générez un itinéraire personnalisé avec l&apos;IA</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus size={22} className="text-white" />
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Liste des voyages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl font-light text-midnight">
              Mes voyages
            </h3>
            <div className="flex gap-1 bg-sand-50 rounded-2xl p-1">
              {(['active', 'archived', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl font-body text-xs font-semibold transition-all ${
                    activeTab === tab ? 'bg-white text-midnight shadow-sm' : 'text-midnight/50 hover:text-midnight'
                  }`}
                >
                  {tab === 'active' ? 'Actifs' : tab === 'archived' ? 'Archivés' : 'Tous'}
                </button>
              ))}
            </div>
          </div>

          {loadingTrips ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-3xl border border-sand-100 h-52 animate-pulse" />
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="font-display text-xl text-midnight mb-2">
                {activeTab === 'all' ? 'Aucun voyage encore' : `Aucun voyage ${activeTab === 'active' ? 'actif' : 'archivé'}`}
              </p>
              <p className="font-body text-sm text-midnight/50 mb-6">
                {activeTab === 'all' ? 'Créez votre premier itinéraire personnalisé !' : 'Changez de filtre ou créez un nouveau voyage.'}
              </p>
              <Link href="/trip/new" className="btn-primary inline-flex items-center gap-2">
                <Sparkles size={15} />
                Créer mon premier voyage
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTrips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <TripCard trip={trip} onDelete={handleDeleteTrip} onArchive={handleArchiveTrip} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
