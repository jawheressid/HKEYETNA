import placesData from '@/data/places.json';
import experiencesData from '@/data/experiences.json';

export interface TripInput {
  budget: number; // TND total
  duration: number; // days
  interests: string[];
  startCity?: string;
}

export interface DayActivity {
  time: string;
  title: string;
  description: string;
  type: 'visite' | 'repas' | 'activité' | 'hébergement' | 'transport';
  price: number;
  location?: string;
}

export interface DayPlan {
  day: number;
  date?: string;
  location: string;
  hotel?: {
    name: string;
    price: number;
    stars: number;
    image: string;
  };
  activities: DayActivity[];
  totalDayCost: number;
  weather?: { temperature: number; description: string; icon: string };
}

export interface GeneratedTrip {
  title: string;
  summary: string;
  days: DayPlan[];
  totalCost: number;
  highlights: string[];
}

// Mock hotels database
const HOTELS: Record<string, Array<{ name: string; priceRange: [number, number]; stars: number; image: string }>> = {
  Tunis: [
    { name: 'Hotel Majestic Tunis', priceRange: [180, 280], stars: 4, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' },
    { name: 'La Maison Blanche', priceRange: [250, 400], stars: 5, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80' },
    { name: 'Hotel Medina', priceRange: [90, 150], stars: 3, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80' },
  ],
  Djerba: [
    { name: 'Hasdrubal Thalassa & Spa', priceRange: [280, 450], stars: 5, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80' },
    { name: 'Radisson Blu Djerba', priceRange: [200, 320], stars: 4, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' },
    { name: 'Dar Jerba', priceRange: [110, 180], stars: 3, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80' },
  ],
  Douz: [
    { name: 'Sahara Douz Hotel', priceRange: [140, 220], stars: 4, image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80' },
    { name: 'Campement Berbère Étoile', priceRange: [180, 280], stars: 4, image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80' },
  ],
  Hammamet: [
    { name: 'Mövenpick Resort Hammamet', priceRange: [240, 380], stars: 5, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80' },
    { name: 'Club Med Hammamet', priceRange: [310, 500], stars: 5, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80' },
    { name: 'Hotel Sindbad', priceRange: [120, 180], stars: 3, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' },
  ],
};

function selectHotel(city: string, dailyBudget: number) {
  const options = HOTELS[city] || HOTELS.Tunis;
  const affordable = options.filter(h => h.priceRange[0] <= dailyBudget * 0.5);
  const selected = affordable.length > 0 ? affordable[0] : options[options.length - 1];
  return {
    name: selected.name,
    price: Math.round((selected.priceRange[0] + selected.priceRange[1]) / 2),
    stars: selected.stars,
    image: selected.image,
  };
}

export function buildMockTrip(input: TripInput): GeneratedTrip {
  const { budget, duration, interests } = input;
  const dailyBudget = budget / duration;

  // Select destinations based on interests
  const destinationMap: Record<string, string[]> = {
    plage: ['Hammamet', 'Djerba', 'Tabarka'],
    désert: ['Douz', 'Matmata'],
    culture: ['Tunis', 'Kairouan', 'Carthage'],
    nature: ['Aïn Draham', 'Tabarka'],
    histoire: ['Tunis', 'El Jem', 'Sbeitla', 'Carthage'],
    gastronomie: ['Tunis', 'Nabeul', 'Djerba'],
    aventure: ['Douz', 'Aïn Draham', 'Tabarka'],
  };

  const selectedCities: string[] = [];
  interests.forEach(interest => {
    const cities = destinationMap[interest.toLowerCase()] || [];
    cities.forEach(city => {
      if (!selectedCities.includes(city) && selectedCities.length < duration) {
        selectedCities.push(city);
      }
    });
  });

  // Fill remaining days with default cities
  const defaults = ['Tunis', 'Hammamet', 'Djerba', 'Douz', 'Kairouan'];
  while (selectedCities.length < duration) {
    const next = defaults.find(c => !selectedCities.includes(c));
    if (next) selectedCities.push(next);
    else selectedCities.push('Tunis');
  }

  const days: DayPlan[] = selectedCities.slice(0, duration).map((city, i) => {
    const hotel = selectHotel(city, dailyBudget);
    const activities: DayActivity[] = [
      {
        time: '09:00',
        title: `Petit-déjeuner tunisien`,
        description: 'Démarrez la journée avec un authentique petit-déjeuner : pain msemen, huile d\'olive, olives et thé à la menthe.',
        type: 'repas',
        price: 15,
        location: city,
      },
      {
        time: '10:30',
        title: `Exploration de ${city}`,
        description: `Découverte des sites emblématiques de ${city} avec un guide local passionné.`,
        type: 'visite',
        price: 60,
        location: city,
      },
      {
        time: '13:00',
        title: 'Déjeuner traditionnel',
        description: 'Déjeuner dans un restaurant local avec vue. Couscous aux légumes ou poisson grillé selon la région.',
        type: 'repas',
        price: 35,
        location: city,
      },
      {
        time: '15:00',
        title: `Activité ${interests[0] || 'culturelle'}`,
        description: `Expérience ${interests[0] || 'culturelle'} incontournable au cœur de ${city}.`,
        type: 'activité',
        price: 80,
        location: city,
      },
      {
        time: '19:00',
        title: 'Dîner panoramique',
        description: 'Dîner dans un cadre enchanteur avec spécialités tunisiennes et vue imprenable.',
        type: 'repas',
        price: 55,
        location: city,
      },
    ];

    const actCost = activities.reduce((s, a) => s + a.price, 0);
    const totalDayCost = actCost + hotel.price;

    return {
      day: i + 1,
      location: city,
      hotel,
      activities,
      totalDayCost,
    };
  });

  const totalCost = days.reduce((s, d) => s + d.totalDayCost, 0);

  return {
    title: `Voyage en Tunisie — ${duration} Jours Inoubliables`,
    summary: `Un itinéraire ${duration} jours soigneusement sélectionné pour un budget de ${budget} DT, combinant ${interests.join(', ')} à travers les plus beaux paysages tunisiens.`,
    days,
    totalCost,
    highlights: [
      `${duration} nuits dans des hébergements soigneusement sélectionnés`,
      `Expériences authentiques avec des locaux passionnés`,
      `Cuisine tunisienne dans les meilleurs restaurants`,
      `Guides experts dans chaque destination`,
    ],
  };
}
