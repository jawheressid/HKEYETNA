'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, DollarSign, Clock, Heart, ChevronRight } from 'lucide-react';
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

type TransportPreference = 'has-transport' | 'need-transport' | 'no-preference';

const TRANSPORT_OPTIONS: Array<{ id: TransportPreference; label: string; desc: string; emoji: string }> = [
  { id: 'has-transport', label: 'J’ai déjà un transport', desc: 'Voiture perso / transport déjà réservé', emoji: '🚗' },
  { id: 'need-transport', label: 'Je veux un transport', desc: 'Je souhaite des options de transfert', emoji: '🚌' },
  { id: 'no-preference', label: 'Peu importe', desc: 'L’IA décide selon l’itinéraire', emoji: '🧭' },
];

interface Props {
  onTripGenerated: (trip: any) => void;
}

export default function TripGenerator({ onTripGenerated }: Props) {
  const { format } = useCurrency();
  const [budget, setBudget] = useState(2000);
  const [duration, setDuration] = useState(5);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['culture', 'gastronomie']);
  const [includeWorkshops, setIncludeWorkshops] = useState(true);
  const [transportPreference, setTransportPreference] = useState<TransportPreference>('no-preference');
  const [wantsGuide, setWantsGuide] = useState(true);
  const [extraPreferences, setExtraPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const generateTrip = async () => {
    if (selectedInterests.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget,
          duration,
          interests: selectedInterests,
          preferences: {
            includeWorkshops,
            transportPreference,
            wantsGuide,
            notes: extraPreferences.trim(),
          },
        }),
      });
      const trip = await res.json();
      onTripGenerated(trip);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="trip" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 text-terracotta-600 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles size={14} />
            Propulsé par l'Intelligence Artificielle
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-light text-midnight mb-5">
            Votre voyage,
            <span className="text-terracotta-500 italic"> personnalisé</span>
          </h2>
          <p className="font-body text-lg text-midnight/60 max-w-xl mx-auto">
            Décrivez vos envies, notre IA compose un itinéraire sur mesure adapté à votre budget et vos intérêts.
          </p>
        </motion.div>

        {/* Generator Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="bg-white rounded-5xl shadow-xl border border-sand-100 overflow-hidden"
        >
          {/* Progress */}
          <div className="flex border-b border-sand-100">
            {[
              { n: 1, label: 'Budget & Durée', icon: DollarSign },
              { n: 2, label: 'Intérêts', icon: Heart },
              { n: 3, label: 'Préférences', icon: Heart },
              { n: 4, label: 'Génération', icon: Sparkles },
            ].map(({ n, label, icon: Icon }) => (
              <button
                key={n}
                onClick={() => n < 4 && setStep(n)}
                className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-medium transition-colors ${
                  step === n
                    ? 'bg-terracotta-50 text-terracotta-600 border-b-2 border-terracotta-500'
                    : step > n
                    ? 'text-olive-600 bg-olive-50/50'
                    : 'text-midnight/40'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > n ? 'bg-olive-500 text-white' : step === n ? 'bg-terracotta-500 text-white' : 'bg-sand-200 text-midnight/40'
                }`}>
                  {step > n ? '✓' : n}
                </div>
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {/* Step 1: Budget & Duration */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-10"
                >
                  {/* Budget Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-2 font-body font-semibold text-midnight">
                        <DollarSign size={18} className="text-terracotta-500" />
                        Budget total
                      </label>
                      <div className="bg-sand-100 px-4 py-2 rounded-xl">
                        <span className="font-display text-2xl font-semibold text-terracotta-500">
                          {format(budget)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={10000}
                      step={100}
                      value={budget}
                      onChange={e => setBudget(Number(e.target.value))}
                      className="w-full h-2 bg-sand-200 rounded-full appearance-none cursor-pointer accent-terracotta-500"
                    />
                    <div className="flex justify-between text-xs text-midnight/40 mt-2 font-body">
                      <span>{format(500)}</span>
                      <span>{format(10000)}</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="flex items-center gap-2 font-body font-semibold text-midnight mb-6">
                      <Clock size={18} className="text-terracotta-500" />
                      Durée du séjour
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                      {[1, 2, 3, 4, 5, 7, 10].map(d => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`flex flex-col items-center py-4 px-2 rounded-2xl border-2 transition-all font-body ${
                            duration === d
                              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600'
                              : 'border-sand-200 hover:border-sand-300 text-midnight/60'
                          }`}
                        >
                          <span className="text-xl font-bold">{d}</span>
                          <span className="text-xs mt-1">{d === 1 ? 'jour' : 'jours'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                      Suivant
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Interests */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div>
                    <label className="flex items-center gap-2 font-body font-semibold text-midnight mb-2">
                      <Heart size={18} className="text-terracotta-500" />
                      Vos centres d'intérêt
                    </label>
                    <p className="text-sm text-midnight/50 font-body mb-6">Sélectionnez tout ce qui vous inspire</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {INTERESTS.map(interest => (
                        <button
                          key={interest.id}
                          onClick={() => toggleInterest(interest.id)}
                          className={`flex flex-col items-center py-5 px-3 rounded-3xl border-2 transition-all font-body ${
                            selectedInterests.includes(interest.id)
                              ? 'border-terracotta-500 bg-terracotta-50 shadow-md shadow-terracotta-100'
                              : 'border-sand-200 hover:border-sand-300 hover:bg-sand-50'
                          }`}
                        >
                          <span className="text-2xl mb-2">{interest.label.split(' ')[0]}</span>
                          <span className={`text-sm font-medium ${selectedInterests.includes(interest.id) ? 'text-terracotta-600' : 'text-midnight'}`}>
                            {interest.label.split(' ').slice(1).join(' ')}
                          </span>
                          <span className="text-xs text-midnight/40 mt-1">{interest.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                      Retour
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={selectedInterests.length === 0}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Preferences */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div>
                      <p className="font-body font-semibold text-midnight mb-3">Souhaitez-vous des workshops (ateliers) ?</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setIncludeWorkshops(true)}
                          className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                            includeWorkshops
                              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                              : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                          }`}
                        >
                          <p className="font-body font-semibold text-sm">Oui, ajoutez des ateliers</p>
                          <p className="text-xs font-body mt-1 opacity-80">Cuisine, artisanat, activités créatives</p>
                        </button>
                        <button
                          onClick={() => setIncludeWorkshops(false)}
                          className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                            !includeWorkshops
                              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                              : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                          }`}
                        >
                          <p className="font-body font-semibold text-sm">Non, pas nécessaire</p>
                          <p className="text-xs font-body mt-1 opacity-80">Plutôt visites classiques et détente</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="font-body font-semibold text-midnight mb-3">Transport</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {TRANSPORT_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setTransportPreference(option.id)}
                            className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                              transportPreference === option.id
                                ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                            }`}
                          >
                            <p className="font-body font-semibold text-sm">{option.emoji} {option.label}</p>
                            <p className="text-xs font-body mt-1 opacity-80">{option.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-body font-semibold text-midnight mb-3">Guide local</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setWantsGuide(true)}
                          className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                            wantsGuide
                              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                              : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                          }`}
                        >
                          <p className="font-body font-semibold text-sm">Oui, je veux un guide</p>
                          <p className="text-xs font-body mt-1 opacity-80">Visites guidées et conseils d’expert</p>
                        </button>
                        <button
                          onClick={() => setWantsGuide(false)}
                          className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                            !wantsGuide
                              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                              : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                          }`}
                        >
                          <p className="font-body font-semibold text-sm">Non, je préfère en autonomie</p>
                          <p className="text-xs font-body mt-1 opacity-80">Parcours libre sans accompagnement</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-body font-semibold text-midnight mb-2 block">Autres préférences (optionnel)</label>
                      <textarea
                        value={extraPreferences}
                        onChange={(e) => setExtraPreferences(e.target.value)}
                        placeholder="Ex: hôtel calme, activités famille, peu de marche, préférence poisson, etc."
                        className="w-full min-h-28 bg-white border border-sand-200 rounded-2xl px-4 py-3 font-body text-sm text-midnight placeholder-midnight/35 focus:outline-none focus:border-terracotta-400 transition-colors resize-y"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                      Retour
                    </button>
                    <button
                      onClick={() => { setStep(4); generateTrip(); }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      Générer mon voyage
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Loading */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center py-20 gap-8"
                >
                  {loading ? (
                    <>
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-sand-200" />
                        <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-terracotta-500 border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl">✈️</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-2xl font-light text-midnight mb-2">
                          Composition de votre voyage…
                        </p>
                        <p className="font-body text-midnight/50 text-sm">
                          Notre IA explore les meilleurs itinéraires pour vous
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {['Recherche des hôtels', 'Sélection des activités', 'Optimisation du budget'].map((t, i) => (
                          <motion.span
                            key={t}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
                            className="tag"
                          >
                            {t}
                          </motion.span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-olive-100 flex items-center justify-center text-4xl">
                        🎉
                      </div>
                      <div className="text-center">
                        <p className="font-display text-2xl font-light text-midnight mb-2">
                          Votre itinéraire est prêt !
                        </p>
                        <p className="font-body text-midnight/50 text-sm">
                          Découvrez votre voyage personnalisé ci-dessous
                        </p>
                      </div>
                      <button onClick={() => setStep(1)} className="btn-secondary">
                        Modifier les préférences
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
