'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export type Currency = 'TND' | 'EUR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (amountTND: number) => number;
  format: (amountTND: number) => string;
  symbol: string;
}

const RATES: Record<Currency, number> = {
  TND: 1,
  EUR: 0.29,
  USD: 0.32,
};

const SYMBOLS: Record<Currency, string> = {
  TND: 'DT',
  EUR: '€',
  USD: '$',
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'TND',
  setCurrency: () => {},
  convert: (n) => n,
  format: (n) => `${n} DT`,
  symbol: 'DT',
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [currency, setCurrency] = useState<Currency>('TND');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedCurrency = window.localStorage.getItem('preferred_currency');
    if (storedCurrency === 'TND' || storedCurrency === 'EUR' || storedCurrency === 'USD') {
      setCurrency(storedCurrency);
    }
  }, []);

  useEffect(() => {
    const preferredCurrency = profile?.preferred_currency;

    if (preferredCurrency === 'TND' || preferredCurrency === 'EUR' || preferredCurrency === 'USD') {
      setCurrency(preferredCurrency);
    }
  }, [profile?.preferred_currency]);

  const convert = useCallback(
    (amountTND: number) => {
      return Math.round(amountTND * RATES[currency]);
    },
    [currency]
  );

  const format = useCallback(
    (amountTND: number) => {
      const converted = convert(amountTND);
      const sym = SYMBOLS[currency];
      return currency === 'TND'
        ? `${converted} ${sym}`
        : `${sym}${converted}`;
    },
    [currency, convert]
  );

  const handleSetCurrency = useCallback((nextCurrency: Currency) => {
    setCurrency(nextCurrency);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('preferred_currency', nextCurrency);
    }
  }, []);

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency: handleSetCurrency, convert, format, symbol: SYMBOLS[currency] }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
