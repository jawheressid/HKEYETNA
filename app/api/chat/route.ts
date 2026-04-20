import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const getChatModel = (systemInstruction: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction,
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.8,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
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

    const model = getChatModel(systemPrompt);
    const historyText = formatHistory(history);
    const prompt = `${historyText ? `Historique récent :\n${historyText}\n\n` : ''}Message utilisateur : ${message}\nRéponse de Hayet :`;

    const response = await model.generateContent(prompt);
    const reply = response.response.text().trim();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      reply: 'Désolée, je rencontre un petit souci technique. Essayez de me poser votre question autrement ! 😊',
    });
  }
}
