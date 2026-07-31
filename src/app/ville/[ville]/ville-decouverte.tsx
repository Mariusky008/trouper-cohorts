"use client";

// Le catalogue de la ville, à swiper — repris de l'app v3
// (`public/popey-app-v3.html`), qui est LA référence de design du produit.
//
// La carte est PLEINE PHOTO, sombre, avec un voile dégradé et les informations
// posées en bas dessus. Pile de trois (top / behind / behind2, chacune plus
// petite et plus sombre). Trois gestes, trois tampons : à droite, à gauche, vers
// le haut. Barre de trois actions rondes, celle du milieu plus grosse et menthe.
//
// CE QUI DIFFÈRE DE L'APP V3, ET POURQUOI
//   • « Je veux » devient « Garder ». Nous ne pouvons rien réserver : promettre
//     une réservation qui n'arrive pas ferait plus de mal que pas de bouton du
//     tout. Le favori reste SUR L'APPAREIL — aucun serveur, aucun consentement à
//     demander, aucune notification promise.
//   • Pas de prix barré ni de pourcentage : nos annonces sont des phrases
//     écrites par le commerçant, pas des offres tarifées. On affiche sa phrase.
//   • Pas de carte de fidélité ni de parrainage : non construits.
//   • Le compte à rebours n'apparaît QUE si le pro a fixé une échéance à son
//     annonce. Inventer une urgence est exactement ce qu'on ne fait pas.
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
  /** Fin de validité de l'annonce (ISO), si le pro en a fixé une. */
  jusqua?: string | null;
};

/** Déplacement au-delà duquel la carte part au relâchement. */
const SEUIL = 95;
/** Le tampon apparaît bien avant : l'intention doit se lire pendant le geste. */
const SEUIL_TAMPON = 30;
const CLE_FAVORIS = "popey-ville-favoris";

const lireFavoris = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_FAVORIS) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

/** « jusqu'à 19 h », « jusqu'à demain », « jusqu'au 3 août » — jamais inventé. */
function echeance(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t) || t < Date.now()) return "";
  const h = Math.round((t - Date.now()) / 3600000);
  if (h <= 24) {
    const d = new Date(t);
    return `jusqu'à ${d.getHours()} h${d.getMinutes() ? String(d.getMinutes()).padStart(2, "0") : ""}`;
  }
  if (h <= 48) return "jusqu'à demain";
  return `jusqu'au ${new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

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
  const [d, setD] = useState({ x: 0, y: 0 });
  const [sortie, setSortie] = useState<"" | "oui" | "non" | "haut">("");
  const [glisse, setGlisse] = useState(false);
  const [filtre, setFiltre] = useState("");
  const [favoris, setFavoris] = useState<string[]>([]);
  const [voirFavoris, setVoirFavoris] = useState(false);
  const [toast, setToast] = useState("");
  const depart = useRef<{ x: number; y: number } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const metiers = useMemo(() => {
    const vus = new Map<string, number>();
    for (const x of fiches) vus.set(x.metier, (vus.get(x.metier) ?? 0) + 1);
    return [...vus.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).map(([m]) => m);
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

  const suivante = useCallback((sens: "oui" | "non" | "haut") => {
    if (depart.current !== null) return;
    setSortie(sens);
    window.setTimeout(() => {
      setSortie("");
      setD({ x: 0, y: 0 });
      setI((n) => n + 1);
    }, 300);
  }, []);

  const revenir = useCallback(() => {
    if (depart.current !== null) return;
    setD({ x: 0, y: 0 });
    setI((n) => Math.max(0, n - 1));
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
      suivante("oui");
    },
    [montre, suivante]
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

  const versLeSite = (x: Fiche) => {
    window.location.href = `/site-internet/apercu/${x.slug}?via=catalogue`;
  };

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (voirFavoris) setVoirFavoris(false);
        else setOuvert(false);
      } else if (e.key === "ArrowRight" && f) garder(f);
      else if (e.key === "ArrowLeft") suivante("non");
      else if (e.key === "ArrowUp" && f) versLeSite(f);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert, voirFavoris, f, garder, suivante]);

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
    depart.current = { x: e.clientX, y: e.clientY };
    setGlisse(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!depart.current) return;
    setD({ x: e.clientX - depart.current.x, y: e.clientY - depart.current.y });
  };
  const onUp = () => {
    const { x, y } = d;
    depart.current = null;
    setGlisse(false);
    // Le geste vertical l'emporte s'il domine : monter, c'est « je veux voir ».
    if (-y > SEUIL && -y > Math.abs(x) && f) versLeSite(f);
    else if (x > SEUIL && f) garder(f);
    else if (x < -SEUIL) suivante("non");
    else setD({ x: 0, y: 0 });
  };

  const ouvre = () => {
    // Les favoris vivent sur l'appareil : lus à l'ouverture, jamais au rendu
    // serveur — sinon l'hydratation diverge.
    setFavoris(lireFavoris());
    setI(0);
    setD({ x: 0, y: 0 });
    setSortie("");
    setGlisse(false);
    setFiltre("");
    setOuvert(true);
  };

  if (!fiches.length) return null;

  // Position de la carte : le doigt pendant le geste, un envol après.
  const pos = sortie === "oui" ? { x: 620, y: 0 } : sortie === "non" ? { x: -620, y: 0 } : sortie === "haut" ? { x: 0, y: -720 } : d;
  const rot = pos.x / 16;
  const tampon = -d.y > SEUIL_TAMPON && -d.y > Math.abs(d.x) ? "up" : d.x > SEUIL_TAMPON ? "yes" : d.x < -SEUIL_TAMPON ? "no" : "";
  const force = Math.min(1, (Math.max(Math.abs(d.x), -d.y) - SEUIL_TAMPON) / (SEUIL - SEUIL_TAMPON));
  const favorisFiches = fiches.filter((x) => favoris.includes(x.slug));
  const pile = [liste[i + 2], liste[i + 1], f].filter(Boolean);
  const jusqua = f ? echeance(f.jusqua) : "";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vil .vdec-open{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:16px;
            border:none;border-radius:15px;padding:15px;font-family:var(--fb),system-ui,sans-serif;font-size:14.5px;
            font-weight:800;cursor:pointer;color:#06231A;background:linear-gradient(90deg,#00E0A0,#07B083);
            box-shadow:0 14px 30px -14px rgba(0,224,160,.6);}
          .vil .vdec-open:active{transform:translateY(1px);}

          /* ══ Le catalogue à swiper — la maille de l'app v3 ════════════════════ */
          .vdec{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;
            background:#06070A;font-family:var(--fb),system-ui,sans-serif;animation:vdecIn .28s ease;}
          .vdec *{box-sizing:border-box;}
          @keyframes vdecIn{from{opacity:0}to{opacity:1}}
          .vdec .app{position:relative;width:100%;max-width:420px;height:100dvh;display:flex;flex-direction:column;
            padding:calc(12px + env(safe-area-inset-top)) 16px calc(12px + env(safe-area-inset-bottom));
            background:radial-gradient(120% 70% at 50% 0%,#141A20 0%,#0B0D12 55%,#08090D 100%);overflow:hidden;}

          .vdec .dhead{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
          .vdec .logo{font-family:var(--fd),Georgia,serif;font-size:22px;font-weight:800;color:#fff;line-height:1;
            margin-right:auto;}
          .vdec .logo em{font-style:normal;color:#00E0A0;}
          .vdec .pill{font-weight:600;font-size:12px;padding:7px 12px;border-radius:999px;cursor:pointer;
            border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;font-family:inherit;
            white-space:nowrap;}
          .vdec .pill.mine{font-weight:700;background:rgba(0,224,160,.1);border-color:rgba(0,224,160,.35);color:#00E0A0;}
          .vdec .pill.mine b{margin-left:5px;background:#00E0A0;color:#06231A;border-radius:999px;padding:1px 6px;
            font-size:10px;font-weight:800;}
          .vdec .pill.x{width:32px;height:32px;padding:0;border-radius:50%;font-size:14px;}

          .vdec .live{font-size:11.5px;color:#8A9099;margin-bottom:8px;}
          .vdec .live b{color:#E9EBED;font-weight:700;}

          .vdec .filters{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin-bottom:8px;}
          .vdec .filters::-webkit-scrollbar{display:none;}
          .vdec .fpill{flex:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);
            color:#B9BEC5;border-radius:999px;padding:6px 12px;font-size:11.5px;font-weight:600;cursor:pointer;
            font-family:inherit;white-space:nowrap;}
          .vdec .fpill.on{background:#00E0A0;border-color:#00E0A0;color:#06231A;font-weight:800;}

          /* La pile : trois cartes, la suivante plus petite et plus sombre. */
          .vdec .deck{position:relative;flex:1;min-height:0;margin:2px 0 4px;}
          .vdec .card{position:absolute;inset:0;border-radius:26px;overflow:hidden;
            box-shadow:0 30px 70px rgba(0,0,0,.55);will-change:transform;
            background:linear-gradient(160deg,#243049,#0F1524);}
          .vdec .card.behind{transform:scale(.92) translateY(20px);filter:brightness(.7);}
          .vdec .card.behind2{transform:scale(.84) translateY(40px);filter:brightness(.5);}
          .vdec .card.top{cursor:grab;touch-action:none;z-index:5;}
          .vdec .card.top:active{cursor:grabbing;}
          .vdec .card.go{transition:transform .3s cubic-bezier(.4,0,1,1),opacity .3s ease;opacity:0;}
          .vdec .card.back{transition:transform .32s cubic-bezier(.22,1,.36,1);}

          .vdec .media{position:absolute;inset:0;background-size:cover;background-position:center;}
          .vdec .mono{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            font-family:var(--fd),Georgia,serif;font-size:110px;font-weight:800;color:rgba(255,255,255,.1);}
          .vdec .scrim{position:absolute;inset:0;z-index:2;pointer-events:none;
            background:linear-gradient(180deg,rgba(11,13,18,.05) 38%,rgba(11,13,18,.55) 62%,rgba(11,13,18,.96) 100%);}
          /* Compte à rebours : seulement si le pro a fixé une échéance. */
          .vdec .cd{position:absolute;top:20px;left:50%;transform:translateX(-50%);z-index:6;font-weight:700;
            font-size:12.5px;color:#fff;background:rgba(11,13,18,.55);border:1px solid rgba(240,96,143,.55);
            padding:6px 12px;border-radius:999px;white-space:nowrap;}

          .vdec .stamp{position:absolute;top:84px;z-index:7;font-weight:800;font-size:22px;letter-spacing:.04em;
            padding:8px 14px;border-radius:12px;text-transform:uppercase;pointer-events:none;}
          /* Chaque tampon est ancré du côté OPPOSÉ au geste : en glissant à droite,
             la carte part à droite — un tampon ancré à droite sortirait de l'écran
             au moment précis où il doit se lire. (v3 les met du même côté ; c'est
             le seul endroit où je m'en écarte, et c'est pour cette raison.) */
          .vdec .stamp.yes{left:18px;color:#00E0A0;border:3px solid #00E0A0;transform:rotate(-14deg);}
          .vdec .stamp.no{right:18px;color:#F0608F;border:3px solid #F0608F;transform:rotate(14deg);}
          .vdec .stamp.up{left:50%;top:42%;transform:translate(-50%,-50%);color:#fff;border:3px solid #fff;}

          .vdec .info{position:absolute;left:18px;right:18px;bottom:18px;z-index:6;}
          .vdec .nm{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:26px;line-height:1.05;color:#fff;}
          .vdec .meta{font-size:13px;color:#CFD2D6;margin-top:6px;}
          .vdec .rate{display:inline-flex;align-items:center;gap:5px;margin-top:7px;font-weight:700;font-size:12.5px;
            color:#FFD84D;background:rgba(255,196,0,.12);border:1px solid rgba(255,196,0,.35);padding:4px 10px;
            border-radius:999px;}
          .vdec .rate.neuf{color:#00E0A0;background:rgba(0,224,160,.1);border-color:rgba(0,224,160,.35);}
          .vdec .offer{margin-top:11px;}
          .vdec .offer-k{font-size:9.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#00E0A0;}
          .vdec .offer-t{font-weight:600;font-size:15px;line-height:1.35;color:#E9EBED;margin-top:5px;
            display:-webkit-box;-webkit-line-clamp:3;line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
          .vdec .offer-w{font-size:11px;color:#8A9099;margin-top:6px;}
          .vdec .rien{margin-top:11px;font-size:13px;color:#9AA0A8;line-height:1.45;}

          .vdec .hint{text-align:center;font-size:11px;color:#5C6168;margin-top:8px;}
          .vdec .bar{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:10px;}
          .vdec .act{display:flex;flex-direction:column;align-items:center;gap:6px;border:none;background:none;
            font-family:inherit;font-size:10.5px;font-weight:600;color:#5C6168;cursor:pointer;text-decoration:none;}
          .vdec .act .circle{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;
            justify-content:center;font-size:22px;border:1px solid rgba(255,255,255,.14);
            background:rgba(255,255,255,.05);color:#fff;transition:transform .15s ease;}
          .vdec .act:active .circle{transform:scale(.92);}
          .vdec .act.want .circle{width:66px;height:66px;font-size:26px;border:none;color:#06231A;
            background:linear-gradient(90deg,#00E0A0,#07B083);box-shadow:0 10px 28px rgba(0,224,160,.35);}
          .vdec .act:disabled{opacity:.35;cursor:not-allowed;}

          .vdec .empty{margin:auto;text-align:center;max-width:320px;padding:20px;}
          .vdec .empty .e{font-size:42px;}
          .vdec .empty h3{font-family:var(--fd),Georgia,serif;font-size:24px;font-weight:700;color:#fff;margin-top:12px;}
          .vdec .empty p{font-size:13.5px;line-height:1.6;color:#8A9099;margin-top:10px;}
          .vdec .empty button{margin-top:18px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);
            color:#fff;border-radius:13px;padding:12px 20px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;}

          .vdec .favs{position:absolute;inset:0;z-index:20;display:flex;align-items:flex-end;justify-content:center;
            background:rgba(0,0,0,.65);}
          .vdec .favs-p{width:100%;max-height:80%;display:flex;flex-direction:column;background:#15181D;
            border:1px solid rgba(255,255,255,.08);border-radius:26px 26px 0 0;animation:favUp .28s ease;overflow:hidden;}
          @keyframes favUp{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
          .vdec .favs-h{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px;}
          .vdec .favs-t{font-family:var(--fd),Georgia,serif;font-size:19px;font-weight:700;color:#fff;}
          .vdec .favs-l{overflow-y:auto;padding:0 18px calc(20px + env(safe-area-inset-bottom));display:flex;
            flex-direction:column;gap:9px;}
          .vdec .fav{display:flex;align-items:center;gap:11px;border:1px solid rgba(255,255,255,.1);
            border-radius:14px;padding:10px;background:rgba(255,255,255,.04);}
          .vdec .fav .im{width:44px;height:44px;flex:none;border-radius:11px;background-size:cover;
            background-position:center;background-image:linear-gradient(150deg,#243049,#0F1524);}
          .vdec .fav .fb{flex:1;min-width:0;}
          .vdec .fav .fn{display:block;font-size:13.5px;font-weight:700;color:#fff;white-space:nowrap;
            overflow:hidden;text-overflow:ellipsis;}
          .vdec .fav .fm{display:block;font-size:10.5px;color:#00E0A0;font-weight:600;text-transform:uppercase;
            letter-spacing:.05em;margin-top:2px;}
          .vdec .fav a{flex:none;text-decoration:none;background:#00E0A0;color:#06231A;border-radius:10px;
            padding:8px 12px;font-size:12.5px;font-weight:700;}
          .vdec .fav .rm{flex:none;border:none;background:none;color:rgba(255,255,255,.35);font-size:15px;
            cursor:pointer;font-family:inherit;padding:4px;}
          .vdec .favs-vide{font-size:13px;line-height:1.6;color:#8A9099;padding:6px 0 18px;}
          .vdec .favs-vide b{color:#fff;font-weight:700;}

          .vdec .toast{position:absolute;left:50%;bottom:132px;transform:translateX(-50%);z-index:30;
            background:rgba(11,13,18,.96);border:1px solid rgba(0,224,160,.4);color:#fff;border-radius:999px;
            padding:10px 18px;font-size:13px;font-weight:600;white-space:nowrap;animation:tIn .24s ease;}
          @keyframes tIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
          @media (prefers-reduced-motion:reduce){.vdec,.vdec .card,.vdec .favs-p,.vdec .toast{animation:none;transition:none;}}
          `,
        }}
      />

      <button type="button" className="vdec-open" onClick={ouvre}>
        🔎 Découvrir les {fiches.length} commerce{fiches.length > 1 ? "s" : ""} de {ville}
      </button>

      {ouvert && (
        <div className="vdec" role="dialog" aria-modal="true" aria-label={`Le catalogue de ${ville}`}>
          <div className="app">
            <div className="dhead">
              <span className="logo">
                Pop<em>ey</em>
              </span>
              <button type="button" className="pill" onClick={onVilles} disabled={!onVilles}>
                📍 {ville} {onVilles ? "▾" : ""}
              </button>
              <button type="button" className="pill mine" onClick={() => setVoirFavoris(true)} aria-label="Mes favoris">
                ♥<b>{favoris.length}</b>
              </button>
              <button type="button" className="pill x" onClick={() => setOuvert(false)} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="live">
              <b>{fiches.length}</b> commerce{fiches.length > 1 ? "s" : ""} à {ville}
              {annonces > 0 && (
                <>
                  {" · "}
                  <b>{annonces}</b> annonce{annonces > 1 ? "s" : ""} en cours
                </>
              )}
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

            <div className="deck">
              {total === 0 ? (
                <div className="empty">
                  <div className="e">🌱</div>
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
                  <div className="e">✨</div>
                  <h3>Vous avez tout vu à {ville}.</h3>
                  <p>
                    Le catalogue s&apos;agrandit à mesure que d&apos;autres commerçants mettent leur site en ligne.
                  </p>
                  <button type="button" onClick={() => setI(0)}>
                    🔄 Revoir les commerces
                  </button>
                </div>
              ) : (
                pile.map((x, n) => {
                  const dessus = n === pile.length - 1;
                  const rang = pile.length - 1 - n; // 0 = dessus, 1 = derrière, 2 = tout au fond
                  const cls = dessus ? "top" : rang === 1 ? "behind" : "behind2";
                  return (
                    <div
                      key={`${x.slug}-${i}-${n}`}
                      className={`card ${cls}${dessus ? (sortie ? " go" : glisse ? "" : " back") : ""}`}
                      style={
                        dessus
                          ? { transform: `translate(${pos.x}px,${pos.y}px) rotate(${rot}deg)` }
                          : undefined
                      }
                      onPointerDown={dessus ? onDown : undefined}
                      onPointerMove={dessus ? onMove : undefined}
                      onPointerUp={dessus ? onUp : undefined}
                      onPointerCancel={dessus ? onUp : undefined}
                    >
                      <div
                        className="media"
                        style={x.photo ? { backgroundImage: `url("${x.photo}")` } : undefined}
                      >
                        {!x.photo && (
                          <span className="mono" aria-hidden="true">
                            {x.nom.trim().slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="scrim" />
                      {dessus && jusqua && <span className="cd">⏳ {jusqua}</span>}
                      {dessus && tampon && (
                        <span className={`stamp ${tampon}`} style={{ opacity: force }} aria-hidden="true">
                          {tampon === "yes" ? "Gardé" : tampon === "no" ? "Passer" : "Le site"}
                        </span>
                      )}
                      <div className="info">
                        <div className="nm">{x.nom}</div>
                        <div className="meta">📍 {x.metier} · {ville}</div>
                        {x.note != null && x.avis != null && x.avis > 0 ? (
                          <div className="rate">
                            ⭐ {x.note.toFixed(1).replace(".", ",")} · {x.avis} avis
                          </div>
                        ) : (
                          <div className="rate neuf">✨ Nouveau sur Popey</div>
                        )}
                        {x.texte ? (
                          <div className="offer">
                            <div className="offer-k">✦ En ce moment</div>
                            <div className="offer-t">{x.texte}</div>
                            {x.quand && <div className="offer-w">{x.quand}</div>}
                          </div>
                        ) : (
                          <div className="rien">Pas d&apos;annonce en ce moment — son site vous dit tout le reste.</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!fini && total > 0 && f && (
              <>
                <div className="hint">glissez la carte — à gauche pour passer, à droite pour garder, vers le haut pour y aller</div>
                <div className="bar">
                  <button type="button" className="act" onClick={() => suivante("non")}>
                    <span className="circle">✕</span>Passer
                  </button>
                  <button type="button" className="act want" onClick={() => garder(f)}>
                    <span className="circle">♥</span>Garder
                  </button>
                  <a className="act" href={`/site-internet/apercu/${f.slug}?via=catalogue`}>
                    <span className="circle">↑</span>Le site
                  </a>
                </div>
              </>
            )}
            {!fini && total > 0 && i > 0 && (
              <div className="hint">
                <button
                  type="button"
                  onClick={revenir}
                  style={{ background: "none", border: "none", color: "#8A9099", font: "inherit", cursor: "pointer" }}
                >
                  ↩ revenir au précédent
                </button>
              </div>
            )}

            {toast && <div className="toast">{toast}</div>}

            {voirFavoris && (
              <div className="favs" onClick={() => setVoirFavoris(false)}>
                <div className="favs-p" onClick={(e) => e.stopPropagation()}>
                  <div className="favs-h">
                    <span className="favs-t">♥ Mes favoris</span>
                    <button type="button" className="pill x" onClick={() => setVoirFavoris(false)} aria-label="Fermer">
                      ✕
                    </button>
                  </div>
                  <div className="favs-l">
                    {favorisFiches.length === 0 ? (
                      <div className="favs-vide">
                        Rien de gardé pour l&apos;instant. Glissez une carte vers la droite, ou touchez ♥. Vos favoris
                        restent <b>sur cet appareil</b> — rien n&apos;est envoyé nulle part.
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
