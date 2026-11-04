"use client";

/**
 * 🏆 MA COLLECTION — l'écran, refait le 4 novembre 2026 (« on s'y perd, on ne sait pas quoi y faire, ça manque de
 * clarté et de modernité ; la section qui devrait être le wow de la page, “Ta propre figurine”, n'est pas du tout ce
 * que je voulais »). UNE HISTOIRE, DANS L'ORDRE :
 *   1. TA FIGURINE QUI PARLE (le wow) : la démonstration (la figurine du propriétaire), qu'on fait parler soi-même —
 *      son émotion, son texte, sa voix — et qu'on envoie sur WhatsApp ; puis « Crée ta figurine », dès le départ, et la
 *      tienne, avec une option de plus à chaque achat (`ma-figurine.tsx`) ;
 *   2. L'ÉDITION DU MOIS : ce qui se gagne maintenant, et le temps qui reste ;
 *   3. MES FIGURINES : l'album, une page par commerce (`album.tsx`) ;
 *   4. OÙ LES GAGNER : les commerces ClikMe.
 * (« Ce que tu gagnes » et ses paliers sont partis le 4 novembre 2026 : l'album les montre là où ils comptent.)
 * Ses familles viennent de `/api/direct/famille?moi=1` (`famillesDe`) ; sa figurine et la démonstration, de
 * `/api/direct/ma-figurine`.
 */
import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { MaFamille } from "@/lib/direct/famille";
import { STYLES_COLLECTION } from "@/app/f/[slug]/collection";
import { Album, STYLES_ALBUM } from "./album";
import { ChronoEdition, OuGagner, STYLES_DECOUVRIR, type CommerceACollectionner } from "./decouvrir";
import { Annonce, EnvoiPhoto, FabricationAuto, STYLES_MA_FIGURINE, StudioDemo, StudioMoi } from "./ma-figurine";
import { figurinesEnTout, type DemoFigurine, type EtatMaFigurine } from "@/lib/direct/ma-figurine";

type Familles = { familles: MaFamille[] } | null;
type Figurine = { etat: EtatMaFigurine | null; demo: DemoFigurine | null } | null;

export function MaCollection({ aujourdhui, commerces, villes = [] }: { aujourdhui: string; commerces: CommerceACollectionner[]; villes?: { slug: string; nom: string }[] }) {
  const [familles, setFamilles] = useState<Familles>(null);
  const [ennui, setEnnui] = useState(false);
  const [figurine, setFigurine] = useState<Figurine>(null);
  // (stable : la fabrication rappelle le serveur dans un effet qui en dépend)
  const poserEtat = useCallback((e: EtatMaFigurine) => setFigurine((f) => (f ? { ...f, etat: e } : f)), []);

  useEffect(() => {
    let fini = false;
    fetch("/api/direct/famille?moi=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { familles?: MaFamille[] }) => !fini && setFamilles({ familles: Array.isArray(j.familles) ? j.familles : [] }))
      .catch(() => !fini && setEnnui(true));
    fetch("/api/direct/ma-figurine", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { etat?: EtatMaFigurine; demo?: DemoFigurine }) => {
        if (fini) return;
        setFigurine({ etat: j.etat ?? null, demo: j.demo ?? null });
        // 🎭 la démonstration (montrée à qui n'a pas encore la sienne) n'a pas toutes ses expressions : la première
        // visite les fait faire — les visages, puis leurs bouches ouvertes —, une fois en tout
        if (j.demo && !j.demo.complete && j.etat?.etape !== "prete")
          void (async () => {
            for (let k = 0; k < 2 && !fini; k++) {
              const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "demo", quoi: "expressions" }) });
              const x = (await r.json().catch(() => ({}))) as { demo?: DemoFigurine; error?: string; enCours?: boolean };
              if (fini) return;
              if (x.demo) setFigurine((f) => (f ? { ...f, demo: x.demo! } : f));
              if (!r.ok || x.error || x.enCours || x.demo?.complete) return;
            }
          })().catch(() => undefined);
      })
      .catch(() => !fini && setFigurine({ etat: null, demo: null }));
    return () => {
      fini = true;
    };
  }, []);

  const avec = (familles?.familles ?? [])
    .filter((f) => f.collection)
    .sort((a, b) => b.collection!.gagnees + b.collection!.trophees.length * 10 - (a.collection!.gagnees + a.collection!.trophees.length * 10));
  const total = figurinesEnTout(avec); // (les collections finies comptent leurs 10, comme pour « Ma figurine »)
  const ors = avec.reduce((n, f) => n + f.collection!.trophees.length, 0);
  const etat = figurine?.etat ?? null;
  const prete = etat?.etape === "prete" && etat.neutre && etat.parle;

  return (
    <main className="mc">
      <header className="mc-barre">
        <Link className="mc-logo" href="/">
          Clik<b>Me</b>
        </Link>
        <span className="mc-moi">
          Ma collection
          {familles && avec.length > 0 && (
            <>
              {" · "}
              <b>{total}</b>
              {ors > 0 && <em> · 🏆 {ors}</em>}
            </>
          )}
        </span>
      </header>

      {/* 1. LE WOW : TA FIGURINE QUI PARLE */}
      <section className="mc-heros" aria-labelledby="mc-titre">
        <small className="mc-sur">{prete ? "TA FIGURINE" : "TA FIGURINE QUI PARLE"}</small>
        <h1 id="mc-titre">{prete ? "Fais-la parler." : "Ta figurine. Tes mots. Ses émotions."}</h1>
        <p className="mc-dit">
          {prete
            ? "Choisis ce qu’elle ressent, écris ce qu’elle dit, et envoie-la à qui tu veux."
            : "Essaie-la : choisis son émotion, écris ce qu’elle dit, envoie-la. Puis crée la tienne avec ta photo : c’est gratuit, et chaque achat chez un commerce ClikMe lui ajoute une option."}
        </p>
        {!figurine ? (
          <div className="mc-attente" aria-label="Chargement">
            <i style={{ "--d": "0s" } as CSSProperties} />
          </div>
        ) : prete ? (
          <StudioMoi key={etat!.neutre} etat={etat!} onEtat={poserEtat} />
        ) : etat?.etape === "fabrication" ? (
          <>
            {etat.auto ? (
              <FabricationAuto etat={etat} onEtat={poserEtat} />
            ) : (
              <Annonce titre="On fabrique ta figurine 🛠️" emoji="📸">
                Ta photo est bien arrivée. Ta figurine sera ici dans quelques jours : tu pourras la faire parler et l’envoyer à tes proches.
              </Annonce>
            )}
            <h2 className="mc-avant">En attendant, fais parler la démonstration</h2>
            <StudioDemo demo={figurine.demo} />
          </>
        ) : etat?.etape === "bientot" ? (
          <>
            <Annonce titre="Ta figurine arrive très bientôt 🛠️" emoji="📸">
              Reviens ici dans quelques jours pour envoyer ta photo.
            </Annonce>
            <h2 className="mc-avant">En attendant, fais parler la démonstration</h2>
            <StudioDemo demo={figurine.demo} />
          </>
        ) : (
          // DÈS LE DÉPART : la démonstration (le wow), puis « Crée ta figurine »
          <>
            <StudioDemo demo={figurine.demo} creer={Boolean(etat)} />
            {etat && <EnvoiPhoto etat={etat} villes={villes} onEnvoye={poserEtat} />}
          </>
        )}
      </section>

      <div className="dc">
        {/* 2. L'ÉDITION DU MOIS */}
        <section className="dc-bloc" aria-labelledby="mc-edition">
          <h2 id="mc-edition">L’édition du mois</h2>
          <ChronoEdition aujourdhui={aujourdhui} figurine={avec[0]?.figurine ?? commerces[0]?.figurine} />
        </section>

        {/* 3. MES FIGURINES : L'ALBUM */}
        {ennui && <p className="mc-vide">Ta collection n’a pas pu s’afficher. Réessaie dans un instant.</p>}
        {avec.length > 0 && (
          <section className="dc-bloc" aria-labelledby="mc-miennes">
            <h2 id="mc-miennes">
              Mes figurines <span className="mc-total">{total}</span>
            </h2>
            <Album familles={avec} />
          </section>
        )}

        {/* 4. OÙ LES GAGNER */}
        <OuGagner
          commerces={commerces.filter((c) => !avec.some((f) => f.slug === c.slug))}
          titre={avec.length ? "D’autres commerces où en gagner" : "Où gagner tes figurines"}
          aujourdhui={aujourdhui}
        />
        {familles && avec.length === 0 && <p className="dc-deja">Tu as déjà des figurines ? Ouvre cette page sur le téléphone où tu as libéré ton fantôme.</p>}
      </div>

      <p className="mc-regle">
        On ne gagne une figurine qu’en venant : elles ne s’achètent pas. Une édition manquée est manquée ; les éditions rares se gagnent quand le commerce annonce une
        place libre.
      </p>
      <style>{STYLES_MC + STYLES_MA_FIGURINE + STYLES_COLLECTION + STYLES_DECOUVRIR + STYLES_ALBUM}</style>
    </main>
  );
}

const STYLES_MC = `
.mc{min-height:100dvh;box-sizing:border-box;padding:calc(10px + env(safe-area-inset-top)) 0 calc(28px + env(safe-area-inset-bottom));max-width:1180px;margin:0 auto;
  background:radial-gradient(100% 38% at 50% 0%,rgba(255,46,154,.22),transparent 72%),linear-gradient(180deg,#1E0C18,#12060F 40%);color:#FFF4E6;
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
body{background:#12060F}
.mc-barre{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;
  background:rgba(18,6,15,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.mc-logo{font-size:19px;font-weight:900;color:#FFF4E6;text-decoration:none;letter-spacing:-.02em}
.mc-logo b{color:#FF2E9A}
.mc-moi{padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.08);font-size:13px;font-weight:700;color:#D9C3CB;white-space:nowrap}
.mc-moi b{color:#FFF4E6}
.mc-moi em{font-style:normal;color:#F2C46B}
.mc-heros{padding:14px 16px 0}
.mc-sur{display:block;font-size:11.5px;font-weight:900;letter-spacing:.14em;color:#F2C46B}
.mc-heros h1{margin:6px 0 0;font-size:34px;line-height:1.04;font-weight:900;letter-spacing:-.035em;
  background:linear-gradient(135deg,#fff,#FFC8E6 50%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.mc-dit{margin:8px 0 18px;max-width:560px;color:#D9C3CB}
.mc-avant{margin:26px 0 12px;font-size:20px;font-weight:900;letter-spacing:-.02em}
.mc-heros .tf-photo{margin-top:22px}
.mc-attente{display:grid;margin:8px 0 0}
.mc-attente i{height:420px;border-radius:30px;background:linear-gradient(100deg,rgba(255,255,255,.04) 30%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear var(--d) infinite}
.mc-vide{margin:28px 0 0;padding:18px;border-radius:20px;background:rgba(255,255,255,.05);text-align:center;color:#D9C3CB}
.mc-total{display:inline-grid;place-items:center;min-width:34px;height:34px;margin-left:6px;padding:0 9px;box-sizing:border-box;border-radius:999px;background:#FF2E9A;color:#fff;font-size:17px;vertical-align:4px;box-shadow:0 8px 18px -8px rgba(255,46,154,.9)}
.mc-regle{margin:34px 20px 0;font-size:12px;line-height:1.5;color:#8D7580;text-align:center}
@media (min-width:860px){
  .mc-barre{padding:14px 32px}
  .mc-heros{padding:30px 32px 0}
  .mc-heros h1{font-size:60px;max-width:820px}
  .mc-dit{font-size:18px;margin-bottom:28px}
  .mc-regle{font-size:13px;max-width:640px;margin-left:auto;margin-right:auto}
}
@keyframes mc-entre{from{opacity:0;transform:translateY(14px)}}
@keyframes mc-reflet{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.mc *{animation:none!important}}
`;
