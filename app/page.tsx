'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, ArrowRight, Sparkles } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import SocialFeed from '@/components/SocialFeed';
import MapView from '@/components/MapView';
import { useCurrency } from '@/context/CurrencyContext';
import placesData from '@/data/places.json';
import experiencesData from '@/data/experiences.json';

const FEATURED_PLACES = placesData.slice(0, 6);

function PlaceCard({ place }: { place: (typeof placesData)[0] }) {
  const { format } = useCurrency();
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="card group cursor-pointer"
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={place.image}
          alt={place.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {place.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-white/85 backdrop-blur-sm text-midnight text-xs px-2.5 py-1 rounded-full font-body font-medium">
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
          <MapPin size={12} />
          <span className="font-body text-xs">{place.city}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-xl font-medium text-midnight">{place.name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={13} fill="currentColor" className="text-terracotta-500" />
            <span className="font-body text-sm font-medium text-sand-600">{place.rating}</span>
          </div>
        </div>
        <p className="font-body text-sm text-midnight/60 leading-relaxed line-clamp-2">{place.description}</p>
        {place.pricePerNight > 0 && (
          <div className="mt-4 pt-4 border-t border-sand-100 flex items-center justify-between">
            <span className="font-body text-xs text-midnight/40">À partir de</span>
            <span className="font-display text-lg font-semibold text-terracotta-500">
              {format(place.pricePerNight)}<span className="text-sm font-body text-midnight/40">/nuit</span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ExperienceCard({ exp }: { exp: (typeof experiencesData)[0] }) {
  const { format } = useCurrency();
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }} className="flex gap-4 bg-white rounded-3xl p-4 border border-sand-100 shadow-sm group cursor-pointer">
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
        <Image src={exp.image} alt={exp.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="tag text-xs mb-2 inline-flex">{exp.category}</span>
            <h4 className="font-body font-semibold text-midnight text-sm line-clamp-1">{exp.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-midnight/50 font-body">
              <MapPin size={10} />
              <span>{exp.location}</span>
              <span>·</span>
              <span>{exp.duration}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Star size={12} fill="currentColor" className="text-terracotta-500" />
            <span className="text-xs font-body font-medium text-sand-600">{exp.rating}</span>
          </div>
          <span className="font-display text-base font-semibold text-terracotta-500">{format(exp.price)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const mapPlaces = placesData.map(p => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    category: p.category,
    description: p.description,
    image: p.image,
  }));

  return (
    <div className="bg-transparent">
      {/* Hero */}
      <HeroSection />

      {/* Featured Places */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div>
              <span className="tag mb-4 inline-flex">✦ Destinations phares</span>
              <h2 className="section-title">
                Incontournables
                <span className="text-terracotta-500 italic"> de Tunisie</span>
              </h2>
            </div>
            <Link href="/explore" className="flex items-center gap-2 font-body font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">
              Voir tout <ArrowRight size={16} />
            </Link>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_PLACES.map((place, i) => (
              <motion.div
                key={place.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <PlaceCard place={place} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 sm:py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="surface-card p-6 sm:p-8">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-8"
            >
              <span className="tag mb-4 inline-flex">🗺️ Carte interactive</span>
              <h2 className="section-title mb-3">
                Explorez la carte
              </h2>
              <p className="font-body text-midnight/60">Cliquez sur un marqueur pour découvrir le lieu</p>
            </motion.div>
            <div className="h-[360px] sm:h-[500px] rounded-4xl overflow-hidden shadow-xl border border-sand-200/70">
              <MapView places={mapPlaces} center={[33.8869, 9.5375]} zoom={6} />
            </div>
          </div>
        </div>
      </section>

      {/* Experiences */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div>
              <span className="tag mb-4 inline-flex">⚡ Expériences uniques</span>
              <h2 className="section-title">
                Vivez la Tunisie
                <span className="text-terracotta-500 italic"> autrement</span>
              </h2>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiencesData.slice(0, 6).map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
              >
                <ExperienceCard exp={exp} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Static Trip Preview */}
      <div className="bg-sand-50/50 border-y border-sand-200/50">
        <section id="trip" className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
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
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-midnight mb-5">
                Votre voyage,
                <span className="text-terracotta-500 italic"> personnalisé</span>
              </h2>
              <p className="font-body text-base sm:text-lg text-midnight/60 max-w-xl mx-auto mb-10">
                Décrivez vos envies, notre IA compose un itinéraire sur mesure adapté à votre budget et vos intérêts.
              </p>
            </motion.div>

            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="bg-white rounded-5xl shadow-xl border border-sand-100 overflow-hidden mb-10 p-5 sm:p-8 md:p-12"
            >
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className="tag">Exemple — 3 jours à Tunis &amp; Djerba</div>
                <div className="tag bg-olive-50 text-olive-700">Budget: 1 800 DT</div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    day: 1,
                    city: 'Tunis',
                    emoji: '🏛️',
                    activities: ['Médina & Zitouna', 'Déjeuner Dar El Jeld', 'Musée du Bardo'],
                    hotel: 'La Maison Blanche ★★★★★',
                  },
                  {
                    day: 2,
                    city: 'Carthage',
                    emoji: '🏺',
                    activities: ['Sites antiques', 'Sidi Bou Saïd', 'Atelier poterie'],
                    hotel: 'Hotel Majestic Tunis ★★★★',
                  },
                  {
                    day: 3,
                    city: 'Djerba',
                    emoji: '🏖️',
                    activities: ['Houmt Souk', 'Plage Sidi Mahrez', 'Dîner Dar Jerba'],
                    hotel: 'Hasdrubal Thalassa ★★★★★',
                  },
                ].map((day) => (
                  <div key={day.day} className="bg-sand-50 rounded-3xl p-5 border border-sand-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-terracotta-500 rounded-full flex items-center justify-center text-white font-display font-bold text-sm">
                        {day.day}
                      </div>
                      <div>
                        <span className="text-lg">{day.emoji}</span>
                        <span className="font-display font-medium text-midnight ml-1">{day.city}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {day.activities.map((activity) => (
                        <li key={activity} className="flex items-start gap-2 font-body text-xs text-midnight/70">
                          <span className="text-terracotta-400 mt-0.5">✦</span>
                          {activity}
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 border-t border-sand-200">
                      <p className="font-body text-xs text-midnight/40">{day.hotel}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative mt-6">
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent rounded-3xl z-10 flex flex-col items-center justify-end pb-8 gap-4">
                  <p className="font-body text-midnight/60 text-sm text-center max-w-sm px-4">
                    Créez un compte pour générer votre propre itinéraire personnalisé.
                  </p>
                  <Link href="/login" className="btn-primary flex items-center gap-2 text-sm px-8">
                    <Sparkles size={15} />
                    Créer mon propre voyage
                  </Link>
                </div>

                <div className="blur-sm pointer-events-none">
                  <div className="h-20 bg-sand-100 rounded-2xl mb-3" />
                  <div className="h-16 bg-sand-50 rounded-2xl" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Social Feed */}
      <SocialFeed />

      {/* Footer */}
      <footer className="bg-midnight py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-terracotta-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-display font-bold">H</span>
                </div>
                <span className="font-display text-2xl font-semibold text-white">HKEYETNA</span>
              </div>
              <p className="font-body text-white/50 text-sm leading-relaxed max-w-xs">
                Votre compagnon de voyage IA pour explorer la Tunisie authentique. Des itinéraires personnalisés, des expériences inoubliables.
              </p>
            </div>
            <div>
              <h4 className="font-body font-semibold text-white mb-4 text-sm">Explorer</h4>
              <ul className="space-y-3">
                {['Destinations', 'Expériences', 'Hôtels', 'Carte interactive'].map(item => (
                  <li key={item}><a href="#" className="text-white/40 hover:text-white/80 text-sm font-body transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-body font-semibold text-white mb-4 text-sm">À propos</h4>
              <ul className="space-y-3">
                {['Notre histoire', 'Blog voyage', 'Partenaires', 'Contact'].map(item => (
                  <li key={item}><a href="#" className="text-white/40 hover:text-white/80 text-sm font-body transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-white/30 text-xs">© 2025 HKEYETNA — Fait avec ❤️ pour la Tunisie</p>
            <div className="flex gap-4 text-white/30 text-xs font-body">
              <a href="#" className="hover:text-white/60 transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-white/60 transition-colors">Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
