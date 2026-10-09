// 🔗 L'IMAGE DE PARTAGE D'UNE PAGE COMMERÇANT — ce qu'on voit dans WhatsApp,
// un SMS ou un e-mail quand on envoie son adresse.
//
// « Quand j'envoie le lien de la page d'un commerçant, j'aurais préféré qu'on
// ait, à la place de la photo de la vitrine nue, la vitrine créée sur ClikMe,
// sur sa page juste créée. »
//
// SA PHOTO CLIKME, QUAND ELLE EST PRÊTE, EST L'IMAGE : sa devanture passée dans
// l'univers ClikMe, fantômes compris — celle qui ouvre sa page (voir
// `lib/site-internet/couverture.ts`). Elle est faite en portrait (4:5, ou 2:3)
// et l'aperçu est en paysage : la recadrer y perdrait l'enseigne en haut ou
// les fantômes à la porte. Elle est donc posée ENTIÈRE, à droite, sur un fond
// tiré d'elle-même et flouté ; à gauche, le titre de sa page — « Bienvenue
// à … », dit comme la page le dit (`lib/site-internet/bienvenue.ts`).
//
// SANS ELLE (pas encore faite, ratée, ou il a choisi de garder sa photo
// d'origine), sa vraie photo en plein cadre, sous le même titre ; sans photo
// du tout, le fantôme de ClikMe ; et pour une adresse inconnue, la carte de
// la marque.
//
// RIEN NE LA FAIT ÉCHOUER : chaque lecture a son repli. Une image qui échoue,
// c'est un lien sans aperçu — et celui-là, personne ne l'ouvre.
//
// EN JPEG, PAS EN PNG : une photo en PNG pèse plus d'un mégaoctet et demi, et
// les messageries font l'aperçu d'une image légère plus sûrement et plus vite.
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { couvertureAffichee, couvertureDuDiagnostic } from "@/lib/site-internet/couverture";
import { aLaMaisonEnDeux } from "@/lib/site-internet/bienvenue";
import { nomDeVille } from "@/lib/direct/ville";
import { clikmeOgImage, fantomeClikme, FantomeSurHalo, MotMarque, OG_SIZE, policesClikme } from "@/lib/og/clikme-og";
import { SITE_HOST } from "@/lib/site-url";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/jpeg";
export const alt = "Sa page sur ClikMe";

const str = (v: unknown) => (v == null ? "" : String(v));
const cap = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
const jpeg = (b: Buffer) => `data:image/jpeg;base64,${b.toString("base64")}`;

const { width: L_OG, height: H_OG } = OG_SIZE;
/** La vitrine tient toute la hauteur, à cette distance des bords. */
const MARGE = 34;
const VITRINE_H = H_OG - 2 * MARGE;
/** Le texte commence ici, et s'arrête à cette distance de l'image de droite. */
const GAUCHE = 70;
const ECART = 44;

/**
 * DIX MINUTES EN CACHE, PAS UN AN : sa photo ClikMe se fait dans la minute qui
 * suit la création de sa page, et un lien envoyé entre-temps ne doit pas
 * figer l'ancienne image. (Celle du moteur se déclare « immuable pour un an ».)
 */
const CACHE = process.env.NODE_ENV === "development" ? "no-cache, no-store" : "public, max-age=600, s-maxage=600";

/** Une image d'ailleurs, en octets ; rien si elle ne vient pas à temps. */
async function telecharger(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const octets = Buffer.from(await res.arrayBuffer());
    return octets.length && octets.length < 15_000_000 ? octets : null;
  } catch {
    return null;
  }
}

/**
 * LA VITRINE CLIKME, PRÊTE À POSER : elle-même à la hauteur de l'image, et le
 * fond qu'on tire d'elle. Tout passe en JPEG à la taille exacte où on le
 * montre — le moteur de l'image ne lit pas le WebP, et n'a pas à réduire
 * lui-même une image de deux mégaoctets.
 */
async function preparerVitrine(octets: Buffer) {
  try {
    const { width = 0, height = 0 } = await sharp(octets).metadata();
    if (!width || !height) return null;
    // PORTRAIT D'ORDINAIRE ; une image plus large est ramenée au carré.
    const largeur = Math.round(VITRINE_H * Math.min(1, Math.max(0.6, width / height)));
    const [fond, vitrine] = await Promise.all([
      sharp(octets)
        .resize(L_OG, H_OG, { fit: "cover" })
        .blur(36)
        .modulate({ brightness: 0.85 })
        .jpeg({ quality: 70 })
        .toBuffer(),
      sharp(octets).resize(largeur, VITRINE_H, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer(),
    ]);
    return { fond: jpeg(fond), vitrine: jpeg(vitrine), largeur };
  } catch {
    return null;
  }
}

/** SA VRAIE PHOTO, en plein cadre. */
async function preparerPhoto(octets: Buffer) {
  try {
    return jpeg(await sharp(octets).rotate().resize(L_OG, H_OG, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer());
  } catch {
    return null;
  }
}

/**
 * LA TAILLE DU NOM : sur une ligne tant qu'il tient, puis sur deux ou trois.
 * Poppins en 800 compte un peu plus d'un demi-cadratin par lettre.
 */
function tailleDuNom(nom: string, largeur: number) {
  return Math.round(Math.max(44, Math.min(82, largeur / (Math.max(nom.length, 1) * 0.6))));
}

/**
 * « Bienvenue à » / « Lili Ross by me. » / « Magasin Vêtements · Vevey ».
 * `ombre` : posé sur une vraie photo, qui peut être très claire.
 */
function Titre({ mot, nom, role, largeur, ombre }: { mot: string; nom: string; role: string; largeur: number; ombre?: boolean }) {
  const t = tailleDuNom(nom, largeur);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: largeur, ...(ombre ? { textShadow: "0 2px 18px rgba(0,0,0,0.7)" } : {}) }}>
      <div style={{ display: "flex", fontSize: 50, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1, color: "#FFF8EC" }}>
        Bienvenue {mot}
      </div>
      <div
        style={{
          display: "block",
          marginTop: 2,
          fontSize: t,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: -t / 40,
          color: "#F6B54B",
          lineClamp: 3,
          textWrap: "balance",
        }}
      >
        {`${nom}.`}
      </div>
      {role && <div style={{ display: "flex", marginTop: 22, fontSize: 27, fontWeight: 600, color: "#EAD5BA" }}>{role}</div>}
    </div>
  );
}

/** LA COLONNE DE GAUCHE : la marque, le titre de sa page, l'adresse du site. */
function Colonne({ largeur, ...titre }: { mot: string; nom: string; role: string; largeur: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: GAUCHE,
        width: largeur,
        height: H_OG,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "58px 0 52px",
      }}
    >
      <MotMarque taille={46} />
      <Titre {...titre} largeur={largeur} />
      <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "#CDB9A5" }}>{SITE_HOST}</div>
    </div>
  );
}

const PLEIN = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0, display: "flex" };
const FOND_BRUN = "linear-gradient(160deg, #3D2615 0%, #26170C 55%, #170D07 100%)";

/** Ce que la page dit d'elle : son titre, et de quoi faire son image. */
async function lirePage(slug: string) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city, activite, diagnostic")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (!row) return null;
    const activite = str(row.activite);
    const mp = resolveMetier(activite);
    const diag = (row.diagnostic ?? {}) as Record<string, unknown>;
    return {
      nom: str(row.business_name).trim() || "Votre commerce",
      role: [mp.entry?.label ? cap(mp.entry.label) : cap(activite), nomDeVille(str(row.city))].filter(Boolean).join(" · "),
      couverture: couvertureAffichee(couvertureDuDiagnostic(row.diagnostic)),
      photo: (Array.isArray(diag.photos) ? diag.photos : []).map(str).find((u) => /^https?:\/\//i.test(u)),
    };
  } catch {
    return null;
  }
}

async function dessiner(slug: string): Promise<ImageResponse> {
  const page = await lirePage(slug);
  if (!page) return clikmeOgImage();

  // UN NOM SANS FIN NE POUSSE PAS LA VITRINE HORS DE L'IMAGE.
  const [mot, nom] = aLaMaisonEnDeux(page.nom.length > 64 ? `${page.nom.slice(0, 62).trimEnd()}…` : page.nom);
  const titre = { mot, nom, role: page.role };
  const [fonts, vitrine] = await Promise.all([
    policesClikme(),
    page.couverture ? telecharger(page.couverture).then((o) => (o ? preparerVitrine(o) : null)) : null,
  ]);
  const options = { ...OG_SIZE, ...(fonts.length ? { fonts } : {}) };
  const cadre = { width: "100%", height: "100%", display: "flex", position: "relative" as const, backgroundColor: "#1B110A", fontFamily: "Poppins, sans-serif" };

  if (vitrine) {
    return new ImageResponse(
      (
        <div style={cadre}>
          <img src={vitrine.fond} width={L_OG} height={H_OG} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
          {/* LE VOILE : sombre sous le titre, et la lueur de sa porte derrière la vitrine. */}
          <div
            style={{
              ...PLEIN,
              backgroundImage:
                "radial-gradient(circle at 80% 50%, rgba(255,170,70,0.30) 0%, rgba(0,0,0,0) 52%), linear-gradient(90deg, rgba(22,13,8,0.93) 0%, rgba(22,13,8,0.8) 42%, rgba(22,13,8,0.42) 100%)",
            }}
          />
          <Colonne {...titre} largeur={L_OG - GAUCHE - ECART - vitrine.largeur - MARGE} />
          {/* SA VITRINE, ENTIÈRE, dans le cadre d'or des feuilles de l'application. */}
          <div
            style={{
              position: "absolute",
              top: MARGE,
              right: MARGE,
              width: vitrine.largeur,
              height: VITRINE_H,
              display: "flex",
              borderRadius: 30,
              boxShadow: "0 26px 60px rgba(0,0,0,0.55)",
            }}
          >
            <img src={vitrine.vitrine} width={vitrine.largeur} height={VITRINE_H} alt="" style={{ borderRadius: 30 }} />
            <div style={{ ...PLEIN, borderRadius: 30, border: "3px solid rgba(246,181,75,0.75)" }} />
          </div>
        </div>
      ),
      options,
    );
  }

  // LA VRAIE PHOTO N'EST LUE QUE SI LA VITRINE CLIKME MANQUE.
  const photo = page.photo ? await telecharger(page.photo).then((o) => (o ? preparerPhoto(o) : null)) : null;
  if (photo) {
    return new ImageResponse(
      (
        <div style={cadre}>
          <img src={photo} width={L_OG} height={H_OG} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
          <div
            style={{
              ...PLEIN,
              backgroundImage:
                "linear-gradient(180deg, rgba(22,13,8,0.55) 0%, rgba(22,13,8,0.1) 26%, rgba(22,13,8,0.35) 52%, rgba(22,13,8,0.93) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: GAUCHE,
              right: GAUCHE,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "52px 0 56px",
            }}
          >
            <MotMarque taille={46} />
            <Titre {...titre} largeur={L_OG - 2 * GAUCHE} ombre />
          </div>
        </div>
      ),
      options,
    );
  }

  // NI VITRINE NI PHOTO : le fantôme de ClikMe tient la place de la devanture.
  const fantome = await fantomeClikme();
  return new ImageResponse(
    (
      <div style={{ ...cadre, backgroundImage: FOND_BRUN }}>
        <div style={{ ...PLEIN, backgroundImage: "radial-gradient(circle at 80% 48%, rgba(255,170,70,0.36) 0%, rgba(0,0,0,0) 50%)" }} />
        <Colonne {...titre} largeur={L_OG - GAUCHE - ECART - 400 - 50} />
        <FantomeSurHalo src={fantome} style={{ right: 50, top: 115 }} />
      </div>
    ),
    options,
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let png: Buffer;
  try {
    png = Buffer.from(await (await dessiner(slug)).arrayBuffer());
  } catch {
    // LE DESSIN A ÉCHOUÉ (une police, une image illisible) : la carte de la marque.
    png = Buffer.from(await (await clikmeOgImage()).arrayBuffer());
  }
  try {
    const jpg = await sharp(png).jpeg({ quality: 86, chromaSubsampling: "4:4:4" }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { "content-type": "image/jpeg", "cache-control": CACHE } });
  } catch {
    return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": CACHE } });
  }
}
