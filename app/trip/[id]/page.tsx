'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Trip } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ItineraryView from '@/components/ItineraryView';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchTrip = async () => {
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError || !data) {
        setError('Voyage introuvable.');
      } else {
        setTrip(data);
      }

      setLoading(false);
    };

    if (user && params.id) {
      void fetchTrip();
    }
  }, [user, params.id]);

  const handleDelete = async () => {
    if (!trip || !window.confirm('Supprimer définitivement ce voyage ?')) {
      return;
    }

    await supabase.from('trips').delete().eq('id', trip.id);
    router.push('/profile');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-body text-midnight/60">{error || 'Voyage introuvable.'}</p>
        <Link href="/profile" className="btn-secondary">← Retour au profil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="px-6 max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-xs font-body text-midnight/40 mb-6">
          <Link href="/" className="hover:text-midnight/70 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/profile" className="hover:text-midnight/70 transition-colors">Profil</Link>
          <span>/</span>
          <span className="text-midnight/70 truncate max-w-[200px]">{trip.title}</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2.5 rounded-full border border-sand-200 text-midnight/50 hover:text-midnight transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-display text-2xl md:text-3xl font-light text-midnight">{trip.title}</h1>
          </div>

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-sm font-body text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-4 py-2 rounded-full transition-all"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      </div>

      {trip.trip_data && <ItineraryView trip={trip.trip_data} />}
    </div>
  );
}
