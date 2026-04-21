import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getTripModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { budget, duration, interests, startCity, preferences } = body;
    const safeInterests = Array.isArray(interests) ? interests : ['culture'];
    const includeWorkshops = Boolean(preferences?.includeWorkshops);
    const transportPreference =
      preferences?.transportPreference === 'has-transport'
        ? 'L\'utilisateur a déjà un moyen de transport'
        : preferences?.transportPreference === 'need-transport'
          ? 'L\'utilisateur veut des options de transport intégrées'
          : 'Aucune préférence particulière sur le transport';
    const wantsGuide = preferences?.wantsGuide === false ? 'Non' : 'Oui';
    const notes = typeof preferences?.notes === 'string' && preferences.notes.trim().length > 0
      ? preferences.notes.trim()
      : 'Aucune note supplémentaire';

    const prompt = `Tu es un expert en tourisme tunisien. Génère un itinéraire de voyage détaillé en Tunisie.

Paramètres du voyage :
- Budget total : ${budget} DT
- Durée : ${duration} jours
- Intérêts : ${safeInterests.join(', ')}
- Ville de départ : ${startCity || 'Tunis'}
- Workshops/ateliers : ${includeWorkshops ? 'Oui, inclure des ateliers immersifs' : 'Non, ateliers non prioritaires'}
- Transport : ${transportPreference}
- Guide local : ${wantsGuide}
- Préférences supplémentaires : ${notes}

Génère un itinéraire JSON structuré avec exactement ce format :
{
  "title": "Titre accrocheur du voyage",
  "summary": "Résumé poétique du voyage (2-3 phrases)",
  "days": [
    {
      "day": 1,
      "location": "Nom de la ville",
      "hotel": {
        "name": "Nom de l'hôtel",
        "price": 200,
        "stars": 4,
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80"
      },
      "activities": [
        {
          "time": "09:00",
          "title": "Nom de l'activité",
          "description": "Description courte",
          "type": "visite",
          "price": 50,
          "location": "Lieu précis"
        }
      ],
      "totalDayCost": 400
    }
  ],
  "totalCost": ${budget},
  "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"]
}

Les types d'activités possibles : "visite", "repas", "activité", "hébergement", "transport"
Inclus 4-5 activités par jour : petit-déjeuner, visite matinale, déjeuner, activité après-midi, dîner.
Utilise des vrais noms de lieux tunisiens, des prix réalistes en DT.
Contraintes :
- Si workshops = oui, inclure au moins un atelier (type "activité") pendant le séjour.
- Si transport = besoin de transport, inclure des activités de type "transport" (transferts/navettes).
- Si guide local = oui, mentionner explicitement au moins une activité guidée par jour.
Réponds UNIQUEMENT avec le JSON, aucune explication.`;

    const model = getTripModel();
    const message = await model.generateContent(prompt);

    // Extract JSON from response
    const text = message.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const trip = JSON.parse(jsonMatch[0]);
    return NextResponse.json(trip);
  } catch (error) {
    console.error('Trip generation error:', error);
    // Return fallback mock data
    const { buildMockTrip } = await import('@/lib/tripGenerator');
    const body = await request.json().catch(() => ({}));
    const fallback = buildMockTrip({
      budget: body.budget || 1500,
      duration: body.duration || 3,
      interests: body.interests || ['culture'],
      preferences: body.preferences,
    });
    return NextResponse.json(fallback);
  }
}
