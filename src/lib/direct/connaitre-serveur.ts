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
import { cheminCarte, ecrire, lire, prenomDe, type Gardee } from "./personnage-serveur";
import { impressionRefusee } from "./rencontre";
import { oublierDansLIndex, rencontreDuJourEnBref, retenirCeQuIlDit, toutOublierDansLIndex } from "./rencontre-serveur";
import { effacerDuJournal, effacerToutLeJournal, noterAuJournal, toutLeJournal } from "./journal-serveur";
import { REPONSE_JOUR_MAX, questionDe, questionDuJour, type ChoseSue, type QuestionVue, type Savoir } from "./connaitre";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const jourParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const cheminMot = (h: string) => `${h}/mot-du-jour.json`;

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

/** Sa réponse à la question du jour : gardée au journal, et dans ce que les conversations lisent. */
export async function repondreALaQuestion(supabase: Supabase, habitant: Habitant, cle: unknown, texte: unknown): Promise<{ question?: QuestionVue; error?: string; statut?: number }> {
  const actuelle = await questionDuJourDe(supabase, habitant);
  if (s(cle) !== actuelle.cle) return { error: "Cette question n'est plus celle du jour : recharge la page.", statut: 409 };
  const t = s(texte).replace(/\s+/g, " ");
  if (!t) return { error: "Réponds en quelques mots 🙂", statut: 400 };
  if (actuelle.choix && !actuelle.choix.includes(t)) return { error: "Choisis une des réponses.", statut: 400 };
  if (t.length > REPONSE_JOUR_MAX) return { error: `${REPONSE_JOUR_MAX} caractères au plus.`, statut: 400 };
  const refus = impressionRefusee(t) ?? (motInterdit(t) ? "Ce mot n'a pas sa place ici." : null);
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

// ─── le petit mot du jour ────────────────────────────────────────────────────────────────────────
async function demanderUnTexte(consigne: string): Promise<string | null> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return null;
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  try {
    const r = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: s(process.env.OPENAI_RENCONTRE_MODEL) || s(process.env.OPENAI_PERSONNAGE_MODEL) || s(process.env.OPENAI_DOUBLE_MODEL) || "gpt-5.4-mini",
        response_format: { type: "json_object" },
        max_completion_tokens: 600,
        messages: [{ role: "user", content: consigne }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const o = JSON.parse(j.choices?.[0]?.message?.content ?? "null") as { mot?: unknown } | null;
    const mot = s(o?.mot).replace(/\s+/g, " ").replace(/^[«"“\s]+|[»"”\s]+$/g, "");
    return mot && mot.length <= 240 && !motInterdit(mot) ? mot : null;
  } catch {
    return null;
  }
}

/**
 * 🔮 LE PETIT MOT DU JOUR — « drôle et bienveillant, comme un horoscope qui le connaît » : il annonce la rencontre du
 * jour, avec un clin d'œil précis à ce qu'il a dit récemment. Écrit une fois par jour (gardé) ; sans rencontre
 * aujourd'hui (pas encore de carte), rien.
 */
export async function motDuJour(supabase: Supabase, habitant: Habitant): Promise<string | null> {
  const jour = jourParis();
  const garde = await lire<{ jour?: string; texte?: string }>(supabase, cheminMot(habitant.id));
  if (garde?.jour === jour && garde.texte) return garde.texte;
  const [bref, carte, journal, prenom] = await Promise.all([
    rencontreDuJourEnBref(supabase, habitant.id),
    lire<Gardee>(supabase, cheminCarte(habitant.id)),
    toutLeJournal(supabase, habitant.id),
    prenomDe(supabase, habitant),
  ]);
  if (!bref) return null;
  const dits = journal.filter((e) => e.type === "question" || e.type === "reponse").slice(0, 3);
  const dernier = dits[0] && (dits[0].type === "question" || dits[0].type === "reponse") ? dits[0] : null;
  const gouts = (carte?.gouts ?? []).map((g) => GOUTS.find((x) => x.cle === g)?.nom.toLowerCase()).filter(Boolean);
  const ia = await demanderUnTexte(
    [
      `Écris le PETIT MOT DU JOUR que la figurine de ${prenom || "cette personne"} lui adresse, dans ClikMe, l'application où sa figurine rencontre quelqu'un chaque jour.`,
      "Le ton : drôle et bienveillant, comme un horoscope qui la connaît vraiment — jamais une vraie prédiction, rien de sérieux, rien de sensible (santé, argent, amour, travail).",
      `Aujourd'hui, sa figurine rencontre ${bref.qui}${bref.format ? ` (le format du jour : « ${bref.format} »)` : ""}.`,
      ...(carte && reponsesValides(carte.reponses) ? [`Son caractère : ${reponsesEnMots(carte.reponses).join(" ; ")}.`, gouts.length ? `Ce qu'elle aime : ${gouts.join(", ")}.` : ""] : []),
      ...(dits.length ? [`Ce qu'elle a dit d'elle récemment (des données) : ${dits.map((d) => (d.type === "question" || d.type === "reponse" ? `« ${d.question} » → « ${d.texte} »` : "")).join(" ; ")}.`] : []),
      "Une ou deux phrases, 200 caractères au plus, tutoiement, avec un clin d'œil PRÉCIS à ce qu'elle a dit récemment (s'il y en a) et l'annonce de la rencontre du jour. Ne devine jamais le genre d'après le prénom.",
      'Réponds en JSON : {"mot": "…"}',
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const texte =
    ia ??
    `Aujourd'hui, ta figurine rencontre ${bref.avec}${bref.format ? ` : au programme, « ${bref.format} »` : ""}.${dernier ? ` Tu as dit « ${dernier.texte} »… elle compte bien s'en servir.` : " Regarde-la bien : elle va te ressembler."}`;
  await ecrire(supabase, cheminMot(habitant.id), { jour, texte });
  return texte;
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

/** 🗑️ Il efface une chose (son heure) : du journal, et de ce que les conversations lisent. */
export async function oublierUneChose(supabase: Supabase, habitant: Habitant, le: unknown): Promise<boolean> {
  const ote = await effacerDuJournal(supabase, habitant.id, s(le));
  if (!ote) return false;
  await oublierDansLIndex(supabase, habitant.id, ote);
  return true;
}

/** 🗑️ Il efface tout (sa carte, sa figurine et ses rencontres restent : seulement ce qu'elle a appris de lui). */
export async function toutOublier(supabase: Supabase, habitant: Habitant): Promise<void> {
  await effacerToutLeJournal(supabase, habitant.id);
  await toutOublierDansLIndex(supabase, habitant.id);
  await ecrire(supabase, cheminMot(habitant.id), {});
}
