'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/context/CurrencyContext';
import { ChevronDown } from 'lucide-react';

type Currency = 'TND' | 'EUR' | 'USD';

const CURRENCIES: { code: Currency; label: string; flag: string }[] = [
  { code: 'TND', label: 'DT — Dinar', flag: '🇹🇳' },
  { code: 'EUR', label: '€ — Euro', flag: '🇪🇺' },
  { code: 'USD', label: '$ — Dollar', flag: '🇺🇸' },
];

export default function CurrencySwitcher() {
  const { currency, setCurrency, symbol } = useCurrency();
  const [open, setOpen] = useState(false);

  const current = CURRENCIES.find(c => c.code === currency)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-sand-100 hover:bg-sand-200 px-3 py-2 rounded-xl transition-colors text-sm font-body font-medium text-midnight"
      >
        <span>{current.flag}</span>
        <span>{current.code}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-sand-100 overflow-hidden z-50"
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-body transition-colors hover:bg-sand-50 ${
                  currency === c.code ? 'bg-sand-100 text-terracotta-600 font-medium' : 'text-midnight'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
