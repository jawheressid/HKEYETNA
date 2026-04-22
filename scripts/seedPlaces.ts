import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import placesData from '../data/places.json';

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  const places = placesData.map((place) => ({
    id: place.id,
    name: place.name,
    city: place.city,
    category: place.category,
    description: place.description,
    image: place.image,
    tags: place.tags,
    rating: place.rating,
    price_per_night: place.pricePerNight,
    lat: place.lat,
    lng: place.lng,
  }));

  const { error } = await supabase.from('places').upsert(places);

  if (error) {
    if (error.code === 'PGRST205') {
      console.error(
        "Seed error: la table 'public.places' n'existe pas encore. Exécutez d'abord la migration SQL 'supabase/migrations/001_initial.sql' dans Supabase SQL Editor."
      );
      return;
    }

    console.error('Seed error:', error);
    return;
  }

  console.log(`Seeded ${places.length} places`);
}

void seed();
