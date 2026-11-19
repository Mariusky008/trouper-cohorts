/**
 * 💬 LA QUESTION DU JOUR, EN VISITE (`docs/univers/ma-maison.md`, section 19 ; le lot M5, deuxième partie). Les
 * maquettes : « la question du jour — sa réponse se découvre après la sienne ».
 *
 * Chez un proche qui a répondu à sa question du jour (lot 2a, `connaitre-serveur.ts`), le visiteur la voit ; il y répond
 * à son tour, et seulement alors il découvre la réponse de son hôte. L'hôte, chez lui, voit qui lui a répondu et quoi
 * (« 💬 Sam a répondu à ta question du jour »). Entre proches seulement ; une réponse par visiteur et par jour (la
 * nouvelle remplace l'ancienne). `<habitant>/ma-piece/reponses/<jour>.json` = { cle, reponses: [{ de, texte, le }] }.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { questionDuJourDe } from "./connaitre-serveur";
import { REPONSE_JOUR_MAX, type QuestionVue } from "./connaitre";
import { ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { motPasse } from "./rituel-serveur";
import { hDeCle, seParlent } from "./talkie-serveur";
import type { QuestionChezLui, QuestionChezMoi } from "./ma-maison";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const cheminReponses = (h: string, jour: string) => `${h}/ma-piece/reponses/${jour}.json`;
type Reponse = { de: string; texte: string; le: string };
type Fiche = { cle?: string; reponses?: Reponse[] };

/** Sa question du jour, s'il y a répondu aujourd'hui (sinon rien à montrer à ses visiteurs). */
async function saQuestion(supabase: Supabase, h: string): Promise<QuestionVue | null> {
  const q = await questionDuJourDe(supabase, { id: h } as Habitant).catch(() => null);
  return q?.reponse ? q : null;
}
async function lesReponses(supabase: Supabase, h: string, cle: string): Promise<Reponse[]> {
  const f = await lireJson<Fiche>(supabase, cheminReponses(h, jourParis())).catch(() => ({}) as Fiche);
  return f.cle === cle && Array.isArray(f.reponses) ? f.reponses.filter((r) => s(r?.de) && s(r?.texte)) : [];
}

/** 💬 Chez lui, pour ce visiteur (un proche) : sa question ; la réponse du visiteur ; la sienne, une fois que le visiteur a répondu. */
export async function questionChezLui(supabase: Supabase, h: string, visiteur: string): Promise<QuestionChezLui | null> {
  const q = await saQuestion(supabase, h);
  if (!q) return null;
  const mienne = (await lesReponses(supabase, h, q.cle)).find((r) => r.de === visiteur);
  return { cle: q.cle, q: q.q, ...(q.choix ? { choix: [...q.choix] } : {}), ...(mienne ? { maReponse: mienne.texte, saReponse: q.reponse } : {}) };
}

/** 💬 Il répond à la question du jour de son proche (`cle` : la clé de profil de l'hôte). */
export async function repondreChezLui(supabase: Supabase, visiteur: Habitant, cle: unknown, texte: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const h = await hDeCle(supabase, cle);
  if (!h || h === visiteur.id) return { error: "Cette maison n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, visiteur.id, h))) return { error: "La question du jour, c’est entre proches.", statut: 403 };
  const q = await saQuestion(supabase, h);
  if (!q) return { error: "Pas de question aujourd’hui.", statut: 404 };
  const t = s(texte).replace(/\s+/g, " ");
  if (!t) return { error: "Réponds en quelques mots 🙂", statut: 400 };
  if (q.choix && !q.choix.includes(t)) return { error: "Choisis une des réponses.", statut: 400 };
  if (t.length > REPONSE_JOUR_MAX) return { error: `${REPONSE_JOUR_MAX} caractères au plus.`, statut: 400 };
  if (/https?:|www\./i.test(t) || !motPasse(t)) return { error: "Ces mots ne passent pas : écris autre chose 🙂", statut: 400 };
  const avant = (await lesReponses(supabase, h, q.cle)).filter((r) => r.de !== visiteur.id);
  await ecrireJson(supabase, cheminReponses(h, jourParis()), { cle: q.cle, reponses: [...avant, { de: visiteur.id, texte: t, le: new Date().toISOString() }].slice(-50) });
  return { ok: true };
}

/** 💬 Chez moi : ma question du jour, et ce que mes proches y ont répondu (les plus récents d'abord). */
export async function questionChezMoi(supabase: Supabase, h: string): Promise<QuestionChezMoi | null> {
  const q = await saQuestion(supabase, h);
  if (!q) return null;
  const rep = await lesReponses(supabase, h, q.cle);
  if (!rep.length) return null;
  const prenoms = await Promise.all(rep.map(async (r) => s((await lireLigne(supabase, r.de)).ligne?.prenom) || "Quelqu’un"));
  return { q: q.q, reponses: rep.map((r, i) => ({ de: prenoms[i], texte: r.texte, le: r.le })).sort((a, b) => b.le.localeCompare(a.le)) };
}
