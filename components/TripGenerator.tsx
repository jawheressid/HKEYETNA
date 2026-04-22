'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  DollarSign,
  CalendarRange,
  Heart,
  ChevronRight,
  MapPinned,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import {
  INTERESTS,
  REGION_OPTIONS,
  TRANSPORT_OPTIONS,
  addDays,
  calculateDuration,
  dateToInputValue,
  getRecommendedExperiences,
  getSuggestedRegions,
  type TransportPreference,
} from '@/lib/tripPlanner';
import type { TripGeneratorInput } from '@/lib/tripTypes';

interface Props {
  onTripGenerated: (trip: any, input: TripGeneratorInput) => void;
  onReset?: () => void;
}

const EXPERIENCE_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'visite', label: 'Visites' },
  { id: 'activité', label: 'Activités' },
  { id: 'artisanat', label: 'Artisanat' },
  { id: 'gastronomie', label: 'Gastronomie' },
  { id: 'nature', label: 'Nature' },
];

const tomorrow = dateToInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000));

export default function TripGenerator({ onTripGenerated, onReset }: Props) {
  const { format } = useCurrency();
  const [budget, setBudget] = useState(2600);
  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(addDays(tomorrow, 4));
  const [duration, setDuration] = useState(5);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['culture', 'gastronomie', 'artisanat']);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['Grand Tunis', 'Nabeul']);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<string[]>(['cooking-tunis', 'pottery-nabeul']);
  const [includeWorkshops, setIncludeWorkshops] = useState(true);
  const [transportPreference, setTransportPreference] = useState<TransportPreference>('no-preference');
  const [wantsGuide, setWantsGuide] = useState(true);
  const [extraPreferences, setExtraPreferences] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setDuration(calculateDuration(startDate, endDate));
  }, [startDate, endDate]);

  const suggestedRegions = useMemo(() => getSuggestedRegions(selectedInterests), [selectedInterests]);
  const recommendedExperiences = useMemo(
    () =>
      getRecommendedExperiences({
        selectedInterests,
        selectedRegions,
        limit: 8,
      }).filter((experience) => {
        if (experienceFilter === 'all') {
          return true;
        }

        return (
          experience.activityType === experienceFilter ||
          experience.category === experienceFilter ||
          experience.tags.includes(experienceFilter)
        );
      }),
    [experienceFilter, selectedInterests, selectedRegions]
  );

  useEffect(() => {
    if (selectedRegions.length === 0 && suggestedRegions.length > 0) {
      setSelectedRegions(suggestedRegions.slice(0, 2));
    }
  }, [selectedRegions.length, suggestedRegions]);

  useEffect(() => {
    if (selectedRegions.length === 0) {
      return;
    }

    setSelectedExperienceIds((previous) =>
      previous.filter((id) =>
        getRecommendedExperiences({
          selectedInterests,
          selectedRegions,
          limit: 50,
        }).some((experience) => experience.id === id)
      )
    );
  }, [selectedInterests, selectedRegions]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((previous) =>
      previous.includes(id) ? previous.filter((interest) => interest !== id) : [...previous, id]
    );
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((previous) =>
      previous.includes(region) ? previous.filter((item) => item !== region) : [...previous, region]
    );
  };

  const toggleExperience = (id: string) => {
    setSelectedExperienceIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  };

  const handleDurationPreset = (days: number) => {
    setEndDate(addDays(startDate, days - 1));
    setDuration(days);
  };

  const handleGenerateTrip = async () => {
    if (selectedInterests.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const input: TripGeneratorInput = {
        budget,
        duration,
        startDate,
        endDate,
        interests: selectedInterests,
        regions: selectedRegions,
        selectedExperienceIds,
        preferences: {
          includeWorkshops,
          transportPreference,
          wantsGuide,
          notes: extraPreferences.trim(),
        },
      };

      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const trip = await response.json();
      onTripGenerated(trip, input);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="trip" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 text-terracotta-600 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles size={14} />
            Propulsé par l&apos;Intelligence Artificielle
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-light text-midnight mb-5">
            Votre voyage,
            <span className="text-terracotta-500 italic"> personnalisé</span>
          </h2>
          <p className="font-body text-lg text-midnight/60 max-w-2xl mx-auto">
            Choisissez vos dates, vos régions, vos centres d&apos;intérêt et les expériences que vous voulez vraiment voir apparaître dans le plan final.
          </p>
        </motion.div>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="bg-white rounded-5xl shadow-xl border border-sand-100 overflow-hidden"
        >
          <div className="flex border-b border-sand-100 overflow-x-auto">
            {[
              { n: 1, label: 'Dates & Budget', icon: CalendarRange },
              { n: 2, label: 'Intérêts', icon: Heart },
              { n: 3, label: 'Régions & Activités', icon: MapPinned },
              { n: 4, label: 'Génération', icon: Sparkles },
            ].map(({ n, label, icon: Icon }) => (
              <button
                key={n}
                onClick={() => n < 4 && setStep(n)}
                className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-5 text-sm font-medium transition-colors ${
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
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-10"
                >
                  <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
                    <div className="space-y-8">
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
                          min={700}
                          max={12000}
                          step={100}
                          value={budget}
                          onChange={(event) => setBudget(Number(event.target.value))}
                          className="w-full h-2 bg-sand-200 rounded-full appearance-none cursor-pointer accent-terracotta-500"
                        />
                        <div className="flex justify-between text-xs text-midnight/40 mt-2 font-body">
                          <span>{format(700)}</span>
                          <span>{format(12000)}</span>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 font-body font-semibold text-midnight mb-5">
                          <CalendarRange size={18} className="text-terracotta-500" />
                          Dates du séjour
                        </label>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-sand-50 rounded-3xl border border-sand-200 p-5">
                            <label className="block text-xs font-body uppercase tracking-wide text-midnight/40 mb-2">
                              Départ
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              min={tomorrow}
                              onChange={(event) => {
                                const value = event.target.value;
                                setStartDate(value);
                                if (value > endDate) {
                                  setEndDate(value);
                                }
                              }}
                              className="w-full bg-white border border-sand-200 rounded-2xl px-4 py-3 font-body text-sm text-midnight focus:outline-none focus:border-terracotta-400"
                            />
                          </div>

                          <div className="bg-sand-50 rounded-3xl border border-sand-200 p-5">
                            <label className="block text-xs font-body uppercase tracking-wide text-midnight/40 mb-2">
                              Retour
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(event) => setEndDate(event.target.value)}
                              className="w-full bg-white border border-sand-200 rounded-2xl px-4 py-3 font-body text-sm text-midnight focus:outline-none focus:border-terracotta-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 font-body font-semibold text-midnight mb-5">
                          <Clock3 size={18} className="text-terracotta-500" />
                          Ajuster la durée rapidement
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                          {[3, 4, 5, 6, 7, 10, 12].map((days) => (
                            <button
                              key={days}
                              onClick={() => handleDurationPreset(days)}
                              className={`flex flex-col items-center py-4 px-2 rounded-2xl border-2 transition-all font-body ${
                                duration === days
                                  ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600'
                                  : 'border-sand-200 hover:border-sand-300 text-midnight/60'
                              }`}
                            >
                              <span className="text-xl font-bold">{days}</span>
                              <span className="text-xs mt-1">jours</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="surface-card p-6">
                      <span className="tag mb-4 inline-flex">Synthèse instantanée</span>
                      <h3 className="font-display text-3xl font-light text-midnight mb-4">
                        {duration} jours bien
                        <span className="text-terracotta-500 italic"> planifiés</span>
                      </h3>
                      <div className="space-y-4 font-body text-sm text-midnight/65">
                        <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200">
                          <p className="text-midnight/40 text-xs mb-1">Fenêtre de voyage</p>
                          <p>{new Date(startDate).toLocaleDateString('fr-FR')} → {new Date(endDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200">
                          <p className="text-midnight/40 text-xs mb-1">Budget moyen par jour</p>
                          <p>{format(Math.round(budget / duration))}</p>
                        </div>
                        <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200">
                          <p className="text-midnight/40 text-xs mb-1">Style attendu</p>
                          <p>Plan détaillé avec activités, horaires, hôtels et carte par journée.</p>
                        </div>
                      </div>
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

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div>
                    <label className="flex items-center gap-2 font-body font-semibold text-midnight mb-2">
                      <Heart size={18} className="text-terracotta-500" />
                      Vos centres d&apos;intérêt
                    </label>
                    <p className="text-sm text-midnight/50 font-body mb-6">
                      Sélectionnez tout ce qui doit influencer l&apos;itinéraire et les activités proposées.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {INTERESTS.map((interest) => (
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

                  <div>
                    <label className="flex items-center gap-2 font-body font-semibold text-midnight mb-2">
                      <MapPinned size={18} className="text-terracotta-500" />
                      Régions à visiter
                    </label>
                    <p className="text-sm text-midnight/50 font-body mb-4">
                      Choisissez les régions à privilégier. L&apos;IA concentrera le parcours sur ces zones.
                    </p>
                    {suggestedRegions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {suggestedRegions.map((region) => (
                          <button
                            key={region}
                            onClick={() => toggleRegion(region)}
                            className="tag hover:bg-terracotta-50 transition-colors"
                          >
                            Suggestion IA: {region}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {REGION_OPTIONS.map((region) => (
                        <button
                          key={region}
                          onClick={() => toggleRegion(region)}
                          className={`px-4 py-2 rounded-2xl text-sm font-body font-medium transition-colors ${
                            selectedRegions.includes(region)
                              ? 'bg-midnight text-white'
                              : 'bg-sand-50 border border-sand-200 text-midnight/70 hover:border-sand-300'
                          }`}
                        >
                          {region}
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

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-10"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <label className="flex items-center gap-2 font-body font-semibold text-midnight mb-2">
                          <Sparkles size={18} className="text-terracotta-500" />
                          Activités recommandées à injecter dans le plan
                        </label>
                        <p className="text-sm text-midnight/50 font-body">
                          Cochez celles que vous voulez voir apparaître en priorité dans l&apos;itinéraire final.
                        </p>
                      </div>
                      <span className="tag">{selectedExperienceIds.length} activité{selectedExperienceIds.length > 1 ? 's' : ''} choisie{selectedExperienceIds.length > 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                      {selectedRegions.length > 0 && (
                        <span className="tag bg-olive-50 text-olive-700">
                          Régions actives: {selectedRegions.join(', ')}
                        </span>
                      )}
                      {EXPERIENCE_FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setExperienceFilter(filter.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-body font-medium transition-colors ${
                            experienceFilter === filter.id
                              ? 'bg-midnight text-white'
                              : 'bg-sand-100 text-midnight/65 hover:bg-sand-200'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {recommendedExperiences.length === 0 && (
                        <div className="md:col-span-2 rounded-3xl border border-sand-200 bg-sand-50 p-5 font-body text-sm text-midnight/60">
                          Aucune activité ne correspond encore à cette combinaison. Essayez une autre région ou un autre filtre.
                        </div>
                      )}
                      {recommendedExperiences.map((experience) => {
                        const selected = selectedExperienceIds.includes(experience.id);
                        return (
                          <button
                            key={experience.id}
                            onClick={() => toggleExperience(experience.id)}
                            className={`text-left rounded-4xl border overflow-hidden transition-all ${
                              selected
                                ? 'border-terracotta-400 bg-terracotta-50 shadow-lg shadow-terracotta-100/60'
                                : 'border-sand-100 bg-white hover:border-sand-200'
                            }`}
                          >
                            <div className="relative h-48">
                              <img src={experience.image} alt={experience.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-midnight/10 to-transparent" />
                              <div className="absolute top-4 right-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm ${
                                  selected ? 'bg-white text-terracotta-500' : 'bg-black/25 text-white'
                                }`}>
                                  <CheckCircle2 size={18} />
                                </div>
                              </div>
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="bg-white/85 text-midnight text-xs px-2.5 py-1 rounded-full font-body font-medium">
                                    {experience.region}
                                  </span>
                                  <span className="bg-olive-50/90 text-olive-700 text-xs px-2.5 py-1 rounded-full font-body font-medium">
                                    {experience.socialImpactPercent}% impact local
                                  </span>
                                </div>
                                <h4 className="font-display text-2xl text-white">{experience.name}</h4>
                              </div>
                            </div>
                            <div className="p-5 space-y-3">
                              <p className="font-body text-sm text-midnight/60 leading-relaxed">{experience.description}</p>
                              <div className="flex flex-wrap gap-2 text-xs font-body text-midnight/55">
                                <span className="tag">{experience.duration}</span>
                                <span className="tag">{format(experience.price)}</span>
                                <span className="tag">{experience.artisansSupported} artisans aidés</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <p className="font-body font-semibold text-midnight mb-3">Souhaitez-vous des workshops ?</p>
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
                            <p className="text-xs font-body mt-1 opacity-80">Cuisine, artisanat, création locale</p>
                          </button>
                          <button
                            onClick={() => setIncludeWorkshops(false)}
                            className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                              !includeWorkshops
                                ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                            }`}
                          >
                            <p className="font-body font-semibold text-sm">Non, plutôt visites</p>
                            <p className="text-xs font-body mt-1 opacity-80">Plus de temps pour explorer librement</p>
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="font-body font-semibold text-midnight mb-3">Transport</p>
                        <div className="grid grid-cols-1 gap-3">
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
                    </div>

                    <div className="space-y-6">
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
                            <p className="text-xs font-body mt-1 opacity-80">Pour mieux comprendre les lieux et les rencontres</p>
                          </button>
                          <button
                            onClick={() => setWantsGuide(false)}
                            className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                              !wantsGuide
                                ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                : 'border-sand-200 bg-white text-midnight/70 hover:border-sand-300'
                            }`}
                          >
                            <p className="font-body font-semibold text-sm">Non, plus autonome</p>
                            <p className="text-xs font-body mt-1 opacity-80">Parcours plus libre avec repères précis</p>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="font-body font-semibold text-midnight mb-2 block">
                          Détails supplémentaires
                        </label>
                        <textarea
                          value={extraPreferences}
                          onChange={(event) => setExtraPreferences(event.target.value)}
                          placeholder="Ex: peu de marche, hôtel avec spa, plus d'artisanat, rythme doux, voyage photo..."
                          className="w-full min-h-36 bg-white border border-sand-200 rounded-2xl px-4 py-3 font-body text-sm text-midnight placeholder-midnight/35 focus:outline-none focus:border-terracotta-400 transition-colors resize-y"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                      Retour
                    </button>
                    <button
                      onClick={() => {
                        setStep(4);
                        void handleGenerateTrip();
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      Générer mon voyage
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={false}
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
                          <span className="text-3xl">🧭</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-2xl font-light text-midnight mb-2">
                          Planification de votre séjour…
                        </p>
                        <p className="font-body text-midnight/50 text-sm">
                          Gemini orchestre dates, régions, activités choisies, impact local et carte de trajet.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          'Vérification des régions',
                          'Insertion des activités cochées',
                          'Optimisation des horaires',
                          'Valorisation de l’impact local',
                        ].map((text, index) => (
                          <motion.span
                            key={text}
                            initial={false}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2.3, delay: index * 0.4, repeat: Infinity }}
                            className="tag"
                          >
                            {text}
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
                          Votre itinéraire détaillé est prêt
                        </p>
                        <p className="font-body text-midnight/50 text-sm">
                          Dates confirmées, activités choisies injectées, impact local estimé et carte par journée disponibles ci-dessous.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onReset?.();
                          setStep(1);
                        }}
                        className="btn-secondary"
                      >
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
