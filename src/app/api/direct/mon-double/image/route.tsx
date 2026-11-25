// 📸 « MA FIGURINE DU JOUR », L'IMAGE À PARTAGER (le chantier « Ma figurine », lot 3 ; `docs/univers/ma-figurine.md`,
// section 5) — la sienne seulement (le cookie d'habitant).
//
// GET → une image PNG, 1080 × 1350 : « Ma figurine du jour », la date ; sa figurine avec sa tête du jour (celle choisie,
// sinon celle de son humeur), sa pancarte au-dessus de sa tête, ce qu'elle porte toute seule (l'auréole, l'accessoire de
// sa passion, le cœur) ; dessous, sa série et son souvenir s'il en a (de vraies données, rien d'inventé) ; « Mon double
// sur ClikMe ». Sans compte : 401 ; sans figurine : 404 (jamais une image vide).
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { dateDuJour, figurineDuJourEnImage, vueDuDouble } from "@/lib/direct/image-du-double-serveur";
import { IMAGE_DOUBLE, PHRASES_IMAGE_DOUBLE } from "@/lib/direct/mon-double";
import { SERIE_MIN } from "@/lib/direct/ornements";
import { COEUR_TRACE, piecesDesOrnements, type PieceOrnement } from "@/app/collection/ornements";
import { policesClikme } from "@/lib/og/clikme-og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const { largeur: L, hauteur: H } = IMAGE_DOUBLE;
/** Le cadre de sa figurine sur l'image : sa hauteur, sa largeur au plus, le bas de ses pieds. */
const FIG = { h: 760, lMax: 900, bas: 1110 };
const CREME = "#FFF4E6";
const FLAMME = "M12 1.5C12.6 5.6 18.5 8.4 18.5 14.2A6.5 6.5 0 0 1 5.5 14.2C5.5 10.9 7.4 9 8.6 7.8C8.8 10 9.8 11.4 11 11.9C10.4 8.6 10.9 4.8 12 1.5Z";

/** Les dessins d'une pièce, sans ses `<>…</>` (le moteur de l'image ne sait pas les lire dans un `<svg>`). */
function aplatir(n: ReactNode): ReactNode[] {
  return Children.toArray(n).flatMap((c) => (isValidElement<{ children?: ReactNode }>(c) && c.type === Fragment ? aplatir(c.props.children) : [c]));
}

/** Une pièce de ses ornements, en points sur l'image : son cadre tel que l'écran le dessine, élargi pour ne rien couper. */
function enPoints(p: PieceOrnement, x0: number, y0: number, l: number, h: number) {
  const [vx, vy, vl, vh] = p.vue;
  const [bx, by, bl, bh] = [x0 + p.boite[0] * l, y0 + p.boite[1] * h, p.boite[2] * l, p.boite[3] * h];
  let [sx, sy, dx, dy] = [bl / vl, bh / vh, 0, 0];
  if (p.ajuste !== "none") {
    const s = Math.min(bl / vl, bh / vh);
    [sx, sy, dx] = [s, s, (bl - vl * s) / 2];
    dy = p.ajuste === "xMidYMid meet" ? (bh - vh * s) / 2 : 0;
  }
  const m = Math.max(vl, vh) * 0.5;
  return { vue: `${vx - m} ${vy - m} ${vl + 2 * m} ${vh + 2 * m}`, left: bx + dx - m * sx, top: by + dy - m * sy, width: (vl + 2 * m) * sx, height: (vh + 2 * m) * sy };
}

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const d = await vueDuDouble(supabase, moi.id);
  const [fig, polices] = await Promise.all([figurineDuJourEnImage(supabase, d, new URL(req.url).origin), policesClikme()]);
  if (!fig) return NextResponse.json({ error: PHRASES_IMAGE_DOUBLE.sansFigurine }, { status: 404, headers: sansCache });

  // (sa figurine, à la hauteur du cadre — moins haute si elle est très large)
  const echelle = Math.min(FIG.h / fig.hauteur, FIG.lMax / fig.largeur);
  const [fl, fh] = [Math.round(fig.largeur * echelle), Math.round(fig.hauteur * echelle)];
  const [fx, fy] = [Math.round((L - fl) / 2), FIG.bas - fh];
  const o = d.ornements ?? null;
  // (les ornements posés d'après la boîte de sa tête ; le badge, un emoji, reste à l'écran)
  const pieces = d.corps && o ? piecesDesOrnements({ ...o, boite: d.corps.boite }).filter((p) => p.cle !== "badge") : [];
  const hautDeLaTete = d.corps ? fy + d.corps.boite[1] * fh : fy;
  const pancarte = d.pancarte.trim();
  const grande = pancarte.length <= 34;
  const serie = o?.serie ?? 0;
  const date = dateDuJour();

  const carte = new ImageResponse(
    (
      <div style={{ width: L, height: H, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", fontFamily: "Poppins", color: CREME, backgroundColor: "#120c09", backgroundImage: "linear-gradient(180deg, #2b1a12 0%, #120c09 70%)" }}>
        {/* le halo derrière elle */}
        <div style={{ position: "absolute", left: L / 2 - 470, top: FIG.bas - 640, width: 940, height: 940, borderRadius: 470, backgroundImage: "radial-gradient(circle, rgba(246,181,75,0.55) 0%, rgba(255,46,154,0.22) 40%, rgba(255,46,154,0) 70%)" }} />
        <div style={{ position: "absolute", top: 64, left: 0, width: L, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>{PHRASES_IMAGE_DOUBLE.titre}</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#CDB8A4", marginTop: 4 }}>{date.charAt(0).toUpperCase() + date.slice(1)}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/png;base64,${fig.png.toString("base64")}`} width={fl} height={fh} style={{ position: "absolute", left: fx, top: fy }} />
        {pieces.map((p) => {
          const r = enPoints(p, fx, fy, fl, fh);
          return (
            <svg key={p.cle} viewBox={r.vue} preserveAspectRatio="none" width={r.width} height={r.height} style={{ position: "absolute", left: r.left, top: r.top }}>
              {aplatir(p.contenu)}
            </svg>
          );
        })}
        {pancarte && (
          <div style={{ position: "absolute", left: 0, width: L, bottom: H - hautDeLaTete + 6, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(-3deg)" }}>
              <div style={{ maxWidth: 760, padding: "14px 30px 12px", borderRadius: 14, backgroundColor: CREME, color: "#2A1A10", fontSize: grande ? 50 : 40, fontWeight: 800, lineHeight: 1.1, textAlign: "center", boxShadow: "0 14px 28px rgba(0,0,0,0.5)" }}>{pancarte}</div>
              <div style={{ width: 8, height: 34, borderRadius: 4, backgroundColor: "#7A5A44" }} />
            </div>
          </div>
        )}
        {(serie >= SERIE_MIN || o?.coeur) && (
          <div style={{ position: "absolute", top: FIG.bas + 18, left: 0, width: L, display: "flex", justifyContent: "center", gap: 18 }}>
            {serie >= SERIE_MIN && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px 10px 18px", borderRadius: 999, backgroundColor: "#F5A23A", color: "#2A1500", fontSize: 32, fontWeight: 800 }}>
                <svg viewBox="0 0 24 24" width={36} height={36}>
                  <path d={FLAMME} fill="#E0322E" />
                </svg>
                {PHRASES_IMAGE_DOUBLE.serie(serie)}
              </div>
            )}
            {o?.coeur && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px 10px 18px", borderRadius: 999, backgroundColor: "#261B16", color: CREME, fontSize: 32, fontWeight: 600, boxShadow: "0 0 0 2px rgba(255,196,140,0.3)" }}>
                <svg viewBox="0 0 24 22" width={34} height={32}>
                  <path d={COEUR_TRACE} fill="#FF2E9A" />
                </svg>
                {o.coeur.sorte === "surprise" ? `offert par ${o.coeur.prenom}` : `vu avec ${o.coeur.prenom}`}
              </div>
            )}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 64, left: 0, width: L, display: "flex", justifyContent: "center", fontSize: 46, fontWeight: 800 }}>
          <span>{PHRASES_IMAGE_DOUBLE.signature.replace(" ClikMe", "")}</span>
          <span style={{ color: "#FF2E9A", marginLeft: 12 }}>ClikMe</span>
        </div>
      </div>
    ),
    { width: L, height: H, fonts: polices },
  );
  const png = Buffer.from(await carte.arrayBuffer());
  return new NextResponse(new Uint8Array(png), { headers: { ...sansCache, "content-type": "image/png", "content-disposition": `inline; filename="${IMAGE_DOUBLE.nom}"` } });
}
