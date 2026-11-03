"use client";

/**
 * 🏆 MA COLLECTION — l'écran : le total (figurines, commerces, figurines d'or), puis une étagère par commerce, la plus
 * avancée d'abord. Ses familles et leurs collections viennent de `/api/direct/famille?moi=1` (`famillesDe`) : le
 * même calcul que sur chaque page de famille. Sans collection, la page explique et dit où commencer (`decouvrir.tsx`).
 */
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import type { MaFamille } from "@/lib/direct/famille";
import { deNom } from "@/lib/echanges/echanges";
import { CollectionDuCommerce, STYLES_COLLECTION } from "@/app/f/[slug]/collection";
import { ChronoEdition, Decouvrir, EnSavoirPlus, STYLES_DECOUVRIR, type CommerceACollectionner } from "./decouvrir";
import { MaFigurine } from "./ma-figurine";
import { figurinesEnTout } from "@/lib/direct/ma-figurine";

type Etat = { familles: MaFamille[] } | null;

export function MaCollection({ aujourdhui, commerces }: { aujourdhui: string; commerces: CommerceACollectionner[] }) {
  const [etat, setEtat] = useState<Etat>(null);
  const [ennui, setEnnui] = useState(false);

  useEffect(() => {
    let fini = false;
    fetch("/api/direct/famille?moi=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { familles?: MaFamille[] }) => !fini && setEtat({ familles: Array.isArray(j.familles) ? j.familles : [] }))
      .catch(() => !fini && setEnnui(true));
    return () => {
      fini = true;
    };
  }, []);

  const avec = (etat?.familles ?? []).filter((f) => f.collection).sort((a, b) => (b.collection!.gagnees + b.collection!.trophees.length * 10) - (a.collection!.gagnees + a.collection!.trophees.length * 10));
  const figurines = figurinesEnTout(avec); // (les collections finies comptent leurs 10, comme pour « Ma figurine »)
  const ors = avec.reduce((n, f) => n + f.collection!.trophees.length, 0);

  return (
    <main className="mc">
      <header className="mc-tete">
        <Link className="mc-logo" href="/">
          Clik<b>Me</b>
        </Link>
        <h1>Ma collection</h1>
        <p className="mc-dit">Une visite chez un commerce ClikMe, une figurine. À 10, la figurine d’or.</p>
        {etat && avec.length > 0 && (
          <div className="mc-totaux">
            <span>
              <b>{figurines}</b> figurine{figurines > 1 ? "s" : ""}
            </span>
            <span>
              <b>{avec.length}</b> commerce{avec.length > 1 ? "s" : ""}
            </span>
            {ors > 0 && (
              <span className="or">
                🏆 <b>{ors}</b> d’or
              </span>
            )}
          </div>
        )}
      </header>

      {!etat && !ennui && (
        <div className="mc-attente" aria-label="Chargement de ta collection">
          {[0, 1, 2].map((k) => (
            <i key={k} style={{ "--d": `${k * 0.15}s` } as CSSProperties} />
          ))}
        </div>
      )}
      {ennui && <p className="mc-vide">Ta collection n’a pas pu s’afficher. Réessaie dans un instant.</p>}

      {(ennui || (etat && avec.length === 0)) && <Decouvrir aujourdhui={aujourdhui} commerces={commerces} />}

      {avec.length > 0 && (
        <div className="mc-chrono">
          <ChronoEdition aujourdhui={aujourdhui} figurine={avec[0].figurine} />
        </div>
      )}

      {avec.length > 0 && <MaFigurine />}

      <div className="mc-etageres">
      {avec.map((f) => (
        <article key={f.slug} className="mc-commerce">
          <div className="mc-commerce-tete">
            <a href={`/f/${encodeURIComponent(f.slug)}`}>
              <b>{f.nom}</b>
              <small>Fantôme n°{f.numero} · sa page ›</small>
            </a>
          </div>
          <CollectionDuCommerce
            collection={f.collection!}
            titre="Ta collection"
            nom={f.nom}
            de={deNom(f.nom)}
            figurine={f.figurine ?? "/direct/double/pied/salut-1.webp"}
            cadeau={f.cadeau}
            slug={f.slug}
            compact
            lienCollection={false}
          />
        </article>
      ))}
      </div>

      {avec.length > 0 && <EnSavoirPlus aujourdhui={aujourdhui} commerces={commerces.filter((c) => !avec.some((f) => f.slug === c.slug))} />}

      <p className="mc-regle">
        On ne gagne une figurine qu’en venant : elles ne s’achètent pas. Une édition manquée est manquée ; les éditions rares se gagnent quand le commerce annonce une
        place libre.
      </p>
      <style>{STYLES_MC + STYLES_COLLECTION + STYLES_DECOUVRIR}</style>
    </main>
  );
}

const STYLES_MC = `
.mc{min-height:100dvh;box-sizing:border-box;padding:calc(18px + env(safe-area-inset-top)) 0 calc(28px + env(safe-area-inset-bottom));max-width:1180px;margin:0 auto;
  background:radial-gradient(90% 40% at 50% 0%,rgba(255,46,154,.25),transparent 70%),linear-gradient(180deg,#1E0C18,#12060F 50%);color:#FFF4E6;
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
body{background:#12060F}
.mc-tete{padding:0 18px;text-align:center}
.mc-logo{display:inline-block;font-size:18px;font-weight:900;color:#FFF4E6;text-decoration:none}
.mc-logo b{color:#FF2E9A}
.mc-tete h1{margin:14px 0 0;font-size:40px;line-height:1.02;font-weight:900;letter-spacing:-.03em;background:linear-gradient(135deg,#fff,#FFC8E6 45%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent;animation:mc-entre .6s cubic-bezier(.2,.9,.3,1) both}
.mc-dit{margin:6px 0 0;color:#D9C3CB}
.mc-totaux{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:16px 0 0}
.mc-totaux span{padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:13px;color:#D9C3CB;animation:mc-entre .5s cubic-bezier(.2,.9,.3,1) both}
.mc-totaux span:nth-child(2){animation-delay:.08s}.mc-totaux span:nth-child(3){animation-delay:.16s}
.mc-totaux b{color:#FFF4E6;font-size:15px}
.mc-totaux .or{background:linear-gradient(135deg,rgba(242,196,107,.3),rgba(184,128,30,.2));border-color:rgba(242,196,107,.6)}
.mc-commerce{margin:22px 16px 0;animation:mc-entre .6s cubic-bezier(.2,.9,.3,1) both}
.mc-commerce:nth-of-type(2){animation-delay:.1s}.mc-commerce:nth-of-type(3){animation-delay:.2s}
.mc-commerce-tete a{display:flex;flex-direction:column;margin:0 4px 8px;color:#FFF4E6;text-decoration:none}
.mc-commerce-tete b{font-size:19px;font-weight:900}
.mc-commerce-tete small{font-size:12.5px;color:#A88E99}
.mc-vide{margin:28px 18px 0;padding:22px 18px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);text-align:center;color:#D9C3CB}
.mc-vide b{display:block;margin-top:14px;font-size:19px;color:#FFF4E6}
.mc-vide p{margin:6px 0 0}
.mc-attente{display:grid;gap:14px;margin:24px 16px 0}
.mc-attente i{height:150px;border-radius:24px;background:linear-gradient(100deg,rgba(255,255,255,.04) 30%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear var(--d) infinite}
.mc-regle{margin:26px 20px 0;font-size:12px;line-height:1.5;color:#8D7580;text-align:center}
.mc-etageres{display:grid;grid-template-columns:minmax(0,1fr)}
.mc-chrono{padding:0 16px}
@media (min-width:860px){
  .mc{padding-top:calc(28px + env(safe-area-inset-top))}
  .mc-tete h1{font-size:64px}
  .mc-dit{font-size:17px}
  .mc-etageres{grid-template-columns:repeat(2,minmax(0,1fr));gap:0 8px;padding:0 16px}
  .mc-chrono{padding:0 32px}
  .mc-regle{font-size:13px;max-width:640px;margin-left:auto;margin-right:auto}
}
@keyframes mc-entre{from{opacity:0;transform:translateY(14px)}}
@keyframes mc-reflet{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.mc *{animation:none!important}}
`;
