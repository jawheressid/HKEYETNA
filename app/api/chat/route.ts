import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import experiencesData from '@/data/experiences.json';
import placesData from '@/data/places.json';
import { getTopRestaurants } from '@/lib/catalog';
import { normalizeText } from '@/lib/tripPlanner';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const getChatModel = (systemInstruction: string, modelName: string) => {
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
    systemInstruction,
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.65,
    },
  });
};

const formatHistory = (history: ChatMessage[] = []) =>
  history
    .slice(-10)
    .map((entry, index) => {
      const speaker = entry.role === 'assistant' ? 'Hayet' : 'Utilisateur';
      return `${index + 1}. ${speaker}: ${entry.content}`;
    })
    .join('\n');

const findMentionedPlace = (message: string) => {
  const normalizedMessage = normalizeText(message);

  return placesData.find((place) => {
    const entries = [place.city, place.region, place.name].map((value) => normalizeText(value));
    return entries.some((entry) => entry && normalizedMessage.includes(entry));
  });
};

const buildLocalCatalogReply = (message: string) => {
  const normalizedMessage = normalizeText(message);
  const place = findMentionedPlace(message);
  const city = place?.city;
  const region = place?.region;

  if (
    normalizedMessage.includes('restaurant') ||
    normalizedMessage.includes('manger') ||
    normalizedMessage.includes('diner') ||
    normalizedMessage.includes('déjeuner')
  ) {
    const restaurants = getTopRestaurants({ city, region, limit: 3 });
    if (restaurants.length > 0) {
      const intro = city
        ? `Voici 3 bonnes adresses à ${city} :`
        : region
          ? `Voici 3 bonnes adresses dans la région ${region} :`
          : 'Voici 3 bonnes adresses en Tunisie :';

      return `${intro} ${restaurants
        .map((restaurant) => `${restaurant.name} (${restaurant.averageTicket} DT, ${restaurant.specialties[0]})`)
        .join(' ; ')}.`;
    }
  }

  if (
    normalizedMessage.includes('activité') ||
    normalizedMessage.includes('que faire') ||
    normalizedMessage.includes('visite')
  ) {
    const experiences = experiencesData
      .filter((experience) => {
        if (city) {
          return normalizeText(experience.location) === normalizeText(city);
        }

        if (region) {
          return normalizeText(experience.region) === normalizeText(region);
        }

        return true;
      })
      .sort((left, right) => right.rating - left.rating)
      .slice(0, 3);

    if (experiences.length > 0) {
      return `Pour ${city || region || 'la Tunisie'}, je vous conseille ${experiences
        .map((experience) => `${experience.name} (${experience.price} DT)`)
        .join(', ')}.`;
    }
  }

  return null;
};

export async function POST(request: NextRequest) {
  let body:
    | {
        message: string;
        tripContext?: unknown;
        history?: ChatMessage[];
      }
    | null = null;

  try {
    body = await request.json() as {
      message: string;
      tripContext?: unknown;
      history?: ChatMessage[];
    };
    const { message, tripContext, history } = body;

    const systemPrompt = `Tu es Hayet, une assistante touristique IA spécialisée en Tunisie pour la plateforme HKEYETNA.

Tu es chaleureuse, enthousiaste et passionnée par la Tunisie. Tu réponds TOUJOURS en français.

${tripContext ? `Contexte du voyage actuel de l'utilisateur : ${JSON.stringify(tripContext)}` : ''}

Tu peux aider avec :
- Suggestions d'activités selon les intérêts et la météo
- Recommandations de restaurants et spécialités locales
- Conseils pratiques (transport, sécurité, monnaie)
- Alternatives en cas de mauvais temps
- Informations culturelles et historiques
- Ajustements d'itinéraire

Sois concise (2-4 phrases max par réponse), amicale et utilise occasionnellement des emojis pertinents.
Si l'utilisateur pose une question hors tourisme tunisien, redirige poliment vers ton domaine.`;

    const historyText = formatHistory(history);
    const prompt = `${historyText ? `Historique récent :\n${historyText}\n\n` : ''}Message utilisateur : ${message}\nRéponse de Hayet :`;

    const preferredModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    let reply = '';
    let lastModelError: unknown = null;

    for (const modelName of preferredModels) {
      try {
        const model = getChatModel(systemPrompt, modelName);
        const response = await model.generateContent(prompt);
        reply = response.response.text().trim();
        if (reply) {
          break;
        }
      } catch (error) {
        lastModelError = error;
      }
    }

    if (!reply) {
      reply = buildLocalCatalogReply(message) || '';
    }

    if (!reply) {
      throw lastModelError || new Error('No chatbot response produced');
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);

    const localReply = typeof body?.message === 'string' ? buildLocalCatalogReply(body.message) : null;
    const fallbackReplies = [
      'Je reste disponible pour vos questions sur la Tunisie. Par exemple: transport entre villes, meilleure saison par région, ou activités authentiques selon votre budget.',
      'Je peux vous proposer un mini-plan local (matin, midi, soir) pour Tunis, Djerba, Douz ou Kairouan. Dites-moi simplement la ville et le nombre de jours.',
      'Je peux aussi adapter vos activités selon la météo et votre style de voyage (famille, aventure, culture, gastronomie).',
    ];

    const reply = localReply || fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

    return NextResponse.json({
      reply,
      degraded: true,
    });
  }
}
