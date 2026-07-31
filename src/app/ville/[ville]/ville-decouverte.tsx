"use client";

// « Découvrir les commerces de {ville} » — le mode plein écran, une carte à la fois.
//
// La forme reprend le catalogue Privilège, qui était abouti : carte CRÈME (média
// en haut, corps clair en bas), pile à deux fantômes, tampons pendant le geste,
// pastilles de progression, filtres par métier, quatre actions rondes légendées.
// Polices Fraunces / Instrument Sans, couleurs encre / crème / or / turquoise.
//
// Ce qui change par rapport à Privilège, et pourquoi :
//   • « J'aime » devient « Garder ». Un favori est stocké SUR L'APPAREIL : il ne
//     promet aucune notification et ne part sur aucun serveur — on ne collecte
//     rien sans consentement, et on ne fabrique pas un engagement qui n'existe pas.
//   • Aucun compteur d'intérêt inventé. Les seuls chiffres affichés sont réels :
//     commerces en ligne et annonces en cours.
//   • Le gros bouton central mène au commerce — c'est la seule action utile.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Fiche = {
  slug: string;
  nom: string;
  metier: string;
  photo: string | null;
  note: number | null;
  avis: number | null;
  /** Annonce en cours, si le commerce en a une. */
  texte: string;
  /** Ancienneté de l'annonce (« il y a 2 h »). */
  quand: string;
};

/** Au-delà de ce déplacement horizontal, la carte part au relâchement. */
const SEUIL = 95;
/** Le tampon apparaît bien avant : l'intention doit se lire pendant le geste. */
const SEUIL_TAMPON = 34;
const CLE_FAVORIS = "popey-ville-favoris";

const lireFavoris = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_FAVORIS) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

export function VilleDecouverte({
  ville,
  fiches,
  onVilles,
}: {
  ville: string;
  fiches: Fiche[];
  /** Ouvre le sélecteur de ville (rendu par la page). */
  onVilles?: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [sortie, setSortie] = useState<0 | 1 | -1>(0);
  const [glisse, setGlisse] = useState(false);
  const [filtre, setFiltre] = useState("");
  const [favoris, setFavoris] = useState<string[]>([]);
  const [voirFavoris, setVoirFavoris] = useState(false);
  const [toast, setToast] = useState("");
  const depart = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  const metiers = useMemo(() => {
    const vus = new Map<string, number>();
    for (const x of fiches) vus.set(x.metier, (vus.get(x.metier) ?? 0) + 1);
    return [...vus.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
      .map(([m]) => m);
  }, [fiches]);

  const liste = useMemo(() => (filtre ? fiches.filter((x) => x.metier === filtre) : fiches), [fiches, filtre]);
  const annonces = useMemo(() => fiches.filter((x) => x.texte).length, [fiches]);
  const total = liste.length;
  const fini = i >= total;
  const f = liste[i];

  const montre = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1900);
  }, []);

  /** `pas` = +1 pour avancer, -1 pour revenir. L'envol suit le sens du geste. */
  const avance = useCallback((pas: 1 | -1) => {
    if (depart.current !== null) return;
    setSortie(pas === 1 ? -1 : 1);
    window.setTimeout(() => {
      setSortie(0);
      setDx(0);
      setI((n) => Math.max(0, n + pas));
    }, 260);
  }, []);

  const garder = useCallback(
    (x: Fiche) => {
      setFavoris((prev) => {
        const suite = prev.includes(x.slug) ? prev : [...prev, x.slug];
        try {
          localStorage.setItem(CLE_FAVORIS, JSON.stringify(suite));
        } catch {
          /* stockage refusé (navigation privée) → le favori vit le temps de la visite */
        }
        return suite;
      });
      montre(`♥ ${x.nom} gardé`);
      avance(1);
    },
    [avance, montre]
  );

  const retirer = (slug: string) => {
    setFavoris((prev) => {
      const suite = prev.filter((s) => s !== slug);
      try {
        localStorage.setItem(CLE_FAVORIS, JSON.stringify(suite));
      } catch {
        /* idem */
      }
      return suite;
    });
  };

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (voirFavoris) setVoirFavoris(false);
        else setOuvert(false);
      } else if (e.key === "ArrowRight") avance(1);
      else if (e.key === "ArrowLeft") avance(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert, voirFavoris, avance]);

  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, [ouvert]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sortie) return;
    depart.current = e.clientX;
    setGlisse(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (depart.current === null) return;
    setDx(e.clientX - depart.current);
  };
  const onUp = () => {
    const d = dx;
    depart.current = null;
    setGlisse(false);
    if (d > SEUIL && f) garder(f); // vers la droite : on garde
    else if (d < -SEUIL) avance(1); // vers la gauche : on passe
    else setDx(0);
  };

  const ouvre = () => {
    // Les favoris vivent sur l'appareil : on les lit à l'ouverture, jamais au
    // rendu serveur — sinon l'hydratation diverge.
    setFavoris(lireFavoris());
    setI(0);
    setDx(0);
    setSortie(0);
    setGlisse(false);
    setFiltre("");
    setOuvert(true);
  };

  if (!fiches.length) return null;

  const dep = sortie ? sortie * 560 : dx;
  const rot = dep / 24;
  const tampon = dx > SEUIL_TAMPON ? "oui" : dx < -SEUIL_TAMPON ? "non" : "";
  const forceTampon = Math.min(1, (Math.abs(dx) - SEUIL_TAMPON) / (SEUIL - SEUIL_TAMPON));
  const favorisFiches = fiches.filter((x) => favoris.includes(x.slug));

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vil .vdec-open{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:16px;
            border:none;border-radius:15px;padding:15px;font-family:var(--fb),system-ui,sans-serif;font-size:14.5px;
            font-weight:700;cursor:pointer;color:#07100C;background:linear-gradient(120deg,#00C896,#00A878);
            box-shadow:0 16px 34px -18px rgba(0,200,150,.9);}
          .vil .vdec-open:active{transform:translateY(1px);}

          /* ══ Mode découverte — la forme du catalogue Privilège ════════════════ */
          .vdec{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;
            background:rgba(6,8,11,.86);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
            font-family:var(--fb),system-ui,sans-serif;animation:vdecIn .28s ease;}
          .vdec *{box-sizing:border-box;}
          @keyframes vdecIn{from{opacity:0}to{opacity:1}}
          .vdec .app{position:relative;width:100%;max-width:430px;height:100dvh;display:flex;flex-direction:column;
            overflow:hidden;background:linear-gradient(160deg,#0E1318 0%,#0A0C10 50%,#0D1209 100%);
            box-shadow:0 0 80px rgba(0,0,0,.5);}

          .vdec .hd{display:flex;align-items:center;justify-content:space-between;gap:10px;
            padding:calc(14px + env(safe-area-inset-top)) 18px 10px;}
          .vdec .logo{font-family:var(--fd),Georgia,serif;font-size:21px;font-weight:900;color:#fff;line-height:1;}
          .vdec .logo em{font-style:normal;color:#00C896;}
          .vdec .month{font-size:11.5px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:.04em;margin-top:3px;}
          .vdec .hd-r{display:flex;align-items:center;gap:7px;}
          .vdec .pill-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:12px;
            color:rgba(255,255,255,.72);padding:8px 12px;font-size:12.5px;font-weight:600;cursor:pointer;
            font-family:inherit;white-space:nowrap;}
          .vdec .pill-btn b{margin-left:6px;background:#00C896;color:#07100C;border-radius:999px;padding:1px 6px;
            font-size:10px;font-weight:800;}
          .vdec .close{width:34px;height:34px;flex:none;border-radius:50%;border:1px solid rgba(255,255,255,.16);
            background:rgba(255,255,255,.08);color:#fff;font-size:15px;cursor:pointer;font-family:inherit;}

          /* Chiffres RÉELS uniquement : ce qu'il y a dans la ville, maintenant. */
          .vdec .live{margin:2px 18px 10px;border-radius:12px;padding:9px 12px;display:flex;align-items:center;gap:8px;
            background:rgba(0,200,150,.09);border:1px solid rgba(0,200,150,.22);font-size:12px;color:#BFE9DA;
            line-height:1.4;}
          .vdec .live b{color:#fff;font-weight:700;}

          .vdec .filters{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:0 18px 10px;}
          .vdec .filters::-webkit-scrollbar{display:none;}
          .vdec .fpill{flex:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);
            color:rgba(255,255,255,.66);border-radius:999px;padding:7px 13px;font-size:12px;font-weight:600;
            cursor:pointer;font-family:inherit;white-space:nowrap;}
          .vdec .fpill.on{background:#00C896;border-color:#00C896;color:#07100C;font-weight:700;}

          .vdec .dots{display:flex;justify-content:center;align-items:center;gap:4px;padding:0 18px 8px;flex-wrap:wrap;}
          .vdec .dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.18);transition:all .25s ease;}
          .vdec .dot.on{width:18px;border-radius:3px;background:#00C896;}
          .vdec .dot.done{background:rgba(255,255,255,.36);}

          .vdec .stackw{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 16px;}
          .vdec .stack{position:relative;width:100%;max-width:420px;height:100%;max-height:540px;}
          .vdec .ghost{position:absolute;inset:0;border-radius:26px;background:rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.06);transform-origin:bottom center;pointer-events:none;}
          .vdec .ghost.g2{transform:scale(.94) translateY(10px);z-index:1;}
          .vdec .ghost.g1{transform:scale(.97) translateY(5px);z-index:2;background:rgba(255,255,255,.06);}

          .vdec .card{position:absolute;inset:0;border-radius:26px;overflow:hidden;background:#F6F3EC;
            box-shadow:0 32px 80px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2);cursor:grab;touch-action:pan-y;
            user-select:none;z-index:10;will-change:transform;}
          .vdec .card:active{cursor:grabbing;}
          .vdec .card.go{transition:transform .26s cubic-bezier(.4,0,1,1),opacity .26s ease;opacity:0;}
          .vdec .card.back{transition:transform .3s cubic-bezier(.22,1,.36,1);}

          /* Tampon pendant le geste : l'intention se lit avant le relâchement. */
          .vdec .stamp{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;
            pointer-events:none;transition:opacity .1s;}
          .vdec .stamp i{font-style:normal;font-family:var(--fd),Georgia,serif;font-size:38px;font-weight:900;color:#fff;
            border:5px solid #fff;border-radius:12px;padding:6px 18px;letter-spacing:2px;}
          .vdec .stamp.oui{background:linear-gradient(135deg,rgba(0,196,140,.9),rgba(0,196,140,.6));}
          .vdec .stamp.oui i{transform:rotate(-14deg);}
          .vdec .stamp.non{background:linear-gradient(135deg,rgba(239,68,68,.88),rgba(239,68,68,.6));}
          .vdec .stamp.non i{transform:rotate(14deg);}

          .vdec .media{height:38%;position:relative;background-size:cover;background-position:center;}
          .vdec .media::after{content:"";position:absolute;inset:0;
            background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.5) 100%);}
          .vdec .mono{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            font-family:var(--fd),Georgia,serif;font-size:82px;line-height:1;font-weight:900;color:rgba(255,255,255,.14);}
          .vdec .tagm{position:absolute;top:13px;left:13px;z-index:2;border-radius:999px;padding:5px 11px;
            font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#07100C;background:#00C896;}
          .vdec .tagn{position:absolute;top:13px;right:13px;z-index:2;border-radius:999px;padding:5px 10px;
            font-size:11px;font-weight:700;color:#3A2A00;background:#C8A84B;}

          .vdec .body{height:62%;padding:14px 15px 13px;display:flex;flex-direction:column;}
          .vdec .nm{font-family:var(--fd),Georgia,serif;font-size:24px;font-weight:700;line-height:1.1;color:#12141A;}
          .vdec .meta{font-size:12px;color:#6B7280;margin-top:5px;}
          .vdec .offer{margin-top:11px;border-radius:12px;padding:10px 12px;
            background:linear-gradient(135deg,#FDFAF2,#FDF5DC);border:1.5px solid rgba(200,168,75,.3);}
          .vdec .offer-k{font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#A8842A;}
          .vdec .offer-t{font-family:var(--fd),Georgia,serif;font-size:15px;font-weight:700;color:#12141A;
            margin-top:5px;line-height:1.35;}
          .vdec .offer-w{font-size:10.5px;color:#8A8F98;margin-top:5px;}
          .vdec .rien{margin-top:11px;border-radius:12px;padding:10px 12px;background:rgba(15,23,42,.04);
            border:1px solid rgba(15,23,42,.08);font-size:12.5px;line-height:1.45;color:#5A5D68;}
          .vdec .cta{display:block;margin-top:auto;text-align:center;text-decoration:none;border-radius:13px;
            padding:13px;font-size:14.5px;font-weight:700;color:#07100C;background:#00C896;
            box-shadow:0 8px 22px -10px rgba(0,200,150,.75);}
          .vdec .cta:active{transform:translateY(1px);}

          /* flex-end : le gros bouton est plus haut que les autres — sans ça, les
             quatre légendes se retrouvent à des hauteurs différentes. */
          .vdec .acts{display:flex;align-items:flex-end;justify-content:center;gap:15px;
            padding:14px 18px calc(18px + env(safe-area-inset-bottom));}
          .vdec .aw{display:flex;flex-direction:column;align-items:center;gap:5px;}
          .vdec .act{display:flex;align-items:center;justify-content:center;border:none;border-radius:50%;
            cursor:pointer;transition:transform .15s ease;font-size:20px;font-family:inherit;text-decoration:none;
            box-shadow:0 4px 16px rgba(0,0,0,.25);}
          .vdec .act:active{transform:scale(.92);}
          .vdec .act:disabled{opacity:.3;cursor:not-allowed;}
          .vdec .act.back2,.vdec .act.skip{width:52px;height:52px;background:rgba(255,255,255,.1);
            border:1.5px solid rgba(255,255,255,.18);color:rgba(255,255,255,.74);}
          .vdec .act.keep{width:52px;height:52px;background:rgba(200,168,75,.16);
            border:1.5px solid rgba(200,168,75,.55);color:#E4C66E;}
          .vdec .act.gogo{width:70px;height:70px;background:#00C896;color:#07100C;font-size:25px;font-weight:800;
            box-shadow:0 8px 28px rgba(0,200,150,.4);}
          .vdec .alab{font-size:10px;font-weight:600;color:rgba(255,255,255,.32);letter-spacing:.04em;}

          .vdec .empty{margin:auto;text-align:center;max-width:320px;padding:20px;}
          .vdec .empty .e{font-size:40px;}
          .vdec .empty h3{font-family:var(--fd),Georgia,serif;font-size:23px;font-weight:700;color:#fff;margin-top:12px;}
          .vdec .empty p{font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.55);margin-top:10px;}
          .vdec .empty button{margin-top:18px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);
            color:#fff;border-radius:13px;padding:12px 20px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;}

          /* Favoris — feuille glissante, comme les panneaux de Privilège. */
          .vdec .favs{position:absolute;inset:0;z-index:20;display:flex;align-items:flex-end;justify-content:center;
            background:rgba(0,0,0,.6);}
          .vdec .favs-p{width:100%;max-height:80%;display:flex;flex-direction:column;background:#11131C;
            border:1px solid rgba(255,255,255,.08);border-radius:26px 26px 0 0;animation:favUp .28s ease;overflow:hidden;}
          @keyframes favUp{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
          .vdec .favs-h{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px;}
          .vdec .favs-t{font-family:var(--fd),Georgia,serif;font-size:19px;font-weight:700;color:#fff;}
          .vdec .favs-l{overflow-y:auto;padding:0 18px calc(20px + env(safe-area-inset-bottom));display:flex;
            flex-direction:column;gap:9px;}
          .vdec .fav{display:flex;align-items:center;gap:11px;border:1px solid rgba(255,255,255,.1);
            border-radius:14px;padding:10px;background:rgba(255,255,255,.04);}
          .vdec .fav .im{width:44px;height:44px;flex:none;border-radius:11px;background-size:cover;
            background-position:center;background-image:linear-gradient(150deg,#2C3A5E,#141A2E);}
          .vdec .fav .fb{flex:1;min-width:0;}
          .vdec .fav .fn{display:block;font-size:13.5px;font-weight:700;color:#fff;white-space:nowrap;
            overflow:hidden;text-overflow:ellipsis;}
          .vdec .fav .fm{display:block;font-size:10.5px;color:#00C896;font-weight:600;text-transform:uppercase;
            letter-spacing:.05em;margin-top:2px;}
          .vdec .fav a{flex:none;text-decoration:none;background:#00C896;color:#07100C;border-radius:10px;
            padding:8px 12px;font-size:12.5px;font-weight:700;}
          .vdec .fav .rm{flex:none;border:none;background:none;color:rgba(255,255,255,.35);font-size:15px;
            cursor:pointer;font-family:inherit;padding:4px;}
          .vdec .favs-vide{font-size:13px;line-height:1.6;color:rgba(255,255,255,.5);padding:6px 0 18px;}
          .vdec .favs-vide b{color:#fff;font-weight:700;}

          .vdec .toast{position:absolute;left:50%;bottom:118px;transform:translateX(-50%);z-index:30;
            background:rgba(17,19,28,.96);border:1px solid rgba(0,200,150,.35);color:#fff;border-radius:999px;
            padding:10px 18px;font-size:13px;font-weight:600;white-space:nowrap;animation:tIn .24s ease;
            box-shadow:0 14px 34px -14px rgba(0,0,0,.9);}
          @keyframes tIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
          @media (prefers-reduced-motion:reduce){.vdec,.vdec .card,.vdec .favs-p,.vdec .toast{animation:none;transition:none;}}
          `,
        }}
      />

      <button type="button" className="vdec-open" onClick={ouvre}>
        🔎 Découvrir les {fiches.length} commerce{fiches.length > 1 ? "s" : ""} de {ville}
      </button>

      {ouvert && (
        <div className="vdec" role="dialog" aria-modal="true" aria-label={`Découvrir les commerces de ${ville}`}>
          <div className="app">
            <div className="hd">
              <div>
                <div className="logo">
                  Pop<em>ey</em>
                </div>
                <div className="month">Aujourd&apos;hui à {ville}</div>
              </div>
              <div className="hd-r">
                {onVilles && (
                  <button type="button" className="pill-btn" onClick={onVilles} aria-label="Changer de ville">
                    📍
                  </button>
                )}
                <button type="button" className="pill-btn" onClick={() => setVoirFavoris(true)} aria-label="Mes favoris">
                  ♥<b>{favoris.length}</b>
                </button>
                <button type="button" className="close" onClick={() => setOuvert(false)} aria-label="Fermer">
                  ✕
                </button>
              </div>
            </div>

            <div className="live">
              <span aria-hidden="true">🔥</span>
              <span>
                <b>{fiches.length}</b> commerce{fiches.length > 1 ? "s" : ""} en ligne à {ville}
                {annonces > 0 && (
                  <>
                    {" · "}
                    <b>{annonces}</b> annonce{annonces > 1 ? "s" : ""} en cours
                  </>
                )}
              </span>
            </div>

            {metiers.length > 1 && (
              <div className="filters">
                <button
                  type="button"
                  className={`fpill${filtre === "" ? " on" : ""}`}
                  onClick={() => {
                    setFiltre("");
                    setI(0);
                  }}
                >
                  Tous
                </button>
                {metiers.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`fpill${filtre === m ? " on" : ""}`}
                    onClick={() => {
                      setFiltre(m);
                      setI(0);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {total > 0 && !fini && (
              <div className="dots" aria-hidden="true">
                {liste.slice(0, 24).map((x, n) => (
                  <i key={x.slug} className={`dot${n === i ? " on" : n < i ? " done" : ""}`} />
                ))}
              </div>
            )}

            <div className="stackw">
              {total === 0 ? (
                <div className="empty">
                  <div className="e">🔎</div>
                  <h3>Personne ici pour l&apos;instant.</h3>
                  <p>Ce métier n&apos;est pas encore représenté à {ville}.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFiltre("");
                      setI(0);
                    }}
                  >
                    Voir tous les commerces
                  </button>
                </div>
              ) : fini ? (
                <div className="empty">
                  <div className="e">👋</div>
                  <h3>Vous les avez tous vus.</h3>
                  <p>
                    Le catalogue s&apos;agrandit à mesure que d&apos;autres commerçants de {ville} mettent leur site
                    en ligne.
                  </p>
                  <button type="button" onClick={() => setI(0)}>
                    Recommencer
                  </button>
                </div>
              ) : (
                <div className="stack">
                  {i + 2 < total && <div className="ghost g2" aria-hidden="true" />}
                  {i + 1 < total && <div className="ghost g1" aria-hidden="true" />}
                  <div
                    className={`card${sortie ? " go" : glisse ? "" : " back"}`}
                    style={{ transform: `translateX(${dep}px) rotate(${rot}deg)` }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                  >
                    {tampon && (
                      <div className={`stamp ${tampon}`} style={{ opacity: forceTampon }} aria-hidden="true">
                        <i>{tampon === "oui" ? "GARDÉ" : "PLUS TARD"}</i>
                      </div>
                    )}
                    <div
                      className="media"
                      style={{
                        backgroundImage: f.photo ? `url("${f.photo}")` : "linear-gradient(150deg,#2C3A5E,#141A2E)",
                      }}
                    >
                      <span className="tagm">{f.metier}</span>
                      {f.note != null && f.avis != null && f.avis > 0 && (
                        <span className="tagn">★ {f.note.toFixed(1).replace(".", ",")}</span>
                      )}
                      {!f.photo && (
                        <span className="mono" aria-hidden="true">
                          {f.nom.trim().slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="body">
                      <div className="nm">{f.nom}</div>
                      <div className="meta">
                        {ville}
                        {f.avis != null && f.avis > 0 ? ` · ${f.avis} avis Google` : ""}
                      </div>
                      {f.texte ? (
                        <div className="offer">
                          <div className="offer-k">✦ En ce moment</div>
                          <div className="offer-t">{f.texte}</div>
                          {f.quand && <div className="offer-w">{f.quand}</div>}
                        </div>
                      ) : (
                        <div className="rien">Pas d&apos;annonce en ce moment — son site vous dit tout le reste.</div>
                      )}
                      <a className="cta" href={`/site-internet/apercu/${f.slug}?via=catalogue`}>
                        Voir ce commerce →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!fini && total > 0 && (
              <div className="acts">
                <div className="aw">
                  <button
                    type="button"
                    className="act back2"
                    onClick={() => avance(-1)}
                    disabled={i === 0}
                    aria-label="Revenir au commerce précédent"
                  >
                    ↩
                  </button>
                  <span className="alab">Revenir</span>
                </div>
                <div className="aw">
                  <button type="button" className="act skip" onClick={() => avance(1)} aria-label="Passer">
                    ✕
                  </button>
                  <span className="alab">Passer</span>
                </div>
                <div className="aw">
                  <a
                    className="act gogo"
                    href={`/site-internet/apercu/${f.slug}?via=catalogue`}
                    aria-label={`Voir ${f.nom}`}
                  >
                    →
                  </a>
                  <span className="alab">Y aller</span>
                </div>
                <div className="aw">
                  <button type="button" className="act keep" onClick={() => garder(f)} aria-label="Garder ce commerce">
                    ♥
                  </button>
                  <span className="alab">Garder</span>
                </div>
              </div>
            )}

            {toast && <div className="toast">{toast}</div>}

            {voirFavoris && (
              <div className="favs" onClick={() => setVoirFavoris(false)}>
                <div className="favs-p" onClick={(e) => e.stopPropagation()}>
                  <div className="favs-h">
                    <span className="favs-t">♥ Mes favoris</span>
                    <button type="button" className="close" onClick={() => setVoirFavoris(false)} aria-label="Fermer">
                      ✕
                    </button>
                  </div>
                  <div className="favs-l">
                    {favorisFiches.length === 0 ? (
                      <div className="favs-vide">
                        Rien de gardé pour l&apos;instant. Faites glisser une carte vers la droite, ou touchez ♥.
                        Vos favoris restent <b>sur cet appareil</b> — rien n&apos;est envoyé nulle part.
                      </div>
                    ) : (
                      favorisFiches.map((x) => (
                        <div className="fav" key={x.slug}>
                          <span
                            className="im"
                            aria-hidden="true"
                            style={x.photo ? { backgroundImage: `url("${x.photo}")` } : undefined}
                          />
                          <span className="fb">
                            <span className="fn">{x.nom}</span>
                            <span className="fm">{x.metier}</span>
                          </span>
                          <a href={`/site-internet/apercu/${x.slug}?via=catalogue`}>Voir</a>
                          <button
                            type="button"
                            className="rm"
                            onClick={() => retirer(x.slug)}
                            aria-label={`Retirer ${x.nom} des favoris`}
                          >
                            🗑
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
