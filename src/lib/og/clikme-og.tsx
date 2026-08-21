import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site-url";
import { MARQUE } from "@/lib/marque";

// La vignette d'aperçu de lien de la racine — ce qui s'affiche quand quelqu'un
// colle l'adresse dans WhatsApp, un e-mail ou LinkedIn.
//
// Elle affichait encore la carte d'un autre produit (« Popey · LE CLUB DES BONS
// PLANS · Offres / Gratuités / Privilèges »). C'est la première chose que voit
// quelqu'un à qui on transfère le lien : elle doit dire ce que fait le produit
// aujourd'hui, et rien d'autre.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Le symbole, en tracés purs. Inline plutôt qu'un fichier : la génération de
// l'image ne doit dépendre d'aucune requête réseau — une vignette qui échoue
// est une vignette que personne ne voit jamais.
const SYMBOLE =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 42">` +
      `<rect x="1" y="1.5" width="6.8" height="38" fill="#FFFFFF"/>` +
      `<path d="M11.8 23.5 L11.8 6.5 L26 20.5 L19.5 21 Z" fill="#3FD79A"/>` +
      `<path d="M11.8 23.5 L17 23.5 L27.5 38.5 L22 41 Z" fill="#3FD79A"/>` +
      `</svg>`,
  ).toString("base64");

/**
 * LES TROIS PASTILLES DE L'IMAGE DE PARTAGE.
 *
 * Elles disaient « Site gratuit · Assistante incluse · Catalogue de votre
 * ville » — le produit tel qu'il était vendu quand le site était le sujet.
 * Depuis, le sujet est Le Direct : ce qu'un commerçant dit à midi et que les
 * habitants voient tout de suite. L'aperçu qui part dans un WhatsApp est
 * souvent la PREMIÈRE phrase que quelqu'un lit de Clikme ; elle ne peut pas
 * décrire une version précédente du produit.
 */
const PASTILLES = ["Le Direct de votre ville", "Vos clients ce midi", "Site offert"] as const;

export function clikmeOgImage(subtitle: string, pastilles: readonly string[] = PASTILLES): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "linear-gradient(135deg, #0B1512 0%, #113026 55%, #0A2A1E 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 9, color: "#8FC7AE" }}>
          LE RÉSEAU DU COMMERCE LOCAL
        </div>
        {/* Le mot reste en minuscules — règle de la charte. */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SYMBOLE} width={78} height={113} alt="" style={{ marginRight: 26 }} />
          <span style={{ fontSize: 140, fontWeight: 800, lineHeight: 1 }}>{MARQUE.toLowerCase()}</span>
        </div>
        <div style={{ display: "flex", fontSize: 48, marginTop: 26, color: "#E6F2EC", maxWidth: 1000 }}>{subtitle}</div>
        <div style={{ display: "flex", marginTop: 44 }}>
          {pastilles.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                fontSize: 28,
                color: "#BFEBD6",
                border: "2px solid rgba(63,215,154,0.5)",
                borderRadius: 999,
                padding: "12px 26px",
                marginRight: 16,
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 52, fontSize: 28, color: "#7E9A8C" }}>{SITE_HOST}</div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
