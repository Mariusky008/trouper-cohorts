// 🖼️ L'APERÇU D'UN MESSAGE DE FIGURINE, DANS WHATSAPP (`clikme.fr/t/<id>/apercu`) — l'image de `og:image`.
//
// Le 9 novembre 2026, le patron, devant le message reçu : « pas du tout encourageant ou beau, ça ne donne pas envie de
// cliquer ». L'aperçu montrait une carte grise, sans image : l'image prévue était sa figurine en .webp, derrière une
// adresse signée qui s'efface en une heure — WhatsApp ne la montrait pas. Ici, une vraie carte, 1200 × 630, en JPEG
// léger, à une adresse qui ne change pas : sa figurine en grand, un bouton ▶, « Marius t'a laissé un message avec sa
// figurine », « Écouter son message ». Un lien effacé : la même carte, sans figurine.
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { apercuDuLien } from "@/lib/direct/talkie-serveur";
import { policesClikme } from "@/lib/og/clikme-og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const L = 1200;
const H = 630;
const CADRE = { l: 440, h: 560 };

const svg = (corps: string, vue: string) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vue}">${corps}</svg>`).toString("base64")}`;
/** Le ▶ (un triangle aux coins ronds). */
const LECTURE = svg(`<path d="M8 4.8v14.4a1.2 1.2 0 0 0 1.8 1l11.4-7.2a1.2 1.2 0 0 0 0-2L9.8 3.8A1.2 1.2 0 0 0 8 4.8Z" fill="#FF2E9A"/>`, "0 0 24 24");
/** Un micro, pour la bulle. */
const MICRO = svg(
  `<rect x="9" y="2.5" width="6" height="12" rx="3" fill="#FFFFFF"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>`,
  "0 0 24 24",
);

/**
 * Sa figurine, recadrée sur le haut (sa tête) et convertie : WhatsApp et le dessin de la carte ne lisent pas le .webp.
 * 🏡 Son image vedette (sa figurine chez elle, « Univers », lot 5c) : recadrée sur le bas, là où elle est assise.
 */
async function figurine(adresse: string, vedette = false): Promise<string | null> {
  try {
    const r = await fetch(adresse, { cache: "no-store" });
    if (!r.ok) return null;
    const png = await sharp(Buffer.from(await r.arrayBuffer()))
      .resize(CADRE.l, CADRE.h, { fit: "cover", position: vedette ? "bottom" : "top" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let l: Awaited<ReturnType<typeof apercuDuLien>> = null;
  try {
    l = await apercuDuLien(createAdminClient(), id);
  } catch {
    l = null;
  }
  const [image, polices] = await Promise.all([l ? (l.vedette ? figurine(l.vedette, true).then((x) => x ?? figurine(l.neutre)) : figurine(l.neutre)) : Promise.resolve(null), policesClikme()]);
  const prenom = l?.prenom || "";
  const grand = prenom.length > 11 ? 60 : 76;

  const carte = new ImageResponse(
    (
      <div
        style={{
          width: L,
          height: H,
          display: "flex",
          position: "relative",
          backgroundColor: "#12060F",
          backgroundImage: "radial-gradient(circle at 78% 52%, rgba(255,46,154,0.55) 0%, rgba(255,46,154,0.16) 34%, rgba(18,6,15,0) 62%)",
          fontFamily: "Poppins",
          color: "#FFF4E6",
        }}
      >
        {/* ce qu'il dit : qui, et quoi faire */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: image ? 650 : L, padding: image ? "0 20px 0 72px" : "0 72px" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>
            <span>Clik</span>
            <span style={{ color: "#FF4FAE" }}>Me</span>
            {l?.pour ? <span style={{ marginLeft: 18, fontSize: 26, fontWeight: 600, color: "#CDB4C0", alignSelf: "center" }}>{`· pour ${l.pour}`}</span> : null}
          </div>
          {l ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
              <span style={{ fontSize: grand, fontWeight: 800, lineHeight: 1.05, color: "#FF4FAE" }}>{prenom}</span>
              <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap" }}>t’a laissé un message</span>
              <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap" }}>avec sa figurine</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
              <span style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.15 }}>Un message de figurine</span>
              <span style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.4, color: "#CDB4C0" }}>Ce message s’est effacé.</span>
            </div>
          )}
          {l ? (
            <div style={{ display: "flex", alignItems: "center", alignSelf: "flex-start", marginTop: 40, padding: "12px 30px 12px 12px", borderRadius: 999, backgroundColor: "#FFF4E6", color: "#2A0F1F", fontSize: 30, fontWeight: 800 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, marginRight: 16, borderRadius: 999, backgroundColor: "#FFFFFF", boxShadow: "0 0 0 3px #FF2E9A" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LECTURE} width={34} height={34} alt="" />
              </div>
              Écouter son message
            </div>
          ) : null}
        </div>

        {/* sa figurine, en grand, et le ▶ */}
        {image ? (
          <div style={{ position: "absolute", right: 70, top: (H - CADRE.h) / 2, display: "flex", width: CADRE.l, height: CADRE.h, borderRadius: 48, overflow: "hidden", border: "6px solid rgba(242,196,107,0.9)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} width={CADRE.l} height={CADRE.h} alt="" />
          </div>
        ) : null}
        {image ? (
          <div style={{ position: "absolute", right: 70 + CADRE.l - 92, top: (H - CADRE.h) / 2 + 28, display: "flex", alignItems: "center", justifyContent: "center", width: 92, height: 92, borderRadius: 999, backgroundColor: "#FF2E9A", border: "5px solid #12060F" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MICRO} width={46} height={46} alt="" />
          </div>
        ) : null}
        {image ? (
          <div style={{ position: "absolute", right: 70 + CADRE.l / 2 - 70, top: (H - CADRE.h) / 2 + CADRE.h - 170, display: "flex", alignItems: "center", justifyContent: "center", width: 140, height: 140, borderRadius: 999, backgroundColor: "rgba(255,244,230,0.96)", boxShadow: "0 18px 40px rgba(0,0,0,0.45)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LECTURE} width={86} height={86} alt="" style={{ marginLeft: 8 }} />
          </div>
        ) : null}
      </div>
    ),
    { width: L, height: H, fonts: polices },
  );

  // (en JPEG : quelques dizaines de ko — un aperçu trop lourd, WhatsApp ne le montre pas)
  const jpeg = await sharp(Buffer.from(await carte.arrayBuffer()))
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "content-type": "image/jpeg", "cache-control": l ? "public, max-age=3600, s-maxage=86400" : "public, max-age=300", "x-robots-tag": "noindex" },
  });
}
