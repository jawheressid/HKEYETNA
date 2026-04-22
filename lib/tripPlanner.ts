import placesData from '@/data/places.json';
import experiencesData from '@/data/experiences.json';

export type TransportPreference = 'has-transport' | 'need-transport' | 'no-preference';
export type PlannerActivityType = 'visite' | 'repas' | 'activité' | 'hébergement' | 'transport';

export const INTERESTS = [
  { id: 'plage', label: '🏖️ Plage', desc: 'Côtes & mer' },
  { id: 'désert', label: '🏜️ Désert', desc: 'Sahara & dunes' },
  { id: 'culture', label: '🏛️ Culture', desc: 'Musées & art' },
  { id: 'histoire', label: '🏺 Histoire', desc: 'Antiquités & héritage' },
  { id: 'gastronomie', label: '🍽️ Gastronomie', desc: 'Saveurs locales' },
  { id: 'nature', label: '🌿 Nature', desc: 'Forêts & oasis' },
  { id: 'aventure', label: '🧗 Aventure', desc: 'Outdoor & sensations' },
  { id: 'spirituel', label: '🕌 Spirituel', desc: 'Patrimoine sacré' },
  { id: 'artisanat', label: '🧵 Artisanat', desc: 'Savoir-faire local' },
  { id: 'bien-etre', label: '🧖 Bien-être', desc: 'Spa & détente' },
  { id: 'photographie', label: '📸 Photo', desc: 'Lieux iconiques' },
  { id: 'famille', label: '👨‍👩‍👧 Famille', desc: 'Expériences douces' },
];

export const TRANSPORT_OPTIONS: Array<{
  id: TransportPreference;
  label: string;
  desc: string;
  emoji: string;
}> = [
  { id: 'has-transport', label: 'J’ai déjà un transport', desc: 'Voiture perso / transport déjà réservé', emoji: '🚗' },
  { id: 'need-transport', label: 'Je veux un transport', desc: 'Je souhaite des options de transfert', emoji: '🚌' },
  { id: 'no-preference', label: 'Peu importe', desc: 'L’IA décide selon l’itinéraire', emoji: '🧭' },
];

export type PlaceRecord = (typeof placesData)[number];
export type ExperienceRecord = (typeof experiencesData)[number];

export const REGION_OPTIONS = Array.from(new Set(placesData.map((place) => place.region))).sort((a, b) =>
  a.localeCompare(b, 'fr')
);

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function normalizeText(value: string | undefined | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function dateToInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, daysToAdd: number) {
  const base = new Date(date);
  base.setDate(base.getDate() + daysToAdd);
  return dateToInputValue(base);
}

export function calculateDuration(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 1;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / DAY_IN_MS) + 1;
  return Math.max(diff, 1);
}

export function formatDisplayDate(date?: string) {
  if (!date) {
    return '';
  }

  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

export function resolvePlace(query?: string, fallbackCity?: string) {
  const terms = [query, fallbackCity].filter(Boolean).map((value) => normalizeText(value));

  return placesData.find((place) => {
    const haystack = [
      place.name,
      place.city,
      place.region,
      ...place.tags,
    ].map((value) => normalizeText(value));

    return terms.some((term) => haystack.some((entry) => entry.includes(term) || term.includes(entry)));
  });
}

export function resolveCoordinates(query?: string, fallbackCity?: string) {
  const matchedPlace = resolvePlace(query, fallbackCity);

  if (matchedPlace) {
    return { lat: matchedPlace.lat, lng: matchedPlace.lng };
  }

  const cityMatch = placesData.find((place) => normalizeText(place.city) === normalizeText(fallbackCity));
  if (cityMatch) {
    return { lat: cityMatch.lat, lng: cityMatch.lng };
  }

  return undefined;
}

export function getExperiencesByIds(ids: string[] = []) {
  const idSet = new Set(ids);
  return experiencesData.filter((experience) => idSet.has(experience.id));
}

function getInterestTokens(selectedInterests: string[]) {
  const selectedIds = new Set(selectedInterests.map((interest) => normalizeText(interest)));
  return INTERESTS.filter((interest) => selectedIds.has(normalizeText(interest.id))).flatMap((interest) => [
    normalizeText(interest.id),
    ...normalizeText(interest.desc).split(/\s+/),
  ]);
}

function scoreExperience(experience: ExperienceRecord, selectedInterests: string[], selectedRegions: string[]) {
  const interestTokens = getInterestTokens(selectedInterests);
  const regionSet = new Set(selectedRegions.map((region) => normalizeText(region)));
  const tags = [...experience.tags, experience.category, experience.location, experience.region].map((value) => normalizeText(value));

  let score = 0;

  for (const token of interestTokens) {
    if (tags.some((tag) => tag.includes(token))) {
      score += 3;
    }
  }

  if (regionSet.size === 0 || regionSet.has(normalizeText(experience.region))) {
    score += 4;
  }

  score += experience.rating;
  score += experience.socialImpactPercent / 20;

  return score;
}

export function getRecommendedExperiences({
  selectedInterests,
  selectedRegions,
  limit = 8,
}: {
  selectedInterests: string[];
  selectedRegions: string[];
  limit?: number;
}) {
  return [...experiencesData]
    .sort(
      (left, right) =>
        scoreExperience(right, selectedInterests, selectedRegions) -
        scoreExperience(left, selectedInterests, selectedRegions)
    )
    .slice(0, limit);
}

export function getSuggestedRegions(selectedInterests: string[]) {
  const matchingExperiences = getRecommendedExperiences({
    selectedInterests,
    selectedRegions: [],
    limit: 6,
  });

  return Array.from(new Set(matchingExperiences.map((experience) => experience.region)));
}

export function buildActivityFromExperience(
  experience: ExperienceRecord,
  time: string,
  selectedByUser = false
) {
  return {
    id: experience.id,
    time,
    title: experience.name,
    description: experience.description,
    type: experience.activityType as PlannerActivityType,
    price: experience.price,
    location: experience.location,
    image: experience.image,
    selectedByUser,
    socialImpactPercent: experience.socialImpactPercent,
    artisansSupported: Math.min(experience.artisansSupported, 3),
    coordinates: {
      lat: experience.lat,
      lng: experience.lng,
    },
  };
}

export function buildPlaceVisitActivity(place: PlaceRecord, time: string) {
  return {
    id: `${place.id}-visit`,
    time,
    title: place.name,
    description: place.description,
    type: 'visite' as const,
    price: place.pricePerNight > 0 ? Math.round(place.pricePerNight * 0.15) : 35,
    location: place.city,
    image: place.image,
    selectedByUser: false,
    socialImpactPercent: 58,
    artisansSupported: 2,
    coordinates: {
      lat: place.lat,
      lng: place.lng,
    },
  };
}

export function getReplacementSuggestions({
  location,
  interests,
  regions,
  activityType,
  excludeIds = [],
}: {
  location?: string;
  interests: string[];
  regions: string[];
  activityType?: PlannerActivityType;
  excludeIds?: string[];
}) {
  // Keep replacement strict by type when one is provided.
  if (activityType === 'hébergement') {
    return [];
  }

  const blockedIds = new Set(excludeIds);
  const normalizedLocation = normalizeText(location);

  const experienceSuggestions = getRecommendedExperiences({
    selectedInterests: interests,
    selectedRegions: regions,
    limit: 12,
  }).filter((experience) => {
    if (blockedIds.has(experience.id)) {
      return false;
    }

    if (activityType && experience.activityType !== activityType) {
      return false;
    }

    return (
      normalizeText(experience.location) === normalizedLocation ||
      normalizeText(experience.region) === normalizedLocation ||
      normalizeText(experience.location).includes(normalizedLocation) ||
      normalizedLocation.includes(normalizeText(experience.location))
    );
  });

  const fallbackSuggestions = getRecommendedExperiences({
    selectedInterests: interests,
    selectedRegions: regions,
    limit: 12,
  }).filter((experience) => {
    if (blockedIds.has(experience.id)) {
      return false;
    }

    if (activityType && experience.activityType !== activityType) {
      return false;
    }

    return true;
  });

  const source = experienceSuggestions.length >= 2 ? experienceSuggestions : fallbackSuggestions;
  return source.slice(0, 2);
}

export function calculateSocialImpact(days: Array<{ activities: Array<{ socialImpactPercent?: number; artisansSupported?: number }> }>) {
  const activities = days.flatMap((day) => day.activities);
  const values = activities.filter((activity) => typeof activity.socialImpactPercent === 'number');

  if (values.length === 0) {
    return {
      localImpactPercent: 0,
      artisansSupported: 0,
    };
  }

  const localImpactPercent = Math.round(
    values.reduce((sum, activity) => sum + (activity.socialImpactPercent ?? 0), 0) / values.length
  );

  const artisansSupported = values.reduce(
    (sum, activity) => sum + (activity.artisansSupported ?? 0),
    0
  );

  return {
    localImpactPercent,
    artisansSupported,
  };
}

export function buildMapStops(day: {
  day: number;
  hotel?: { name: string; image?: string; coordinates?: { lat: number; lng: number } };
  activities: Array<{
    id?: string;
    time?: string;
    type?: string;
    title: string;
    description: string;
    image?: string;
    coordinates?: { lat: number; lng: number };
  }>;
}) {
  const stops = [];

  if (day.hotel?.coordinates) {
    stops.push({
      id: `hotel-${day.day}`,
      name: day.hotel.name,
      lat: day.hotel.coordinates.lat,
      lng: day.hotel.coordinates.lng,
      category: 'hotel',
      time: 'Nuit',
      description: 'Hébergement de la journée',
      image: day.hotel.image,
    });
  }

  for (const activity of day.activities) {
    if (!activity.coordinates) {
      continue;
    }

    stops.push({
      id: activity.id ?? `${day.day}-${activity.title}`,
      name: activity.title,
      lat: activity.coordinates.lat,
      lng: activity.coordinates.lng,
      category: activity.type ?? 'activity',
      time: activity.time,
      description: activity.description,
      image: activity.image,
    });
  }

  return stops;
}
