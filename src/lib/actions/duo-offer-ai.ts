"use server";

import { OpenAI } from "openai";

type DuoScript = {
  min_1_2: string;
  min_3_4: string;
  min_5: string;
};

type DuoOfferIdea = {
  nom_offre: string;
  valeur_ajoutee: string;
  description_projet: string;
  format_offre: string;
  script_appel: DuoScript;
  angles: string[];
};

type DuoProfileInput = {
  user_id?: string;
  trade?: string | null;
  offer_title?: string | null;
  offer_description?: string | null;
  city?: string | null;
};

const normalizeText = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : fallback;
};

const normalizeScript = (value: unknown): DuoScript => {
  const source = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return {
    min_1_2: normalizeText(source.min_1_2, "Présentation rapide et angle commun."),
    min_3_4: normalizeText(source.min_3_4, "Choisir un client cible prioritaire et un test terrain."),
    min_5: normalizeText(source.min_5, "Décider Go/No-Go et fixer l’action dans 24h."),
  };
};

const normalizeAngles = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 3);
};

const parseIdea = (content: string): DuoOfferIdea => {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  return {
    nom_offre: normalizeText(parsed.nom_offre, "Pack Duo Business"),
    valeur_ajoutee: normalizeText(parsed.valeur_ajoutee, "Une offre commune plus rapide à vendre qu’une offre séparée."),
    description_projet: normalizeText(
      parsed.description_projet,
      "Offre hybride prête à tester immédiatement sur un client local."
    ),
    format_offre: normalizeText(parsed.format_offre, "Pack duo"),
    script_appel: normalizeScript(parsed.script_appel),
    angles: normalizeAngles(parsed.angles),
  };
};

async function generateOneIdea(openai: OpenAI, payload: {
  city: string;
  userA: { metier: string; competences: string; cible: string };
  userB: { metier: string; competences: string; cible: string };
}): Promise<DuoOfferIdea | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Tu es un Senior Business Strategist et Growth Hacker local. Style direct, cash, pragmatique. Évite le jargon. Propose une offre réalisable immédiatement.",
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction:
            "Crée une offre commune ultra-pertinente pour ces deux professionnels et réponds uniquement en JSON avec: nom_offre, valeur_ajoutee, description_projet, format_offre, script_appel{min_1_2,min_3_4,min_5}, angles(array max 3).",
          contexte_geographique: payload.city,
          utilisateur_A: payload.userA,
          utilisateur_B: payload.userB,
          contraintes: [
            "Identifier un pain point commun",
            "Combiner les 2 expertises dans une offre hybride",
            "Orienté action immédiate",
          ],
        }),
      },
      {
        role: "assistant",
        content: JSON.stringify({
          nom_offre: "Pack Vitrine qui Convertit",
          valeur_ajoutee: "Le client obtient une image pro ET des textes qui vendent, sans gérer deux prestataires.",
          description_projet: "Photographe + Copywriter créent une page vitrine locale prête à publier en 5 jours.",
          format_offre: "Sprint 5 jours",
          script_appel: {
            min_1_2: "Rappel rapide des forces de chacun et du résultat visé pour le client.",
            min_3_4: "Choisir un client test local précis et répartir les tâches livrables.",
            min_5: "Décider Go/No-Go et fixer un message commercial envoyé dans la journée.",
          },
          angles: [
            "Un seul interlocuteur pour un résultat complet",
            "Délai court et livrable concret",
            "Impact direct sur la conversion locale",
          ],
        }),
      },
      {
        role: "assistant",
        content: JSON.stringify({
          nom_offre: "Audit Visibilité & Closing",
          valeur_ajoutee: "Le client sait exactement quoi corriger et comment signer plus vite.",
          description_projet: "Consultant SEO + closer B2B livrent un diagnostic actionnable et un script de vente sur-mesure.",
          format_offre: "Audit express",
          script_appel: {
            min_1_2: "Aligner la promesse de l’offre et l’objectif cash pour le client cible.",
            min_3_4: "Identifier un prospect local prioritaire et le plan de contact immédiat.",
            min_5: "Valider le test terrain sur 7 jours avec métrique simple.",
          },
          angles: [
            "Mesure claire avant/après",
            "Action commerciale immédiate",
            "Complémentarité acquisition + conversion",
          ],
        }),
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) return null;
  return parseIdea(content);
}

export async function generateDuoOfferIdeas(params: {
  currentUserOffer: DuoProfileInput | null;
  duoCandidates: DuoProfileInput[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return {};

  const openai = new OpenAI({ apiKey });
  const city = params.currentUserOffer?.city || "Dax, Landes";
  const userA = {
    metier: params.currentUserOffer?.trade || "Entrepreneur",
    competences: params.currentUserOffer?.offer_title || params.currentUserOffer?.offer_description || "Accompagnement business",
    cible: params.currentUserOffer?.city ? `PME locales à ${params.currentUserOffer.city}` : "PME locales",
  };

  const candidates = (params.duoCandidates || []).slice(0, 4);
  const ideas = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const idea = await generateOneIdea(openai, {
          city: candidate?.city || city,
          userA,
          userB: {
            metier: candidate?.trade || "Expert métier",
            competences: candidate?.offer_title || candidate?.offer_description || "Expertise opérationnelle",
            cible: candidate?.city ? `Clients à ${candidate.city}` : "Clients locaux",
          },
        });
        if (!idea) return null;
        return { partnerId: candidate.user_id, idea };
      } catch {
        return null;
      }
    })
  );

  return ideas.reduce((acc: Record<string, DuoOfferIdea>, item) => {
    if (!item?.partnerId || !item.idea) return acc;
    acc[item.partnerId] = item.idea;
    return acc;
  }, {});
}
