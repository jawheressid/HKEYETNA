import accommodationsData from '@/data/accommodations.json';
import restaurantsData from '@/data/restaurants.json';
import placesData from '@/data/places.json';
import { normalizeText, resolveCoordinates } from '@/lib/tripPlanner';

export type AccommodationRecord = (typeof accommodationsData)[number];
export type RestaurantRecord = (typeof restaurantsData)[number];

function getRegionForCity(city: string) {
  return (
    placesData.find((place) => normalizeText(place.city) === normalizeText(city))?.region ||
    placesData.find((place) => normalizeText(place.name) === normalizeText(city))?.region
  );
}

function getAccommodationsForCity(city: string) {
  const normalizedCity = normalizeText(city);
  const region = getRegionForCity(city);

  const exactMatches = accommodationsData.filter(
    (item) => normalizeText(item.city) === normalizedCity
  );

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  if (region) {
    return accommodationsData.filter(
      (item) => normalizeText(item.region) === normalizeText(region)
    );
  }

  return accommodationsData;
}

function getRestaurantsForCity(city: string) {
  const normalizedCity = normalizeText(city);
  const region = getRegionForCity(city);

  const exactMatches = restaurantsData.filter(
    (item) => normalizeText(item.city) === normalizedCity
  );

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  if (region) {
    return restaurantsData.filter(
      (item) => normalizeText(item.region) === normalizeText(region)
    );
  }

  return restaurantsData;
}

function getAccommodationTargetPrice(dailyBudget: number) {
  if (dailyBudget <= 110) {
    return dailyBudget * 0.45;
  }

  if (dailyBudget <= 220) {
    return dailyBudget * 0.38;
  }

  return dailyBudget * 0.34;
}

function getAverageNightPrice(item: AccommodationRecord) {
  return Math.round((item.pricePerNightMin + item.pricePerNightMax) / 2);
}

export function selectAccommodation(city: string, dailyBudget: number) {
  const options = getAccommodationsForCity(city);
  const targetPrice = getAccommodationTargetPrice(dailyBudget);

  const sorted = [...options].sort((left, right) => {
    const leftPrice = getAverageNightPrice(left);
    const rightPrice = getAverageNightPrice(right);
    const leftDiff = Math.abs(leftPrice - targetPrice);
    const rightDiff = Math.abs(rightPrice - targetPrice);
    return leftDiff - rightDiff || right.rating - left.rating;
  });

  const selected = sorted[0] || options[0];
  const coordinates =
    resolveCoordinates(selected?.name, selected?.city) ||
    resolveCoordinates(city, city);

  if (!selected) {
    return {
      name: `Hébergement à ${city}`,
      price: Math.max(45, Math.round(targetPrice)),
      stars: 3,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
      coordinates,
    };
  }

  return {
    name: selected.name,
    price: getAverageNightPrice(selected),
    stars: selected.stars,
    image: selected.image,
    coordinates,
    accommodationType: selected.accommodationType,
  };
}

export function getAccommodationSuggestions({
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
  const normalizedExcluded = normalizeText(excludeName);

  return getAccommodationsForCity(city)
    .filter((item) => normalizeText(item.name) !== normalizedExcluded)
    .sort((left, right) => {
      const leftDiff = Math.abs(getAverageNightPrice(left) - budgetPerNight);
      const rightDiff = Math.abs(getAverageNightPrice(right) - budgetPerNight);
      return leftDiff - rightDiff || right.rating - left.rating;
    })
    .slice(0, limit)
    .map((item) => ({
      name: item.name,
      price: getAverageNightPrice(item),
      stars: item.stars,
      image: item.image,
      coordinates: resolveCoordinates(item.name, item.city) || resolveCoordinates(city, city),
      accommodationType: item.accommodationType,
    }));
}

function pickRestaurantByTypes(
  city: string,
  targetPrice: number,
  types: string[],
  excludedIds: Set<string>
) {
  const matching = getRestaurantsForCity(city)
    .filter((item) => !excludedIds.has(item.id))
    .filter((item) => types.includes(item.restaurantType));

  const source = matching.length > 0
    ? matching
    : getRestaurantsForCity(city).filter((item) => !excludedIds.has(item.id));

  const selected = [...source].sort((left, right) => {
    const leftDiff = Math.abs(left.averageTicket - targetPrice);
    const rightDiff = Math.abs(right.averageTicket - targetPrice);
    return leftDiff - rightDiff || right.rating - left.rating;
  })[0];

  if (selected) {
    excludedIds.add(selected.id);
  }

  return selected;
}

export function pickRestaurantsForDay(city: string, dailyBudget: number) {
  const excludedIds = new Set<string>();

  return {
    breakfast: pickRestaurantByTypes(city, Math.max(8, dailyBudget * 0.06), ['cafe', 'tea-room', 'pastry', 'street-food'], excludedIds),
    lunch: pickRestaurantByTypes(city, Math.max(20, dailyBudget * 0.13), ['restaurant', 'street-food', 'grill', 'seafood'], excludedIds),
    dinner: pickRestaurantByTypes(city, Math.max(28, dailyBudget * 0.18), ['restaurant', 'seafood', 'grill', 'tea-room'], excludedIds),
  };
}

export function getTopRestaurants({
  city,
  region,
  limit = 3,
}: {
  city?: string;
  region?: string;
  limit?: number;
}) {
  let source = restaurantsData as RestaurantRecord[];

  if (city) {
    source = source.filter((item) => normalizeText(item.city) === normalizeText(city));
  } else if (region) {
    source = source.filter((item) => normalizeText(item.region) === normalizeText(region));
  }

  return [...source]
    .sort((left, right) => right.rating - left.rating || left.averageTicket - right.averageTicket)
    .slice(0, limit);
}
