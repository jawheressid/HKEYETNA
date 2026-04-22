export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          preferred_currency: 'TND' | 'EUR' | 'USD';
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string | null;
          total_cost: number | null;
          budget: number | null;
          duration: number | null;
          interests: string[] | null;
          start_city: string | null;
          highlights: string[] | null;
          status: 'active' | 'archived' | 'draft';
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      trip_days: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          location: string | null;
          hotel: Record<string, any> | null;
          activities: any[];
          total_day_cost: number;
          weather: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trip_days']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['trip_days']['Insert']>;
      };
      places: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          region: string | null;
          description: string | null;
          image: string | null;
          tags: string[] | null;
          rating: number | null;
          price_level: number | null;
          lat: number | null;
          lng: number | null;
          price_per_night: number | null;
          category: string | null;
          avg_temp: number | null;
          season: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['places']['Insert']>;
      };
      experiences: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          category: string | null;
          duration: string | null;
          price: number | null;
          rating: number | null;
          image: string | null;
          description: string | null;
          included: string[] | null;
          tags: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['experiences']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['experiences']['Insert']>;
      };
      saved_places: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saved_places']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};

// Convenient shorthand types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Trip = Database['public']['Tables']['trips']['Row'];
export type TripDay = Database['public']['Tables']['trip_days']['Row'];
export type Place = Database['public']['Tables']['places']['Row'];
export type Experience = Database['public']['Tables']['experiences']['Row'];

// Extended trip with days
export type TripWithDays = Trip & { trip_days: TripDay[] };
