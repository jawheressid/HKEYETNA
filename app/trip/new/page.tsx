'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TripGenerator from '@/components/TripGenerator';
import ItineraryView from '@/components/ItineraryView';
import { saveTripRecord } from '@/lib/tripStorage';
import type { TripGeneratorInput } from '@/lib/tripTypes';

export default function NewTripPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);
  const [generatorInput, setGeneratorInput] = useState<TripGeneratorInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [redirectingToBooking, setRedirectingToBooking] = useState(false);
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
    const id = await saveTripRecord({
      userId: user.id,
      trip: generatedTrip,
      input: generatorInput,
      status: 'saved',
    });
    setSaving(false);

    if (id) {
      router.push(`/trip/${id}`);
      return;
    }

    setSaveError('Impossible de sauvegarder ce voyage pour le moment.');
  };

  const handleBooking = () => {
    if (!generatedTrip || !generatorInput) {
      return;
    }

    setRedirectingToBooking(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'hkeyetna-pending-booking',
        JSON.stringify({
          trip: generatedTrip,
          input: generatorInput,
        })
      );
    }
    router.push('/trip/booking');
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

      {generatedTrip && <ItineraryView trip={generatedTrip} />}

      {generatedTrip && (
        <div className="px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-6 bg-white rounded-4xl border border-sand-100 shadow-sm p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-olive-50 border border-olive-200 text-olive-700 text-sm font-medium px-4 py-2 rounded-full mb-3">
                  <Sparkles size={14} />
                  Votre itinéraire est prêt
                </div>
                <p className="font-body text-sm text-midnight/55">
                  Vérifiez d&apos;abord votre voyage dans Booking pour choisir le paiement, puis il sera enregistré dans votre espace booking. Vous pouvez aussi le sauvegarder en brouillon.
                </p>
                {saveError && (
                  <p className="font-body text-sm text-red-500 mt-3">{saveError}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBooking}
                  className="btn-primary flex items-center justify-center gap-2 min-w-[220px]"
                  disabled={redirectingToBooking}
                >
                  {redirectingToBooking ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  {redirectingToBooking ? 'Ouverture du booking…' : 'Booking'}
                </button>
                <button onClick={handleSave} className="btn-secondary flex items-center justify-center gap-2 min-w-[220px]" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Sauvegarde…' : 'Sauvegarder en brouillon'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
