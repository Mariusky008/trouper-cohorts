/**
 * ✨📸 MON DOUBLE DU JOUR, CÔTÉ SERVEUR : ce que l'écran montre (`vueDuDouble`, pour la route `/api/direct/mon-double`)
 * et, pour l'image à partager (lot 3, `/api/direct/mon-double/image` ; `docs/univers/ma-figurine.md`, section 5), sa
 * figurine du jour en une seule image : son corps sans sa tête, et la tête du jour posée dans la boîte de sa tête —
 * exactement comme l'écran la pose (l'image de la tête étirée à sa boîte).
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { calquesDeFigurine } from "./calques-figurine-serveur";
import { sesExpressions } from "./expressions-figurine-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { humeurDuJour } from "./talkie-serveur";
import { humeurDe } from "./rituel";
import { EXPRESSIONS_FIGURINE, expressionDeLHumeur, type ExpressionFigurine } from "./expressions-figurine";
import { sonDouble } from "./mon-double-serveur";
import { ornementsDe } from "./ornements-serveur";
import { telecharger } from "./ma-figurine-serveur";
import { NOM_FICHIER_SALON, cheminFichierSalon } from "./salon-fichiers-serveur";
import type { MonDoubleVue } from "./mon-double";
import { bonjourDe } from "./bonjour-serveur";

type Supabase = ReturnType<typeof createAdminClient>;

export async function vueDuDouble(supabase: Supabase, h: string): Promise<MonDoubleVue> {
  const [calques, expr, humeur, double, assise, ornements, bonjour] = await Promise.all([
    calquesDeFigurine(supabase, h, { fabriquer: false }).catch(() => null),
    sesExpressions(supabase, h).catch(() => null),
    humeurDuJour(supabase, h).catch(() => null),
    sonDouble(supabase, h),
    figurineDeLaMaison(supabase, h).catch(() => null),
    ornementsDe(supabase, h).catch(() => null),
    bonjourDe(supabase, h).catch(() => null),
  ]);
  // (ses têtes : seulement découpées sur ses calques d'aujourd'hui — la même règle de découpe)
  const memeDecoupe = Boolean(calques?.sansTete && expr && (expr.etat.decoupe ?? 1) === (calques.decoupe ?? 1));
  const tetes = memeDecoupe ? EXPRESSIONS_FIGURINE.filter((x) => expr!.etat.tetes[x.cle]).map((x) => ({ cle: x.cle, e: x.e, nom: x.nom, src: expr!.etat.tetes[x.cle]! })) : [];
  const eH = expressionDeLHumeur(humeur);
  const v = humeurDe(humeur);
  return {
    ...(calques?.sansTete ? { corps: { src: calques.sansTete.fichier, ratio: calques.ratio, boite: calques.tete.boite }, habituelle: calques.tete.fichier } : {}),
    ...(!calques?.sansTete && assise?.src ? { image: assise.src } : {}),
    tetes,
    ...(eH && v ? { humeur: { e: eH, emoji: v.emoji, nom: v.court } } : {}),
    ...(double.choisie && tetes.some((t) => t.cle === double.choisie) ? { choisie: double.choisie } : {}),
    pancarte: double.pancarte,
    pret: double.pret,
    ...(ornements ? { ornements } : {}),
    ...(bonjour ? { bonjour } : {}),
    ...(memeDecoupe && expr!.etat.tetes.parle ? { parle: expr!.etat.tetes.parle } : {}),
  };
}

/** La tête du jour (celle choisie, sinon celle de son humeur) ; rien : sa tête habituelle. */
export const teteDuDouble = (d: MonDoubleVue): ExpressionFigurine | null => d.choisie ?? d.humeur?.e ?? null;

/** Les octets d'une image de sa figurine : un fichier du salon (lu dans le stockage), sinon son adresse. */
async function octets(supabase: Supabase, src: string | undefined, origine: string): Promise<Buffer | null> {
  if (!src) return null;
  try {
    const nom = /^\/api\/direct\/salon\/fichier\/([^/?#]+)/.exec(src)?.[1];
    if (nom && NOM_FICHIER_SALON.test(nom)) return await telecharger(supabase, cheminFichierSalon(nom));
    const r = await fetch(new URL(src, origine), { cache: "no-store" });
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** Sa figurine du jour, en une seule image PNG (rien : pas de figurine). */
export async function figurineDuJourEnImage(supabase: Supabase, d: MonDoubleVue, origine: string, o: { tete?: string } = {}): Promise<{ png: Buffer; largeur: number; hauteur: number } | null> {
  const e = teteDuDouble(d);
  if (d.corps) {
    // (`o.tete` : une autre tête posée à la place — 🗣️ sa bouche ouverte, pour la vidéo de sa réaction)
    const tete = o.tete || (e && d.tetes.find((t) => t.cle === e)?.src) || d.habituelle;
    const [corps, t] = await Promise.all([octets(supabase, d.corps.src, origine), octets(supabase, tete, origine)]);
    if (corps) {
      try {
        const base = sharp(corps).ensureAlpha();
        const { width: W = 0, height: H = 0 } = await base.metadata();
        if (W && H) {
          const [bx, by, bw, bh] = d.corps.boite;
          const [l, h] = [Math.max(1, Math.round(bw * W)), Math.max(1, Math.round(bh * H))];
          const posee = t ? await sharp(t).resize(l, h, { fit: "fill" }).png().toBuffer().catch(() => null) : null;
          const png = await base
            .composite(posee ? [{ input: posee, left: Math.round(bx * W), top: Math.round(by * H) }] : [])
            .png()
            .toBuffer();
          return { png, largeur: W, hauteur: H };
        }
      } catch {
        /* (son image d'une seule pièce, plus bas) */
      }
    }
  }
  const seule = await octets(supabase, d.image, origine);
  if (!seule) return null;
  try {
    const png = await sharp(seule).ensureAlpha().png().toBuffer();
    const m = await sharp(png).metadata();
    return m.width && m.height ? { png, largeur: m.width, hauteur: m.height } : null;
  } catch {
    return null;
  }
}

/** La date du jour, en mots (« mercredi 25 novembre »), à l'heure de Paris. */
export const dateDuJour = (maintenant = new Date()) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(maintenant);
