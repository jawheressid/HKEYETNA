'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/context/CurrencyContext';
import { Check, ChevronDown } from 'lucide-react';

type Currency = 'TND' | 'EUR' | 'USD';

const CURRENCIES: { code: Currency; label: string; flag: string }[] = [
  { code: 'TND', label: 'DT — Dinar', flag: '🇹🇳' },
  { code: 'EUR', label: '€ — Euro', flag: '🇪🇺' },
  { code: 'USD', label: '$ — Dollar', flag: '🇺🇸' },
];

export default function CurrencySwitcher({ mobile = false }: { mobile?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const current = CURRENCIES.find(c => c.code === currency)!;

  return (
    <div className={`relative ${mobile ? 'w-full' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center transition-colors text-sm font-body font-semibold text-midnight ${
          mobile
            ? 'w-full justify-between bg-sand-50 hover:bg-white border border-sand-200 px-4 py-3 rounded-2xl'
            : 'gap-2 bg-white/85 hover:bg-white border border-sand-200 px-3 py-2 rounded-full'
        }`}
      >
        <span className="flex items-center gap-2">
          <span>{current.flag}</span>
          <span>{current.code}</span>
          {mobile && <span className="text-midnight/45 font-medium">{current.label}</span>}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`z-50 bg-white/95 backdrop-blur-md border border-sand-200 overflow-hidden ${
              mobile
                ? 'mt-3 rounded-2xl shadow-lg'
                : 'absolute right-0 top-full mt-2 w-44 rounded-3xl shadow-xl'
            }`}
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-body transition-colors hover:bg-sand-50 ${
                  currency === c.code ? 'bg-sand-100 text-terracotta-600 font-semibold' : 'text-midnight'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span>{c.flag}</span>
                  <span>{mobile ? `${c.code} — ${c.label}` : c.label}</span>
                </span>
                {currency === c.code && <Check size={16} className="flex-shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
