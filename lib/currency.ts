export type Currency = 'TND' | 'EUR' | 'USD';

export const EXCHANGE_RATES: Record<Currency, number> = {
  TND: 1,
  EUR: 0.29,
  USD: 0.32,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TND: 'DT',
  EUR: '€',
  USD: '$',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  TND: 'Dinar Tunisien',
  EUR: 'Euro',
  USD: 'Dollar Américain',
};

export function convertCurrency(amountTND: number, target: Currency): number {
  return Math.round(amountTND * EXCHANGE_RATES[target]);
}

export function formatCurrency(amountTND: number, currency: Currency): string {
  const converted = convertCurrency(amountTND, currency);
  const symbol = CURRENCY_SYMBOLS[currency];
  return currency === 'TND' ? `${converted} ${symbol}` : `${symbol}${converted}`;
}
