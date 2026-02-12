import { OpenAI } from 'openai';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Create an OpenAI API client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'nodejs'; // Force Node.js runtime instead of edge for better stability

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    // Vérifier la clé API
    if (!process.env.OPENAI_API_KEY) {
        return new Response('Missing OPENAI_API_KEY', { status: 500 });
    }

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
  
    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });
  
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI Coach Error:', error);
    return new Response(JSON.stringify({ error: 'Error processing AI request' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
