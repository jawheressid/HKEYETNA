'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TripGenerator, { type TripGeneratorInput } from '@/components/TripGenerator';
import ItineraryView from '@/components/ItineraryView';
import { supabase } from '@/lib/supabase';

async function saveTrip(userId: string, trip: any, input: TripGeneratorInput): Promise<string | null> {
  const coverImage = trip.days?.[0]?.hotel?.image ?? null;
  const { data: tripRow, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      title: trip.title,
      summary: trip.summary,
      duration: input.duration,
      budget: input.budget,
      total_cost: trip.totalCost,
      interests: input.interests,
      highlights: trip.highlights,
      status: 'saved',
      cover_image: coverImage,
      preferences: {
        ...input.preferences,
        startDate: input.startDate,
        endDate: input.endDate,
        regions: input.regions,
        selectedExperienceIds: input.selectedExperienceIds,
      },
      trip_data: trip,
    })
    .select()
    .single();

  if (tripError || !tripRow) {
    return null;
  }

  for (const day of trip.days ?? []) {
    const { data: dayRow } = await supabase
      .from('trip_days')
      .insert({
        trip_id: tripRow.id,
        day_number: day.day,
        location: day.location,
        total_day_cost: day.totalDayCost,
        hotel_name: day.hotel?.name ?? null,
        hotel_price: day.hotel?.price ?? null,
        hotel_stars: day.hotel?.stars ?? null,
        hotel_image: day.hotel?.image ?? null,
      })
      .select()
      .single();

    if (!dayRow) {
      continue;
    }

    if (day.activities?.length) {
      await supabase.from('trip_activities').insert(
        day.activities.map((activity: any, index: number) => ({
          trip_day_id: dayRow.id,
          time_slot: activity.time,
          title: activity.title,
          description: activity.description,
          activity_type: activity.type,
          price: activity.price,
          location: activity.location ?? day.location,
          sort_order: index,
        }))
      );
    }
  }

  return tripRow.id;
}

export default function NewTripPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);
  const [generatorInput, setGeneratorInput] = useState<TripGeneratorInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/trip/new');
    }
  }, [user, authLoading, router]);

  const handleSave = async () => {
    if (!user || !generatedTrip || !generatorInput) {
      return;
    }

    setSaving(true);
    setSaveError('');
    const id = await saveTrip(user.id, generatedTrip, generatorInput);
    setSaving(false);

    if (id) {
      router.push(`/trip/${id}`);
      return;
    }

    setSaveError('Impossible de sauvegarder ce voyage pour le moment.');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="px-6">
        <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="tag mb-3 inline-flex">✦ Voyage privé</span>
            <h1 className="font-display text-3xl md:text-4xl font-light text-midnight">Créer un nouveau voyage</h1>
          </div>
          <Link href="/profile" className="btn-secondary text-sm">
            Retour au profil
          </Link>
        </div>
      </div>

      <TripGenerator
        onTripGenerated={(trip, input) => {
          setGeneratedTrip(trip);
          setGeneratorInput(input);
        }}
        onReset={() => {
          setGeneratedTrip(null);
          setGeneratorInput(null);
          setSaveError('');
        }}
      />

      {generatedTrip && (
        <div className="px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-2 mb-4 bg-white rounded-4xl border border-sand-100 shadow-sm p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-olive-50 border border-olive-200 text-olive-700 text-sm font-medium px-4 py-2 rounded-full mb-3">
                  <Sparkles size={14} />
                  Votre itinéraire est prêt
                </div>
                <p className="font-body text-sm text-midnight/55">
                  Sauvegardez-le pour le retrouver dans votre profil et y revenir plus tard.
                </p>
                {saveError && (
                  <p className="font-body text-sm text-red-500 mt-3">{saveError}</p>
                )}
              </div>

              <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2 min-w-[220px]" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Sauvegarde…' : 'Sauvegarder ce voyage'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {generatedTrip && <ItineraryView trip={generatedTrip} />}
    </div>
  );
}
