// 🖼️ L'APERÇU D'UNE INVITATION DEVANT MA TÉLÉ, DANS WHATSAPP (`/univers/salons/apercu?chez=<clé>&place=<jeton>`) — l'image
// de `og:image` du lien d'une place libre (`docs/univers/decouvrir.md`, section 30).
//
// Le 21 novembre 2026, le propriétaire, devant l'invitation reçue : « j'ai la miniature sur WhatsApp qui parle d'un autre
// concept, donc il faut la refaire ». Ici, une vraie carte, 1200 × 630, en JPEG léger : « ClikMe », « Léa t'invite devant
// sa télé », « Une place t'attend à côté de sa figurine » ; à droite, la télé allumée, sa figurine assise et la place
// libre qui brille (« ＋ Ta place »). Un lien qui n'existe pas (ou de plus d'une semaine) : la même carte, sans figurine
// ni prénom (une clé seule ne montre la figurine de personne).
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { apercuDeLaPlace } from "@/lib/direct/salons-ouverts-serveur";
import { policesClikme } from "@/lib/og/clikme-og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const L = 1200;
const H = 630;
const FIG = { l: 300, h: 380 };

const svg = (corps: string, vue: string) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vue}">${corps}</svg>`).toString("base64")}`;
/** Un clap de cinéma (pour le bouton). */
const CLAP = svg(
  `<rect x="3" y="9" width="18" height="12" rx="2" fill="#FF2E9A"/><path d="M3 9l2.5-5 15 0-2.5 5z" fill="#2A0F1F"/><path d="M7 4l-2 5M12 4l-2 5M17 4l-2 5" stroke="#FFF4E6" stroke-width="1.6"/>`,
  "0 0 24 24",
);

/** Le ▶ de la télé. */
const LECTURE = svg(`<path d="M8 4.8v14.4a1.2 1.2 0 0 0 1.8 1l11.4-7.2a1.2 1.2 0 0 0 0-2L9.8 3.8A1.2 1.2 0 0 0 8 4.8Z" fill="#FFF4E6"/>`, "0 0 24 24");

/** Sa figurine assise (détourée, celle de sa maison), réduite, en PNG, posée sur le bas. */
async function figurine(octets: Buffer): Promise<string | null> {
  try {
    const png = await sharp(octets)
      .resize(FIG.l, FIG.h, { fit: "contain", position: "bottom", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  let a: Awaited<ReturnType<typeof apercuDeLaPlace>> = null;
  try {
    a = await apercuDeLaPlace(createAdminClient(), q.get("chez"), q.get("place"));
  } catch {
    a = null;
  }
  const [image, polices] = await Promise.all([a?.figurine ? figurine(a.figurine) : Promise.resolve(null), policesClikme()]);
  const prenom = a?.prenom || "";
  // (👥 une place réservée par un invité chez un proche : « Sam t'invite chez Léa », la figurine de Sam)
  const chez = (a?.chez || "").slice(0, 14);
  const grand = prenom.length > 11 ? 58 : 74;
  const tv = { x: 690, y: 70, l: 430, h: 242 };

  const carte = new ImageResponse(
    (
      <div
        style={{
          width: L,
          height: H,
          display: "flex",
          position: "relative",
          backgroundColor: "#12060F",
          backgroundImage: "radial-gradient(circle at 76% 40%, rgba(255,170,90,0.35) 0%, rgba(255,46,154,0.18) 32%, rgba(18,6,15,0) 62%)",
          fontFamily: "Poppins",
          color: "#FFF4E6",
        }}
      >
        {/* qui invite, et quoi faire */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 640, padding: "0 20px 0 72px" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>
            <span>Clik</span>
            <span style={{ color: "#FF4FAE" }}>Me</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
            {prenom ? <span style={{ fontSize: grand, fontWeight: 800, lineHeight: 1.05, color: "#FF4FAE" }}>{prenom}</span> : null}
            <span style={{ fontSize: prenom ? 50 : 60, fontWeight: 800, lineHeight: 1.18 }}>{prenom ? (chez ? `t’invite chez ${chez}` : "t’invite devant sa télé") : "Une place t’attend"}</span>
            <span style={{ fontSize: prenom ? 50 : 60, fontWeight: 800, lineHeight: 1.18 }}>{prenom ? "" : "devant la télé"}</span>
            <span style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.35, color: "#E5CFC0", marginTop: 14 }}>{prenom ? "Une place t’attend à côté de sa figurine : vous regardez des vidéos ensemble." : "Vos figurines côte à côte, devant les mêmes vidéos."}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", alignSelf: "flex-start", marginTop: 36, padding: "12px 30px 12px 14px", borderRadius: 999, backgroundColor: "#FFF4E6", color: "#2A0F1F", fontSize: 30, fontWeight: 800 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CLAP} width={44} height={44} alt="" style={{ marginRight: 14 }} />
            Prendre ma place
          </div>
        </div>

        {/* la télé allumée */}
        <div style={{ position: "absolute", left: tv.x, top: tv.y, width: tv.l, height: tv.h, display: "flex", borderRadius: 18, border: "8px solid #2b1a14", backgroundImage: "linear-gradient(135deg, #2d6fb8 0%, #7a3fa8 55%, #ff7a59 100%)", boxShadow: "0 0 60px rgba(120,160,255,0.45)" }} />
        <div style={{ position: "absolute", left: tv.x + tv.l / 2 - 40, top: tv.y + tv.h / 2 - 40, width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LECTURE} width={46} height={46} alt="" style={{ marginLeft: 6 }} />
        </div>
        {/* le sol */}
        <div style={{ position: "absolute", left: 640, top: 520, width: 560, height: 110, display: "flex", backgroundImage: "radial-gradient(ellipse at 50% 30%, rgba(255,190,120,0.30) 0%, rgba(18,6,15,0) 70%)" }} />
        {/* sa figurine, et la place libre qui brille */}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} width={FIG.l} height={FIG.h} alt="" style={{ position: "absolute", left: 690, top: H - FIG.h - 40 }} />
        ) : null}
        <div style={{ position: "absolute", left: image ? 990 : 840, top: 400, width: 170, height: 170, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "4px solid rgba(255,214,150,0.85)", backgroundColor: "rgba(255,214,150,0.10)", boxShadow: "0 0 50px rgba(255,190,110,0.55)" }}>
          <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, color: "#FFE2B0" }}>+</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#FFE2B0" }}>Ta place</span>
        </div>
      </div>
    ),
    { width: L, height: H, fonts: polices },
  );

  // (en JPEG : quelques dizaines de ko — un aperçu trop lourd, WhatsApp ne le montre pas)
  const jpeg = await sharp(Buffer.from(await carte.arrayBuffer()))
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "content-type": "image/jpeg", "cache-control": a ? "public, max-age=3600, s-maxage=86400" : "public, max-age=300", "x-robots-tag": "noindex" },
  });
}
