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
    console.log("🚀 AI Coach API Request received");
    
    // 1. Vérifier la clé API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("❌ Fatal: OPENAI_API_KEY is missing in environment variables");
        return new Response(JSON.stringify({ error: 'Configuration Error: Missing API Key' }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
    console.log("✅ API Key found (starts with:", apiKey.substring(0, 7) + "...)");

    // 2. Parser le body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        console.error("❌ Failed to parse request body:", e);
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }
    
    const { messages, context } = body;
    console.log("📦 Request payload:", { 
        messageCount: messages?.length, 
        lastMessage: messages?.[messages.length - 1]?.content?.substring(0, 50),
        context 
    });

    // Construire le System Prompt Dynamique
    const isJobSeeker = context?.programType === 'job_seeker';
    
    const roleDefinition = isJobSeeker
        ? `Tu es le "Coach Popey", un Conseiller en Évolution Professionnelle expert, psychologue du travail et recruteur d'élite. 
           Ta mission est d'aider un chercheur d'emploi à retrouver confiance et à se positionner comme une offre de valeur, pas comme un demandeur.`
        : `Tu es le "Coach Popey", un Directeur Artistique et Sales Coach expert, impitoyable mais bienveillant.
           Ta mission est d'aider un entrepreneur à passer à l'action et à améliorer ses livrables.`;

    const toneDefinition = isJobSeeker
        ? `- Empathique mais ferme sur l'action.
           - Tu bannis le langage "Pôle Emploi" (lettre de motivation, attente).
           - Tu parles de "Proposition de Valeur", "Offre de Service", "Réseau".
           - Tu es rassurant sur les trous dans le CV, mais intransigeant sur la posture.`
        : `- Direct, concis, orienté action.
           - Pas de blabla corporatif ou de "Je suis un modèle de langage".
           - Tu critiques de manière constructive : "C'est mou", "Ça ne vend pas".`;

    const systemPrompt = `
      ${roleDefinition}
  
      CONTEXTE DU JOUR :
      - Jour : ${context?.day || 'Non défini'}
      - Mission : ${context?.mission || 'Non définie'}
      
      TON STYLE :
      ${toneDefinition}
      - Tu proposes toujours 2 ou 3 variantes concrètes quand on te demande de l'aide sur du texte.
      - Tu utilises le tutoiement professionnel.
  
      RÈGLES D'OR :
      1. Si l'utilisateur donne une excuse, recadre-le gentiment vers l'action.
      2. Si l'utilisateur soumet un contenu, analyse-le sous l'angle "Impact & Vente" (ou "Employabilité" pour le chercheur).
      3. Ne fais jamais le travail à sa place sans qu'il ait essayé d'abord.
    `;
  
    console.log("🤖 Calling OpenAI API...");
    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });
    
    console.log("✅ OpenAI stream created successfully");
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('🔥 CRITICAL AI COACH ERROR:', error);
    
    // Log plus détaillé de l'erreur OpenAI si disponible
    if (error.response) {
        console.error('OpenAI Response Status:', error.response.status);
        console.error('OpenAI Response Data:', await error.response.text().catch(() => 'No body'));
    }
    
    return new Response(JSON.stringify({ 
        error: 'Error processing AI request', 
        details: error.message 
    }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
