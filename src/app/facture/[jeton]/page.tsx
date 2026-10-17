// 📄 UNE FACTURE D'ÉCHANGE PAR SON LIEN — `/facture/<jeton>`, depuis « Mes factures » (chez celui qui
// l'a émise et chez celui qui l'a reçue). Le lien est secret : on peut le donner à son comptable.
// Voir `facture-vue.tsx` et `lib/echanges/factures-serveur.ts`.
import type { Metadata, Viewport } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireFacture } from "@/lib/echanges/factures-serveur";
import { MARQUE } from "@/lib/marque";
import { FactureVue, StylesFacture } from "../facture-vue";
import { Imprimer } from "./imprimer";

export const dynamic = "force-dynamic";

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#120C09" };

export const metadata: Metadata = {
  title: { absolute: `Facture d’échange — ${MARQUE}` },
  robots: { index: false, follow: false },
};

const STYLES = `
body{background:#120C09;margin:0;}
.fp{min-height:100dvh;padding:20px 16px 40px;display:flex;flex-direction:column;align-items:center;gap:16px;}
.fp-imprimer{height:52px;padding:0 24px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:800;font-size:16px;cursor:pointer;
  font-family:var(--font-clikme),system-ui,sans-serif;}
.fp-vide{color:#FFF4E6;text-align:center;font-family:system-ui,sans-serif;max-width:380px;margin-top:20vh;}
.fp-vide h1{font-size:22px;margin:0 0 8px;}
.fp-vide p{color:#CDB8A4;margin:0;line-height:1.5;}
@media print{body{background:#fff;}.fp{padding:0;}.fp-imprimer{display:none;}@page{size:A4;margin:16mm;}}
`;

export default async function Page({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const facture = await lireFacture(createAdminClient(), String(jeton ?? "")).catch(() => null);
  return (
    <main className="fp">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <StylesFacture />
      {facture ? (
        <>
          <FactureVue facture={facture} />
          <Imprimer />
        </>
      ) : (
        <div className="fp-vide">
          <h1>Facture introuvable</h1>
          <p>Ce lien ne correspond à aucune facture d’échange. Retrouve tes factures dans ton comptoir, « Mes factures ».</p>
        </div>
      )}
    </main>
  );
}
