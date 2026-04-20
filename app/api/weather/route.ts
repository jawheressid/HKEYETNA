import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/weather';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '36.8065');
  const lng = parseFloat(searchParams.get('lng') || '10.1815');

  try {
    const weather = await fetchWeather(lat, lng);
    return NextResponse.json(weather);
  } catch (error) {
    return NextResponse.json(
      { error: 'Impossible de récupérer la météo' },
      { status: 500 }
    );
  }
}
