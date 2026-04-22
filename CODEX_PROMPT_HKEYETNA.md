# 🧭 HKEYETNA — Prompt Codex Complet
## Backend Supabase + Auth + Profil + Générateur de voyage sauvegardé

---

## CONTEXTE DU PROJET

Tu travailles sur **hkeyetna**, une application Next.js 14 (App Router) de voyage en Tunisie.

**Stack actuelle :**
- Next.js 14 avec App Router (`app/`)
- TypeScript + Tailwind CSS
- Framer Motion pour les animations
- `@google/generative-ai` (Gemini 2.0 Flash) pour la génération de voyage
- Leaflet / React Leaflet pour la carte
- Lucide React + React Icons

**Design System existant (à respecter absolument) :**
- Fonts : `font-display` = Fraunces (serif), `font-body` = Plus Jakarta Sans
- Couleurs Tailwind custom : `terracotta-*` (bleu clair), `sand-*`, `olive-*`, `midnight` (#22374c)
- Classes utilitaires : `.btn-primary`, `.btn-secondary`, `.card`, `.surface-card`, `.tag`, `.section-title`
- Radius : `rounded-3xl`, `rounded-4xl` (2rem), `rounded-5xl` (2.5rem)
- Fond global : gradient parchment + noise texture

**Pages existantes :**
- `/` — page d'accueil avec HeroSection, PlaceCards, MapView, TripGenerator, SocialFeed
- `/explore` — explore page

---

## OBJECTIF GLOBAL

Ajouter **3 choses principales** :

1. **Backend Supabase** (tables, RLS, SQL migration)
2. **Pages Auth** : `/login` + `/signup`
3. **Page Profil** : `/profile` — dashboard utilisateur avec ses voyages
4. **Page Trip** : `/trip/new` (génération authentifiée + sauvegarde) + `/trip/[id]` (détail voyage)
5. **Modification page d'accueil** : section "Votre voyage, personnalisé" devient statique + CTA vers `/login`
6. **Modification Navbar** : ajouter liens Profil / Connexion

---

## PARTIE 1 — BASE DE DONNÉES SUPABASE

### Fichier à créer : `supabase/migrations/001_initial.sql`

```sql
-- ============================================================
-- HKEYETNA — Schema Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- Linked to auth.users via trigger
-- ============================================================
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

-- Auto-create profile on signup
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

-- ============================================================
-- TABLE: trips
-- ============================================================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  duration INTEGER NOT NULL, -- in days
  budget DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  interests TEXT[], -- array of interest slugs
  highlights TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'completed')),
  is_public BOOLEAN DEFAULT FALSE,
  cover_image TEXT,
  -- Preferences stored as JSON
  preferences JSONB DEFAULT '{}',
  -- Raw generated trip JSON (for restore)
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

-- ============================================================
-- TABLE: trip_days
-- ============================================================
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

-- ============================================================
-- TABLE: trip_activities
-- ============================================================
CREATE TABLE public.trip_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  time_slot TEXT, -- "09:00"
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

-- ============================================================
-- TABLE: places (seed depuis data/places.json)
-- ============================================================
CREATE TABLE public.places (
  id TEXT PRIMARY KEY, -- same as JSON id
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

-- Public read for places (no RLS needed for public catalog)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Places are publicly readable" ON public.places FOR SELECT USING (TRUE);

-- ============================================================
-- HELPER: update updated_at automatically
-- ============================================================
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
```

---

## PARTIE 2 — CONFIGURATION SUPABASE CLIENT

### Fichier à créer : `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  duration: number;
  budget: number | null;
  total_cost: number | null;
  interests: string[];
  highlights: string[];
  status: 'draft' | 'saved' | 'completed';
  cover_image: string | null;
  preferences: Record<string, any>;
  trip_data: any; // full GeneratedTrip JSON
  created_at: string;
  updated_at: string;
}
```

### Fichier à créer : `lib/supabaseServer.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}
```

### `.env.example` — ajouter ces variables :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_gemini_key_here
```

### `package.json` — ajouter ces dépendances :

```json
"@supabase/supabase-js": "^2.43.0",
"@supabase/ssr": "^0.3.0"
```

---

## PARTIE 3 — CONTEXT AUTH

### Fichier à créer : `context/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

---

## PARTIE 4 — LAYOUT PRINCIPAL (modifier `app/layout.tsx`)

Envelopper les enfants avec `AuthProvider` **en plus** du `CurrencyProvider` existant :

```tsx
// app/layout.tsx
import { AuthProvider } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
// ... autres imports existants

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <CurrencyProvider>
            {/* sticker background existant */}
            <Navbar />
            <main>{children}</main>
            <ChatbotWidget />
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## PARTIE 5 — PAGE LOGIN + SIGNUP

### Fichier à créer : `app/login/page.tsx`

**Design et comportement :**
- Split layout : gauche = visuel Tunisie avec sticker + quote, droite = formulaire
- Deux onglets : **Connexion** / **Créer un compte**
- Connexion : email + mot de passe + bouton "Se connecter"
- Inscription : prénom + nom, email, mot de passe (min 6 chars) + confirmé
- Animations Framer Motion sur les transitions d'onglets (AnimatePresence)
- Gestion des erreurs Supabase (email déjà utilisé, mauvais mot de passe, etc.)
- Après connexion réussie → redirect vers `/profile`
- Après inscription réussie → afficher message "Vérifiez votre email" OU redirect direct selon config Supabase
- Lien "Retour à l'accueil"

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';

// Traductions des erreurs Supabase en français
const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email already in use': 'Cet email est déjà utilisé.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
};

type Tab = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      setError(AUTH_ERRORS[error.message] || error.message);
    } else {
      router.push('/profile');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (signupPassword !== signupConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }
    if (signupPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    if (error) {
      setError(AUTH_ERRORS[error.message] || error.message);
    } else {
      setSuccess('Compte créé ! Vérifiez votre email ou connectez-vous directement.');
      setTab('login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left: Visual */}
      <div className="hidden md:flex relative bg-midnight overflow-hidden flex-col justify-between p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight/95 to-terracotta-900/30" />
        {/* Decorative sticker */}
        <div className="absolute top-20 right-10 opacity-20 rotate-12">
          <Image src="/branding/sticker-khamsa.png" alt="" width={120} height={120} />
        </div>
        <div className="absolute bottom-32 left-8 opacity-15 -rotate-6">
          <Image src="/branding/sticker-tea.png" alt="" width={90} height={90} />
        </div>
        {/* Logo */}
        <div className="relative z-10">
          <Link href="/">
            <Image src="/branding/hkeyetna1.png" alt="HKEYETNA" width={160} height={60} className="brightness-0 invert" />
          </Link>
        </div>
        {/* Quote */}
        <div className="relative z-10 max-w-sm">
          <blockquote className="font-display text-3xl font-light text-white leading-snug mb-6">
            "La Tunisie se découvre mieux quand le voyage est vôtre."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-0.5 bg-terracotta-400" />
            <span className="font-body text-white/50 text-sm">HKEYETNA Travel</span>
          </div>
        </div>
        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { value: '50+', label: 'Destinations' },
            { value: '1000+', label: 'Voyageurs' },
            { value: 'IA', label: 'Itinéraires' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="font-display text-2xl font-semibold text-terracotta-400">{stat.value}</div>
              <div className="font-body text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-12 bg-parchment min-h-screen">
        {/* Back link (mobile) */}
        <Link href="/" className="flex items-center gap-2 text-midnight/50 hover:text-midnight font-body text-sm mb-8 md:hidden transition-colors">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>

        <div className="max-w-md w-full mx-auto">
          {/* Tab Switch */}
          <div className="flex bg-sand-100 rounded-2xl p-1 mb-8">
            {(['login', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl font-body font-semibold text-sm transition-all ${
                  tab === t ? 'bg-white text-midnight shadow-sm' : 'text-midnight/50 hover:text-midnight'
                }`}
              >
                {t === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="font-display text-4xl font-light text-midnight mb-2">
              {tab === 'login' ? 'Bon retour ✦' : 'Rejoignez-nous'}
            </h1>
            <p className="font-body text-midnight/50 text-sm">
              {tab === 'login'
                ? 'Connectez-vous pour accéder à vos voyages.'
                : 'Créez votre compte pour sauvegarder vos itinéraires.'}
            </p>
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-4 py-3 rounded-2xl mb-6"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-olive-50 border border-olive-200 text-olive-700 text-sm font-body px-4 py-3 rounded-2xl mb-6"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                {/* Email */}
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    placeholder="Votre email"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>
                {/* Password */}
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)} placeholder="Mot de passe"
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight/30 hover:text-midnight/60">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Connexion…' : 'Se connecter'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type="text" required value={signupName} onChange={e => setSignupName(e.target.value)}
                    placeholder="Prénom et nom"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type="email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                    placeholder="Votre email"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)} placeholder="Mot de passe (min. 6 caractères)"
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight/30 hover:text-midnight/60">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={signupConfirm}
                    onChange={e => setSignupConfirm(e.target.value)} placeholder="Confirmer le mot de passe"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Création…' : 'Créer mon compte'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Desktop back link */}
          <div className="mt-8 text-center">
            <Link href="/" className="font-body text-sm text-midnight/40 hover:text-midnight/70 transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## PARTIE 6 — PAGE PROFIL

### Fichier à créer : `app/profile/page.tsx`

**Layout :**
- Sidebar gauche (desktop) : avatar + nom + email + menu (Mes voyages, Paramètres, Déconnexion)
- Section principale droite : contenu selon l'onglet actif
- Mobile : tabs horizontaux en haut

**Section "Mes voyages" :**
- Liste des voyages de l'utilisateur (depuis `trips` table via Supabase)
- Chaque card voyage : titre, durée, budget, destination principale, date, status badge
- Bouton "Voir le détail" → `/trip/[id]`
- Bouton "Créer un nouveau voyage" → `/trip/new` (CTA principal en haut)
- Si aucun voyage : empty state avec illustration + CTA

**Section "Paramètres" :**
- Modifier nom complet
- Changer la devise préférée (réutiliser le CurrencySwitcher)
- Bouton "Sauvegarder"

**Logique :**
- Redirect vers `/login` si pas authentifié (useEffect sur `user`)
- Loading skeleton pendant le fetch
- Supprimer un voyage avec confirmation

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/lib/supabase';
import {
  MapPin, Clock, Wallet, Plus, Trash2, Eye, LogOut,
  Settings, Briefcase, Calendar, ChevronRight, Loader2
} from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-sand-100 text-sand-700',
  saved: 'bg-terracotta-50 text-terracotta-700',
  completed: 'bg-olive-50 text-olive-700',
};
const STATUS_LABELS = { draft: 'Brouillon', saved: 'Sauvegardé', completed: 'Terminé' };

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const mainDestination = trip.trip_data?.days?.[0]?.location ?? 'Tunisie';
  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white rounded-4xl border border-sand-100 shadow-sm overflow-hidden group">
      {/* Cover */}
      <div className="relative h-36 bg-gradient-to-br from-terracotta-100 to-sand-200">
        {trip.cover_image && (
          <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-body font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[trip.status]}`}>
            {STATUS_LABELS[trip.status]}
          </span>
        </div>
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white text-xs font-body">
          <MapPin size={11} />{mainDestination}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-medium text-midnight mb-3 line-clamp-1">{trip.title}</h3>
        <div className="flex items-center gap-4 text-xs text-midnight/50 font-body mb-4">
          <div className="flex items-center gap-1"><Clock size={12} />{trip.duration} jours</div>
          {trip.budget && <div className="flex items-center gap-1"><Wallet size={12} />{trip.budget} DT</div>}
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(trip.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/trip/${trip.id}`} className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5">
            <Eye size={13} /> Voir
          </Link>
          <button
            onClick={() => onDelete(trip.id)}
            className="p-2 rounded-full border border-sand-200 text-midnight/40 hover:border-red-200 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyTrips() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-6">🗺️</div>
      <h3 className="font-display text-2xl font-light text-midnight mb-3">Aucun voyage pour l'instant</h3>
      <p className="font-body text-midnight/50 text-sm mb-8 max-w-xs mx-auto">
        Créez votre premier itinéraire personnalisé avec l'aide de l'IA.
      </p>
      <Link href="/trip/new" className="btn-primary inline-flex items-center gap-2">
        <Plus size={16} /> Créer mon premier voyage
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<'trips' | 'settings'>('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  // Redirect if not auth
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? '');
  }, [profile]);

  const fetchTrips = async () => {
    if (!user) return;
    setTripsLoading(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTrips(data ?? []);
    setTripsLoading(false);
  };

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]);

  const deleteTrip = async (id: string) => {
    if (!confirm('Supprimer ce voyage ?')) return;
    await supabase.from('trips').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block">
            <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-6 sticky top-32">
              {/* Avatar + User Info */}
              <div className="flex flex-col items-center text-center mb-8 pt-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center mb-4">
                  <span className="font-display text-3xl text-white font-medium">
                    {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
                  </span>
                </div>
                <h2 className="font-display text-xl font-medium text-midnight mb-1">
                  {profile?.full_name ?? 'Voyageur'}
                </h2>
                <p className="font-body text-xs text-midnight/40">{profile?.email}</p>
                <div className="mt-3">
                  <span className="tag text-xs">
                    {trips.length} voyage{trips.length !== 1 ? 's' : ''} sauvegardé{trips.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {/* Nav */}
              <nav className="space-y-1">
                {[
                  { id: 'trips', icon: Briefcase, label: 'Mes voyages' },
                  { id: 'settings', icon: Settings, label: 'Paramètres' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-body font-medium text-sm transition-all ${
                      tab === item.id
                        ? 'bg-terracotta-50 text-terracotta-700'
                        : 'text-midnight/60 hover:bg-sand-50 hover:text-midnight'
                    }`}
                  >
                    <item.icon size={16} />{item.label}
                    {tab === item.id && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-body font-medium text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-4"
                >
                  <LogOut size={16} /> Se déconnecter
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            {/* Mobile Header */}
            <div className="md:hidden mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center">
                  <span className="font-display text-2xl text-white font-medium">
                    {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-medium text-midnight">{profile?.full_name ?? 'Voyageur'}</h2>
                  <p className="font-body text-xs text-midnight/40">{profile?.email}</p>
                </div>
              </div>
              {/* Mobile Tabs */}
              <div className="flex bg-sand-100 rounded-2xl p-1">
                {[
                  { id: 'trips', label: 'Mes voyages' },
                  { id: 'settings', label: 'Paramètres' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as any)}
                    className={`flex-1 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
                      tab === t.id ? 'bg-white text-midnight shadow-sm' : 'text-midnight/50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* TRIPS TAB */}
              {tab === 'trips' && (
                <motion.div
                  key="trips"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="tag mb-2 inline-flex">✦ Mes itinéraires</span>
                      <h1 className="font-display text-3xl font-light text-midnight">Mes voyages</h1>
                    </div>
                    <Link href="/trip/new" className="btn-primary flex items-center gap-2 text-sm">
                      <Plus size={15} /> Nouveau voyage
                    </Link>
                  </div>

                  {tripsLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-sand-100 rounded-4xl h-60 animate-pulse" />
                      ))}
                    </div>
                  ) : trips.length === 0 ? (
                    <EmptyTrips />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {trips.map(trip => (
                        <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* SETTINGS TAB */}
              {tab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <div className="mb-8">
                    <span className="tag mb-2 inline-flex">⚙️ Compte</span>
                    <h1 className="font-display text-3xl font-light text-midnight">Paramètres</h1>
                  </div>
                  <div className="bg-white rounded-4xl border border-sand-100 shadow-sm p-8 max-w-lg space-y-6">
                    <div>
                      <label className="font-body font-semibold text-sm text-midnight mb-2 block">Nom complet</label>
                      <input
                        type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-2xl font-body text-sm text-midnight focus:outline-none focus:border-terracotta-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="font-body font-semibold text-sm text-midnight mb-2 block">Email</label>
                      <input
                        type="email" value={profile?.email ?? ''} disabled
                        className="w-full px-4 py-3 bg-sand-50 border border-sand-100 rounded-2xl font-body text-sm text-midnight/50 cursor-not-allowed"
                      />
                      <p className="text-xs text-midnight/40 font-body mt-1.5">L'email ne peut pas être modifié ici.</p>
                    </div>
                    <button
                      onClick={saveSettings} disabled={saving}
                      className="btn-primary disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                      {saving ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-4xl border border-red-100 p-8 max-w-lg mt-6">
                    <h3 className="font-body font-semibold text-sm text-red-600 mb-4">Zone de danger</h3>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-sm font-body font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                      <LogOut size={15} /> Se déconnecter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
```

---

## PARTIE 7 — PAGE TRIP GENERATOR (authentifié + sauvegarde)

### Fichier à créer : `app/trip/new/page.tsx`

**Comportement :**
- Identique au `TripGenerator` existant dans `app/page.tsx`
- Mais **authentification requise** : si pas connecté → redirect `/login?redirect=/trip/new`
- Après génération du voyage (étape 4, success) → afficher un bouton "💾 Sauvegarder ce voyage"
- Cliquer "Sauvegarder" → appelle une fonction `saveTrip(trip)` qui:
  1. Insère dans `trips` table
  2. Insère dans `trip_days` table pour chaque jour
  3. Insère dans `trip_activities` table pour chaque activité
  4. Redirect vers `/trip/[newId]`
- Bouton "Modifier les préférences" → reset step 1

```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ItineraryView from '@/components/ItineraryView';
import {
  Sparkles, DollarSign, Clock, Heart, ChevronRight, Save, Loader2
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

// Réutiliser exactement la même logique que TripGenerator.tsx
// (mêmes INTERESTS, mêmes TRANSPORT_OPTIONS, même UI multi-step)
// + ajouter logique sauvegarde Supabase

// FONCTION SAVE TRIP
async function saveTrip(userId: string, trip: any, input: any): Promise<string | null> {
  // 1. Insert trip
  const coverImage = trip.days?.[0]?.hotel?.image ?? null;
  const { data: tripRow, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      title: trip.title,
      summary: trip.summary,
      duration: input.duration,
      budget: input.budget,
      total_cost: trip.totalCost,
      interests: input.interests,
      highlights: trip.highlights,
      status: 'saved',
      cover_image: coverImage,
      preferences: input.preferences ?? {},
      trip_data: trip,
    })
    .select()
    .single();

  if (tripError || !tripRow) return null;

  // 2. Insert trip_days + activities
  for (const day of trip.days) {
    const { data: dayRow } = await supabase
      .from('trip_days')
      .insert({
        trip_id: tripRow.id,
        day_number: day.day,
        location: day.location,
        total_day_cost: day.totalDayCost,
        hotel_name: day.hotel?.name ?? null,
        hotel_price: day.hotel?.price ?? null,
        hotel_stars: day.hotel?.stars ?? null,
        hotel_image: day.hotel?.image ?? null,
      })
      .select()
      .single();

    if (!dayRow) continue;

    if (day.activities?.length) {
      await supabase.from('trip_activities').insert(
        day.activities.map((act: any, idx: number) => ({
          trip_day_id: dayRow.id,
          time_slot: act.time,
          title: act.title,
          description: act.description,
          activity_type: act.type,
          price: act.price,
          location: act.location ?? day.location,
          sort_order: idx,
        }))
      );
    }
  }

  return tripRow.id;
}

export default function NewTripPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { format } = useCurrency();
  const [generatedTrip, setGeneratedTrip] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Redirect if not auth
  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/trip/new');
  }, [user, authLoading]);

  // [Copier ici tout le state et la logique de TripGenerator.tsx]
  // budget, duration, selectedInterests, includeWorkshops, transportPreference,
  // wantsGuide, extraPreferences, loading, step
  // + function generateTrip()
  // + tout le JSX du TripGenerator

  const handleSave = async () => {
    if (!user || !generatedTrip) return;
    setSaving(true);
    const id = await saveTrip(user.id, generatedTrip, {
      budget,
      duration,
      interests: selectedInterests,
      preferences: { includeWorkshops, transportPreference, wantsGuide, notes: extraPreferences },
    });
    setSaving(false);
    if (id) router.push(`/trip/${id}`);
  };

  // Dans l'étape 4 (success), ajouter sous le message "Votre itinéraire est prêt !":
  // <button onClick={handleSave} className="btn-primary flex items-center gap-2">
  //   {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
  //   {saving ? 'Sauvegarde…' : 'Sauvegarder ce voyage'}
  // </button>

  // [RESTE DU JSX identique à TripGenerator.tsx]
}
```

---

## PARTIE 8 — PAGE DÉTAIL VOYAGE

### Fichier à créer : `app/trip/[id]/page.tsx`

**Comportement :**
- Charge le voyage depuis Supabase via `trip.trip_data` (le JSON complet sauvegardé)
- Réutilise le composant `ItineraryView` existant
- Header avec : titre, bouton retour vers `/profile`, bouton "Supprimer"
- Breadcrumb : Accueil > Profil > Ce voyage

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ItineraryView from '@/components/ItineraryView';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import type { Trip } from '@/lib/supabase';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    const fetchTrip = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', params.id)
        .single();
      if (error || !data) {
        setError('Voyage introuvable.');
      } else {
        setTrip(data);
      }
      setLoading(false);
    };
    if (user) fetchTrip();
  }, [user, params.id]);

  const handleDelete = async () => {
    if (!trip || !confirm('Supprimer définitivement ce voyage ?')) return;
    await supabase.from('trips').delete().eq('id', trip.id);
    router.push('/profile');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-terracotta-500" size={32} />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-body text-midnight/60">{error || 'Voyage introuvable.'}</p>
        <Link href="/profile" className="btn-secondary">← Retour au profil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      {/* Header */}
      <div className="px-6 max-w-7xl mx-auto mb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-body text-midnight/40 mb-6">
          <Link href="/" className="hover:text-midnight/70 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/profile" className="hover:text-midnight/70 transition-colors">Profil</Link>
          <span>/</span>
          <span className="text-midnight/70 truncate max-w-[200px]">{trip.title}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2.5 rounded-full border border-sand-200 text-midnight/50 hover:text-midnight transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-display text-2xl md:text-3xl font-light text-midnight">{trip.title}</h1>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-sm font-body text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-4 py-2 rounded-full transition-all"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>

      {/* Itinerary */}
      {trip.trip_data && <ItineraryView trip={trip.trip_data} />}
    </div>
  );
}
```

---

## PARTIE 9 — MODIFICATION PAGE D'ACCUEIL

### Dans `app/page.tsx`, modifier la section TripGenerator :

**Remplacer** le composant `<TripGenerator onTripGenerated={setGeneratedTrip} />` par une section **statique** qui présente un exemple de voyage pré-généré avec un CTA.

```tsx
{/* Section "Votre voyage, personnalisé" — STATIQUE avec CTA */}
<div className="bg-sand-50/50 border-y border-sand-200/50">
  <section id="trip" className="py-24 px-6">
    <div className="max-w-5xl mx-auto">
      {/* Header identique au TripGenerator */}
      <motion.div
        initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 text-terracotta-600 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Sparkles size={14} /> Propulsé par l'Intelligence Artificielle
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-light text-midnight mb-5">
          Votre voyage,<span className="text-terracotta-500 italic"> personnalisé</span>
        </h2>
        <p className="font-body text-lg text-midnight/60 max-w-xl mx-auto mb-10">
          Décrivez vos envies, notre IA compose un itinéraire sur mesure adapté à votre budget et vos intérêts.
        </p>
      </motion.div>

      {/* Exemple de plan statique (aperçu visuel) */}
      <motion.div
        initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
        className="bg-white rounded-5xl shadow-xl border border-sand-100 overflow-hidden mb-10 p-8 md:p-12"
      >
        {/* Mini preview d'un itinéraire 3 jours */}
        <div className="flex items-center gap-3 mb-8">
          <div className="tag">Exemple — 3 jours à Tunis & Djerba</div>
          <div className="tag bg-olive-50 text-olive-700">Budget: 1 800 DT</div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              day: 1, city: 'Tunis', emoji: '🏛️',
              activities: ['Médina & Zitouna', 'Déjeuner Dar El Jeld', 'Bardo Museum'],
              hotel: 'La Maison Blanche ★★★★★',
            },
            {
              day: 2, city: 'Carthage', emoji: '🏺',
              activities: ['Sites antiques', 'Sidi Bou Saïd', 'Atelier poterie'],
              hotel: 'Hotel Majestic Tunis ★★★★',
            },
            {
              day: 3, city: 'Djerba', emoji: '🏖️',
              activities: ['Houmt Souk', 'Plage Sidi Mahrez', 'Dîner Dar Jerba'],
              hotel: 'Hasdrubal Thalassa ★★★★★',
            },
          ].map((day) => (
            <div key={day.day} className="bg-sand-50 rounded-3xl p-5 border border-sand-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-terracotta-500 rounded-full flex items-center justify-center text-white font-display font-bold text-sm">
                  {day.day}
                </div>
                <div>
                  <span className="text-lg">{day.emoji}</span>
                  <span className="font-display font-medium text-midnight ml-1">{day.city}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {day.activities.map(act => (
                  <li key={act} className="flex items-start gap-2 font-body text-xs text-midnight/70">
                    <span className="text-terracotta-400 mt-0.5">✦</span> {act}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-sand-200">
                <p className="font-body text-xs text-midnight/40">{day.hotel}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Blur overlay + CTA */}
        <div className="relative mt-6">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent rounded-3xl z-10 flex flex-col items-center justify-end pb-8 gap-4">
            <p className="font-body text-midnight/60 text-sm text-center max-w-sm">
              Créez un compte pour générer votre propre itinéraire personnalisé.
            </p>
            <Link href="/login" className="btn-primary flex items-center gap-2 text-sm px-8">
              <Sparkles size={15} /> Créer mon propre voyage
            </Link>
          </div>
          {/* Fake blurred content */}
          <div className="blur-sm pointer-events-none">
            <div className="h-20 bg-sand-100 rounded-2xl mb-3" />
            <div className="h-16 bg-sand-50 rounded-2xl" />
          </div>
        </div>
      </motion.div>
    </div>
  </section>
</div>
```

Supprimer aussi le state `generatedTrip` et le `<ItineraryView>` conditionnel de la page d'accueil (ils ne sont plus utilisés).

---

## PARTIE 10 — MODIFICATION NAVBAR

### Dans `components/Navbar.tsx` :

- Importer `useAuth` 
- Ajouter dans les liens de navigation desktop :
  - Si connecté : afficher avatar initiales + lien `/profile`, remplacer "Créer mon voyage" par "Mon profil"
  - Si non connecté : garder le bouton "Créer mon voyage" qui redirige vers `/login`
- Mettre à jour aussi les liens mobiles

```tsx
// Dans Navbar.tsx, ajouter:
import { useAuth } from '@/context/AuthContext';
// ...

const { user, profile } = useAuth();

// Dans le JSX desktop (remplacer le bloc "Right Actions") :
<div className="hidden md:flex items-center gap-4">
  <CurrencySwitcher />
  {user ? (
    <Link href="/profile" className="flex items-center gap-2 bg-sand-100 hover:bg-sand-200 px-4 py-2.5 rounded-full transition-colors">
      <div className="w-7 h-7 rounded-full bg-terracotta-500 flex items-center justify-center">
        <span className="text-white text-xs font-display font-bold">
          {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
        </span>
      </div>
      <span className="font-body text-sm font-semibold text-midnight">
        {profile?.full_name?.split(' ')[0] ?? 'Profil'}
      </span>
    </Link>
  ) : (
    <Link href="/login" className="btn-primary text-sm py-2.5 px-5">
      Créer mon voyage
    </Link>
  )}
</div>

// Mettre à jour aussi navLinks pour ajouter Trip:
const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/explore', label: 'Explorer' },
  { href: '/trip/new', label: 'Planifier' },
];
```

---

## PARTIE 11 — ROUTE API SAVE TRIP (optionnel server-side)

### Fichier à créer : `app/api/trips/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { trip, input } = body;

  // Insert trip
  const { data: tripRow, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      title: trip.title,
      summary: trip.summary,
      duration: input.duration,
      budget: input.budget,
      total_cost: trip.totalCost,
      interests: input.interests,
      highlights: trip.highlights,
      status: 'saved',
      cover_image: trip.days?.[0]?.hotel?.image ?? null,
      preferences: input.preferences ?? {},
      trip_data: trip,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: tripRow.id });
}
```

---

## PARTIE 12 — SEED PLACES (script optionnel)

### Fichier à créer : `scripts/seedPlaces.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import placesData from '../data/places.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key pour bypass RLS
);

async function seed() {
  const places = placesData.map(p => ({
    id: p.id,
    name: p.name,
    city: p.city,
    category: p.category,
    description: p.description,
    image: p.image,
    tags: p.tags,
    rating: p.rating,
    price_per_night: p.pricePerNight,
    lat: p.lat,
    lng: p.lng,
  }));

  const { error } = await supabase.from('places').upsert(places);
  if (error) console.error('Seed error:', error);
  else console.log(`✅ Seeded ${places.length} places`);
}

seed();
```

Pour lancer : `npx tsx scripts/seedPlaces.ts`

---

## PARTIE 13 — FICHIERS À MODIFIER / CRÉER — RÉCAPITULATIF

```
hkeyetna/
├── supabase/
│   └── migrations/
│       └── 001_initial.sql          ← CRÉER
├── scripts/
│   └── seedPlaces.ts                ← CRÉER (optionnel)
├── lib/
│   ├── supabase.ts                  ← CRÉER
│   └── supabaseServer.ts            ← CRÉER
├── context/
│   └── AuthContext.tsx              ← CRÉER
├── app/
│   ├── layout.tsx                   ← MODIFIER (ajouter AuthProvider)
│   ├── page.tsx                     ← MODIFIER (section voyage statique + CTA)
│   ├── login/
│   │   └── page.tsx                 ← CRÉER
│   ├── profile/
│   │   └── page.tsx                 ← CRÉER
│   ├── trip/
│   │   ├── new/
│   │   │   └── page.tsx             ← CRÉER
│   │   └── [id]/
│   │       └── page.tsx             ← CRÉER
│   └── api/
│       └── trips/
│           └── route.ts             ← CRÉER
├── components/
│   └── Navbar.tsx                   ← MODIFIER (auth-aware)
└── .env.example                     ← MODIFIER (ajouter Supabase vars)
```

---

## PARTIE 14 — NOTES IMPORTANTES

### Design à respecter absolument :
- **Toutes** les nouvelles pages doivent utiliser les classes CSS existantes : `font-display`, `font-body`, `btn-primary`, `btn-secondary`, `card`, `surface-card`, `tag`, `section-title`
- Couleurs : `terracotta-*`, `sand-*`, `olive-*`, `midnight`
- Radius : toujours `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, `rounded-5xl`
- Animations : Framer Motion avec `initial={false}` + `whileInView` + `viewport={{ once: true }}`
- Padding top des pages : `pt-28` pour tenir compte de la navbar fixed

### Gestion d'erreur Auth :
- Toujours vérifier `authLoading` avant de redirect (éviter flash de redirect)
- Pattern : `if (!authLoading && !user) router.push('/login')`

### Supabase URL de redirect :
- Dans `supabase/config.toml` ou le dashboard Supabase, ajouter `http://localhost:3000/**` aux redirect URLs autorisées.

### Variables d'env requises :
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
# Pour le script seed uniquement:
SUPABASE_SERVICE_ROLE_KEY=...
```

### Installation dépendances :
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## OBJECTIF FINAL

Quand tout est implémenté, le flow utilisateur sera :

1. L'utilisateur arrive sur `/` → voit la section "Votre voyage personnalisé" **statique** avec un aperçu d'exemple
2. Il clique "Créer mon propre voyage" → redirigé vers `/login`
3. Il se connecte / crée un compte
4. Redirigé vers `/profile` → voit ses voyages (vide au début)
5. Clique "Nouveau voyage" → va sur `/trip/new`
6. Remplit le wizard (budget, durée, intérêts, préférences)
7. L'IA Gemini génère l'itinéraire → affiché avec `ItineraryView`
8. Il clique "💾 Sauvegarder" → sauvegardé en BDD → redirigé vers `/trip/[id]`
9. Dans `/trip/[id]` : il voit son voyage en détail, peut le supprimer
10. Dans `/profile` : il retrouve tous ses voyages sauvegardés
