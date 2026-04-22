'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Landmark, Loader2, CheckCircle2, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { saveTripRecord } from '@/lib/tripStorage';
import type { TripGeneratorInput } from '@/lib/tripTypes';

type PendingBooking = {
  trip: any;
  input: TripGeneratorInput;
};

const PAYMENT_OPTIONS = [
  { id: 'card', label: 'Carte bancaire', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: Wallet },
  { id: 'bank', label: 'Virement', icon: Landmark },
] as const;

export default function BookingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { format } = useCurrency();
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'bank'>('card');
  const [travelerName, setTravelerName] = useState('');
  const [travelerEmail, setTravelerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/trip/booking');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem('hkeyetna-pending-booking');
    if (!raw) {
      return;
    }

    try {
      setPendingBooking(JSON.parse(raw));
    } catch {
      setPendingBooking(null);
    }
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setTravelerName(profile.full_name ?? '');
    setTravelerEmail(profile.email ?? '');
  }, [profile]);

  const summary = useMemo(() => {
    if (!pendingBooking?.trip) {
      return null;
    }

    const trip = pendingBooking.trip;
    const firstDay = trip.days?.[0];

    return {
      totalDays: trip.days?.length ?? 0,
      totalCost: trip.totalCost ?? 0,
      regions: trip.regions ?? [],
      firstHotel: firstDay?.hotel?.name ?? 'Hébergement local',
      firstLocation: firstDay?.location ?? 'Tunisie',
    };
  }, [pendingBooking]);

  const handleConfirmBooking = async () => {
    if (!user || !pendingBooking) {
      return;
    }

    setSaving(true);
    setError('');

    const id = await saveTripRecord({
      userId: user.id,
      trip: pendingBooking.trip,
      input: pendingBooking.input,
      status: 'saved',
      booking: {
        paymentMethod,
        travelerName,
        travelerEmail,
        notes,
      },
    });

    setSaving(false);

    if (!id) {
      setError('Impossible de finaliser le booking pour le moment.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('hkeyetna-pending-booking');
    }

    router.push('/profile?tab=bookings');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  if (!pendingBooking) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-4xl border border-sand-100 shadow-sm p-8 text-center">
          <h1 className="font-display text-3xl text-midnight mb-3">Aucun voyage à booker</h1>
          <p className="font-body text-midnight/55 mb-6">
            Générez d&apos;abord un itinéraire, puis utilisez le bouton Booking depuis la page de planification.
          </p>
          <Link href="/trip/new" className="btn-primary inline-flex">
            Retour à la planification
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <span className="tag mb-3 inline-flex">✦ Booking</span>
          <h1 className="font-display text-4xl font-light text-midnight">Vérifiez votre voyage et confirmez</h1>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-4xl border border-sand-100 shadow-sm p-7">
            <h2 className="font-display text-2xl text-midnight mb-4">{pendingBooking.trip.title}</h2>
            <p className="font-body text-midnight/60 leading-relaxed mb-6">{pendingBooking.trip.summary}</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-sand-50 rounded-3xl p-4 border border-sand-200">
                <p className="text-xs font-body text-midnight/40 mb-1">Point de départ</p>
                <p className="font-body font-semibold text-midnight">{summary?.firstLocation}</p>
              </div>
              <div className="bg-sand-50 rounded-3xl p-4 border border-sand-200">
                <p className="text-xs font-body text-midnight/40 mb-1">Premier hébergement</p>
                <p className="font-body font-semibold text-midnight">{summary?.firstHotel}</p>
              </div>
              <div className="bg-sand-50 rounded-3xl p-4 border border-sand-200">
                <p className="text-xs font-body text-midnight/40 mb-1">Durée</p>
                <p className="font-body font-semibold text-midnight">{summary?.totalDays} jours</p>
              </div>
              <div className="bg-sand-50 rounded-3xl p-4 border border-sand-200">
                <p className="text-xs font-body text-midnight/40 mb-1">Budget total</p>
                <p className="font-body font-semibold text-midnight">{format(summary?.totalCost ?? 0)}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="font-body font-semibold text-midnight mb-3">Régions du séjour</p>
              <div className="flex flex-wrap gap-2">
                {(summary?.regions ?? []).map((region: string) => (
                  <span key={region} className="tag">{region}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-body font-semibold text-midnight mb-3">Aperçu jour par jour</p>
              <div className="space-y-3">
                {pendingBooking.trip.days.map((day: any) => (
                  <div key={day.day} className="rounded-3xl border border-sand-200 p-4 bg-sand-50/60">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-body font-semibold text-midnight">Jour {day.day} • {day.location}</p>
                      <span className="text-sm font-body text-terracotta-600">{format(day.totalDayCost)}</span>
                    </div>
                    <p className="text-sm font-body text-midnight/55 line-clamp-2">
                      {(day.activities ?? []).slice(0, 3).map((activity: any) => activity.title).join(' • ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-7">
              <p className="font-body font-semibold text-midnight mb-4">Voyageur principal</p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={travelerName}
                  onChange={(event) => setTravelerName(event.target.value)}
                  placeholder="Nom du voyageur"
                  className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-2xl font-body text-sm"
                />
                <input
                  type="email"
                  value={travelerEmail}
                  onChange={(event) => setTravelerEmail(event.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-2xl font-body text-sm"
                />
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notes de booking: heure d’arrivée, besoins particuliers, etc."
                  className="w-full min-h-28 px-4 py-3 bg-sand-50 border border-sand-200 rounded-2xl font-body text-sm resize-y"
                />
              </div>
            </div>

            <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-7">
              <p className="font-body font-semibold text-midnight mb-4">Mode de paiement</p>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={`w-full rounded-3xl border-2 p-4 text-left transition-all ${
                      paymentMethod === option.id
                        ? 'border-terracotta-500 bg-terracotta-50'
                        : 'border-sand-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <option.icon size={18} className={paymentMethod === option.id ? 'text-terracotta-600' : 'text-midnight/50'} />
                      <span className="font-body font-semibold text-midnight">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-midnight to-midnight/90 rounded-4xl p-7 text-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} className="text-olive-300" />
                <p className="font-body font-semibold">Confirmation finale</p>
              </div>
              <p className="font-body text-white/70 text-sm mb-5">
                Après validation, ce voyage sera enregistré dans votre espace booking pour le retrouver depuis votre profil.
              </p>
              {error && <p className="font-body text-sm text-red-200 mb-4">{error}</p>}
              <button
                onClick={handleConfirmBooking}
                disabled={saving || !travelerName || !travelerEmail}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {saving ? 'Confirmation…' : 'Confirmer et enregistrer ce trip'}
              </button>
              <Link href="/trip/new" className="mt-3 inline-flex text-sm font-body text-white/70 hover:text-white">
                Retour à la planification
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
