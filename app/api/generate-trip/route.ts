import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getExperiencesByIds } from '@/lib/tripPlanner';
import { buildMockTrip, hydrateGeneratedTrip } from '@/lib/tripGenerator';

const getTripModel = (modelName: string) => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API ||
    process.env.gemini_api;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  });
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  try {
    const { budget, duration, interests, startCity, startDate, endDate, regions, selectedExperienceIds, preferences } = body;
    const safeInterests = Array.isArray(interests) ? interests : ['culture'];
    const safeRegions = Array.isArray(regions) ? regions : [];
    const safeSelectedExperienceIds = Array.isArray(selectedExperienceIds) ? selectedExperienceIds : [];
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
    const selectedExperiences = getExperiencesByIds(safeSelectedExperienceIds);

    const prompt = `Tu es un expert en tourisme tunisien. Génère un itinéraire de voyage détaillé en Tunisie.

Paramètres du voyage :
- Budget total : ${budget} DT
- Durée : ${duration} jours
- Départ : ${startDate || 'date libre'}
- Retour : ${endDate || 'date libre'}
- Intérêts : ${safeInterests.join(', ')}
- Régions souhaitées : ${safeRegions.length > 0 ? safeRegions.join(', ') : 'aucune préférence régionale'}
- Ville de départ : ${startCity || 'Tunis'}
- Activités impératives choisies par l'utilisateur : ${selectedExperiences.length > 0 ? selectedExperiences.map((experience) => experience.name).join(', ') : 'aucune activité imposée'}
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
      "date": "${startDate || '2026-05-01'}",
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

Les types d'activités possibles : "visite", "repas", "activité", "hébergement", "transport".
Inclus 4-5 activités planifiées par jour avec horaires cohérents et villes réalistes.
Utilise des vrais noms de lieux tunisiens, des prix réalistes en DT et respecte les activités sélectionnées par l'utilisateur quand elles existent.
Contraintes :
- Si workshops = oui, inclure au moins un atelier (type "activité") pendant le séjour.
- Si transport = besoin de transport, inclure des activités de type "transport" (transferts/navettes).
- Si guide local = oui, mentionner explicitement au moins une activité guidée par jour.
- Si des régions sont précisées, concentre le voyage prioritairement sur ces régions.
- Si plusieurs régions sont choisies, garde la même région sur des jours successifs avant de passer à la suivante.
- Si des dates sont précisées, renseigne le champ "date" de chaque jour.
Réponds UNIQUEMENT avec le JSON, aucune explication.`;

    const preferredModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    let text = '';
    let lastError: unknown = null;

    for (const modelName of preferredModels) {
      try {
        const model = getTripModel(modelName);
        const message = await model.generateContent(prompt);
        text = message.response.text().trim();
        if (text) {
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!text) {
      throw lastError || new Error('No trip content produced');
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const trip = hydrateGeneratedTrip(JSON.parse(jsonMatch[0]), {
      budget: budget || 1500,
      duration: duration || 3,
      interests: safeInterests,
      startCity,
      startDate,
      endDate,
      regions: safeRegions,
      selectedExperienceIds: safeSelectedExperienceIds,
      preferences,
    });
    return NextResponse.json(trip);
  } catch (error) {
    console.error('Trip generation error:', error);
    const fallback = buildMockTrip({
      budget: body.budget || 1500,
      duration: body.duration || 3,
      interests: body.interests || ['culture'],
      startCity: body.startCity,
      startDate: body.startDate,
      endDate: body.endDate,
      regions: body.regions,
      selectedExperienceIds: body.selectedExperienceIds,
      preferences: body.preferences,
    });
    return NextResponse.json(fallback);
  }
}
