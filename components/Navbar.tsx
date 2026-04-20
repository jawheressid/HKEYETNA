'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import CurrencySwitcher from './CurrencySwitcher';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/explore', label: 'Explorer' },
  { href: '/#trip', label: 'Planifier' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-0 right-0 z-50 px-4"
    >
      <div
        className={`max-w-7xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between rounded-3xl border transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-white shadow-xl shadow-sand-500/15'
            : 'bg-white/72 backdrop-blur-lg border-white/80 shadow-lg shadow-sand-500/10'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <span className="text-white font-display font-semibold text-sm">H</span>
          </div>
          <span className="font-display text-xl font-semibold text-midnight tracking-tight">
            HKEYETNA
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-3 bg-white/70 border border-sand-200 rounded-full px-2 py-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-semibold text-midnight/70 hover:text-terracotta-600 hover:bg-sand-50 transition-colors px-4 py-2 rounded-full"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <CurrencySwitcher />
          <Link href="/#trip" className="btn-primary text-sm py-2.5 px-5">
            Créer mon voyage
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2.5 rounded-2xl text-midnight hover:bg-sand-100 transition-colors"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden max-w-7xl mx-auto mt-2 bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-sand-500/15 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-body text-base font-semibold text-midnight/80 hover:text-terracotta-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-sand-200 flex items-center justify-between">
                <CurrencySwitcher />
                <Link href="/#trip" className="btn-primary text-sm py-2 px-4" onClick={() => setMenuOpen(false)}>
                  Créer mon voyage
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
