'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, ArrowRight, Compass } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import TripGenerator from '@/components/TripGenerator';
import ItineraryView from '@/components/ItineraryView';
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
            <Star size={13} fill="#d4852a" className="text-sand-500" />
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
        <Image src={exp.image} alt={exp.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
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
            <Star size={12} fill="#d4852a" className="text-sand-500" />
            <span className="text-xs font-body font-medium text-sand-600">{exp.rating}</span>
          </div>
          <span className="font-display text-base font-semibold text-terracotta-500">{format(exp.price)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);

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
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
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
                initial={{ opacity: 0, y: 30 }}
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
      <section className="py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="surface-card p-6 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
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
            <div className="h-[500px] rounded-4xl overflow-hidden shadow-xl border border-sand-200/70">
              <MapView places={mapPlaces} center={[33.8869, 9.5375]} zoom={6} />
            </div>
          </div>
        </div>
      </section>

      {/* Experiences */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
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
                initial={{ opacity: 0, y: 20 }}
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

      {/* Trip Generator */}
      <div className="bg-sand-50/50 border-y border-sand-200/50">
        <TripGenerator onTripGenerated={setGeneratedTrip} />
      </div>

      {/* Generated Itinerary */}
      {generatedTrip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ItineraryView trip={generatedTrip} />
        </motion.div>
      )}

      {/* Social Feed */}
      <SocialFeed />

      {/* Footer */}
      <footer className="bg-midnight py-16 px-6 border-t border-white/5">
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
