'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Play, Instagram, Share2 } from 'lucide-react';

const SOCIAL_POSTS = [
  {
    id: 1,
    user: 'gharmouloutdoors',
    avatar: '🏕️',
    location: 'Douz, Sahara Tunisien',
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80',
    isVideo: true,
    caption: 'Lever de soleil sur les grandes dunes de Douz 🌅 Un moment magique que chaque voyageur doit vivre. #Sahara #Tunisie #Desert',
    likes: 4231,
    comments: 187,
    tags: ['#Sahara', '#Tunisie', '#Nature'],
  },
  {
    id: 2,
    user: 'tunisian_campers',
    avatar: '⛺',
    location: 'Aïn Draham, Jendouba',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
    isVideo: false,
    caption: 'Nuit en forêt dans le nord tunisien 🌲 La Tunisie ne se limite pas au désert ! #ForêtTunisie #Camping',
    likes: 2890,
    comments: 124,
    tags: ['#Camping', '#Forêt', '#Nord'],
  },
  {
    id: 3,
    user: 'djerba.vibes',
    avatar: '🌊',
    location: 'Houmt Souk, Djerba',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    isVideo: true,
    caption: 'La médina de Houmt Souk au coucher du soleil 🧡 Des couleurs à couper le souffle. #Djerba #Médina #Voyage',
    likes: 6102,
    comments: 342,
    tags: ['#Djerba', '#Médina', '#Sunset'],
  },
  {
    id: 4,
    user: 'sidi_bou_said_love',
    avatar: '🏡',
    location: 'Sidi Bou Saïd',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80',
    isVideo: false,
    caption: 'Le bleu et blanc iconique de Sidi Bou Saïd 💙 Chaque ruelle est un tableau. #SidiBouSaid #Tunisie #Architecture',
    likes: 8450,
    comments: 512,
    tags: ['#SidiBouSaid', '#Bleu', '#Architecture'],
  },
  {
    id: 5,
    user: 'sahara_nights_tn',
    avatar: '🌙',
    location: 'Ksar Ghilane, Gabès',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80',
    isVideo: true,
    caption: 'Nuit étoilée dans le désert tunisien ✨ Impossible de voir autant d\'étoiles en ville. #DesertLife #Étoiles #Sahara',
    likes: 11340,
    comments: 678,
    tags: ['#Étoiles', '#Désert', '#Nuit'],
  },
  {
    id: 6,
    user: 'carthage_explorer',
    avatar: '🏛️',
    location: 'Carthage, Tunis',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80',
    isVideo: false,
    caption: 'Les ruines de Carthage au crépuscule 🏛️ 2800 ans d\'histoire face à la mer. #Carthage #UNESCO #Histoire',
    likes: 3760,
    comments: 201,
    tags: ['#Carthage', '#Ruines', '#UNESCO'],
  },
];

function formatNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function SocialFeed() {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className="py-24 px-6 bg-midnight">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-tr from-terracotta-500 via-sand-400 to-olive-400 rounded-xl flex items-center justify-center">
                <Instagram size={16} className="text-white" />
              </div>
              <span className="text-white/50 font-body text-sm">Inspiration Voyage</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-light text-white">
              La communauté
              <span className="text-sand-300 italic"> voyage</span>
            </h2>
          </div>
          <p className="font-body text-white/50 max-w-xs leading-relaxed">
            Des voyageurs partagent leurs découvertes authentiques à travers la Tunisie.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SOCIAL_POSTS.map((post, i) => (
            <motion.div
              key={post.id}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`relative group rounded-3xl overflow-hidden bg-midnight cursor-pointer ${
                i === 0 ? 'md:col-span-1 md:row-span-2' : ''
              }`}
              style={{ aspectRatio: i === 0 ? '1/2' : '1/1' }}
            >
              {/* Image */}
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Video Play Icon */}
              {post.isVideo && (
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Play size={14} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              )}

              {/* Content (visible on hover) */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* User */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-sm">
                    {post.avatar}
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold font-body">@{post.user}</p>
                    <p className="text-white/60 text-xs font-body">{post.location}</p>
                  </div>
                </div>

                {/* Caption */}
                <p className="text-white/90 text-xs font-body line-clamp-2 mb-3 leading-relaxed">
                  {post.caption}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 text-white/80 hover:text-terracotta-300 transition-colors"
                  >
                    <Heart
                      size={16}
                      fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
                      className={likedPosts.has(post.id) ? 'text-terracotta-300' : ''}
                    />
                    <span className="text-xs font-body">
                      {formatNumber(post.likes + (likedPosts.has(post.id) ? 1 : 0))}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-white/60">
                    <MessageCircle size={16} />
                    <span className="text-xs font-body">{formatNumber(post.comments)}</span>
                  </div>
                  <button className="ml-auto text-white/60 hover:text-white transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Tags (always visible) */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                {post.tags.slice(0, 1).map(tag => (
                  <span key={tag} className="bg-black/30 backdrop-blur-sm text-white/80 text-xs px-2 py-0.5 rounded-lg font-body">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-white/40 font-body text-sm mb-4">Partagez votre aventure tunisienne</p>
          <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-body font-medium px-6 py-3 rounded-2xl transition-colors">
            <Instagram size={16} />
            Rejoindre la communauté
          </button>
        </motion.div>
      </div>
    </section>
  );
}
