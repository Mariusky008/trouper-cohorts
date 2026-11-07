/**
 * 🧠 MIEUX LE CONNAÎTRE, CÔTÉ SERVEUR — voir `connaitre.ts` (le lot 2). Tout passe par son journal
 * (`journal-serveur.ts`, sur Supabase) : la question du jour s'y écrit, « ce que ta figurine sait de toi » le lit, et
 * il peut l'effacer (une chose, ou tout).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { motInterdit } from "./mots-interdits";
import { GOUTS, reponsesEnMots, reponsesValides } from "./personnage";
import { cheminCarte, ecrire, lire, type Gardee } from "./personnage-serveur";
import { oublierDansLeCarnet, retenirCeQuIlDit, toutOublierDansLeCarnet } from "./ce-qu-il-a-dit-serveur";
import { effacerDuJournal, effacerToutLeJournal, noterAuJournal, toutLeJournal } from "./journal-serveur";
import { REPONSE_JOUR_MAX, questionDe, questionDuJour, type ChoseSue, type QuestionVue, type Savoir } from "./connaitre";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const jourParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
// (le petit mot du jour, qui annonçait la rencontre du jour, est parti avec « Rencontres » le 7 novembre 2026 ; ce
// fichier ne sert plus qu'à être vidé quand il efface tout)
const cheminMot = (h: string) => `${h}/mot-du-jour.json`;

/** Ni lien, ni adresse e-mail, ni numéro, ni autre messagerie dans ce qu'il dit de lui. */
function texteRefuse(texte: string): string | null {
  if (/https?:|www\.|\.(?:com|fr|net|org|io|me)\b/i.test(texte)) return "Pas de lien ici.";
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(texte)) return "Pas d’adresse e-mail ici.";
  if ((texte.match(/\d/g) ?? []).length >= 8) return "Pas de numéro ici.";
  if (/\b(?:insta(?:gram)?|snap(?:chat)?|whats ?app|telegram|tiktok|facebook|messenger)\b/i.test(texte)) return "Pas d’autre messagerie ici.";
  return null;
}

// ─── la question du jour ─────────────────────────────────────────────────────────────────────────
/** Sa question du jour (jamais une déjà répondue), et sa réponse s'il l'a déjà donnée aujourd'hui. */
export async function questionDuJourDe(supabase: Supabase, habitant: Habitant): Promise<QuestionVue> {
  const jour = jourParis();
  const journal = await toutLeJournal(supabase, habitant.id);
  const questions = journal.filter((e) => e.type === "question");
  // (aujourd'hui, il a déjà répondu : la même question, avec sa réponse)
  const dAujourdhui = questions.find((e) => jourParis(new Date(e.le)) === jour);
  if (dAujourdhui && dAujourdhui.type === "question") {
    const q = questionDe(dAujourdhui.cle);
    if (q) return { ...q, reponse: dAujourdhui.texte };
  }
  return questionDuJour(habitant.id, jour, questions.map((e) => (e.type === "question" ? e.cle : "")));
}

/** Sa réponse à la question du jour : gardée au journal, et dans ce qu'il a dit de lui (`ce-qu-il-a-dit-serveur.ts`). */
export async function repondreALaQuestion(supabase: Supabase, habitant: Habitant, cle: unknown, texte: unknown): Promise<{ question?: QuestionVue; error?: string; statut?: number }> {
  const actuelle = await questionDuJourDe(supabase, habitant);
  if (s(cle) !== actuelle.cle) return { error: "Cette question n'est plus celle du jour : recharge la page.", statut: 409 };
  const t = s(texte).replace(/\s+/g, " ");
  if (!t) return { error: "Réponds en quelques mots 🙂", statut: 400 };
  if (actuelle.choix && !actuelle.choix.includes(t)) return { error: "Choisis une des réponses.", statut: 400 };
  if (t.length > REPONSE_JOUR_MAX) return { error: `${REPONSE_JOUR_MAX} caractères au plus.`, statut: 400 };
  const refus = texteRefuse(t) ?? (motInterdit(t) ? "Ce mot n'a pas sa place ici." : null);
  if (refus) return { error: refus, statut: 400 };
  // (il change d'avis dans la journée : sa réponse d'avant s'efface)
  if (actuelle.reponse) {
    const journal = await toutLeJournal(supabase, habitant.id);
    const avant = journal.find((e) => e.type === "question" && e.cle === actuelle.cle && jourParis(new Date(e.le)) === jourParis());
    if (avant) await effacerDuJournal(supabase, habitant.id, avant.le);
  }
  await noterAuJournal(supabase, habitant.id, { type: "question", le: new Date().toISOString(), cle: actuelle.cle, question: actuelle.q, texte: t });
  await retenirCeQuIlDit(supabase, habitant.id, actuelle.q, t);
  return { question: { ...actuelle, reponse: t } };
}

// ─── 🧠 ce que ta figurine sait de toi ───────────────────────────────────────────────────────────
/** Tout ce qu'elle a retenu : sa carte en mots, et le reste de son journal (les plus récentes d'abord). */
export async function savoirDe(supabase: Supabase, habitant: Habitant): Promise<Savoir> {
  const [carte, journal] = await Promise.all([lire<Gardee>(supabase, cheminCarte(habitant.id)), toutLeJournal(supabase, habitant.id)]);
  const choses: ChoseSue[] = [];
  const jugees = new Set<string>();
  for (const e of journal) {
    if (e.type === "question") choses.push({ le: e.le, type: "question", titre: e.question, texte: e.texte });
    else if (e.type === "reponse") choses.push({ le: e.le, type: "reponse", titre: e.question, texte: e.texte });
    else if (e.type === "revele") choses.push({ le: e.le, type: "revele", titre: `Avec ${e.avec}`, texte: e.texte });
    else if (e.type === "verdict" && !jugees.has(e.phrase)) {
      // (la plus récente compte : un avis retiré n'apparaît pas)
      jugees.add(e.phrase);
      if (e.verdict) choses.push({ le: e.le, type: "verdict", titre: e.verdict === "moi" ? "✅ C'est tout toi" : "🙅 Jamais de la vie", texte: e.phrase });
    }
    if (choses.length >= 200) break;
  }
  return {
    carte:
      carte && reponsesValides(carte.reponses)
        ? { reponses: reponsesEnMots(carte.reponses), gouts: (carte.gouts ?? []).map((g) => GOUTS.find((x) => x.cle === g)?.nom ?? g), phrase: s(carte.phrase) }
        : null,
    choses,
  };
}

/** 🗑️ Il efface une chose (son heure) : du journal, et de ce qu'il a dit de lui. */
export async function oublierUneChose(supabase: Supabase, habitant: Habitant, le: unknown): Promise<boolean> {
  const ote = await effacerDuJournal(supabase, habitant.id, s(le));
  if (!ote) return false;
  await oublierDansLeCarnet(supabase, habitant.id, ote);
  return true;
}

/** 🗑️ Il efface tout (sa carte et sa figurine restent : seulement ce qu'elle a appris de lui). */
export async function toutOublier(supabase: Supabase, habitant: Habitant): Promise<void> {
  await effacerToutLeJournal(supabase, habitant.id);
  await toutOublierDansLeCarnet(supabase, habitant.id);
  await ecrire(supabase, cheminMot(habitant.id), {});
}
