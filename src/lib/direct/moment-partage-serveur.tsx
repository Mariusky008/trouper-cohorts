/**
 * 📸 ENVOYER LE MOMENT, CÔTÉ SERVEUR (les grands moments, lot R3 ; `moment-partage.ts` ; `docs/univers/grands-moments.md`).
 *
 * `creerMoment` : ma réaction à une seconde d'une vidéo devient une image story (1080 × 1920), fabriquée une fois et
 * gardée (`moments/<id>.png`) avec sa fiche (`moments/<id>.json`). L'image : « ClikMe », la miniature officielle de la
 * vidéo (relayée par le serveur ; sans elle, un écran sombre et ▶ — jamais une fausse image), « à 2:47 », le titre, ma
 * figurine qui fait la tête de l'émotion (la mienne seulement : le cookie d'habitant), son aura, sa bulle, ce qui
 * jaillit autour (dessiné, pas d'émoji), « Léa a réagi à 2:47 » et l'adresse du moment. Vingt par jour ; trente jours.
 */
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { ImageResponse } from "next/og";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { policesClikme } from "@/lib/og/clikme-og";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson, prenomDe, telecharger, deposer } from "./ma-figurine-serveur";
import { figurineDuJourEnImage, vueDuDouble } from "./image-du-double-serveur";
import { MOMENTS, motDuMoment, type Moment } from "./grands-moments";
import { MOMENT_PARTAGE as MP, PHRASES_MOMENT as P, adresseCourte, cleMomentValide, idMomentValide, idVideoValide, minuteDuMoment, type MomentPartage } from "./moment-partage";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).replace(/\s+/g, " ").trim();

const DOSSIER = "moments";
const cheminFiche = (id: string) => `${DOSSIER}/${id}.json`;
export const cheminImageMoment = (id: string) => `${DOSSIER}/${id}.png`;
const cheminCompte = (h: string) => `${DOSSIER}/par/${h}.json`;

/** La miniature officielle de la vidéo (YouTube), relayée : rien si elle ne vient pas (3 s au plus). */
async function miniature(video: string): Promise<string | null> {
  const base = s(process.env.YOUTUBE_MINIATURE_BASE) || "https://i.ytimg.com";
  try {
    const r = await fetch(`${base}/vi/${encodeURIComponent(video)}/hqdefault.jpg`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!r.ok) return null;
    const jpg = await sharp(Buffer.from(await r.arrayBuffer()))
      .resize(MP.largeur, Math.round((MP.largeur * 9) / 16), { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    return null;
  }
}

// (ce qui jaillit autour d'elle, dessiné : étoiles, cœurs, flammes, gouttes, éclairs)
const ETOILE = "M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7z";
const COEUR = "M12 21L2.5 11.5C-1 8 1.5 1.5 6.5 1.5C9 1.5 10.8 3 12 5C13.2 3 15 1.5 17.5 1.5C22.5 1.5 25 8 21.5 11.5Z";
const FLAMME = "M12 1.5C12.6 5.6 18.5 8.4 18.5 14.2A6.5 6.5 0 0 1 5.5 14.2C5.5 10.9 7.4 9 8.6 7.8C8.8 10 9.8 11.4 11 11.9C10.4 8.6 10.9 4.8 12 1.5Z";
const GOUTTE = "M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2Z";
const ECLAIR = "M13 2L4 14h6l-1 8 9-12h-6z";
const FORME: Record<Moment["cle"], string> = { rire: ETOILE, coeur: COEUR, choc: ECLAIR, colere: FLAMME, triste: GOUTTE, bravo: ETOILE, feu: FLAMME };
const DECOR: readonly [number, number, number, number][] = [
  [120, 1010, 84, -12],
  [880, 960, 96, 14],
  [70, 1300, 64, 8],
  [940, 1270, 72, -10],
  [190, 1520, 56, 20],
  [860, 1540, 60, -18],
  [300, 930, 44, 6],
  [730, 1150, 40, -6],
];

async function imageDuMoment(o: { m: Moment; mot: string; prenom: string; video: { id: string; titre: string }; t: number; adresse: string; fig: { png: Buffer; largeur: number; hauteur: number } }): Promise<Buffer> {
  const { largeur: L, hauteur: H } = MP;
  const hTele = Math.round((L * 9) / 16);
  const [mini, polices] = await Promise.all([miniature(o.video.id), policesClikme()]);
  const minute = minuteDuMoment(o.t);
  // (sa figurine : 640 de haut au plus, posée à 1640)
  const FIG = { h: 640, lMax: 820, bas: 1640 };
  const k = Math.min(FIG.h / o.fig.hauteur, FIG.lMax / o.fig.largeur);
  const [fl, fh] = [Math.round(o.fig.largeur * k), Math.round(o.fig.hauteur * k)];
  const [fx, fy] = [Math.round((L - fl) / 2), FIG.bas - fh];
  const c = o.m.couleur;
  const longue = [...o.mot].length > 18;
  const titre = [...o.video.titre].slice(0, MP.titre).join("");
  const carte = new ImageResponse(
    (
      <div style={{ width: L, height: H, display: "flex", flexDirection: "column", position: "relative", fontFamily: "Poppins", color: "#FFF4E6", backgroundColor: "#1B0A17", backgroundImage: "linear-gradient(180deg, #2A1024 0%, #1B0A17 60%, #12060F 100%)" }}>
        {/* la marque */}
        <div style={{ position: "absolute", top: 56, left: 0, width: L, display: "flex", justifyContent: "center", fontSize: 44, fontWeight: 800 }}>
          <span>Clik</span>
          <span style={{ color: "#FF2E9A" }}>Me</span>
        </div>
        {/* la miniature officielle de la vidéo, l'heure du moment */}
        <div style={{ position: "absolute", top: 140, left: 0, width: L, height: hTele, display: "flex", backgroundColor: "#000" }}>
          {mini ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={mini} width={L} height={hTele} style={{ position: "absolute", left: 0, top: 0 }} />
          ) : (
            <div style={{ position: "absolute", left: L / 2 - 70, top: hTele / 2 - 70, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" width={70} height={70}>
                <path d="M8 4.8v14.4a1.2 1.2 0 0 0 1.8 1l11.4-7.2a1.2 1.2 0 0 0 0-2L9.8 3.8A1.2 1.2 0 0 0 8 4.8Z" fill="#FFF4E6" />
              </svg>
            </div>
          )}
          <div style={{ position: "absolute", left: 32, bottom: 28, display: "flex", padding: "10px 26px", borderRadius: 18, backgroundColor: "#FF2E9A", color: "#FFFFFF", fontSize: 46, fontWeight: 800 }}>{`à ${minute}`}</div>
        </div>
        <div style={{ position: "absolute", top: 140 + hTele + 22, left: 60, width: L - 120, display: "flex", fontSize: 36, fontWeight: 600, color: "#CFAEC4", lineHeight: 1.25 }}>{titre}</div>
        {/* son aura */}
        <div style={{ position: "absolute", left: L / 2 - 460, top: FIG.bas - 760, width: 920, height: 920, borderRadius: 460, backgroundImage: `radial-gradient(circle, ${c} 0%, ${c}88 30%, ${c}00 68%)` }} />
        {DECOR.map(([x, y, t, r], i) => (
          <svg key={i} viewBox="-2 -2 28 28" width={t} height={t} style={{ position: "absolute", left: x, top: y, transform: `rotate(${r}deg)` }}>
            <path d={FORME[o.m.cle]} fill={i % 3 === 2 ? "#FFF4E6" : c} />
          </svg>
        ))}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/png;base64,${o.fig.png.toString("base64")}`} width={fl} height={fh} style={{ position: "absolute", left: fx, top: fy }} />
        {/* sa bulle */}
        <div style={{ position: "absolute", left: 0, width: L, top: fy - (longue ? 190 : 150), display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(-3deg)" }}>
            <div style={{ display: "flex", maxWidth: 900, padding: "18px 34px 16px", borderRadius: 30, border: "6px solid #1B0A17", backgroundColor: c, color: "#1B0A17", fontSize: longue ? 54 : 74, fontWeight: 800, lineHeight: 1.05, textAlign: "center", boxShadow: "8px 10px 0 #1B0A17" }}>{o.mot}</div>
            <svg viewBox="0 0 40 30" width={52} height={38} style={{ marginTop: -6 }}>
              <path d="M2 0 L38 0 L14 30 Z" fill="#1B0A17" />
            </svg>
          </div>
        </div>
        {/* qui, et où le revoir */}
        <div style={{ position: "absolute", top: 1680, left: 0, width: L, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 54, fontWeight: 800 }}>{P.aReagi(o.prenom, minute)}</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#CFAEC4", marginTop: 6 }}>{P.regarde}</div>
          <div style={{ display: "flex", marginTop: 18, padding: "10px 30px", borderRadius: 999, backgroundColor: "#FFFFFF", color: "#1B0A17", fontSize: 34, fontWeight: 800 }}>{o.adresse}</div>
        </div>
      </div>
    ),
    { width: L, height: H, fonts: polices },
  );
  return Buffer.from(await carte.arrayBuffer());
}

type Resultat<T> = ({ error?: undefined; statut?: undefined } & T) | { error: string; statut: number };

/** 📸 Mon moment devient une image : sa fiche et son image, gardées ; son adresse. */
export async function creerMoment(supabase: Supabase, moi: Habitant, p: Record<string, unknown>, origine: string): Promise<Resultat<{ moment: MomentPartage; image: string; lien: string }>> {
  const video = s(p.video);
  const t = Number(p.t);
  if (!idVideoValide(video) || !Number.isFinite(t) || t < 0 || t > 4 * 3600) return { error: "Quelle vidéo ?", statut: 400 };
  if (!cleMomentValide(p.e)) return { error: "Quelle émotion ?", statut: 400 };
  const m = MOMENTS[p.e];
  // (vingt par jour)
  const jour = jourParis();
  const compte = await lireJson<{ jour: string; n: number }>(supabase, cheminCompte(moi.id));
  const n = compte.jour === jour ? Number(compte.n) || 0 : 0;
  if (n >= MP.parJour) return { error: P.trop, statut: 429 };
  // (ma figurine, la tête de l'émotion si elle est prête)
  const d = await vueDuDouble(supabase, moi.id);
  const tete = d.tetes.some((x) => x.cle === m.tete) ? m.tete : undefined;
  const fig = await figurineDuJourEnImage(supabase, { ...d, ...(tete ? { choisie: tete } : {}) }, origine).catch(() => null);
  if (!fig) return { error: P.sansFigurine, statut: 404 };
  const id = randomBytes(5).toString("hex");
  const ecrit = s(p.mot);
  const moment: MomentPartage = {
    id,
    prenom: (await prenomDe(supabase, moi).catch(() => "")) || "Quelqu’un",
    video: { id: video, titre: [...s(p.titre)].slice(0, MP.titre).join("") },
    t: Math.round(t * 10) / 10,
    e: m.cle,
    mot: motDuMoment(m, id, ecrit || null),
    le: Date.now(),
  };
  const png = await imageDuMoment({ m, mot: moment.mot, prenom: moment.prenom, video: moment.video, t: moment.t, adresse: adresseCourte(origine, id), fig }).catch(() => null);
  if (!png) return { error: P.rate, statut: 502 };
  if (!(await deposer(supabase, cheminImageMoment(id), png, "image/png")) || !(await ecrireJson(supabase, cheminFiche(id), { ...moment, h: moi.id }))) return { error: P.rate, statut: 502 };
  await ecrireJson(supabase, cheminCompte(moi.id), { jour, n: n + 1 });
  return { moment, image: `/api/direct/moment/${id}/image`, lien: `${origine}/moment/${id}` };
}

/** Un moment envoyé (rien : inconnu, ou de plus de trente jours). */
export async function lireMoment(supabase: Supabase, id: unknown): Promise<MomentPartage | null> {
  if (!idMomentValide(id)) return null;
  const f = await lireJson<MomentPartage & { h: string }>(supabase, cheminFiche(id));
  if (f.id !== id || !f.video || !cleMomentValide(f.e) || !f.le || Date.now() - f.le > MP.jours * 86_400_000) return null;
  return { id, prenom: s(f.prenom), video: { id: s(f.video.id), titre: s(f.video.titre) }, t: Number(f.t) || 0, e: f.e, mot: s(f.mot), le: f.le };
}

/** Son image (rien : inconnu ou effacé). */
export async function imageDeMoment(supabase: Supabase, id: unknown): Promise<Buffer | null> {
  if (!(await lireMoment(supabase, id))) return null;
  return telecharger(supabase, cheminImageMoment(String(id))).catch(() => null);
}
