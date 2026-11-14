"use client";

/**
 * 🏡 « CHEZ MOI » — le propriétaire, le 13 novembre 2026, sur « Mon univers » (« des tonnes d'informations […] on ne
 * sait pas ce qu'il faut y faire ») et « Proches » (« il faudrait que les choses soient plus simples […] un peu comme
 * WhatsApp ») ; sa réponse : une seule page, « Chez moi » — mon univers en haut, mes conversations dessous ; les réglages
 * derrière ⚙️, le reste derrière « ＋ ». (L'onglet « Proches » de l'appli, quand l'interrupteur « Univers pour tous » est
 * allumé : `proches.tsx`, `chezMoi`.)
 *
 * ICI, L'EN-TÊTE : une fenêtre sur mon univers (son décor du moment, ma figurine assise chez elle, à la taille relevée sur
 * son image vedette — comme `/univers/monde`), le thème du mois, mon humeur en pastille (un toucher : la changer, et voir
 * ce que les figurines en ont dit), ⚙️ « Mon univers » (ses réglages : `/univers/monde`). Sans univers encore : ce qui
 * l'attend (`/univers`).
 *
 * 🎁🚪 MES VISITES (le 13 novembre 2026, `visites-recues.tsx`) : sur ma fenêtre, un badge qui se dandine quand un cadeau
 * m'attend ou que quelqu'un a frappé (un toucher : la découverte) ; les cadeaux que j'ai posés chez moi, sur le sol de
 * mon univers, qui scintillent.
 *
 * 🏠 LE 14 NOVEMBRE 2026, « MA MAISON » A SON ONGLET (le propriétaire : « mon univers est difficilement accessible sur
 * l'appli, ça mérite peut-être son onglet direct ») : le menu devient Découvrir · Messages · Ma maison · Autour. Mon
 * univers part dans « Ma maison » (`ma-maison.tsx`, `FenetreSurMonUnivers` en entier) ; ici, « Messages » garde son
 * en-tête sans la fenêtre (`sansFenetre`) : mon humeur, mes visites, en pastilles.
 */
import { useEffect, useRef, useState } from "react";
import type { EtatUnivers } from "@/lib/direct/univers-creation";
import { humeurDe } from "@/lib/direct/rituel";
import { objetDe, type MesVisites, type SouvenirVu } from "@/lib/direct/visites";
import type { ADecouvrir } from "./visites-recues";
import { TAILLE_FIGURINE, useCadreVisible } from "../univers/monde/monde";
import { useRituel } from "./rituel";

/** Mon univers, tel que le sert `/api/direct/univers` (`null` : pas encore lu). */
export function useMonUnivers(actif: boolean): EtatUnivers | null | "absent" {
  const [etat, setEtat] = useState<EtatUnivers | null | "absent">(null);
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    fetch("/api/direct/univers", { cache: "no-store" })
      .then(async (r) => (r.ok ? ((await r.json()) as EtatUnivers) : null))
      .then((e) => !fini && setEtat(e?.etape ? e : "absent"))
      .catch(() => !fini && setEtat("absent"));
    return () => {
      fini = true;
    };
  }, [actif]);
  return etat;
}

/** L'en-tête : « Chez moi », ⚙️, la fenêtre sur mon univers, ma pastille d'humeur, le badge de mes visites. */
export function EnteteChezMoi({
  actif,
  onHumeur,
  visites = null,
  nouveautes = [],
  onVisites,
  sansFenetre = false,
}: {
  actif: boolean;
  onHumeur: () => void;
  visites?: MesVisites | null;
  nouveautes?: ADecouvrir[];
  onVisites?: () => void;
  /** 🏠 (« Messages », depuis que « Ma maison » a son onglet) : le titre, l'humeur et les visites, sans la fenêtre */
  sansFenetre?: boolean;
}) {
  const etat = useMonUnivers(actif && !sansFenetre);
  const r = useRituel();
  const h = humeurDe(r?.humeur ?? null);
  // (ce que les figurines ont dit de mon humeur, et le mot de la fin de cette nuit : un point sur la pastille)
  const nouveau = (r?.mots.length ?? 0) + (r?.fins.length ?? 0);
  const pret = etat && etat !== "absent" && etat.etape === "decouverte" && etat.decor;
  const cadeaux = nouveautes.filter((x) => x.genre === "cadeau").length;
  const tocs = nouveautes.length - cadeaux;
  if (sansFenetre)
    return (
      <header className="cm-tete">
        <div className="cm-titre">
          <h2>Messages</h2>
        </div>
        <div className="cm-rang">
          <button type="button" className={`cm-humeur${h ? "" : " vide"}`} onClick={onHumeur} aria-label={h ? `Ton humeur : ${h.court}. La changer` : "Ton humeur du jour ?"}>
            {h ? `${h.emoji} ${h.court}` : "☀️ Ton humeur ?"}
            {nouveau > 0 && <i aria-label={`${nouveau} nouveau(x)`}>{nouveau}</i>}
          </button>
          {nouveautes.length > 0 && onVisites && (
            <button type="button" className={`cm-badge-visites${cadeaux ? " cadeau" : ""}`} onClick={onVisites}>
              {cadeaux ? `🎁 ${cadeaux > 1 ? `${cadeaux} cadeaux t’attendent` : "Un cadeau t’attend !"}` : `🚪 Toc toc ! ${tocs > 1 ? `${tocs} visites` : "Une visite"}`}
            </button>
          )}
          {!nouveautes.length && onVisites && visites && (visites.passes.length > 0 || visites.poses.length > 0) && (
            <button type="button" className="cm-puce-visites" onClick={onVisites}>
              🚪 Mes visites
            </button>
          )}
        </div>
      </header>
    );
  return (
    <header className="cm-tete">
      <div className="cm-titre">
        <h2>Chez moi</h2>
        {pret && (
          <a className="cm-reglages" href="/univers/monde" aria-label="Mon univers : ses réglages">
            ⚙️
          </a>
        )}
      </div>
      {etat === null ? (
        <div className="cm-fenetre cm-attente" aria-hidden="true" />
      ) : pret ? (
        <FenetreSurMonUnivers etat={etat} souvenirs={visites?.poses}>
          {nouveautes.length > 0 && onVisites && (
            <button type="button" className={`cm-badge-visites${cadeaux ? " cadeau" : ""}`} onClick={onVisites}>
              {cadeaux ? `🎁 ${cadeaux > 1 ? `${cadeaux} cadeaux t’attendent` : "Un cadeau t’attend !"}` : `🚪 Toc toc ! ${tocs > 1 ? `${tocs} visites` : "Une visite"}`}
            </button>
          )}
          {/* 🚪 (rien de nouveau) qui est passé, ce qui est posé chez moi : le bilan */}
          {!nouveautes.length && onVisites && visites && (visites.passes.length > 0 || visites.poses.length > 0) && (
            <button type="button" className="cm-puce-visites" onClick={onVisites}>
              🚪 Mes visites
            </button>
          )}
          <button type="button" className={`cm-humeur${h ? "" : " vide"}`} onClick={onHumeur} aria-label={h ? `Ton humeur : ${h.court}. La changer` : "Ton humeur du jour ?"}>
            {h ? `${h.emoji} ${h.court}` : "☀️ Ton humeur ?"}
            {nouveau > 0 && <i aria-label={`${nouveau} nouveau(x)`}>{nouveau}</i>}
          </button>
          {etat.saison && (
            <span className="cm-saison">
              {etat.saison.emoji} {etat.saison.nom}
            </span>
          )}
        </FenetreSurMonUnivers>
      ) : (
        <a className="cm-attend" href="/univers">
          <b>{etat !== "absent" && etat.etape === "a-creer" ? "Ton univers est prêt à être créé ✨" : etat !== "absent" && etat.etape === "creation" ? "Ton univers se construit… 🛠️" : "Ton univers t’attend 🏡"}</b>
          <span>
            {etat !== "absent" && etat.figurine ? "Pablito l’imagine avec toi, d’après ce que tu lui racontes." : "D’abord ta figurine, assise dans son fauteuil. Ensuite, on imagine ton univers ensemble."}
          </span>
          <span className="cm-attend-bouton">{etat !== "absent" && etat.etape === "creation" ? "Le voir" : "C’est parti"}</span>
        </a>
      )}
    </header>
  );
}

/**
 * 🪟 Une fenêtre sur mon univers : la scène entière (2:3, comme `/univers/monde`), vue par une fenêtre plus basse,
 * centrée sur ma figurine. Un toucher : mon univers en grand (`/univers/monde`). `entiere` (« Ma maison ») : toute la
 * scène, sans la couper.
 */
export function FenetreSurMonUnivers({ etat, souvenirs, entiere = false, children }: { etat: EtatUnivers; souvenirs?: SouvenirVu[]; entiere?: boolean; children?: React.ReactNode }) {
  const boite = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const mesurer = () => setLargeur(el.clientWidth);
    mesurer();
    const o = new ResizeObserver(mesurer);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  const hote = etat.scene?.places.find((p) => p.id === "hote") ?? { x: 0.36, y: 0.8, echelle: 1 };
  const cadre = useCadreVisible(etat.figurine?.assise);
  const releve = etat.scene?.figurine;
  const place = releve
    ? (() => {
        const b = releve.hauteur / Math.max(0.3, cadre.bas - cadre.haut);
        return { x: releve.x, bas: Math.min(1.08, releve.y + (1 - cadre.bas) * b), hauteur: b };
      })()
    : { x: hote.x, bas: Math.max(hote.y, 0.9), hauteur: TAILLE_FIGURINE * Math.min(1.15, Math.max(0.9, hote.echelle)) };
  // (la fenêtre : 0,95 fois sa largeur ; la scène glisse pour que ma figurine soit au milieu)
  const hauteurScene = largeur * 1.5;
  const hauteurFenetre = largeur * (entiere ? 1.5 : 0.95);
  const milieu = (Math.max(place.bas, place.hauteur + 0.02) - place.hauteur / 2) * hauteurScene;
  const decalage = Math.max(0, Math.min(hauteurScene - hauteurFenetre, milieu - hauteurFenetre / 2));
  return (
    <div ref={boite} className="cm-fenetre" style={largeur ? { height: hauteurFenetre } : undefined}>
      <a className="cm-scene" href="/univers/monde" aria-label="Mon univers, en grand" style={{ transform: `translateY(${-decalage}px)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cm-decor" src={etat.decor} alt="Mon univers" />
        {/* 🎁 les cadeaux posés chez moi, sur le sol */}
        {(souvenirs ?? []).map((s, k) =>
          typeof s.x === "number" && typeof s.y === "number" ? (
            <span key={s.id} className="cm-souvenir" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, animationDelay: `${(-0.9 * k).toFixed(1)}s` }} title={`${objetDe(s.objet)?.nom ?? ""}, de ${s.de}`}>
              {objetDe(s.objet)?.emoji}
            </span>
          ) : null,
        )}
        {etat.figurine?.assise && (
          <span className="cm-place" style={{ left: `${place.x * 100}%`, top: `${Math.max(place.bas, place.hauteur + 0.02) * 100}%`, height: `${place.hauteur * 100}%` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={etat.figurine.assise} alt="Ma figurine, chez elle" />
          </span>
        )}
      </a>
      {children}
    </div>
  );
}

/**
 * 🙂 « MOI », QUAND « CRÉER » A QUITTÉ LE MENU (la maquette validée le 13 novembre 2026) : ma figurine (le studio : ses
 * looks, ses mèmes prêts, ses visages), mon univers (ses réglages), mes mèmes (ce qu'ils sont devenus), mes réactions.
 * La suite de « Moi » reste dessous (ma carte, ma figurine du mois, mon téléphone…).
 */
export function RaccourcisMoi({ allerA }: { allerA: (o: string) => void }) {
  const ligne = (ico: string, titre: string, dit: string) => (
    <>
      <span aria-hidden="true">{ico}</span>
      <span>
        <b>{titre}</b>
        <small>{dit}</small>
      </span>
      <i aria-hidden="true">›</i>
    </>
  );
  return (
    <ul className="cm-moi-raccourcis" aria-label="Moi">
      <li>
        <button type="button" onClick={() => allerA("creer")}>
          {ligne("🎭", "Ma figurine et mes mèmes", "Le studio : ses looks, ses mèmes prêts, le duo")}
        </button>
      </li>
      <li>
        <a href="/univers/monde">{ligne("🏡", "Mon univers", "Le retoucher, qui peut entrer, mon lien de visite")}</a>
      </li>
      <li>
        <button type="button" onClick={() => allerA("memes")}>
          {ligne("📥", "Mes mèmes envoyés", "Vus, les réponses, ceux que j’ai reçus")}
        </button>
      </li>
      <li>
        <button type="button" onClick={() => allerA("reactions")}>
          {ligne("⚡", "Mes réactions", "Stickers et gags avec ma tête")}
        </button>
      </li>
    </ul>
  );
}

export const STYLES_CHEZ_MOI = `
.cm-tete{display:flex;flex-direction:column;gap:12px;margin-bottom:6px}
.cm-titre{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cm-titre h2{margin:0;font-size:30px;font-weight:900;letter-spacing:-.02em;color:#FFF4E6}
/* 🏠 « Messages » : l'humeur et les visites en pastilles, sans la fenêtre */
.cm-rang{display:flex;flex-wrap:wrap;gap:8px}
.cm-rang .cm-humeur,.cm-rang .cm-badge-visites,.cm-rang .cm-puce-visites{position:static;animation:none}
.cm-reglages{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.08);font-size:22px;text-decoration:none}
.cm-fenetre{position:relative;width:100%;overflow:hidden;border-radius:24px;background:#2b1a0c;box-shadow:0 14px 30px -14px rgba(0,0,0,.8);aspect-ratio:auto}
.cm-attente{height:240px;animation:cm-lueur 1.4s ease-in-out infinite alternate}
@keyframes cm-lueur{from{opacity:.5}to{opacity:.85}}
.cm-scene{position:absolute;left:0;top:0;width:100%;aspect-ratio:2/3;display:block;container-type:inline-size}
.cm-decor{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cm-place{position:absolute;transform:translate(-50%,-100%);aspect-ratio:2/3;display:flex;align-items:flex-end;justify-content:center}
.cm-place img{height:100%;width:auto;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.cm-humeur{position:absolute;left:10px;bottom:10px;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:0;border-radius:999px;background:rgba(255,250,240,.92);color:#2b1a0c;font:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 6px 14px -6px rgba(0,0,0,.6)}
.cm-humeur.vide{background:#FF2E9A;color:#fff}
.cm-humeur i{display:grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#FF2E9A;color:#fff;font-style:normal;font-size:12px}
.cm-humeur.vide i{background:#fff;color:#FF2E9A}
.cm-souvenir{position:absolute;transform:translate(-50%,-100%);font-size:clamp(20px,7.5cqw,34px);line-height:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,.4)) drop-shadow(0 0 8px rgba(255,236,170,.55));pointer-events:none;animation:cm-scintille 3s ease-in-out infinite}
@keyframes cm-scintille{0%,100%{filter:drop-shadow(0 4px 4px rgba(0,0,0,.4)) drop-shadow(0 0 4px rgba(255,236,170,.3))}50%{filter:drop-shadow(0 4px 4px rgba(0,0,0,.4)) drop-shadow(0 0 12px rgba(255,236,170,.9))}}
.cm-badge-visites{position:absolute;left:10px;top:10px;z-index:2;display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border:0;border-radius:999px;background:#FFF4E6;color:#2b1a0c;font:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 8px 18px -6px rgba(0,0,0,.7);animation:cm-appelle 2.2s ease-in-out infinite;transform-origin:20% 50%}
.cm-badge-visites.cadeau{background:linear-gradient(135deg,#FF2E9A,#F2A23B);color:#fff;box-shadow:0 8px 22px -6px rgba(255,46,154,.9)}
@keyframes cm-appelle{0%,60%,100%{transform:none}66%{transform:rotate(-5deg) scale(1.06)}72%{transform:rotate(4deg) scale(1.06)}78%{transform:rotate(-3deg)}84%{transform:none}}
.cm-visites .cm-avatar{background:linear-gradient(135deg,#FF2E9A,#F2A23B)}
.cm-saison{position:absolute;right:10px;top:10px;padding:5px 10px;border-radius:999px;background:rgba(255,250,240,.85);color:#2b1a0c;font-size:13px;font-weight:800;pointer-events:none}
.cm-attend{display:flex;flex-direction:column;gap:6px;padding:18px;border-radius:24px;background:linear-gradient(135deg,rgba(255,46,154,.2),rgba(242,196,107,.16));border:1px solid rgba(242,196,107,.35);color:#FFF4E6;text-decoration:none}
.cm-attend b{font-size:18px;font-weight:900}
.cm-attend span{font-size:14px;line-height:1.4;color:#E9D5DD}
.cm-doux{margin:8px 2px 0;color:#CDB4C0;font-size:14px}
.cm-liste{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column}
.cm-liste > li{position:relative;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.07)}
.cm-ligne{flex:1;min-width:0;display:grid;grid-template-columns:56px minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px 4px;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.cm-ligne:disabled{cursor:default}
.cm-ligne:active:not(:disabled){background:rgba(255,255,255,.04)}
.cm-avatar{position:relative;display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#FF5DB1,#9D1F63);font-size:26px;overflow:visible}
.cm-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#3a1630}
.cm-la{position:absolute;right:1px;bottom:1px;width:13px;height:13px;border-radius:50%;background:#3DDC84;border:2px solid #1E0C18}
.cm-emoji{position:absolute;left:-4px;bottom:-4px;font-size:18px;line-height:1}
.cm-texte{display:flex;flex-direction:column;gap:2px;min-width:0}
.cm-texte b{font-size:16.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cm-texte span{font-size:14px;color:#BFA6B3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cm-ligne.chaud .cm-texte span{color:#FFF4E6;font-weight:700}
.cm-cote{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:44px}
.cm-cote time{font-size:12.5px;color:#A88E99}
.cm-ligne.chaud .cm-cote time{color:#3DDC84;font-weight:800}
.cm-non-lus{display:grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#3DDC84;color:#0f2a19;font-style:normal;font-size:12.5px;font-weight:900}
.cm-rituel .cm-avatar{background:linear-gradient(135deg,#F2C46B,#FF8A3D)}
.cm-memes .cm-avatar{background:rgba(255,255,255,.08)}
.cm-ajouter{flex:none;padding:8px 14px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:14px;font-weight:900}
.cm-vide{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-top:14px;padding:16px;border-radius:20px;background:rgba(255,255,255,.05)}
.cm-vide b{font-size:17px}
.cm-vide p{margin:0;color:#CDB4C0;font-size:14px}
.cm-puce-visites{position:absolute;right:10px;bottom:10px;z-index:2;padding:8px 13px;border:0;border-radius:999px;background:rgba(18,6,15,.78);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 6px 14px -6px rgba(0,0,0,.6)}
/* 👋 les demandes des inconnus */
.cm-demandes{display:flex;flex-direction:column;gap:8px;margin-top:16px}
.cm-demandes h3{margin:0 2px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#CDB4C0}
.cm-demande{display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;align-items:center;padding:12px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(242,196,107,.5)}
.cm-demande > img,.cm-demande > span:first-child{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#3a1630;border:2px solid #F2C46B;font-size:24px;box-sizing:border-box}
.cm-demande-texte{display:flex;flex-direction:column;gap:2px;min-width:0}
.cm-demande-texte b{font-size:15.5px;font-weight:800}
.cm-demande-texte small{font-size:13px;color:#CDB4C0}
.cm-demande-actions{grid-column:1 / -1;display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}
.cm-ajouter-demande{padding:9px 16px;border:0;border-radius:999px;background:#F2C46B;color:#2A0F1F;font:inherit;font-size:14.5px;font-weight:900;cursor:pointer}
.cm-lien{padding:6px 2px;border:0;background:none;color:#CDB4C0;font:inherit;font-size:14px;font-weight:700;text-decoration:underline;cursor:pointer}
.cm-doux.petit{margin:0 2px;font-size:12.5px}
.cm-tete-liste{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 2px 0}
.cm-tete-liste h3{margin:0;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#CDB4C0}
.cm-nouveau{flex:none;padding:9px 15px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:14.5px;font-weight:900;box-shadow:0 8px 20px -8px rgba(255,46,154,.9);cursor:pointer;-webkit-tap-highlight-color:transparent}
.cm-nouveau:active{transform:scale(.96)}
.cm-liste{margin-top:4px}
/* 🙂 « Moi » : ce qui était dans « Créer » */
.cm-moi-raccourcis{list-style:none;margin:0 0 16px;padding:0;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.cm-moi-raccourcis a,.cm-moi-raccourcis button{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;padding:13px 14px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:none;color:#FFF4E6;font:inherit;text-align:left;text-decoration:none;cursor:pointer;box-sizing:border-box}
.cm-moi-raccourcis li:last-child a,.cm-moi-raccourcis li:last-child button{border-bottom:0}
.cm-moi-raccourcis span:first-child{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.07);font-size:20px}
.cm-moi-raccourcis b{display:block;font-size:15.5px;font-weight:800}
.cm-moi-raccourcis small{display:block;margin-top:1px;font-size:13px;color:#CDB4C0}
.cm-moi-raccourcis i{font-style:normal;font-size:20px;color:#A88E99}
.cm-actions{display:flex;flex-direction:column;gap:10px}
.cm-actions button{display:flex;align-items:center;gap:14px;width:100%;padding:14px 16px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.05);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.cm-actions button > span:first-child{font-size:26px}
.cm-actions b{display:block;font-size:16px}
.cm-actions small{display:block;margin-top:2px;font-size:13px;color:#CDB4C0}
.cm-qui{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.cm-qui button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border:0;border-radius:16px;background:rgba(255,255,255,.05);color:#FFF4E6;font:inherit;font-weight:800;cursor:pointer}
.cm-qui img{width:64px;height:64px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#3a1630}
.cm-attend .cm-attend-bouton{align-self:flex-start;margin-top:6px;padding:11px 18px;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:900;font-size:15px}
`;
