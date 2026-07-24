"use client";

// « Le collectif de {ville} » — côté CLIENT. Le site donne accès aux partenaires
// complémentaires (le vrai plus : un concierge pour toute la ville). Interaction
// AUTONOME (on n'ouvre pas le chat de réservation, qui posait la mauvaise
// question) : le visiteur choisit ce qu'il cherche → confirmation.
// HONNÊTETÉ : le collectif se construit (pas de faux commerce nommé), aucune
// donnée partagée sans accord. Commerce uniquement (déonto).
import { useState } from "react";

const CATS = [
  { ic: "💄", t: "Maquillage" },
  { ic: "💇", t: "Coiffure" },
  { ic: "📸", t: "Photographe" },
  { ic: "🌸", t: "Fleuriste" },
  { ic: "🍽️", t: "Traiteur" },
  { ic: "🎉", t: "Événementiel" },
];

export function CollectifSection({ slug, ville, accent, nom }: { slug: string; ville: string; accent: string; nom: string }) {
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!sel) return;
    setDone(true);
    try {
      fetch("/api/site-internet/apercu/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prenom: "", tel: "", pourQui: `Collectif · ${sel}`, premiere: "", slot: "" }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
  };

  return (
    <section className="collectif" id="mq-collectif" style={{ ["--cx" as string]: accent }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc .collectif{padding:0;}
          .mqc .cl-card{position:relative;overflow:hidden;padding:34px 22px 30px;background:linear-gradient(160deg,#141A2E,#0B0F1A);color:#EAF0FA;}
          .mqc .cl-card::before{content:"";position:absolute;inset:0;background:radial-gradient(420px 220px at 12% 0%,color-mix(in srgb,var(--cx) 60%,transparent),transparent 60%),radial-gradient(420px 240px at 100% 100%,rgba(127,230,192,.14),transparent 60%);pointer-events:none;}
          .mqc .cl-in{position:relative;z-index:1;max-width:460px;margin:0 auto;text-align:center;}
          .mqc .cl-k{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8FA3C8;font-weight:800;}
          .mqc .cl-h{font-family:Georgia,serif;font-size:25px;font-weight:600;line-height:1.14;margin-top:8px;}
          .mqc .cl-p{font-size:13.5px;line-height:1.6;color:#B8C4DC;margin-top:11px;}
          .mqc .cl-p b{color:#fff;}
          .mqc .cl-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin-top:18px;}
          .mqc .cl-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#EAF0FA;border-radius:999px;padding:10px 15px;font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;transition:.15s;}
          .mqc .cl-chip:hover{border-color:rgba(255,255,255,.4);}
          .mqc .cl-chip.on{background:#7FE6C0;color:#0B2A20;border-color:#7FE6C0;font-weight:800;}
          .mqc .cl-cta{margin-top:18px;background:#fff;color:#141A2E;border:none;border-radius:26px;padding:14px 26px;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 14px 30px -14px rgba(0,0,0,.6);}
          .mqc .cl-cta:disabled{opacity:.5;cursor:not-allowed;}
          .mqc .cl-done{margin-top:18px;background:rgba(127,230,192,.12);border:1px solid rgba(127,230,192,.3);border-radius:15px;padding:18px;font-size:14px;line-height:1.5;color:#DFF6EC;}
          .mqc .cl-done b{color:#fff;}
          .mqc .cl-note{font-size:11.5px;color:#8296B6;margin-top:14px;line-height:1.5;}
          @media (min-width:860px){.mqc .cl-card{padding:56px 24px;} .mqc .cl-h{font-size:32px;}}
          `,
        }}
      />
      <div className="cl-card">
        <div className="cl-in">
          <div className="cl-k">🤝 Le collectif de {ville}</div>
          <div className="cl-h">Besoin d&apos;autre chose à {ville}&nbsp;?</div>
          <div className="cl-p">
            {nom} fait partie du collectif des <b>meilleurs commerçants et artisans de {ville}</b>. Dites-nous ce que
            vous cherchez — on vous oriente vers le bon partenaire.
          </div>
          {done ? (
            <div className="cl-done">✓ Parfait. Je cherche le meilleur <b>{sel?.toLowerCase()}</b> de {ville} pour vous — le collectif vous recontacte.</div>
          ) : (
            <>
              <div className="cl-chips">
                {CATS.map((c) => (
                  <button key={c.t} type="button" className={`cl-chip${sel === c.t ? " on" : ""}`} onClick={() => setSel(c.t)}>{c.ic} {c.t}</button>
                ))}
              </div>
              <button type="button" className="cl-cta" onClick={submit} disabled={!sel}>
                🤝 Demander au collectif{sel ? ` — ${sel}` : ""}
              </button>
            </>
          )}
          <div className="cl-note">Le collectif se construit commerce par commerce à {ville}. Aucune donnée n&apos;est partagée sans votre accord.</div>
        </div>
      </div>
    </section>
  );
}
