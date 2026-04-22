import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { trip, input } = body;

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
