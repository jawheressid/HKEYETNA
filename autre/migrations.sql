-- ============================================================
-- HKEYETNA — Migration Supabase complète
-- Exécuter dans l'éditeur SQL de Supabase (dashboard)
-- ============================================================

-- ── 1. TABLE profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  preferred_currency TEXT DEFAULT 'TND' CHECK (preferred_currency IN ('TND','EUR','USD')),
  bio           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger auto-insert profil à la création d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. TABLE trips ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  summary       TEXT,
  total_cost    NUMERIC(10,2),
  budget        NUMERIC(10,2),
  duration      INT,
  interests     TEXT[],
  start_city    TEXT DEFAULT 'Tunis',
  highlights    TEXT[],
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
  is_public     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. TABLE trip_days ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number    INT NOT NULL,
  location      TEXT,
  hotel         JSONB,
  activities    JSONB DEFAULT '[]',
  total_day_cost NUMERIC(10,2) DEFAULT 0,
  weather       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. TABLE places (seed depuis places.json) ──────────────────
CREATE TABLE IF NOT EXISTS public.places (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  city          TEXT,
  region        TEXT,
  description   TEXT,
  image         TEXT,
  tags          TEXT[],
  rating        NUMERIC(3,1),
  price_level   INT DEFAULT 1,
  lat           NUMERIC(9,6),
  lng           NUMERIC(9,6),
  price_per_night NUMERIC(10,2) DEFAULT 0,
  category      TEXT,
  avg_temp      NUMERIC(4,1),
  season        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. TABLE experiences ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiences (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  location      TEXT,
  category      TEXT,
  duration      TEXT,
  price         NUMERIC(10,2),
  rating        NUMERIC(3,1),
  image         TEXT,
  description   TEXT,
  included      TEXT[],
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. TABLE saved_places (favoris utilisateur) ────────────────
CREATE TABLE IF NOT EXISTS public.saved_places (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_id   TEXT NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- ── 7. ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Profiles : chaque user voit/modifie seulement son profil
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trips : select public ou propre; insert/update/delete seulement propre
CREATE POLICY "trips_select" ON public.trips
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "trips_insert" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips_update" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trips_delete" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Trip_days : accès via trip ownership
CREATE POLICY "trip_days_select" ON public.trip_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND (t.user_id = auth.uid() OR t.is_public = TRUE)
    )
  );
CREATE POLICY "trip_days_insert" ON public.trip_days
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );
CREATE POLICY "trip_days_delete" ON public.trip_days
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );

-- Places & Experiences : lecture publique
CREATE POLICY "places_public_read" ON public.places
  FOR SELECT USING (TRUE);
CREATE POLICY "experiences_public_read" ON public.experiences
  FOR SELECT USING (TRUE);

-- Saved places
CREATE POLICY "saved_places_self" ON public.saved_places
  FOR ALL USING (auth.uid() = user_id);

-- ── 8. INDEX pour performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON public.trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_saved_places_user ON public.saved_places(user_id);

-- ── 9. SEED places depuis places.json ─────────────────────────
INSERT INTO public.places (id,name,city,region,description,image,tags,rating,price_level,lat,lng,price_per_night,category,avg_temp,season)
VALUES
  ('sidi-bou-said','Sidi Bou Saïd','Tunis','Grand Tunis','Village pittoresque aux maisons blanches et bleues dominant la mer Méditerranée.','https://upload.wikimedia.org/wikipedia/commons/0/05/Sidi_Chebaan.jpg',ARRAY['village','mer','architecture','photo'],4.9,1,36.8702,10.3417,0,'site',22,'toute l''année'),
  ('carthage','Carthage','Tunis','Grand Tunis','Ancienne capitale de l''empire carthaginois. Ruines monumentales classées UNESCO.','https://upload.wikimedia.org/wikipedia/commons/3/34/Montage_ville_de_Carthage.png',ARRAY['histoire','UNESCO','ruines','antiquité'],4.7,1,36.8528,10.3233,0,'site',21,'printemps, automne'),
  ('djerba','Île de Djerba','Djerba','Médenine','Île légendaire aux plages de rêve, médina animée et traditions artisanales uniques.','https://upload.wikimedia.org/wikipedia/commons/a/a5/Djerba_Island.jpeg',ARRAY['plage','île','artisanat','détente'],4.8,2,33.8075,10.8451,180,'destination',25,'été, printemps'),
  ('douz','Douz','Douz','Kébili','Porte du Sahara tunisien. Dunes dorées et nuits étoilées magiques.','https://upload.wikimedia.org/wikipedia/commons/c/c7/Tunisia_10-12_-_064_-_Douz_and_the_Festival_of_the_Sahara_%286609290791%29.jpg',ARRAY['désert','sahara','aventure','dromadaire'],4.9,2,33.4569,9.0246,200,'destination',30,'automne, hiver'),
  ('tozeur','Tozeur','Tozeur','Tozeur','Oasis majestueuse aux palmiers infinis. Architecture en briques de sable unique au monde.','https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Tozeur%2C_Tunisia.jpg/1280px-Tozeur%2C_Tunisia.jpg',ARRAY['oasis','architecture','culture','désert'],4.7,2,33.9197,8.1336,150,'destination',28,'automne, printemps'),
  ('medina-tunis','Médina de Tunis','Tunis','Grand Tunis','Labyrinthe de souks et de mosquées. La médina la plus authentique d''Afrique du Nord.','https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Medina_of_Tunis_%282017%29.jpg/1280px-Medina_of_Tunis_%282017%29.jpg',ARRAY['médina','souks','culture','histoire'],4.8,1,36.7992,10.1701,0,'site',20,'toute l''année'),
  ('tabarka','Tabarka','Tabarka','Jendouba','Station balnéaire entourée de coraux et forêts de chênes-lièges. Plongée exceptionnelle.','https://upload.wikimedia.org/wikipedia/commons/4/44/Vue_de_Tabarka.jpg',ARRAY['plage','plongée','nature','forêt'],4.6,2,36.9543,8.7590,120,'destination',22,'été'),
  ('kairouan','Kairouan','Kairouan','Kairouan','4ème ville sainte de l''Islam. Mosquée des Aghlabides et artisanat du tapis réputés mondialement.','https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Kairouan%2C_view_of_the_Medina_%286%29_%28cropped%29.jpg/1280px-Kairouan%2C_view_of_the_Medina_%286%29_%28cropped%29.jpg',ARRAY['spirituel','histoire','mosquée','artisanat'],4.8,1,35.6784,10.0963,0,'site',22,'printemps, automne'),
  ('el-jem','El Jem','El Jem','Mahdia','Amphithéâtre romain mieux conservé que le Colisée de Rome. UNESCO.','https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/El_Jem_Amphitheater%2C_Tunisia.jpg/1280px-El_Jem_Amphitheater%2C_Tunisia.jpg',ARRAY['histoire','romain','UNESCO','amphithéâtre'],4.9,1,35.2964,10.7073,0,'site',22,'toute l''année'),
  ('hammamet','Hammamet','Hammamet','Nabeul','Station balnéaire cosmopolite. Jasmin, médina blanche et plages de sable fin.','https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Hammamet%2C_Tunisia_%2830735695888%29.jpg/1280px-Hammamet%2C_Tunisia_%2830735695888%29.jpg',ARRAY['plage','médina','jasmin','resort'],4.5,3,36.3991,10.6130,250,'destination',24,'été'),
  ('chott-el-jerid','Chott El Jérid','Tozeur','Tozeur','Plus grand lac salé d''Afrique. Miroirs et mirages d''une beauté surnaturelle.','https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Chott_el_Djerid_salt_lake_-_Tunisia.jpg/1280px-Chott_el_Djerid_salt_lake_-_Tunisia.jpg',ARRAY['lac','sel','désert','photo'],4.8,1,33.7167,8.4167,0,'site',30,'toute l''année'),
  ('bulla-regia','Bulla Regia','Jendouba','Jendouba','Cité romaine aux maisons souterraines uniques au monde pour fuir la chaleur.','https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Tunisia_bulla_regia%2C_maison_de_la_chasse.jpg/1280px-Tunisia_bulla_regia%2C_maison_de_la_chasse.jpg',ARRAY['histoire','romain','archéologie','unique'],4.6,1,36.5592,8.7533,0,'site',20,'printemps, automne')
ON CONFLICT (id) DO NOTHING;

-- ── 10. SEED experiences ───────────────────────────────────────
INSERT INTO public.experiences (id,name,location,category,duration,price,rating,image,description,included,tags)
VALUES
  ('camel-douz','Randonnée en Dromadaire au Sahara','Douz','aventure','3h',150,4.9,'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80','Traversée des grandes dunes de Douz sur le dos d''un dromadaire.',ARRAY['guide berbère','thé du désert','photos souvenirs'],ARRAY['désert','aventure','nature']),
  ('cooking-tunis','Atelier Cuisine Tunisienne','Tunis','gastronomie','4h',120,4.8,'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80','Apprenez à préparer brik, couscous et makroudh.',ARRAY['ingrédients','recettes','dégustation','thé'],ARRAY['cuisine','culture','famille']),
  ('dive-tabarka','Plongée sous-marine à Tabarka','Tabarka','sport','2h',95,4.7,'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80','Exploration des fonds marins méditerranéens.',ARRAY['équipement','moniteur diplômé','photos'],ARRAY['mer','sport','nature'])
ON CONFLICT (id) DO NOTHING;
