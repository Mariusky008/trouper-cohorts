// 🖨️ LE CARTON « REJOINS LA FAMILLE » — à poser au comptoir (A6) ou dans la vitrine (A5).
//
// C'est le troisième chemin vers sa page de la famille (`/f/<lien>`), après sa bio et la fin de ses
// vidéos : ceux qui sont déjà chez lui. Son nom, son fantôme qui salue, « Ses fantômes ont les bons
// plans en premier », et le QR de sa page — fabriqué ici, en SVG net, imprimable. Un geste : imprimer
// (ou « enregistrer en PDF »).
//
// Seulement pour un commerce client de ClikMe, comme sa page : on n'imprime pas d'invitation au nom
// d'un commerçant qui n'a rien demandé.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_HOST, SITE_URL } from "@/lib/site-url";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { tenueDu } from "@/lib/direct/double-metiers";
import { BarreCarton, type FormatCarton } from "./imprimer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon carton « Rejoins la famille »",
  robots: { index: false, follow: false },
};

const s = (v: unknown) => String(v ?? "").trim();

async function qrSvg(cible: string): Promise<string> {
  try {
    const svg = await QRCode.toString(cible, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2C0912", light: "#00000000" } });
    return svg.replace(/<\?xml[^>]*\?>/i, "").trim();
  } catch {
    return "";
  }
}

export default async function Carton({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ format?: string }> }) {
  const [{ slug }, { format }] = await Promise.all([params, searchParams]);
  const f: FormatCarton = format === "a5" ? "a5" : "a6";
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) notFound();
  const { data } = await createAdminClient().from("human_vitrine_sites").select("slug, business_name, activite, est_client").eq("slug", slug).maybeSingle();
  const row = data as Record<string, unknown> | null;
  const nom = s(row?.business_name);
  if (!row || row.est_client !== true || !nom) notFound();
  const metier = s(row.activite);
  const lien = `${SITE_URL}/f/${encodeURIComponent(slug)}`;
  const svg = await qrSvg(lien);
  const hote = `${tenueDu({ branche: brancheDuMetier(metier), metier })?.enPied ?? "/direct/double/pied/"}salut-1.webp`;

  return (
    <main className="ct">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.ct{--encre:#2C0912;--doux:#7A5560;--rose:#FF2E9A;--papier:#FFF8EE;min-height:100vh;display:flex;flex-direction:column;align-items:center;gap:18px;
  padding:20px 16px 48px;background:#E9E3DA;color:var(--encre);font-family:var(--font-clikme),Poppins,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.ct-barre{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.ct-barre a{padding:9px 14px;border-radius:999px;border:1px solid #D6CFC4;background:#fff;color:var(--encre);font-size:13px;font-weight:700;text-decoration:none}
.ct-barre a.on{background:var(--encre);border-color:var(--encre);color:#fff}
.ct-barre button{padding:9px 16px;border:0;border-radius:999px;background:var(--rose);color:#fff;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.ct-carte{--k:1;width:calc(105mm * var(--k));height:calc(148mm * var(--k));box-sizing:border-box;position:relative;overflow:hidden;background:var(--papier);
  border-radius:4px;box-shadow:0 24px 60px -28px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:calc(13mm * var(--k)) calc(8mm * var(--k)) calc(6mm * var(--k))}
.ct-carte.a5{--k:1.4142}
.ct-carte::before{content:"";position:absolute;left:0;right:0;top:0;height:calc(7mm * var(--k));background:var(--rose)}
.ct-sur{margin:0;font-size:calc(10pt * var(--k));font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--rose)}
.ct-nom{margin:calc(1.5mm * var(--k)) 0 0;font-family:var(--font-enseigne),"Playfair Display",Georgia,serif;font-style:italic;font-weight:700;font-size:calc(21pt * var(--k));line-height:1.05}
.ct-fantome{height:calc(25mm * var(--k));width:auto;margin-top:calc(2mm * var(--k))}
.ct-promesse{margin:calc(1mm * var(--k)) 0 0;font-size:calc(10.5pt * var(--k));font-weight:700;line-height:1.3}
.ct-qr{width:calc(42mm * var(--k));height:calc(42mm * var(--k));margin-top:calc(4mm * var(--k))}
.ct-qr svg{width:100%;height:100%;display:block}
.ct-scanne{margin:calc(3mm * var(--k)) 0 0;font-size:calc(9pt * var(--k));font-weight:700}
.ct-lien{margin:calc(1mm * var(--k)) 0 0;font-size:calc(8pt * var(--k));color:var(--doux)}
.ct-pied{margin-top:auto;font-size:calc(7pt * var(--k));color:var(--doux);letter-spacing:.04em}
/* À l'écran d'un téléphone, le carton se réduit pour tenir ; à l'impression, il garde sa vraie taille. */
@media screen and (max-width:440px){.ct-carte.a6{zoom:.86}}
@media screen and (max-width:640px){.ct-carte.a5{zoom:.6}}
@media print{
  @page{size:${f === "a5" ? "A5" : "A6"} portrait;margin:0}
  html,body{background:#fff}
  .ct{padding:0;background:#fff;min-height:0}
  .ct-barre{display:none}
  .ct-carte{box-shadow:none;border-radius:0}
}`,
        }}
      />
      <BarreCarton format={f} slug={slug} />
      <div className={`ct-carte ${f}`}>
        <p className="ct-sur">👻 Rejoins la famille</p>
        <h1 className="ct-nom">{nom}</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ct-fantome" src={hote} alt="" />
        <p className="ct-promesse">
          Ouvre une cage, entre dans sa famille.
          <br />
          Ses fantômes ont les bons plans en premier.
        </p>
        {svg && <div className="ct-qr" aria-label={`Le lien de sa page : ${lien}`} dangerouslySetInnerHTML={{ __html: svg }} />}
        <p className="ct-scanne">Scanne avec l’appareil photo · sans appli</p>
        <p className="ct-lien">
          {SITE_HOST}/f/{slug}
        </p>
        <p className="ct-pied">ClikMe</p>
      </div>
    </main>
  );
}
