'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type Currency = 'TND' | 'EUR' | 'USD';

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
  const [currency, setCurrency] = useState<Currency>('TND');

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

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, convert, format, symbol: SYMBOLS[currency] }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
