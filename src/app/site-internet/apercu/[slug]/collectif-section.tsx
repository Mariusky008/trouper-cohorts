"use client";

// « Le collectif de {ville} » — côté CLIENT. Le vrai plus : un concierge pour toute
// la ville. Interaction AUTONOME et IMMÉDIATE : le visiteur choisit ce qu'il
// cherche → une proposition CLIQUABLE apparaît aussitôt (pas d'attente, pas de
// « on vous recontacte »).
// HONNÊTETÉ (règle absolue) : le collectif se construit commerce par commerce ; en
// attendant qu'un partenaire soit rattaché, on emmène le visiteur vers les mieux
// notés de {ville} sur Google (lien réel, vérifiable). Aucun faux commerce nommé,
// aucune donnée partagée sans accord. Commerce uniquement (déonto).
import { useState } from "react";

const FALLBACK_CATS = [
  { ic: "💄", t: "Maquillage" },
  { ic: "💇", t: "Coiffure" },
  { ic: "📸", t: "Photographe" },
  { ic: "🌸", t: "Fleuriste" },
  { ic: "🍽️", t: "Traiteur" },
  { ic: "🎉", t: "Événementiel" },
];

export function CollectifSection({ slug, ville, accent, nom, partners }: { slug: string; ville: string; accent: string; nom: string; partners?: Array<{ ic: string; t: string }> }) {
  const CATS = partners && partners.length ? partners : FALLBACK_CATS;
  const [sel, setSel] = useState<{ ic: string; t: string } | null>(null);

  const pick = (c: { ic: string; t: string }) => {
    setSel(c);
    // Signal best-effort pour le pro (aucun blocage, aucune attente côté visiteur).
    try {
      fetch("/api/site-internet/apercu/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prenom: "", tel: "", pourQui: `Collectif · ${c.t}`, premiere: "", slot: "" }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
  };

  const mapsHref = (cat: string) =>
    `https://www.google.com/maps/search/${encodeURIComponent(`${cat} ${ville}`)}`;

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
          /* Proposition immédiate (apparition) */
          .mqc .cl-reco{margin-top:18px;text-align:left;background:linear-gradient(155deg,#182240,#0B0F1A);border:1px solid rgba(127,230,192,.3);border-radius:17px;padding:16px 16px 15px;animation:clReco .5s cubic-bezier(.22,1,.36,1);box-shadow:0 24px 50px -20px rgba(0,0,0,.7);}
          @keyframes clReco{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
          .mqc .cl-reco-k{display:flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .mqc .cl-reco-t{font-size:14.5px;line-height:1.45;color:#EAF0FA;margin-top:9px;}
          .mqc .cl-reco-t b{color:#fff;font-weight:700;}
          .mqc .cl-reco-go{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;margin-top:13px;background:#7FE6C0;color:#0B2A20;border-radius:12px;padding:13px;font-size:14px;font-weight:800;box-shadow:0 14px 28px -12px rgba(127,230,192,.6);}
          .mqc .cl-reco-go:active{transform:translateY(1px);}
          .mqc .cl-reco-alt{display:block;text-align:center;margin-top:10px;font-size:12px;color:#8FA3C8;}
          .mqc .cl-reco-alt button{background:none;border:none;color:#8FA3C8;font-family:inherit;font-size:12px;cursor:pointer;text-decoration:underline;padding:0;}
          .mqc .cl-note{font-size:11.5px;color:#8296B6;margin-top:16px;line-height:1.5;}
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
            vous cherchez — on vous oriente tout de suite.
          </div>
          <div className="cl-chips">
            {CATS.map((c) => (
              <button key={c.t} type="button" className={`cl-chip${sel?.t === c.t ? " on" : ""}`} onClick={() => pick(c)}>{c.ic} {c.t}</button>
            ))}
          </div>
          {sel && (
            <div className="cl-reco" key={sel.t}>
              <div className="cl-reco-k">✨ Ma recommandation</div>
              <div className="cl-reco-t">
                Pour {sel.ic} <b>{sel.t.toLowerCase()}</b> à {ville}, voici les <b>mieux noté·es</b> — je vous y emmène tout de suite.
              </div>
              <a className="cl-reco-go" href={mapsHref(sel.t)} target="_blank" rel="noreferrer">
                Voir les meilleur·es {sel.t.toLowerCase()} de {ville} →
              </a>
              <div className="cl-reco-alt">
                <button type="button" onClick={() => setSel(null)}>chercher autre chose</button>
              </div>
            </div>
          )}
          <div className="cl-note">Le collectif se construit commerce par commerce à {ville}&nbsp;: dès qu&apos;un partenaire vous est rattaché, il apparaît ici en premier. Aucune donnée n&apos;est partagée sans accord.</div>
        </div>
      </div>
    </section>
  );
}
