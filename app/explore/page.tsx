'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MapPin, Star, Search, SlidersHorizontal, X } from 'lucide-react';
import MapView from '@/components/MapView';
import { useCurrency } from '@/context/CurrencyContext';
import placesData from '@/data/places.json';
import experiencesData from '@/data/experiences.json';

const CATEGORIES = ['Tout', 'site', 'destination'];
const ALL_TAGS = ['plage', 'désert', 'culture', 'histoire', 'nature', 'médina', 'aventure', 'gastronomie', 'UNESCO'];

type ViewMode = 'grid' | 'map';

function PlaceCard({ place, index }: { place: (typeof placesData)[0]; index: number }) {
  const { format } = useCurrency();
  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="card group cursor-pointer"
      whileHover={{ y: -6 }}
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={place.image}
          alt={place.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {place.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-white/90 backdrop-blur-sm text-midnight text-xs px-2.5 py-1 rounded-full font-body font-medium">
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute top-3 right-3">
          <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-body flex items-center gap-1">
            <Star size={10} fill="white" />
            {place.rating}
          </div>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
          <MapPin size={12} />
          <span className="font-body text-xs">{place.city}, {place.region}</span>
        </div>
        {/* Weather info */}
        <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-body">
          {place.weather.avgTemp}°C moy.
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-medium text-midnight mb-2">{place.name}</h3>
        <p className="font-body text-sm text-midnight/60 leading-relaxed line-clamp-2 mb-4">{place.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-sand-100">
          <span className="text-xs text-midnight/40 font-body capitalize">{place.category}</span>
          {place.pricePerNight > 0 ? (
            <div className="text-right">
              <span className="font-display text-lg font-semibold text-terracotta-500">{format(place.pricePerNight)}</span>
              <span className="text-xs text-midnight/40 font-body">/nuit</span>
            </div>
          ) : (
            <span className="tag text-xs">Entrée libre</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const toggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    return placesData.filter(place => {
      const matchesSearch =
        !search ||
        place.name.toLowerCase().includes(search.toLowerCase()) ||
        place.city.toLowerCase().includes(search.toLowerCase()) ||
        place.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'Tout' || place.category === activeCategory;
      const matchesTags =
        activeTags.length === 0 ||
        activeTags.some(tag => place.tags.includes(tag));
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [search, activeCategory, activeTags]);

  const mapPlaces = filtered.map(p => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    category: p.category,
    description: p.description,
    image: p.image,
  }));

  return (
    <div className="bg-parchment min-h-screen">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-midnight to-midnight/90 pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, #7caedd 0%, transparent 60%), radial-gradient(circle at 80% 20%, #97bee0 0%, transparent 50%)',
        }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="tag bg-white/15 text-white/80 border-white/20 mb-6 inline-flex">
              <MapPin size={12} /> 12 Destinations
            </span>
            <h1 className="font-display text-6xl md:text-7xl font-light text-white mb-4">
              Explorer la
              <span className="text-sand-300 italic"> Tunisie</span>
            </h1>
            <p className="font-body text-xl text-white/60 max-w-lg">
              Découvrez les trésors cachés et les incontournables d&apos;une destination aux mille visages.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="sticky top-16 z-30 bg-parchment/95 backdrop-blur-lg border-b border-sand-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
          <div className="flex gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une destination, ville…"
                className="w-full bg-white border border-sand-200 rounded-2xl pl-11 pr-4 py-3 font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-300 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight/30 hover:text-midnight"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-body text-sm font-medium transition-colors ${
                showFilters || activeTags.length > 0
                  ? 'bg-terracotta-50 border-terracotta-300 text-terracotta-600'
                  : 'bg-white border-sand-200 text-midnight'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:block">Filtres</span>
              {activeTags.length > 0 && (
                <span className="w-5 h-5 bg-terracotta-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeTags.length}
                </span>
              )}
            </button>

            {/* View Mode */}
            <div className="flex bg-white border border-sand-200 rounded-2xl overflow-hidden">
              {(['grid', 'map'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-3 text-sm font-body font-medium transition-colors ${
                    viewMode === mode ? 'bg-midnight text-white' : 'text-midnight/60 hover:text-midnight'
                  }`}
                >
                  {mode === 'grid' ? '⊞ Grille' : '🗺️ Carte'}
                </button>
              ))}
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="py-3 space-y-3">
                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-body font-medium transition-colors ${
                          activeCategory === cat
                            ? 'bg-midnight text-white'
                            : 'bg-white border border-sand-200 text-midnight/60 hover:border-sand-300'
                        }`}
                      >
                        {cat === 'Tout' ? 'Tout' : cat === 'site' ? 'Sites historiques' : 'Destinations'}
                      </button>
                    ))}
                  </div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {ALL_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-body font-medium transition-colors capitalize ${
                          activeTags.includes(tag)
                            ? 'bg-terracotta-500 text-white'
                            : 'bg-sand-100 text-midnight/60 hover:bg-sand-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {activeTags.length > 0 && (
                      <button
                        onClick={() => setActiveTags([])}
                        className="px-3 py-1.5 rounded-xl text-xs font-body font-medium text-terracotta-600 hover:bg-terracotta-50 transition-colors"
                      >
                        Effacer tout
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <p className="font-body text-sm text-midnight/50">
          <span className="font-semibold text-midnight">{filtered.length}</span> destination{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {viewMode === 'grid' ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((place, i) => (
                <PlaceCard key={place.id} place={place} index={i} />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-24"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="font-display text-2xl font-light text-midnight mb-2">Aucun résultat</h3>
                <p className="font-body text-midnight/50">Essayez d&apos;autres mots-clés ou filtres</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="h-[600px] rounded-4xl overflow-hidden shadow-xl border border-sand-200">
            <MapView places={mapPlaces} center={[33.8869, 9.5375]} zoom={6} />
          </div>
        )}
      </div>
    </div>
  );
}
