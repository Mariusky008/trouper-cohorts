"use client";

// La barre du catalogue : changer de ville, et installer l'app sur l'écran d'accueil.
//
// Le sélecteur ne propose QUE des villes réellement couvertes — proposer une ville
// vide dans un menu, c'est promettre une page qu'on sait vide.
//
// L'installation est le point le plus sous-estimé du produit : une habitude
// quotidienne doit être à un geste. Le bouton n'apparaît QUE si le navigateur a
// vraiment proposé l'installation (évènement `beforeinstallprompt`) — sur iOS il
// n'existe pas, et on explique alors le geste au lieu d'afficher un bouton mort.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { VilleDecouverte, type Fiche } from "./ville-decouverte";

export type VilleItem = { nom: string; slug: string; commerces: number; annonces: number };

// L'évènement d'installation n'est pas typé par TypeScript (non standardisé).
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Faits d'environnement : ils ne changent pas pendant la visite. Lus via
// useSyncExternalStore pour que le rendu serveur (false) et le premier rendu
// client concordent — sinon React signale une divergence d'hydratation.
const jamais = () => () => {};
const estStandalone = () => {
  try {
    return window.matchMedia?.("(display-mode: standalone)")?.matches || false;
  } catch {
    return false;
  }
};
const estIOS = () => {
  try {
    return /iPad|iPhone|iPod/.test(navigator.userAgent || "") && !("MSStream" in window);
  } catch {
    return false;
  }
};

export function VilleBarre({
  ville,
  villeSlug,
  villes,
  fiches,
}: {
  ville: string;
  villeSlug: string;
  villes: VilleItem[];
  fiches: Fiche[];
}) {
  const [menu, setMenu] = useState(false);
  const [install, setInstall] = useState<PromptEvent | null>(null);
  const [vientInstalle, setVientInstalle] = useState(false);
  const [aide, setAide] = useState(false);

  const standalone = useSyncExternalStore(jamais, estStandalone, () => false);
  const iOS = useSyncExternalStore(jamais, estIOS, () => false) && !standalone;
  const installe = standalone || vientInstalle;

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // sinon Chrome affiche sa propre bannière, au mauvais moment
      setInstall(e as PromptEvent);
    };
    const onInstalled = () => {
      setVientInstalle(true);
      setInstall(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installer = useCallback(async () => {
    if (!install) return;
    try {
      await install.prompt();
      await install.userChoice;
    } catch {
      /* refus ou navigateur récalcitrant → on ne dit rien de faux */
    }
    setInstall(null);
  }, [install]);

  const autres = villes.filter((v) => v.slug !== villeSlug);
  const montreInstall = !installe && (Boolean(install) || iOS);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vil .vbar{display:flex;gap:9px;margin-top:20px;}
          .vil .vbar button{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;
            border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;border-radius:13px;
            padding:12px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;}
          .vil .vbar button:active{transform:translateY(1px);}
          .vil .vmodal{position:fixed;inset:0;z-index:95;display:flex;align-items:flex-end;justify-content:center;
            background:rgba(6,8,11,.78);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
          .vil .vsheet{width:100%;max-width:460px;max-height:82%;display:flex;flex-direction:column;
            background:#11131C;border:1px solid rgba(255,255,255,.09);border-radius:26px 26px 0 0;overflow:hidden;
            animation:vsUp .28s ease;}
          @keyframes vsUp{from{transform:translateY(28px);opacity:0}to{transform:none;opacity:1}}
          .vil .vsheet-h{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px;}
          .vil .vsheet-t{font-family:var(--fd),Georgia,serif;font-size:20px;font-weight:700;color:#fff;}
          .vil .vsheet-x{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.16);
            background:rgba(255,255,255,.08);color:#fff;font-size:15px;cursor:pointer;font-family:inherit;}
          .vil .vsheet-l{overflow-y:auto;padding:0 18px calc(20px + env(safe-area-inset-bottom));
            display:flex;flex-direction:column;gap:8px;}
          .vil .vrow{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;
            border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:14px;padding:13px;}
          .vil .vrow.on{border-color:rgba(0,200,150,.5);background:rgba(0,200,150,.1);}
          .vil .vrow .vn{flex:1;min-width:0;font-size:15px;font-weight:700;}
          .vil .vrow .vc{font-size:11.5px;color:#8B93A6;font-weight:600;margin-top:2px;display:block;}
          .vil .vrow .vg{flex:none;color:rgba(255,255,255,.4);font-size:18px;font-weight:700;}
          .vil .vseule{font-size:13px;line-height:1.6;color:#8B93A6;padding:4px 0 16px;}
          .vil .vaide{font-size:13.5px;line-height:1.7;color:#A8AEBC;padding:2px 0 18px;}
          .vil .vaide b{color:#fff;}
          .vil .vaide ol{margin:12px 0 0;padding-left:20px;}
          .vil .vaide li{margin-bottom:6px;}
          `,
        }}
      />

      <VilleDecouverte ville={ville} fiches={fiches} onVilles={villes.length > 1 ? () => setMenu(true) : undefined} />

      <div className="vbar">
        <button type="button" onClick={() => setMenu(true)}>
          📍 Changer de ville
        </button>
        {montreInstall && (
          <button type="button" onClick={() => (install ? installer() : setAide(true))}>
            ⬇️ Ajouter à mon écran
          </button>
        )}
      </div>

      {menu && (
        <div className="vmodal" onClick={() => setMenu(false)}>
          <div className="vsheet" onClick={(e) => e.stopPropagation()}>
            <div className="vsheet-h">
              <span className="vsheet-t">📍 Choisir ma ville</span>
              <button type="button" className="vsheet-x" onClick={() => setMenu(false)} aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="vsheet-l">
              {autres.length === 0 ? (
                <div className="vseule">
                  {ville} est la seule ville couverte pour l&apos;instant. Le catalogue s&apos;ouvre ville par ville,
                  à mesure que des commerçants mettent leur site en ligne.
                </div>
              ) : (
                villes.map((v) => (
                  <a className={`vrow${v.slug === villeSlug ? " on" : ""}`} key={v.slug} href={`/ville/${v.slug}`}>
                    <span className="vn">
                      {v.nom}
                      <span className="vc">
                        {v.commerces} commerce{v.commerces > 1 ? "s" : ""}
                        {v.annonces > 0 ? ` · ${v.annonces} annonce${v.annonces > 1 ? "s" : ""} aujourd'hui` : ""}
                      </span>
                    </span>
                    <span className="vg" aria-hidden="true">
                      {v.slug === villeSlug ? "✓" : "›"}
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {aide && (
        <div className="vmodal" onClick={() => setAide(false)}>
          <div className="vsheet" onClick={(e) => e.stopPropagation()}>
            <div className="vsheet-h">
              <span className="vsheet-t">⬇️ Sur votre écran d&apos;accueil</span>
              <button type="button" className="vsheet-x" onClick={() => setAide(false)} aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="vsheet-l">
              <div className="vaide">
                Sur iPhone, l&apos;installation se fait à la main — Safari ne la propose pas tout seul.
                <ol>
                  <li>
                    Touchez <b>Partager</b> (le carré avec une flèche, en bas).
                  </li>
                  <li>
                    Descendez et choisissez <b>Sur l&apos;écran d&apos;accueil</b>.
                  </li>
                  <li>
                    Validez : <b>{ville}</b> apparaît comme une application.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
