import placesData from '@/data/places.json';
import {
  getAccommodationSuggestions,
  pickRestaurantsForDay,
  selectAccommodation,
  type RestaurantRecord,
} from '@/lib/catalog';
import {
  addDays,
  buildActivityFromExperience,
  buildPlaceVisitActivity,
  calculateDuration,
  calculateSocialImpact,
  getExperiencesByIds,
  getRecommendedExperiences,
  normalizeText,
  resolveCoordinates,
  resolvePlace,
  type TransportPreference,
} from '@/lib/tripPlanner';

export interface TripInput {
  budget: number;
  duration: number;
  interests: string[];
  startDate?: string;
  endDate?: string;
  startCity?: string;
  regions?: string[];
  selectedExperienceIds?: string[];
  preferences?: {
    includeWorkshops?: boolean;
    transportPreference?: TransportPreference;
    wantsGuide?: boolean;
    notes?: string;
  };
}

export interface DayActivity {
  id?: string;
  time: string;
  title: string;
  description: string;
  type: 'visite' | 'repas' | 'activité' | 'hébergement' | 'transport';
  price: number;
  location?: string;
  image?: string;
  selectedByUser?: boolean;
  socialImpactPercent?: number;
  artisansSupported?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DayPlan {
  day: number;
  date?: string;
  location: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
  hotel?: {
    name: string;
    price: number;
    stars: number;
    image: string;
    accommodationType?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  activities: DayActivity[];
  totalDayCost: number;
}

export interface GeneratedTrip {
  title: string;
  summary: string;
  startDate?: string;
  endDate?: string;
  days: DayPlan[];
  totalCost: number;
  highlights: string[];
  regions?: string[];
  socialImpact?: {
    localImpactPercent: number;
    artisansSupported: number;
  };
}

export interface HotelSuggestion {
  name: string;
  price: number;
  stars: number;
  image: string;
  accommodationType?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function getHotelSuggestions({
  city,
  budgetPerNight,
  excludeName,
  limit = 3,
}: {
  city: string;
  budgetPerNight: number;
  excludeName?: string;
  limit?: number;
}) {
  return getAccommodationSuggestions({
    city,
    budgetPerNight,
    excludeName,
    limit,
  }) as HotelSuggestion[];
}

function clampArtisansSupported(value?: number) {
  return Math.min(value ?? 0, 3);
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

function buildRestaurantMeal({
  time,
  city,
  mealLabel,
  restaurant,
  fallbackPrice,
}: {
  time: string;
  city: string;
  mealLabel: string;
  restaurant?: RestaurantRecord;
  fallbackPrice: number;
}): DayActivity {
  const title = restaurant ? `${mealLabel} - ${restaurant.name}` : mealLabel;
  const description = restaurant
    ? `${restaurant.description} Specialités: ${restaurant.specialties.slice(0, 2).join(', ')}.`
    : 'Pause gourmande avec produits régionaux et adresse locale sélectionnée selon votre budget.';

  return {
    id: `${normalizeText(title)}-${normalizeText(city)}`,
    time,
    title,
    description,
    type: 'repas',
    price: restaurant?.averageTicket || fallbackPrice,
    location: restaurant?.city || city,
    image: restaurant?.image,
    coordinates: restaurant
      ? { lat: restaurant.lat, lng: restaurant.lng }
      : resolveCoordinates(city, city),
    socialImpactPercent: restaurant ? 74 : 66,
    artisansSupported: clampArtisansSupported(restaurant ? 2 : 1),
  };
}

function buildTransportActivity(city: string, transportPreference: TransportPreference): DayActivity | null {
  if (transportPreference === 'need-transport') {
    return {
      id: `transport-${normalizeText(city)}`,
      time: '08:00',
      title: 'Transfert organisé',
      description: `Navette privée ou chauffeur local pour rejoindre les activités prévues autour de ${city}.`,
      type: 'transport',
      price: 45,
      location: city,
      coordinates: resolveCoordinates(city, city),
      socialImpactPercent: 52,
      artisansSupported: 3,
    };
  }

  if (transportPreference === 'has-transport') {
    return {
      id: `transport-own-${normalizeText(city)}`,
      time: '08:00',
      title: 'Déplacement en transport personnel',
      description: 'Parcours optimisé pour limiter les détours tout en gardant du temps pour les expériences choisies.',
      type: 'transport',
      price: 0,
      location: city,
      coordinates: resolveCoordinates(city, city),
      socialImpactPercent: 35,
      artisansSupported: 0,
    };
  }

  return null;
}

function getRegionSeedCities(regions: string[] = []) {
  const regionSet = new Set(regions.map((region) => normalizeText(region)));

  if (regionSet.size === 0) {
    return [];
  }

  return Array.from(
    new Set(
      placesData
        .filter((place) => regionSet.has(normalizeText(place.region)))
        .map((place) => place.city)
    )
  );
}

function getRegionForCity(city: string) {
  return (
    resolvePlace(city, city)?.region ||
    placesData.find((place) => normalizeText(place.city) === normalizeText(city))?.region
  );
}

function isCityAllowedByRegions(city: string, regions: string[] = []) {
  if (regions.length === 0) {
    return true;
  }

  const regionSet = new Set(regions.map((region) => normalizeText(region)));
  const matchedRegion =
    resolvePlace(city, city)?.region ||
    placesData.find((place) => normalizeText(place.city) === normalizeText(city))?.region;

  if (!matchedRegion) {
    return false;
  }

  return regionSet.has(normalizeText(matchedRegion));
}

function filterExperienceIdsByRegions(ids: string[] = [], regions: string[] = []) {
  if (regions.length === 0) {
    return ids;
  }

  const regionSet = new Set(regions.map((region) => normalizeText(region)));
  return getExperiencesByIds(ids)
    .filter((experience) => regionSet.has(normalizeText(experience.region)))
    .map((experience) => experience.id);
}

function getInterestSeedCities(interests: string[]) {
  const destinationMap: Record<string, string[]> = {
    plage: ['Hammamet', 'Djerba', 'Mahdia', 'Tabarka'],
    désert: ['Douz', 'Matmata'],
    culture: ['Tunis', 'Kairouan', 'Sousse', 'Dougga'],
    nature: ['Aïn Draham', 'Tabarka', 'Ichkeul'],
    histoire: ['Tunis', 'El Jem', 'Sbeitla', 'Dougga'],
    gastronomie: ['Tunis', 'Nabeul', 'Djerba', 'Mahdia'],
    aventure: ['Douz', 'Aïn Draham', 'Tabarka'],
    spirituel: ['Kairouan', 'Tunis'],
    artisanat: ['Nabeul', 'Kairouan', 'Sousse', 'Djerba'],
    bien_etre: ['Hammamet', 'Djerba'],
    'bien-etre': ['Hammamet', 'Djerba'],
    photographie: ['Sidi Bou Saïd', 'Douz', 'Sousse', 'Dougga'],
    famille: ['Djerba', 'Tabarka', 'Ichkeul'],
  };

  return interests.flatMap((interest) => destinationMap[normalizeText(interest)] || []);
}

function distributeDaysAcrossRegions(duration: number, regionCount: number) {
  const safeRegionCount = Math.max(regionCount, 1);
  const base = Math.floor(duration / safeRegionCount);
  let remainder = duration % safeRegionCount;

  return Array.from({ length: safeRegionCount }, () => {
    const value = base + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
    return Math.max(value, 1);
  });
}

function pickCities(input: TripInput) {
  const duration = calculateDuration(input.startDate, input.endDate) || input.duration;
  const selectedExperienceIds = filterExperienceIdsByRegions(input.selectedExperienceIds, input.regions || []);
  const selectedExperiences = getExperiencesByIds(selectedExperienceIds);
  const regionSeedCities = getRegionSeedCities(input.regions);
  const hasRegionConstraint = (input.regions || []).length > 0;

  const defaults = ['Tunis', 'Hammamet', 'Djerba', 'Douz', 'Kairouan'];

  const filteredInterestCities = getInterestSeedCities(input.interests).filter((city) =>
    isCityAllowedByRegions(city, input.regions || [])
  );

  const candidates = [
    input.startCity && isCityAllowedByRegions(input.startCity, input.regions || []) ? input.startCity : null,
    ...selectedExperiences.map((experience) => experience.location),
    ...regionSeedCities,
    ...filteredInterestCities,
    ...(hasRegionConstraint ? [] : defaults),
  ].filter(isNonEmptyString);

  const regionOrder: string[] = Array.from(
    new Set(
      (
        hasRegionConstraint
          ? input.regions || []
          : [
              ...selectedExperiences.map((experience) => experience.region),
              ...candidates.map((city) => getRegionForCity(city)).filter(isNonEmptyString),
              ...defaults.map((city) => getRegionForCity(city)).filter(isNonEmptyString),
            ]
      ).filter(isNonEmptyString)
    )
  );

  const plannedCities: string[] = [];
  const regionDayCounts = distributeDaysAcrossRegions(duration, regionOrder.length || 1);

  regionOrder.forEach((region, regionIndex) => {
    const regionCities = Array.from(
      new Set(
        candidates.filter((city) => normalizeText(getRegionForCity(city)) === normalizeText(region))
      )
    );
    const fallbackCities = getRegionSeedCities([region]);
    const pool = [...regionCities, ...fallbackCities].filter(
      (city, index, collection) => collection.indexOf(city) === index
    );

    const blockLength = regionDayCounts[regionIndex] || 1;
    for (let dayOffset = 0; dayOffset < blockLength; dayOffset += 1) {
      plannedCities.push(pool[dayOffset % Math.max(pool.length, 1)] || 'Tunis');
    }
  });

  let cursor = 0;
  const fallbackPool =
    (hasRegionConstraint && regionSeedCities.length > 0 ? regionSeedCities : defaults).filter(Boolean);
  while (plannedCities.length < duration) {
    plannedCities.push(fallbackPool[cursor % fallbackPool.length] || 'Tunis');
    cursor += 1;
  }

  return plannedCities.slice(0, duration);
}

function buildDayActivities({
  city,
  interests,
  regions,
  selectedExperienceIds,
  usedExperienceIds,
  includeWorkshops,
  wantsGuide,
  transportPreference,
  dailyBudget,
}: {
  city: string;
  interests: string[];
  regions: string[];
  selectedExperienceIds: string[];
  usedExperienceIds: Set<string>;
  includeWorkshops: boolean;
  wantsGuide: boolean;
  transportPreference: TransportPreference;
  dailyBudget: number;
}) {
  const selectedExperiences = getExperiencesByIds(selectedExperienceIds).filter(
    (experience) =>
      !usedExperienceIds.has(experience.id) &&
      normalizeText(experience.location) === normalizeText(city)
  );

  const regionalRecommendations = getRecommendedExperiences({
    selectedInterests: interests,
    selectedRegions: regions.length > 0 ? regions : (resolvePlace(city, city)?.region ? [resolvePlace(city, city)!.region] : []),
    limit: 6,
  }).filter(
    (experience) =>
      normalizeText(experience.location) === normalizeText(city) &&
      !usedExperienceIds.has(experience.id)
  );

  const primaryExperience = selectedExperiences[0] || regionalRecommendations[0];
  const secondaryExperience =
    selectedExperiences[1] ||
    regionalRecommendations.find((experience) => experience.id !== primaryExperience?.id);

  if (primaryExperience) {
    usedExperienceIds.add(primaryExperience.id);
  }

  if (secondaryExperience) {
    usedExperienceIds.add(secondaryExperience.id);
  }

  const featuredPlace =
    resolvePlace(city, city) ||
    placesData.find((place) => normalizeText(place.city) === normalizeText(city)) ||
    placesData[0];
  const restaurants = pickRestaurantsForDay(city, dailyBudget);

  const activities: DayActivity[] = [];
  const transport = buildTransportActivity(city, transportPreference);

  if (transport) {
    activities.push(transport);
  }

  activities.push(
    buildRestaurantMeal({
      time: '08:45',
      city,
      mealLabel: 'Petit-déjeuner de terroir',
      restaurant: restaurants.breakfast,
      fallbackPrice: 18,
    })
  );

  if (primaryExperience) {
    activities.push(buildActivityFromExperience(primaryExperience, '10:15', selectedExperiences.includes(primaryExperience)));
  } else if (featuredPlace) {
    activities.push(buildPlaceVisitActivity(featuredPlace, '10:15'));
  }

  activities.push(
    buildRestaurantMeal({
      time: '13:00',
      city,
      mealLabel: 'Déjeuner chez une adresse locale',
      restaurant: restaurants.lunch,
      fallbackPrice: 42,
    })
  );

  if (secondaryExperience) {
    activities.push(buildActivityFromExperience(secondaryExperience, '15:30', selectedExperiences.includes(secondaryExperience)));
  } else if (includeWorkshops) {
    activities.push({
      id: `atelier-${normalizeText(city)}`,
      time: '15:30',
      title: wantsGuide ? 'Atelier guidé avec artisans' : 'Atelier immersif en petit groupe',
      description: `Rencontre avec des créateurs locaux à ${city} pour une expérience participative liée à vos centres d’intérêt.`,
      type: 'activité',
      price: 78,
      location: city,
      coordinates: resolveCoordinates(city, city),
      socialImpactPercent: 87,
      artisansSupported: 3,
      selectedByUser: false,
    });
  } else if (featuredPlace) {
    activities.push({
      ...buildPlaceVisitActivity(featuredPlace, '15:30'),
      title: `Temps libre à ${featuredPlace.name}`,
      description: `Exploration plus souple de ${featuredPlace.name} avec pauses photo et bonnes adresses repérées.`,
      socialImpactPercent: 61,
      artisansSupported: 2,
    });
  }

  activities.push(
    buildRestaurantMeal({
      time: '19:30',
      city,
      mealLabel: 'Dîner signature',
      restaurant: restaurants.dinner,
      fallbackPrice: 58,
    })
  );

  return activities;
}

function enrichActivity(
  activity: any,
  location: string,
  selectedExperienceIds: string[],
  interests: string[],
  regions: string[]
): DayActivity {
  const selectedExperiences = getExperiencesByIds(selectedExperienceIds);
  const matchedExperience = selectedExperiences.find(
    (experience) =>
      normalizeText(experience.name) === normalizeText(activity.title) ||
      normalizeText(activity.title).includes(normalizeText(experience.name)) ||
      normalizeText(experience.name).includes(normalizeText(activity.title))
  );

  const anyMatchingExperience = getRecommendedExperiences({
    selectedInterests: interests,
    selectedRegions: regions,
    limit: 24,
  }).find(
    (experience) =>
      normalizeText(experience.name) === normalizeText(activity.title) ||
      normalizeText(activity.location) === normalizeText(experience.location)
  );

  const fallbackByType = getRecommendedExperiences({
    selectedInterests: interests,
    selectedRegions: regions,
    limit: 24,
  }).find(
    (experience) =>
      normalizeText(experience.location) === normalizeText(location) &&
      experience.activityType === activity.type
  );

  if (!matchedExperience && !anyMatchingExperience && fallbackByType) {
    return buildActivityFromExperience(
      fallbackByType,
      typeof activity.time === 'string' && activity.time.length > 0 ? activity.time : '10:30',
      false
    );
  }

  if (!matchedExperience && !anyMatchingExperience && (activity.type === 'visite' || activity.type === 'activité')) {
    const fallbackPlace =
      resolvePlace(location, location) ||
      placesData.find((place) => normalizeText(place.city) === normalizeText(location));

    if (fallbackPlace) {
      return {
        ...buildPlaceVisitActivity(
          fallbackPlace,
          typeof activity.time === 'string' && activity.time.length > 0 ? activity.time : '10:30'
        ),
        type: activity.type,
      };
    }
  }

  const coordinates =
    matchedExperience
      ? { lat: matchedExperience.lat, lng: matchedExperience.lng }
      : anyMatchingExperience
        ? { lat: anyMatchingExperience.lat, lng: anyMatchingExperience.lng }
        : resolveCoordinates(activity.location, location);

  return {
    id: matchedExperience?.id || anyMatchingExperience?.id || `${normalizeText(activity.title)}-${normalizeText(location)}`,
    time: activity.time,
    title: activity.title,
    description: activity.description,
    type: activity.type,
    price: typeof activity.price === 'number' ? activity.price : 0,
    location: activity.location || location,
    image: matchedExperience?.image || anyMatchingExperience?.image,
    selectedByUser: Boolean(matchedExperience),
    socialImpactPercent: matchedExperience?.socialImpactPercent || anyMatchingExperience?.socialImpactPercent || 54,
    artisansSupported: clampArtisansSupported(
      matchedExperience?.artisansSupported || anyMatchingExperience?.artisansSupported || 2
    ),
    coordinates,
  };
}

function ensureSelectedExperiencePresence(days: DayPlan[], selectedExperienceIds: string[]) {
  const selectedExperiences = getExperiencesByIds(selectedExperienceIds);
  const presentIds = new Set(
    days.flatMap((day) => day.activities.map((activity) => activity.id).filter(Boolean))
  );

  for (const experience of selectedExperiences) {
    if (presentIds.has(experience.id)) {
      continue;
    }

    const targetDay =
      days.find((day) => normalizeText(day.location) === normalizeText(experience.location)) ||
      days[0];

    targetDay.activities.splice(2, 0, buildActivityFromExperience(experience, '11:30', true));
    targetDay.totalDayCost = targetDay.activities.reduce((sum: number, activity: DayActivity) => sum + activity.price, 0) + (targetDay.hotel?.price || 0);
  }
}

function getActivityMinPrice(activity: DayActivity) {
  if (activity.price <= 0) {
    return 0;
  }

  if (activity.type === 'repas') {
    return 12;
  }

  if (activity.type === 'visite') {
    return 18;
  }

  if (activity.type === 'activité') {
    return 25;
  }

  if (activity.type === 'transport') {
    return 0;
  }

  return 10;
}

function recomputeDayCost(day: DayPlan) {
  day.totalDayCost =
    day.activities.reduce((sum, activity) => sum + activity.price, 0) +
    (day.hotel?.price || 0);
}

function computeTripCost(days: DayPlan[]) {
  return days.reduce((sum, day) => sum + day.totalDayCost, 0);
}

function enforceRegionConstraint(days: DayPlan[], input: TripInput, fallbackCities: string[]) {
  if (!input.regions || input.regions.length === 0) {
    return;
  }

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    if (!isCityAllowedByRegions(day.location, input.regions)) {
      const fallbackLocation =
        fallbackCities[index] ||
        fallbackCities[0] ||
        day.location;

      day.location = fallbackLocation;
      day.locationCoordinates = resolveCoordinates(fallbackLocation, fallbackLocation);

      for (const activity of day.activities) {
        if (!isCityAllowedByRegions(activity.location || fallbackLocation, input.regions)) {
          activity.location = fallbackLocation;
          activity.coordinates = resolveCoordinates(fallbackLocation, fallbackLocation);
        }
      }
    }
  }
}

function enforceBudgetCap(days: DayPlan[], budget: number) {
  if (!(budget > 0)) {
    return;
  }

  let total = computeTripCost(days);
  if (total <= budget) {
    return;
  }

  const ratio = budget / total;

  for (const day of days) {
    if (day.hotel) {
      day.hotel.price = Math.max(45, Math.round(day.hotel.price * ratio));
    }

    day.activities = day.activities.map((activity) => {
      if (activity.price <= 0) {
        return activity;
      }

      const minPrice = getActivityMinPrice(activity);
      return {
        ...activity,
        price: Math.max(minPrice, Math.round(activity.price * ratio)),
      };
    });

    recomputeDayCost(day);
  }

  total = computeTripCost(days);
  if (total <= budget) {
    return;
  }

  type PriceLine = {
    getCurrent: () => number;
    min: number;
    setValue: (value: number) => void;
  };

  const lines: PriceLine[] = [];

  for (const day of days) {
    if (day.hotel) {
      lines.push({
        getCurrent: () => day.hotel!.price,
        min: 45,
        setValue: (value) => {
          day.hotel!.price = Math.max(0, Math.round(value));
        },
      });
    }

    for (const activity of day.activities) {
      lines.push({
        getCurrent: () => activity.price,
        min: getActivityMinPrice(activity),
        setValue: (value) => {
          activity.price = Math.max(0, Math.round(value));
        },
      });
    }
  }

  let remaining = total - budget;
  const sorted = [...lines].sort(
    (left, right) =>
      (right.getCurrent() - right.min) -
      (left.getCurrent() - left.min)
  );

  for (const line of sorted) {
    if (remaining <= 0) {
      break;
    }

    const current = line.getCurrent();
    const reducible = current - line.min;
    if (reducible <= 0) {
      continue;
    }

    const cut = Math.min(reducible, remaining);
    line.setValue(current - cut);
    remaining -= cut;
  }

  for (const day of days) {
    recomputeDayCost(day);
  }

  total = computeTripCost(days);
  if (total <= budget) {
    return;
  }

  const hardRatio = budget / total;
  for (const day of days) {
    if (day.hotel) {
      day.hotel.price = Math.max(0, Math.round(day.hotel.price * hardRatio));
    }

    day.activities = day.activities.map((activity) => ({
      ...activity,
      price: Math.max(0, Math.round(activity.price * hardRatio)),
    }));

    recomputeDayCost(day);
  }

  total = computeTripCost(days);
  const drift = total - budget;
  if (drift > 0) {
    const targetDay = [...days].sort((a, b) => b.totalDayCost - a.totalDayCost)[0];
    if (targetDay?.hotel) {
      targetDay.hotel.price = Math.max(0, targetDay.hotel.price - drift);
      recomputeDayCost(targetDay);
    }
  }
}

export function hydrateGeneratedTrip(rawTrip: any, input: TripInput): GeneratedTrip {
  const duration = calculateDuration(input.startDate, input.endDate) || input.duration;
  const filteredSelectedExperienceIds = filterExperienceIdsByRegions(input.selectedExperienceIds || [], input.regions || []);
  const normalizedInput: TripInput = {
    ...input,
    selectedExperienceIds: filteredSelectedExperienceIds,
  };
  const cities = pickCities(normalizedInput);
  const rawDays = Array.isArray(rawTrip.days) ? rawTrip.days : [];

  const days: DayPlan[] = rawDays.slice(0, duration).map((day: any, index: number) => {
    const candidateLocation = day.location || cities[index] || 'Tunis';
    const location = isCityAllowedByRegions(candidateLocation, normalizedInput.regions || [])
      ? candidateLocation
      : (cities[index] || cities[0] || 'Tunis');
    const date = day.date || (input.startDate ? addDays(input.startDate, index) : undefined);
    const hotel = day.hotel
      ? {
          name: day.hotel.name || 'Hébergement local',
          price: typeof day.hotel.price === 'number' ? day.hotel.price : Math.round((input.budget || 2000) / duration * 0.5),
          stars: typeof day.hotel.stars === 'number' ? day.hotel.stars : 4,
          image: day.hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
          coordinates: resolveCoordinates(day.hotel.name, location) || resolveCoordinates(location, location),
        }
      : selectAccommodation(location, Math.round((input.budget || 2000) / duration));

    const activities = (Array.isArray(day.activities) ? day.activities : [])
      .map((activity: any) =>
        enrichActivity(
          activity,
          location,
          filteredSelectedExperienceIds,
          normalizedInput.interests,
          normalizedInput.regions || []
        )
      )
      .map((activity: DayActivity) =>
        isCityAllowedByRegions(activity.location || location, normalizedInput.regions || [])
          ? activity
          : {
              ...activity,
              location,
              coordinates: resolveCoordinates(location, location),
            }
      );

    const curatedBackupActivities = buildDayActivities({
      city: location,
      interests: normalizedInput.interests,
      regions: normalizedInput.regions || [],
      selectedExperienceIds: filteredSelectedExperienceIds,
      usedExperienceIds: new Set<string>(),
      includeWorkshops: Boolean(normalizedInput.preferences?.includeWorkshops),
      wantsGuide: normalizedInput.preferences?.wantsGuide !== false,
      transportPreference: normalizedInput.preferences?.transportPreference || 'no-preference',
      dailyBudget: Math.round((input.budget || 2000) / duration),
    });

    const finalActivities = [...activities];
    if (finalActivities.length < 4) {
      for (const candidate of curatedBackupActivities) {
        if (finalActivities.some((activity) => normalizeText(activity.title) === normalizeText(candidate.title))) {
          continue;
        }

        finalActivities.push(candidate);

        if (finalActivities.length >= 5) {
          break;
        }
      }
    }

    const totalDayCost = finalActivities.reduce((sum: number, activity: DayActivity) => sum + activity.price, 0) + (hotel?.price || 0);

    return {
      day: day.day || index + 1,
      date,
      location,
      locationCoordinates: resolveCoordinates(location, location),
      hotel,
      activities: finalActivities,
      totalDayCost,
    };
  });

  if (days.length < duration) {
    const fallback = buildMockTrip(normalizedInput);
    return fallback;
  }

  enforceRegionConstraint(days, normalizedInput, cities);
  ensureSelectedExperiencePresence(days, filteredSelectedExperienceIds);
  enforceBudgetCap(days, normalizedInput.budget);

  const totalCost = computeTripCost(days);
  const socialImpact = calculateSocialImpact(days);
  const uniqueRegions = Array.from(
    new Set(
      days
        .map((day) => resolvePlace(day.location, day.location)?.region)
        .filter(Boolean)
    )
  ) as string[];

  return {
    title: rawTrip.title || `Voyage en Tunisie — ${duration} jours`,
    summary:
      rawTrip.summary ||
      `Un parcours planifié du ${input.startDate || 'départ libre'} au ${input.endDate || 'retour libre'}, avec expériences choisies, temps forts locaux et étapes détaillées.`,
    startDate: input.startDate,
    endDate: input.endDate,
    days,
    totalCost,
    regions: uniqueRegions,
    socialImpact,
    highlights: [
      ...(rawTrip.highlights || []),
      `${socialImpact.localImpactPercent}% des dépenses orientées vers l'économie locale`,
      `${socialImpact.artisansSupported} artisans, guides ou petits producteurs valorisés sur l'ensemble du séjour`,
    ].slice(0, 6),
  };
}

export function buildMockTrip(input: TripInput): GeneratedTrip {
  const duration = calculateDuration(input.startDate, input.endDate) || input.duration;
  const budget = input.budget;
  const filteredSelectedExperienceIds = filterExperienceIdsByRegions(input.selectedExperienceIds || [], input.regions || []);
  const dailyBudget = budget / duration;
  const includeWorkshops = Boolean(input.preferences?.includeWorkshops);
  const transportPreference = input.preferences?.transportPreference || 'no-preference';
  const wantsGuide = input.preferences?.wantsGuide !== false;
  const normalizedInput: TripInput = {
    ...input,
    selectedExperienceIds: filteredSelectedExperienceIds,
  };
  const cities = pickCities(normalizedInput);
  const usedExperienceIds = new Set<string>();

  const days: DayPlan[] = cities.map((city, index) => {
    const hotel = selectAccommodation(city, dailyBudget);
    const activities = buildDayActivities({
      city,
      interests: input.interests,
      regions: input.regions || [],
      selectedExperienceIds: filteredSelectedExperienceIds,
      usedExperienceIds,
      includeWorkshops,
      wantsGuide,
      transportPreference,
      dailyBudget,
    });

    const totalDayCost = activities.reduce((sum: number, activity: DayActivity) => sum + activity.price, 0) + hotel.price;

    return {
      day: index + 1,
      date: input.startDate ? addDays(input.startDate, index) : undefined,
      location: city,
      locationCoordinates: resolveCoordinates(city, city),
      hotel,
      activities,
      totalDayCost,
    };
  });

  ensureSelectedExperiencePresence(days, filteredSelectedExperienceIds);
  enforceRegionConstraint(days, normalizedInput, cities);
  enforceBudgetCap(days, budget);

  const totalCost = computeTripCost(days);
  const socialImpact = calculateSocialImpact(days);
  const endDate = input.endDate || (input.startDate ? addDays(input.startDate, duration - 1) : undefined);
  const regionSummary = Array.from(new Set(days.map((day) => resolvePlace(day.location, day.location)?.region).filter(Boolean))) as string[];

  return {
    title: `Voyage en Tunisie — ${duration} jours planifiés`,
    summary: `Un itinéraire daté et détaillé du ${input.startDate ? new Date(input.startDate).toLocaleDateString('fr-FR') : 'départ libre'} au ${endDate ? new Date(endDate).toLocaleDateString('fr-FR') : 'retour libre'}, conçu autour de ${input.interests.join(', ')} et de vos priorités régionales.`,
    startDate: input.startDate,
    endDate,
    days,
    totalCost,
    regions: regionSummary,
    socialImpact,
    highlights: [
      `${duration} journées réellement planifiées, avec horaires et étapes`,
      `${socialImpact.localImpactPercent}% d'impact local estimé sur vos expériences`,
      `${socialImpact.artisansSupported} artisans, guides ou petits producteurs valorisés`,
      input.selectedExperienceIds?.length
        ? `${input.selectedExperienceIds.length} activités choisies par vous intégrées au plan`
        : 'Recommandations calibrées sur vos centres d’intérêt',
      input.regions?.length ? `Régions mises en avant : ${input.regions.join(', ')}` : null,
      input.preferences?.notes ? `Préférences prises en compte : ${input.preferences.notes}` : null,
    ].filter(Boolean) as string[],
  };
}
