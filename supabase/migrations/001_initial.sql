-- ============================================================
-- HKEYETNA — Schema Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'fr',
  preferred_currency TEXT DEFAULT 'TND',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  duration INTEGER NOT NULL,
  budget DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  interests TEXT[],
  highlights TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'completed')),
  is_public BOOLEAN DEFAULT FALSE,
  cover_image TEXT,
  preferences JSONB DEFAULT '{}',
  trip_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.trip_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  location TEXT NOT NULL,
  total_day_cost DECIMAL(10,2),
  hotel_name TEXT,
  hotel_price DECIMAL(10,2),
  hotel_stars INTEGER,
  hotel_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trip days for their trips"
  ON public.trip_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_days.trip_id
      AND (trips.user_id = auth.uid() OR trips.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert trip days for their trips"
  ON public.trip_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete trip days for their trips"
  ON public.trip_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE TABLE public.trip_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  time_slot TEXT,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT CHECK (activity_type IN ('visite', 'repas', 'activité', 'hébergement', 'transport')),
  price DECIMAL(10,2),
  location TEXT,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.trip_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their trips"
  ON public.trip_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_days td
      JOIN public.trips t ON t.id = td.trip_id
      WHERE td.id = trip_activities.trip_day_id
      AND (t.user_id = auth.uid() OR t.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert activities for their trips"
  ON public.trip_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_days td
      JOIN public.trips t ON t.id = td.trip_id
      WHERE td.id = trip_activities.trip_day_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities for their trips"
  ON public.trip_activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_days td
      JOIN public.trips t ON t.id = td.trip_id
      WHERE td.id = trip_activities.trip_day_id
      AND t.user_id = auth.uid()
    )
  );

CREATE TABLE public.places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  category TEXT,
  description TEXT,
  image TEXT,
  tags TEXT[],
  rating DECIMAL(3,1),
  price_per_night DECIMAL(10,2),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Places are publicly readable"
  ON public.places FOR SELECT
  USING (TRUE);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
