import type { TransportPreference } from '@/lib/tripPlanner';

export interface TripGeneratorInput {
  budget: number;
  duration: number;
  startDate: string;
  endDate: string;
  interests: string[];
  regions: string[];
  selectedExperienceIds: string[];
  preferences: {
    includeWorkshops: boolean;
    transportPreference: TransportPreference;
    wantsGuide: boolean;
    notes: string;
  };
}
