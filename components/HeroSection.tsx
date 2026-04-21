'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowDown, Play, Star, MapPin, Clock3, Compass } from 'lucide-react';

const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
    place: 'Sidi Bou Saïd',
    region: 'Grand Tunis',
  },
  {
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=80',
    place: 'Désert de Douz',
    region: 'Sahara Tunisien',
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    place: 'Île de Djerba',
    region: 'Médenine',
  },
];

const STATS = [
  { value: '12+', label: 'Destinations' },
  { value: '500+', label: 'Expériences' },
  { value: '4.9★', label: 'Note moyenne' },
];

const BRAND_STICKERS = [
  { src: '/branding/sticker-fan.png', alt: 'Eventail traditionnel' },
  { src: '/branding/sticker-khamsa.png', alt: 'Main khamsa' },
  { src: '/branding/sticker-bag.png', alt: 'Pochette rouge' },
  { src: '/branding/sticker-tea.png', alt: 'The a la menthe' },
  { src: '/branding/sticker-tunisia.png', alt: 'Lettrage Tunisia' },
  { src: '/branding/sticker-flowers.png', alt: 'Motif floral' },
  { src: '/branding/sticker-door.png', alt: 'Porte orientale' },
  { src: '/branding/sticker-fish.png', alt: 'Poisson bleu' },
  { src: '/branding/sticker-arabic.png', alt: 'Calligraphie arabe' },
];

export default function HeroSection() {
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImg(i => (i + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const current = HERO_IMAGES[activeImg];

  return (
    <section className="relative overflow-hidden pt-36 pb-20 md:pt-40 md:pb-28 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 max-w-2xl"
          >
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-medium text-midnight leading-[0.95] mb-6"
          >
            Une interface
            <br />
            <span className="text-terracotta-500">raffinée</span> pour
            <br />
            voyager en Tunisie
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-body text-lg text-midnight/65 mb-9 max-w-xl leading-relaxed"
          >
            Inspirez-vous, planifiez, puis générez un itinéraire complet avec météo, budget et recommandations locales dans une expérience élégante.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Link href="/#trip" className="btn-primary text-base px-8 py-4">
              Créer mon voyage
            </Link>
            <Link
              href="/explore"
              className="btn-secondary text-base px-8 py-4 inline-flex items-center gap-2"
            >
              <Play size={16} />
              Explorer la Tunisie
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-3 gap-4 max-w-lg"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white/80 border border-white rounded-3xl px-4 py-4 text-center shadow-lg shadow-sand-500/10">
                <div className="font-display text-2xl sm:text-3xl font-semibold text-midnight">{stat.value}</div>
                <div className="font-body text-xs sm:text-sm text-midnight/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative"
        >
          <div className="surface-card p-4 sm:p-5">
            <div className="relative rounded-[1.75rem] overflow-hidden h-[420px] sm:h-[500px]">
              {HERO_IMAGES.map((img, i) => (
                <motion.img
                  key={i}
                  initial={false}
                  animate={{ opacity: i === activeImg ? 1 : 0, scale: i === activeImg ? 1 : 1.03 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  src={img.url}
                  alt={img.place}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-midnight/75 via-midnight/20 to-transparent" />

              <div className="absolute top-4 left-4 bg-white/85 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/80 shadow-lg">
                <p className="font-body text-xs text-midnight/50 mb-1">Destination active</p>
                <div className="flex items-center gap-2 text-midnight">
                  <MapPin size={14} className="text-terracotta-500" />
                  <span className="font-body font-semibold text-sm">{current.place}</span>
                </div>
                <p className="font-body text-xs text-midnight/45 mt-0.5">{current.region}</p>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/88 backdrop-blur-md rounded-3xl p-4 border border-white/90 shadow-xl">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 text-midnight">
                      <Compass size={15} className="text-terracotta-500" />
                      <span className="font-body text-sm font-semibold">Itinéraire du jour</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-olive-700 text-xs font-body font-semibold bg-olive-50 px-2.5 py-1 rounded-full">
                      <Clock3 size={12} />
                      5h planifié
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-body text-midnight/65">
                    <div className="bg-sand-50 rounded-2xl p-2.5">
                      <p className="text-midnight/40">Matin</p>
                      <p className="font-semibold">Médina</p>
                    </div>
                    <div className="bg-sand-50 rounded-2xl p-2.5">
                      <p className="text-midnight/40">Après-midi</p>
                      <p className="font-semibold">Musée</p>
                    </div>
                    <div className="bg-sand-50 rounded-2xl p-2.5">
                      <p className="text-midnight/40">Soir</p>
                      <p className="font-semibold">Dîner local</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-3 sm:-right-6 bg-white/92 backdrop-blur-md rounded-3xl px-4 py-3 border border-white shadow-xl w-52">
            <div className="flex items-center gap-2 mb-1.5">
              <Star size={13} className="text-sand-500" fill="currentColor" />
              <p className="font-body text-xs text-midnight/50">Satisfaction voyage</p>
            </div>
            <p className="font-display text-2xl text-midnight">4.9 / 5</p>
            <p className="font-body text-xs text-midnight/45">Basé sur 1 200 expériences</p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 flex items-center justify-between">
        <div className="flex gap-2">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeImg ? 'w-9 h-2.5 bg-terracotta-500' : 'w-2.5 h-2.5 bg-midnight/25 hover:bg-midnight/45'
              }`}
            />
          ))}
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-midnight/40"
        >
          <ArrowDown size={18} />
        </motion.div>
      </div>
    </section>
  );
}
