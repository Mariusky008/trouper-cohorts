"use client";

// ÉCRAN 2 — À SAISIR. Le swipe plein écran.
//
// POURQUOI PLEIN ÉCRAN : le glissement vertical vers le haut réserve. Un geste
// vertical ne peut pas cohabiter avec une page qui défile — le navigateur
// gagnerait toujours, et le geste ne serait jamais reconnu. C'est la raison
// pour laquelle cet écran ne vit pas à l'intérieur du fil.
//
// LA MICRO-LÉGENDE sous les boutons (« Passer · Garder · La boutique ») est
// affichée aux trois premiers usages, puis disparaît définitivement. Les icônes
// seules ne sont pas évidentes, la troisième surtout ; mais une légende
// permanente sous trois boutons ronds transforme un geste en formulaire.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { CarteVue } from "../_ui/carte";
import { teinte, initiales } from "../_ui/teinte";

const CLE_USAGES = "clikme_asaisir_usages";
const USAGES_AVEC_LEGENDE = 3;
const SEUIL_PX = 96;
/** Au-delà, le doigt a glissé : ce n'était pas un appui. */
const SEUIL_APPUI = 8;

type Geste = "passer" | "garder" | "boutique" | "reserver";

export function SelectionSwipe({
  cartes,
  ville,
  villeNom,
  gardeesInitiales,
}: {
  cartes: CarteVue[];
  ville: string;
  villeNom: string;
  gardeesInitiales: string[];
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [gardees, setGardees] = useState<Set<string>>(() => new Set(gardeesInitiales));
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const depart = useRef<{ x: number; y: number } | null>(null);
  /** L'amplitude du dernier geste, en pixels.
   *
   *  Elle sert à distinguer UN APPUI d'un GLISSEMENT. Sans elle, on ne peut pas
   *  rendre les façons cliquables : un lien dans une carte qu'on manipule au
   *  doigt se déclencherait à chaque geste raté. Au-delà de quelques pixels, le
   *  doigt glissait — l'appui n'en est pas un. */
  const amplitude = useRef(0);

  // Le compteur d'usages est local à l'appareil : il ne concerne que
  // l'apprentissage du geste, il n'a rien à faire sur un serveur.
  //
  // Lu via useSyncExternalStore plutôt que dans un effet : c'est un fait
  // d'environnement qui ne change pas pendant la visite, et cette lecture est
  // celle que React sait réconcilier entre le rendu serveur et l'hydratation
  // sans signaler de divergence. Le stockage refusé renvoie 0 — on aide, plutôt
  // que de laisser trois boutons ronds sans légende.
  const usages = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return Number(localStorage.getItem(CLE_USAGES) || "0");
      } catch {
        return 0;
      }
    },
    () => 0
  );
  const legende = usages < USAGES_AVEC_LEGENDE;

  // L'incrément est un effet de bord sur un système externe : c'est exactement
  // ce à quoi sert un effet, et il n'y a pas d'état React à mettre à jour.
  useEffect(() => {
    try {
      localStorage.setItem(CLE_USAGES, String(Number(localStorage.getItem(CLE_USAGES) || "0") + 1));
    } catch {
      /* stockage refusé : la légende restera affichée, c'est le bon défaut */
    }
  }, []);

  const carte = cartes[i];
  const reste = cartes.length - i;

  const garder = useCallback(
    async (id: string) => {
      setGardees((s) => new Set(s).add(id));
      try {
        await fetch("/api/direct/garder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicationId: id, ville, garder: true }),
        });
      } catch {
        setGardees((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    },
    [ville]
  );

  const agir = useCallback(
    (g: Geste) => {
      if (!carte) return;
      if (g === "garder" || g === "reserver") void garder(carte.id);
      if (g === "boutique" && carte.auteurSlug) {
        router.push(`/site-internet/apercu/${carte.auteurSlug}?via=direct&pub=${carte.id}`);
        return;
      }
      setDrag(null);
      setI((n) => n + 1);
    },
    [carte, garder, router]
  );

  /**
   * Ouvrir une façon depuis la carte.
   *
   * REFUSÉE APRÈS UN GLISSEMENT. La carte se manipule au doigt : sans ce
   * garde-fou, un balayage horizontal qui commence sur une ligne de prix
   * ouvrirait l'écran du Clik au lieu de passer la carte. Le seuil est petit —
   * un doigt bouge toujours un peu — mais suffit à séparer les deux gestes.
   */
  const ouvrirFacon = (idFacon: string) => {
    if (amplitude.current > SEUIL_APPUI) return;
    router.push(`/ville/${ville}/clik/${idFacon}`);
  };

  // ── Gestes ────────────────────────────────────────────────────────────────
  const onDown = (x: number, y: number) => {
    depart.current = { x, y };
    amplitude.current = 0;
    setDrag({ x: 0, y: 0 });
  };
  const onMove = (x: number, y: number) => {
    if (!depart.current) return;
    const dx = x - depart.current.x;
    const dy = y - depart.current.y;
    amplitude.current = Math.max(amplitude.current, Math.hypot(dx, dy));
    setDrag({ x: dx, y: dy });
  };
  const onUp = () => {
    if (!depart.current || !drag) {
      depart.current = null;
      setDrag(null);
      return;
    }
    depart.current = null;
    // Le vertical prime : « réserver » est le geste le plus engageant, il ne doit
    // pas être avalé par un mouvement horizontal approximatif.
    if (drag.y < -SEUIL_PX && Math.abs(drag.y) > Math.abs(drag.x)) agir("reserver");
    else if (drag.x > SEUIL_PX) agir("garder");
    else if (drag.x < -SEUIL_PX) agir("passer");
    else setDrag(null);
  };

  // Le clavier n'est pas un supplément : sans lui, cet écran est inutilisable
  // pour qui ne peut pas glisser.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") agir("passer");
      else if (e.key === "ArrowRight") agir("garder");
      else if (e.key === "ArrowUp") agir("reserver");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [agir]);

  if (!carte) {
    return (
      <div className="asx-fin">
        <h2>C&apos;est tout pour maintenant</h2>
        <p>
          Vous avez vu la sélection du moment à {villeNom}.
          {gardees.size > 0 ? ` ${gardees.size} gardée${gardees.size > 1 ? "s" : ""} vous attend${gardees.size > 1 ? "ent" : ""} dans Mes commerces.` : ""}
        </p>
        <button type="button" className="asx-retour" onClick={() => router.push(`/ville/${ville}`)}>
          Retour au fil →
        </button>
      </div>
    );
  }

  const rot = drag ? Math.max(-9, Math.min(9, drag.x / 14)) : 0;
  const tampon = drag && drag.y < -SEUIL_PX ? "RÉSERVER" : drag && drag.x > SEUIL_PX ? "GARDÉ" : drag && drag.x < -SEUIL_PX ? "PASSÉ" : "";

  return (
    <div className="asx">
      <div className="asx-top">
        <div style={{ flex: 1 }}>
          <div className="t">Sélectionné pour vous</div>
          <div className="s">
            {i + 1} sur {cartes.length} · les plus proches, les plus urgents
            {gardees.size > 0 ? ` · ${gardees.size} gardée${gardees.size > 1 ? "s" : ""}` : ""}
          </div>
        </div>
      </div>
      {/* UNE BARRE PAR CARTE, pas une jauge continue. Une jauge dit « vous
          avancez » ; des segments disent « il en reste trois », qui est la
          seule question qu'on se pose en glissant. */}
      <div className="asx-seg" aria-hidden="true">
        {cartes.map((c, k) => (
          <i key={c.id} className={k <= i ? "on" : ""} />
        ))}
      </div>

      <div className="asx-pile">
       <div className="asx-stack">
        {reste > 2 && <div className="asx-derr b2" aria-hidden="true" />}
        {reste > 1 && <div className="asx-derr b1" aria-hidden="true" />}
        <div
          className="asx-carte"
          style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rot}deg)`, transition: "none" } : undefined}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            onDown(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => onMove(e.clientX, e.clientY)}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {/* Sans photo : le MÊME repli que le fil, teinté d'après le nom du
              commerce. Cet écran affichait un dégradé sable fixe, identique
              pour tout le monde — deux annonces différentes se ressemblaient,
              et aucune ne ressemblait à ce qu'on venait de voir dans le fil. */}
          <div
            className="asx-img"
            style={
              carte.photo
                ? { backgroundImage: `url(${JSON.stringify(carte.photo)})` }
                : { backgroundImage: teinte(carte.auteurNom) }
            }
          >
            {carte.photo ? null : <span className="asx-mono" aria-hidden="true">{initiales(carte.auteurNom)}</span>}
            {carte.echeance ? <span className="asx-ech">{carte.echeance}</span> : null}
            {carte.repere ? <span className="asx-dist">{carte.repere}</span> : null}
            <span className="asx-voile" />
            <span className="asx-qui">
              {carte.auteurMetier ? <em>{carte.auteurMetier}</em> : null}
              <b>{carte.auteurNom}</b>
            </span>
            {tampon ? <span className="asx-tampon">{tampon}</span> : null}
          </div>
          <div className="asx-corps">
            <p className="asx-texte">{carte.texte}</p>
          </div>

          {/* L'ÉCHELLE DES PRIX, DANS LA CARTE. Sans elle, on glisse sur des
              annonces sans savoir ce qu'elles proposent — c'est-à-dire au
              hasard. Non cliquable : la carte se manipule au doigt, un lien
              dedans se déclencherait à chaque geste raté. Le glissement vers le
              haut reste le geste qui engage. */}
          {carte.facons.length > 0 && (
            <div className="asx-fac">
              {carte.facons.slice(0, 3).map((f) => (
                <button
                  type="button"
                  key={f.id}
                  className={`asx-fac-l f-${f.type}`}
                  onClick={() => ouvrirFacon(f.id)}
                >
                  <span className="asx-fac-ic" aria-hidden="true">
                    {f.type === "cadeau" ? "🎁" : f.type === "express" ? "⚡" : f.type === "collectif" ? "👥" : "🕐"}
                  </span>
                  <span className="asx-fac-c">
                    <span className="asx-fac-pr">{f.prix}</span>
                    <span className="asx-fac-nm">{f.label}</span>
                  </span>
                  <span className="asx-fac-go" aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
       </div>
      </div>

      <div className="asx-boutons">
        <button type="button" className="b s" onClick={() => agir("passer")} aria-label="Passer">✕</button>
        <button type="button" className="b g" onClick={() => agir("garder")} aria-label="Garder">♥</button>
        <button type="button" className="b s" onClick={() => agir("boutique")} aria-label="Voir la boutique">◔</button>
      </div>
      {legende && (
        <div className="asx-leg">
          <span>Passer</span>
          <span>Garder</span>
          <span>La boutique</span>
        </div>
      )}
      <div className="asx-aide">Glissez vers le haut pour réserver ↑</div>
    </div>
  );
}
