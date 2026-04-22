import { createClient as createSupabaseBrowserClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
export const createClientInstance = () => supabase;
export const createClient = () => supabase;

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  preferred_language: string;
  preferred_currency: 'TND' | 'EUR' | 'USD';
  created_at: string;
  updated_at?: string;
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
  status: 'draft' | 'saved' | 'completed' | 'active' | 'archived';
  is_public?: boolean;
  cover_image: string | null;
  start_city?: string | null;
  preferences: Record<string, any>;
  trip_data: any;
  created_at: string;
  updated_at: string;
}
