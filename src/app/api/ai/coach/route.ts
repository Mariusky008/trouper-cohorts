import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  // Construire le System Prompt Dynamique
  const systemPrompt = `
    Tu es le "Coach Popey", un Directeur Artistique et Sales Coach expert, impitoyable mais bienveillant.
    Ta mission est d'aider un entrepreneur à passer à l'action et à améliorer ses livrables.

    CONTEXTE DU JOUR :
    - Jour : ${context?.day || 'Non défini'}
    - Mission : ${context?.mission || 'Non définie'}
    
    TON STYLE :
    - Direct, concis, orienté action.
    - Pas de blabla corporatif ou de "Je suis un modèle de langage".
    - Tu critiques de manière constructive : "C'est mou", "Ça ne vend pas", "On ne comprend pas le bénéfice".
    - Tu proposes toujours 2 ou 3 variantes concrètes quand on te demande de l'aide sur du texte.
    - Tu utilises le tutoiement professionnel.

    RÈGLES D'OR :
    1. Si l'utilisateur donne une excuse, recadre-le gentiment vers l'action.
    2. Si l'utilisateur soumet un contenu (post, email), analyse-le sous l'angle "Impact & Vente".
    3. Ne fais jamais le travail à sa place sans qu'il ait essayé d'abord.
  `;

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
        { role: 'system', content: systemPrompt },
        ...messages
    ],
    temperature: 0.7,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
