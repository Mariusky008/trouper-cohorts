import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site-url";

// LA VIGNETTE D'APERÇU DE LIEN — ce qui s'affiche quand quelqu'un colle une
// adresse de Clikme dans WhatsApp, un SMS, un e-mail ou LinkedIn.
//
// « Le logo et le design, quand j'envoie un lien sur WhatsApp ou par message,
// c'est encore un vieux design. » C'était vrai deux fois :
//
//   · LE LOGO. L'image posait le symbole À CÔTÉ du mot « clikme » écrit en
//     entier — un k dessiné, puis un k tapé. Le logo d'aujourd'hui n'a qu'un
//     k : le curseur, à sa place dans le mot (« cli », le curseur, « me » —
//     voir `components/direct/mot-marque.tsx`).
//   · LE DESIGN. Fond vert sapin et pastilles menthe : la charte d'avant le
//     rose. L'application est passée au brun chaud, à l'or et au fuchsia, avec
//     son fantôme ; la vignette est la première image qu'on voit de Clikme, elle
//     ne peut pas montrer l'ancienne.
//
// CE QU'ELLE DIT EST LA PHRASE DE L'ACCUEIL : « Ta ville, à essayer et à
// partager. » — celle de l'écran « Bienvenue sur Clikme ».
//
// ELLE NE DÉPEND D'AUCUNE REQUÊTE RÉSEAU. La police (Poppins, celle du produit,
// sous licence OFL — voir `polices/OFL-poppins.txt`) et le fantôme sont lus sur
// le disque, et l'image se fabrique quand même s'ils manquent : une vignette qui
// échoue est une vignette que personne ne voit jamais.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Le curseur du logo, en tracés purs : le montant blanc, la flèche fuchsia. */
const CURSEUR =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 42">` +
      `<rect x="1" y="1.5" width="6.8" height="38" fill="#FFFFFF"/>` +
      `<path d="M11.8 23.5 L11.8 6.5 L26 20.5 L19.5 21 Z" fill="#FF2E9A"/>` +
      `<path d="M11.8 23.5 L17 23.5 L27.5 38.5 L22 41 Z" fill="#FF2E9A"/>` +
      `</svg>`,
  ).toString("base64");

/** Les quatre rubriques de l'application, dans l'ordre du menu. */
export const RUBRIQUES = ["Le Direct", "La Ville", "Ensemble", "Ma maison"] as const;

async function lire(chemin: string): Promise<Buffer | null> {
  try {
    return await readFile(join(process.cwd(), chemin));
  } catch {
    return null;
  }
}

/**
 * POPPINS 600 ET 800, la police du produit, lues sur le disque. Rien si elles
 * manquent : l'image se fait alors dans la police par défaut, plutôt que pas
 * du tout. Partagée avec l'image de partage des pages commerçant.
 */
export async function policesClikme() {
  const [p600, p800] = await Promise.all([
    lire("src/lib/og/polices/poppins-latin-600-normal.woff"),
    lire("src/lib/og/polices/poppins-latin-800-normal.woff"),
  ]);
  return [
    ...(p600 ? [{ name: "Poppins", data: p600, weight: 600 as const, style: "normal" as const }] : []),
    ...(p800 ? [{ name: "Poppins", data: p800, weight: 800 as const, style: "normal" as const }] : []),
  ];
}

/** Le fantôme de ClikMe, prêt à poser ; rien s'il manque. */
export async function fantomeClikme() {
  const f = await lire("public/clikme-fantome.png");
  return f ? `data:image/png;base64,${f.toString("base64")}` : null;
}

/** LE FANTÔME, sur son halo — 400 × 400, à placer par `style`. */
export function FantomeSurHalo({ src, style }: { src: string | null; style: Record<string, string | number> }) {
  return (
    <div style={{ position: "absolute", width: 400, height: 400, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <div
        style={{
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: 999,
          backgroundImage: "radial-gradient(circle, rgba(255,120,210,0.30) 0%, rgba(255,120,210,0.08) 45%, rgba(0,0,0,0) 70%)",
        }}
      />
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} width={400} height={366} alt="" style={{ transform: "rotate(-4deg)" }} />
      )}
    </div>
  );
}

/**
 * LE MOT-MARQUE : « cli », le curseur, « me ». En minuscules — règle de la
 * charte. `taille` est celle de la police ; le curseur suit à l'échelle.
 */
export function MotMarque({ taille, couleur = "#FFFFFF" }: { taille: number; couleur?: string }) {
  const k = taille / 104;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", fontSize: taille, fontWeight: 800, lineHeight: 1, letterSpacing: -2 * k, color: couleur }}>
      <span>cli</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CURSEUR}
        width={Math.round(57 * k)}
        height={Math.round(83 * k)}
        alt=""
        style={{ margin: `0 ${3 * k}px ${13 * k}px ${2 * k}px` }}
      />
      <span>me</span>
    </div>
  );
}

export async function clikmeOgImage({
  haut = "Ta ville, à essayer",
  bas = "et à partager.",
  pastilles = RUBRIQUES,
}: {
  /** La phrase, en blanc. */
  haut?: string;
  /** Sa fin, en or. */
  bas?: string;
  pastilles?: readonly string[];
} = {}): Promise<ImageResponse> {
  const [fonts, fantome] = await Promise.all([policesClikme(), fantomeClikme()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#1B110A",
          backgroundImage:
            "radial-gradient(circle at 82% 46%, rgba(255,170,70,0.40) 0%, rgba(255,140,40,0.12) 32%, rgba(0,0,0,0) 58%), linear-gradient(160deg, #3D2615 0%, #26170C 55%, #170D07 100%)",
          color: "#FFF6EA",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {/* LE CADRE D'OR — celui des feuilles de l'application. */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 22,
            right: 22,
            bottom: 22,
            display: "flex",
            borderRadius: 40,
            border: "2px solid rgba(246,181,75,0.45)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 78px", width: 760 }}>
          <MotMarque taille={104} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 40, fontSize: 60, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>
            <span style={{ color: "#FFF8EC" }}>{haut}</span>
            <span style={{ color: "#F6B54B" }}>{bas}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 34 }}>
            {pastilles.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#FFE3BD",
                  border: "2px solid rgba(246,181,75,0.55)",
                  backgroundColor: "rgba(246,181,75,0.08)",
                  borderRadius: 999,
                  padding: "8px 20px",
                  marginRight: 12,
                  marginBottom: 10,
                }}
              >
                {c}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 22, fontWeight: 600, color: "#CDB9A5" }}>{SITE_HOST}</div>
        </div>

        <FantomeSurHalo src={fantome} style={{ right: 58, top: 112 }} />
      </div>
    ),
    { ...OG_SIZE, ...(fonts.length ? { fonts } : {}) },
  );
}
