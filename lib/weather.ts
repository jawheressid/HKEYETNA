export interface WeatherData {
  temperature: number;
  weatherCode: number;
  description: string;
  isGoodWeather: boolean;
  icon: string;
}

const WMO_CODES: Record<number, { description: string; icon: string; good: boolean }> = {
  0: { description: 'Ciel dégagé', icon: '☀️', good: true },
  1: { description: 'Principalement dégagé', icon: '🌤️', good: true },
  2: { description: 'Partiellement nuageux', icon: '⛅', good: true },
  3: { description: 'Couvert', icon: '☁️', good: false },
  45: { description: 'Brouillard', icon: '🌫️', good: false },
  48: { description: 'Brouillard givrant', icon: '🌫️', good: false },
  51: { description: 'Bruine légère', icon: '🌦️', good: false },
  53: { description: 'Bruine modérée', icon: '🌦️', good: false },
  55: { description: 'Bruine dense', icon: '🌧️', good: false },
  61: { description: 'Pluie légère', icon: '🌧️', good: false },
  63: { description: 'Pluie modérée', icon: '🌧️', good: false },
  65: { description: 'Pluie forte', icon: '🌧️', good: false },
  71: { description: 'Neige légère', icon: '❄️', good: false },
  73: { description: 'Neige modérée', icon: '❄️', good: false },
  75: { description: 'Neige forte', icon: '❄️', good: false },
  80: { description: 'Averses légères', icon: '🌦️', good: false },
  81: { description: 'Averses modérées', icon: '🌧️', good: false },
  82: { description: 'Averses violentes', icon: '⛈️', good: false },
  95: { description: 'Orage', icon: '⛈️', good: false },
  96: { description: 'Orage avec grêle', icon: '⛈️', good: false },
  99: { description: 'Orage violent avec grêle', icon: '⛈️', good: false },
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) throw new Error('Weather fetch failed');
    
    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const info = WMO_CODES[code] || { description: 'Conditions variables', icon: '🌤️', good: true };

    return {
      temperature: temp,
      weatherCode: code,
      description: info.description,
      isGoodWeather: info.good,
      icon: info.icon,
    };
  } catch {
    // Fallback for demo
    return {
      temperature: 24,
      weatherCode: 1,
      description: 'Principalement dégagé',
      isGoodWeather: true,
      icon: '🌤️',
    };
  }
}

export function getAlternativeActivity(
  badWeatherActivity: string,
  location: string
): string {
  const alternatives: Record<string, string[]> = {
    'plage': ['visite du musée local', 'atelier cuisine', 'massage traditionnel', 'hammam'],
    'désert': ['musée de la région', 'boutiques artisanales', 'café traditionnel', 'dégustation gastronomique'],
    'randonnée': ['hammam', 'atelier poterie', 'visite médina', 'galerie d\'art'],
    'default': ['visite d\'un musée', 'atelier cuisine', 'hammam', 'shopping en médina'],
  };

  const key = Object.keys(alternatives).find(k =>
    badWeatherActivity.toLowerCase().includes(k)
  ) || 'default';

  const options = alternatives[key];
  return options[Math.floor(Math.random() * options.length)];
}
