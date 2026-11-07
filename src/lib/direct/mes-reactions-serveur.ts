/**
 * ⚡ SES RÉACTIONS, CÔTÉ SERVEUR — voir `mes-reactions.ts` pour la règle.
 *
 * CHAQUE POSE, UNE FOIS : le moteur d'image (fidélité haute : il recopie SON visage) la fait à partir de sa figurine de
 * tous les jours, sur un FOND TRANSPARENT, et l'image est remise exactement dans le cadre d'origine (comme ses
 * expressions : en passant d'une pose à l'autre, elle ne saute pas). Rangée avec ses expressions
 * (`<habitant>/expr-<empreinte>/r-<pose>.webp`) : une nouvelle figurine, de nouvelles poses.
 *
 * Un verrou par pose (trois minutes : deux pages ouvertes ne paient pas deux fois) ; 12 poses par jour au plus.
 * La mesure : chaque envoi d'une réaction ou d'un gag est noté dans `clik_meme_evenement` (`r-<clé>`, « partage »).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { editer, poserAuFormat, reprendre } from "./figurine-expressions-serveur";
import { moteurBranche } from "./ma-figurine-fabrique-serveur";
import { depotDans, dossierExpressions, lireLigne, signer, telecharger } from "./ma-figurine-serveur";
import { GAGS, POSES, REACTIONS, poseValide, type ClePose, type MesReactions } from "./mes-reactions";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const jourParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const nomPose = (p: ClePose) => `r-${p}.webp`;
const nomVerrou = (p: ClePose) => `r-${p}.verrou.json`;
const DUREE_VERROU = 3 * 60_000;
const POSES_PAR_JOUR = 12;

/** Chaque pose, en anglais (c'est là que le moteur est le plus précis). */
const POSE: Record<ClePose, string> = {
  mdr: "its facial expression to a huge burst of LAUGHTER: eyes squeezed shut into happy crescents with little tears of laughter, cheeks pushed up, a wide open laughing mouth, head slightly tilted back",
  serieux: "its facial expression to an unimpressed, deadpan « seriously? » look: one eyebrow raised very high, eyelids half lowered, mouth flat and slightly twisted to one side",
  bravo: "its pose and expression: it is enthusiastically APPLAUDING, both hands clapping together in front of its chest, with a big proud smile",
  choque: "its facial expression to complete SHOCK: eyes wide open, eyebrows shot up, jaw dropped in a big round open mouth",
  bisou: "its pose and expression: it is BLOWING A KISS — lips puckered, one eye winking, one hand raised near the lips",
  grimace: "its facial expression to a funny GRIMACE: tongue sticking out, one eye squeezed shut, nose wrinkled, eyebrows going in opposite directions",
  amour: "its facial expression to being head over heels IN LOVE: dreamy, adoring eyes sparkling with little heart-shaped highlights, rosy blushing cheeks, a tender sweet smile",
  pouce: "its pose and expression: it gives a big THUMBS UP with one hand, with a confident smile and a wink",
  gene: "its facial expression to awkward EMBARRASSMENT: cheeks blushing bright red, eyes glancing sideways, a tight guilty sheepish grin, a little sweat drop on the forehead",
  eternue: "its facial expression to the instant just before a SNEEZE: eyes squeezed shut, nose wrinkled, head tilted back, mouth half open",
  dort: "its facial expression to being fast ASLEEP: eyes peacefully closed, mouth slightly open, head gently tilted to one side",
  hoquet: "its facial expression to being surprised by a HICCUP: eyes wide open, cheeks slightly puffed, mouth in a small tight round shape",
  seule: "nothing at all in the figurine itself: keep it exactly as it is",
};

const consigne = (p: ClePose) =>
  `This is a collectible bobblehead figurine. Change ONLY ${POSE[p]}. It must be readable at a glance, on THIS face (it must still be clearly the same person: same face shape, same hair, same outfit and accessories). ` +
  "Keep the same rendering style and materials, the same spring and base, the same camera framing: the figurine stays at exactly the same place and size in the image. " +
  "REMOVE THE BACKGROUND ENTIRELY: the figurine alone, with its spring and base, on a fully transparent background. No text, nothing added.";

async function dossierDe(supabase: Supabase, habitant: Habitant): Promise<{ dossier: string; neutre: string } | null> {
  const { ligne } = await lireLigne(supabase, habitant.id);
  if (!ligne?.prete_le || !s(ligne.neutre)) return null;
  return { dossier: dossierExpressions(habitant.id, s(ligne.neutre)), neutre: s(ligne.neutre) };
}

/** ⚡ Ses poses faites (adresses signées), sa figurine de tous les jours, et si le moteur peut en faire d'autres. */
export async function mesReactions(supabase: Supabase, habitant: Habitant | null): Promise<MesReactions | null> {
  if (!habitant) return null;
  const d = await dossierDe(supabase, habitant);
  if (!d) return null;
  const noms = await depotDans(supabase, d.dossier).lister();
  const poses: MesReactions["poses"] = {};
  await Promise.all(
    POSES.filter((p) => noms.includes(nomPose(p))).map(async (p) => {
      const u = await signer(supabase, `${d.dossier}/${nomPose(p)}`, 7200);
      if (u) poses[p] = u;
    }),
  );
  const enCours = POSES.filter((p) => !poses[p] && noms.includes(nomVerrou(p)));
  return { poses, moteur: moteurBranche(), neutre: await signer(supabase, d.neutre, 7200), enCours };
}

/** ⚡ UNE POSE, FAITE PAR LE MOTEUR (la première fois qu'il la touche) → son adresse signée. */
export async function fabriquerPose(supabase: Supabase, habitant: Habitant, cle: unknown, avant: number): Promise<{ url?: string; enCours?: boolean; error?: string; statut?: number }> {
  const p = poseValide(cle);
  if (!p) return { error: "Cette réaction n’existe pas.", statut: 400 };
  const d = await dossierDe(supabase, habitant);
  if (!d) return { error: "Ta figurine n’est pas encore prête.", statut: 400 };
  const depot = depotDans(supabase, d.dossier);
  const noms = await depot.lister();
  if (noms.includes(nomPose(p))) return { url: await signer(supabase, `${d.dossier}/${nomPose(p)}`, 7200) };
  if (!moteurBranche()) return { error: "Le moteur d’image n’est pas branché ici.", statut: 400 };
  // (le verrou : une autre page la fait déjà)
  if (noms.includes(nomVerrou(p))) {
    const v = JSON.parse((await depot.lire(nomVerrou(p)))?.toString() || "{}") as { le?: number };
    if (Date.now() - (Number(v.le) || 0) < DUREE_VERROU) return { enCours: true };
  }
  const compteur = `${habitant.id}/reactions-jour.json`;
  const avantJour = JSON.parse((await telecharger(supabase, compteur))?.toString() || "{}") as { jour?: string; n?: number };
  const n = avantJour.jour === jourParis() ? Number(avantJour.n) || 0 : 0;
  if (n >= POSES_PAR_JOUR) return { error: "Assez de nouvelles poses pour aujourd’hui : reviens demain 🙂", statut: 429 };
  const source = await telecharger(supabase, d.neutre);
  if (!source) return { error: "Ta figurine est introuvable.", statut: 400 };
  await depot.ecrire(nomVerrou(p), Buffer.from(JSON.stringify({ le: Date.now() })), "application/json");
  try {
    const { png, cadre } = await poserAuFormat(source);
    const r = await editer(png, consigne(p), avant, "high", { background: "transparent" });
    if (!Buffer.isBuffer(r)) return { error: r.erreur, statut: 502 };
    await depot.ecrire(nomPose(p), await reprendre(r, cadre), "image/webp");
    await depotDans(supabase, habitant.id).ecrire("reactions-jour.json", Buffer.from(JSON.stringify({ jour: jourParis(), n: n + 1 })), "application/json");
    return { url: await signer(supabase, `${d.dossier}/${nomPose(p)}`, 7200) };
  } finally {
    await depot.effacer(nomVerrou(p));
  }
}

/** 📈 Un envoi (une réaction ou un gag) : noté pour la mesure. Jamais bloquant. */
export async function noterEnvoiReaction(supabase: Supabase, cle: unknown): Promise<boolean> {
  const c = s(cle);
  if (!REACTIONS.some((r) => r.cle === c) && !GAGS.some((g) => g.cle === c)) return false;
  const { error } = await supabase.from("clik_meme_evenement").insert({ message_id: `r-${c}`, type: "partage" });
  return !error;
}

/** 📈 Ses réactions et ses gags envoyés, sur 7 et 30 jours, par clé (la page `/admin/humain/memes`). */
export async function statsReactions(supabase: Supabase): Promise<{ ok: boolean; sept: Record<string, number>; trente: Record<string, number> }> {
  const depuis = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data, error } = await supabase.from("clik_meme_evenement").select("message_id, created_at").ilike("message_id", "r-%").gte("created_at", depuis).limit(50_000);
  const res = { ok: !error, sept: {} as Record<string, number>, trente: {} as Record<string, number> };
  if (error) return res;
  const il7 = Date.now() - 7 * 86_400_000;
  for (const e of (Array.isArray(data) ? data : []) as { message_id?: string; created_at?: string }[]) {
    const cle = s(e.message_id).slice(2);
    if (!cle) continue;
    res.trente[cle] = (res.trente[cle] ?? 0) + 1;
    if (new Date(s(e.created_at)).getTime() >= il7) res.sept[cle] = (res.sept[cle] ?? 0) + 1;
  }
  return res;
}
