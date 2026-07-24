"use client";

// « Le collectif de {ville} » — côté CLIENT. Le vrai plus : un concierge pour toute
// la ville. Interaction AUTONOME et IMMÉDIATE : le visiteur choisit ce qu'il
// cherche → une proposition apparaît aussitôt. Au clic, une pop-up EXPLIQUE le
// mécanisme (le visiteur est emmené sur le SITE d'un partenaire du collectif, pas
// sur un annuaire) et ce que le pro y gagne (réciprocité : on le recommande en
// retour → légitimité + son nom qui circule).
// HONNÊTETÉ (règle absolue) : le collectif se construit commerce par commerce ;
// aucun faux commerce nommé, aucune donnée partagée sans accord. La réciprocité
// (« ce que vous gagnez ») n'est montrée qu'en mode maquette (au pro), jamais à un
// vrai visiteur. Commerce uniquement (déonto).
import { useState } from "react";

const FALLBACK_CATS = [
  { ic: "💄", t: "Maquillage" },
  { ic: "💇", t: "Coiffure" },
  { ic: "📸", t: "Photographe" },
  { ic: "🌸", t: "Fleuriste" },
  { ic: "🍽️", t: "Traiteur" },
  { ic: "🎉", t: "Événementiel" },
];

export function CollectifSection({ ville, accent, nom, partners, published }: { slug: string; ville: string; accent: string; nom: string; partners?: Array<{ ic: string; t: string }>; published: boolean }) {
  const CATS = partners && partners.length ? partners : FALLBACK_CATS;
  const [sel, setSel] = useState<{ ic: string; t: string } | null>(null);
  const [modal, setModal] = useState<{ ic: string; t: string } | null>(null);

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
          .mqc .cl-reco-go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:none;font-family:inherit;cursor:pointer;margin-top:13px;background:#7FE6C0;color:#0B2A20;border-radius:12px;padding:13px;font-size:14px;font-weight:800;box-shadow:0 14px 28px -12px rgba(127,230,192,.6);}
          .mqc .cl-reco-go:active{transform:translateY(1px);}
          .mqc .cl-reco-alt{display:block;text-align:center;margin-top:10px;font-size:12px;color:#8FA3C8;}
          .mqc .cl-reco-alt button{background:none;border:none;color:#8FA3C8;font-family:inherit;font-size:12px;cursor:pointer;text-decoration:underline;padding:0;}
          .mqc .cl-note{font-size:11.5px;color:#8296B6;margin-top:16px;line-height:1.5;}
          /* Pop-up « le collectif en action » */
          .mqc .cl-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(7,9,16,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:clFade .25s ease;}
          @keyframes clFade{from{opacity:0}to{opacity:1}}
          .mqc .cl-mbox{position:relative;max-width:360px;width:100%;text-align:left;background:linear-gradient(160deg,#1B2340,#0B0F1A);border:1px solid rgba(127,230,192,.28);border-radius:20px;padding:22px 20px 20px;color:#EAF0FA;box-shadow:0 40px 90px -24px rgba(0,0,0,.8);animation:clPop .4s cubic-bezier(.22,1,.36,1);}
          @keyframes clPop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
          .mqc .cl-mx{position:absolute;top:12px;right:14px;background:none;border:none;color:#6E7BA0;font-size:16px;cursor:pointer;font-family:inherit;padding:2px;}
          .mqc .cl-mx:hover{color:#B8C4DC;}
          .mqc .cl-mk{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .mqc .cl-mh{font-family:Georgia,serif;font-size:20px;font-weight:600;line-height:1.2;margin-top:9px;}
          .mqc .cl-mp{font-size:13.5px;line-height:1.6;color:#C7D2E6;margin-top:12px;}
          .mqc .cl-mp b{color:#fff;font-weight:700;}
          .mqc .cl-mgain{margin-top:14px;background:rgba(127,230,192,.09);border:1px solid rgba(127,230,192,.24);border-radius:13px;padding:13px 14px;}
          .mqc .cl-mgain-h{display:flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .mqc .cl-mgain-p{font-size:13px;line-height:1.55;color:#DFF6EC;margin-top:8px;}
          .mqc .cl-mgain-p b{color:#fff;font-weight:700;}
          .mqc .cl-mgo{margin-top:16px;width:100%;border:none;font-family:inherit;cursor:pointer;background:#7FE6C0;color:#0B2A20;border-radius:12px;padding:13px;font-size:14px;font-weight:800;}
          .mqc .cl-mgo:active{transform:translateY(1px);}
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
            vous cherchez — on vous oriente vers le bon partenaire, tout de suite.
          </div>
          <div className="cl-chips">
            {CATS.map((c) => (
              <button key={c.t} type="button" className={`cl-chip${sel?.t === c.t ? " on" : ""}`} onClick={() => setSel(c)}>{c.ic} {c.t}</button>
            ))}
          </div>
          {sel && (
            <div className="cl-reco" key={sel.t}>
              <div className="cl-reco-k">✨ Ma recommandation</div>
              <div className="cl-reco-t">
                Pour {sel.ic} <b>{sel.t.toLowerCase()}</b> à {ville}, je connais le·la partenaire du collectif qu&apos;il vous faut.
              </div>
              <button type="button" className="cl-reco-go" onClick={() => setModal(sel)}>
                M&apos;emmener chez ce partenaire →
              </button>
              <div className="cl-reco-alt">
                <button type="button" onClick={() => setSel(null)}>chercher autre chose</button>
              </div>
            </div>
          )}
          <div className="cl-note">Le collectif se construit commerce par commerce à {ville}&nbsp;: dès qu&apos;un partenaire vous est rattaché, il apparaît ici en premier. Aucune donnée n&apos;est partagée sans accord.</div>
        </div>
      </div>

      {modal && (
        <div className="cl-modal" onClick={() => setModal(null)}>
          <div className="cl-mbox" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="cl-mx" onClick={() => setModal(null)} aria-label="Fermer">✕</button>
            <div className="cl-mk">🤝 Le collectif en action</div>
            <div className="cl-mh">Direction le site de votre {modal.t.toLowerCase()}</div>
            <div className="cl-mp">
              Sur votre vrai site, ce bouton emmène votre visiteur <b>directement sur le site d&apos;un·e {modal.t.toLowerCase()} du collectif de {ville}</b> — un·e partenaire que <b>vous avez choisi·e</b>. Jamais un annuaire, jamais un concurrent&nbsp;: un commerce de confiance, comme vous.
            </div>
            {!published && (
              <div className="cl-mgain">
                <div className="cl-mgain-h">🎁 Ce que ça vous rapporte</div>
                <div className="cl-mgain-p">
                  C&apos;est <b>donnant-donnant</b>. En envoyant ce client à un·e partenaire, il·elle fait pareil pour vous&nbsp;: quand quelqu&apos;un cherche ce que vous faites, <b>c&apos;est vous qu&apos;on recommande</b>. Résultat&nbsp;: votre nom circule dans {ville}, votre <b>légitimité grandit</b>, et vous récupérez des clients que vous n&apos;auriez jamais vus.
                </div>
              </div>
            )}
            <button type="button" className="cl-mgo" onClick={() => setModal(null)}>{published ? "Fermer" : "J'ai compris"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
