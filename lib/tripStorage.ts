import { supabase } from '@/lib/supabase';
import type { TripGeneratorInput } from '@/lib/tripTypes';

type BookingPayload = {
  paymentMethod: 'card' | 'paypal' | 'bank';
  travelerName: string;
  travelerEmail: string;
  notes?: string;
};

type SaveTripParams = {
  userId: string;
  trip: any;
  input: TripGeneratorInput;
  status?: 'draft' | 'saved' | 'completed' | 'active' | 'archived';
  booking?: BookingPayload;
};

export async function saveTripRecord({
  userId,
  trip,
  input,
  status = 'saved',
  booking,
}: SaveTripParams): Promise<string | null> {
  const coverImage = trip.days?.[0]?.hotel?.image ?? trip.days?.[0]?.activities?.[0]?.image ?? null;
  const preferences = {
    ...input.preferences,
    startDate: input.startDate,
    endDate: input.endDate,
    regions: input.regions,
    selectedExperienceIds: input.selectedExperienceIds,
    booking: booking
      ? {
          ...booking,
          status: 'confirmed',
          bookedAt: new Date().toISOString(),
        }
      : undefined,
  };

  const tripPayload = booking
    ? {
        ...trip,
        booking: preferences.booking,
      }
    : trip;

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
      status,
      cover_image: coverImage,
      preferences,
      trip_data: tripPayload,
    })
    .select()
    .single();

  if (tripError || !tripRow) {
    return null;
  }

  for (const day of trip.days ?? []) {
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

    if (!dayRow || !day.activities?.length) {
      continue;
    }

    await supabase.from('trip_activities').insert(
      day.activities.map((activity: any, index: number) => ({
        trip_day_id: dayRow.id,
        time_slot: activity.time,
        title: activity.title,
        description: activity.description,
        activity_type: activity.type,
        price: activity.price,
        location: activity.location ?? day.location,
        sort_order: index,
      }))
    );
  }

  return tripRow.id;
}
