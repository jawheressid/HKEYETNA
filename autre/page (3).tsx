'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles, ChevronRight, Save, DollarSign, Clock, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';

const INTERESTS = [
  { id: 'plage', label: '🏖️ Plage', desc: 'Côtes & mer' },
  { id: 'désert', label: '🏜️ Désert', desc: 'Sahara & dunes' },
  { id: 'culture', label: '🏛️ Culture', desc: 'Musées & art' },
  { id: 'histoire', label: '🏺 Histoire', desc: 'Antiquités' },
  { id: 'gastronomie', label: '🍽️ Gastronomie', desc: 'Cuisine locale' },
  { id: 'nature', label: '🌿 Nature', desc: 'Forêts & montagnes' },
  { id: 'aventure', label: '🧗 Aventure', desc: 'Sports & trek' },
  { id: 'spirituel', label: '🕌 Spirituel', desc: 'Lieux sacrés' },
];

const TRANSPORT_OPTIONS = [
  { id: 'has-transport', label: 'J'ai déjà un transport', desc: 'Voiture perso / déjà réservé', emoji: '🚗' },
  { id: 'need-transport', label: 'Je veux un transport', desc: 'Options de transfert intégrées', emoji: '🚌' },
  { id: 'no-preference', label: 'Peu importe', desc: 'L'IA décide selon l'itinéraire', emoji: '🧭' },
];

const START_CITIES = ['Tunis', 'Sfax', 'Sousse', 'Hammamet', 'Djerba', 'Tozeur', 'Kairouan', 'Tabarka'];

export default function TripNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { format } = useCurrency();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState(2000);
  const [duration, setDuration] = useState(5);
  const [startCity, setStartCity] = useState('Tunis');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['culture', 'gastronomie']);
  const [includeWorkshops, setIncludeWorkshops] = useState(true);
  const [transportPreference, setTransportPreference] = useState<string>('no-preference');
  const [wantsGuide, setWantsGuide] = useState(true);
  const [extraPreferences, setExtraPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const generateTrip = async () => {
    if (selectedInterests.length === 0) return;
    setLoading(true);
    setStep(4);
    try {
      const res = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget, duration, interests: selectedInterests, startCity,
          preferences: { includeWorkshops, transportPreference, wantsGuide, notes: extraPreferences.trim() },
        }),
      });
      const trip = await res.json();
      setGeneratedTrip(trip);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveTrip = async () => {
    if (!generatedTrip || !user) return;
    setSaving(true);
    try {
      // Sauvegarder le voyage
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: generatedTrip.title || `Voyage ${duration}j en Tunisie`,
          summary: generatedTrip.summary,
          total_cost: generatedTrip.totalCost,
          budget,
          duration,
          interests: selectedInterests,
          start_city: startCity,
          highlights: generatedTrip.highlights || [],
          status: 'active',
        })
        .select()
        .single();

      if (tripError || !tripData) throw tripError;

      // Sauvegarder les jours
      if (generatedTrip.days && generatedTrip.days.length > 0) {
        const daysToInsert = generatedTrip.days.map((day: any) => ({
          trip_id: tripData.id,
          day_number: day.day,
          location: day.location,
          hotel: day.hotel || null,
          activities: day.activities || [],
          total_day_cost: day.totalDayCost || 0,
          weather: day.weather || null,
        }));
        await supabase.from('trip_days').insert(daysToInsert);
      }

      setSavedId(tripData.id);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setSaving(false);
    }
  };

  const STEP_LABELS = ['Informations', 'Intérêts', 'Préférences', 'Génération'];

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-midnight/50 hover:text-midnight font-body text-sm mb-6 transition-colors">
            <ArrowLeft size={16} />
            Mon profil
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 text-terracotta-600 text-sm font-medium px-4 py-1.5 rounded-full">
              <Sparkles size={13} />
              Propulsé par Gemini IA
            </div>
          </div>
          <h1 className="font-display text-4xl font-light text-midnight">
            Créer mon voyage
          </h1>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {STEP_LABELS.slice(0, 3).map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-semibold transition-all ${
                  i + 1 < step ? 'bg-terracotta-500 text-white' :
                  i + 1 === step ? 'bg-terracotta-500 text-white' :
                  'bg-sand-100 text-midnight/40'
                }`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={`font-body text-xs hidden sm:block ${i + 1 === step ? 'text-midnight font-semibold' : 'text-midnight/40'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > i + 1 ? 'bg-terracotta-400' : 'bg-sand-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <motion.div className="bg-white/90 backdrop-blur-sm rounded-4xl border border-sand-100 shadow-xl shadow-sand-500/10 p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1 — Budget, Durée, Départ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-body font-semibold text-midnight flex items-center gap-2">
                      <DollarSign size={16} className="text-terracotta-500" />
                      Budget total
                    </label>
                    <span className="font-display text-2xl font-semibold text-terracotta-500">{format(budget)}</span>
                  </div>
                  <input
                    type="range" min={500} max={10000} step={100} value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    className="w-full accent-terracotta-500"
                  />
                  <div className="flex justify-between text-xs font-body text-midnight/40 mt-1">
                    <span>{format(500)}</span><span>{format(10000)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-body font-semibold text-midnight flex items-center gap-2">
                      <Clock size={16} className="text-terracotta-500" />
                      Durée du séjour
                    </label>
                    <span className="font-display text-2xl font-semibold text-terracotta-500">{duration} jours</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[3, 5, 7, 10, 14].map(d => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`px-4 py-2 rounded-2xl border-2 font-body text-sm font-semibold transition-all ${
                          duration === d ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700' : 'border-sand-200 text-midnight/60 hover:border-sand-300'
                        }`}
                      >
                        {d}j
                      </button>
                    ))}
                    <input
                      type="number" min={1} max={30} value={duration}
                      onChange={e => setDuration(Math.max(1, Math.min(30, Number(e.target.value))))}
                      className="w-20 border-2 border-sand-200 rounded-2xl px-3 py-2 font-body text-sm text-midnight focus:outline-none focus:border-terracotta-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-body font-semibold text-midnight block mb-3">Ville de départ</label>
                  <div className="flex flex-wrap gap-2">
                    {START_CITIES.map(city => (
                      <button
                        key={city}
                        onClick={() => setStartCity(city)}
                        className={`px-4 py-2 rounded-2xl border-2 font-body text-sm font-semibold transition-all ${
                          startCity === city ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700' : 'border-sand-200 text-midnight/60 hover:border-sand-300'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="btn-primary w-full flex items-center justify-center gap-2">
                  Suivant <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* STEP 2 — Intérêts */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <p className="font-body font-semibold text-midnight mb-1 flex items-center gap-2">
                    <Heart size={16} className="text-terracotta-500" />
                    Vos centres d'intérêt
                  </p>
                  <p className="font-body text-sm text-midnight/50 mb-5">Sélectionnez tout ce qui vous attire</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={`rounded-2xl border-2 px-3 py-3.5 text-left transition-all ${
                          selectedInterests.includes(interest.id)
                            ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                            : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                        }`}
                      >
                        <p className="font-body font-semibold text-sm">{interest.label}</p>
                        <p className="text-xs font-body mt-1 opacity-70">{interest.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-secondary">Retour</button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={selectedInterests.length === 0}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Préférences */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Workshops */}
                <div>
                  <p className="font-body font-semibold text-midnight mb-3">Ateliers & workshops ?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: true, title: 'Oui, inclure', desc: 'Cuisine, artisanat, activités créatives' },
                      { val: false, title: 'Non merci', desc: 'Plutôt visites classiques' },
                    ].map(opt => (
                      <button
                        key={String(opt.val)}
                        onClick={() => setIncludeWorkshops(opt.val)}
                        className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                          includeWorkshops === opt.val ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700' : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                        }`}
                      >
                        <p className="font-body font-semibold text-sm">{opt.title}</p>
                        <p className="text-xs font-body mt-1 opacity-80">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport */}
                <div>
                  <p className="font-body font-semibold text-midnight mb-3">Transport</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TRANSPORT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTransportPreference(opt.id)}
                        className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                          transportPreference === opt.id ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700' : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                        }`}
                      >
                        <p className="font-body font-semibold text-sm">{opt.emoji} {opt.label}</p>
                        <p className="text-xs font-body mt-1 opacity-80">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guide */}
                <div>
                  <p className="font-body font-semibold text-midnight mb-3">Guide local ?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: true, title: 'Oui, avec guide', desc: 'Visites guidées et conseils' },
                      { val: false, title: 'En autonomie', desc: 'Parcours libre' },
                    ].map(opt => (
                      <button
                        key={String(opt.val)}
                        onClick={() => setWantsGuide(opt.val)}
                        className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                          wantsGuide === opt.val ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700' : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                        }`}
                      >
                        <p className="font-body font-semibold text-sm">{opt.title}</p>
                        <p className="text-xs font-body mt-1 opacity-80">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-body font-semibold text-midnight mb-2 block">Autres préférences (optionnel)</label>
                  <textarea
                    value={extraPreferences}
                    onChange={e => setExtraPreferences(e.target.value)}
                    placeholder="Ex: hôtel calme, activités famille, peu de marche..."
                    className="w-full min-h-24 bg-sand-50 border border-sand-200 rounded-2xl px-4 py-3 font-body text-sm text-midnight placeholder-midnight/35 focus:outline-none focus:border-terracotta-400 transition-colors resize-y"
                  />
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="btn-secondary">Retour</button>
                  <button
                    onClick={generateTrip}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Sparkles size={16} />
                    Générer mon voyage
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4 — Loading / Résultat */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8"
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-sand-200" />
                      <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-terracotta-500 border-t-transparent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">✈️</div>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-2xl font-light text-midnight mb-2">Composition de votre voyage…</p>
                      <p className="font-body text-sm text-midnight/50">Notre IA Gemini explore les meilleurs itinéraires</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {['Recherche des hôtels', 'Sélection des activités', 'Optimisation du budget'].map((t, i) => (
                        <motion.span
                          key={t}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
                          className="tag"
                        >
                          {t}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                ) : generatedTrip ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-olive-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🎉</div>
                      <h3 className="font-display text-2xl font-light text-midnight mb-1">{generatedTrip.title}</h3>
                      <p className="font-body text-sm text-midnight/55">{generatedTrip.summary}</p>
                    </div>

                    {/* Résumé rapide */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-sand-50 rounded-2xl p-4 text-center">
                        <p className="font-display text-xl font-semibold text-midnight">{generatedTrip.days?.length || duration}</p>
                        <p className="font-body text-xs text-midnight/50">jours</p>
                      </div>
                      <div className="bg-sand-50 rounded-2xl p-4 text-center">
                        <p className="font-display text-xl font-semibold text-terracotta-500">{generatedTrip.totalCost} DT</p>
                        <p className="font-body text-xs text-midnight/50">coût total</p>
                      </div>
                      <div className="bg-sand-50 rounded-2xl p-4 text-center">
                        <p className="font-display text-xl font-semibold text-midnight">{generatedTrip.highlights?.length || 0}</p>
                        <p className="font-body text-xs text-midnight/50">highlights</p>
                      </div>
                    </div>

                    {/* Highlights */}
                    {generatedTrip.highlights && generatedTrip.highlights.length > 0 && (
                      <div className="space-y-2">
                        {generatedTrip.highlights.slice(0, 4).map((h: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 font-body text-sm text-midnight/70">
                            <span className="text-terracotta-500 mt-0.5">✦</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {savedId ? (
                      <div className="flex flex-col gap-3">
                        <div className="bg-olive-50 rounded-2xl px-4 py-3 text-center font-body text-sm font-semibold text-olive-700">
                          ✅ Voyage sauvegardé dans votre profil
                        </div>
                        <Link href={`/trip/${savedId}`} className="btn-primary w-full flex items-center justify-center gap-2">
                          Voir l'itinéraire complet
                          <ChevronRight size={16} />
                        </Link>
                        <Link href="/profile" className="btn-secondary w-full text-center">
                          Retour au profil
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={saveTrip}
                          disabled={saving}
                          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {saving ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><Save size={16} /> Sauvegarder ce voyage</>
                          )}
                        </button>
                        <button onClick={() => setStep(1)} className="btn-secondary w-full">
                          Recommencer
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="font-body text-midnight/50">Une erreur est survenue. Veuillez réessayer.</p>
                    <button onClick={() => setStep(3)} className="btn-secondary mt-4">Retour</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
