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

const CLE_USAGES = "clikme_asaisir_usages";
const USAGES_AVEC_LEGENDE = 3;
const SEUIL_PX = 96;

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
        router.push(`/site-internet/${carte.auteurSlug}`);
        return;
      }
      setDrag(null);
      setI((n) => n + 1);
    },
    [carte, garder, router]
  );

  // ── Gestes ────────────────────────────────────────────────────────────────
  const onDown = (x: number, y: number) => {
    depart.current = { x, y };
    setDrag({ x: 0, y: 0 });
  };
  const onMove = (x: number, y: number) => {
    if (!depart.current) return;
    setDrag({ x: x - depart.current.x, y: y - depart.current.y });
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
        <div>
          <div className="t">Sélectionné pour vous, maintenant</div>
          <div className="s">
            {i + 1} sur {cartes.length} · les plus proches, les plus urgents
          </div>
        </div>
        <div className="asx-cnt">
          <b>♥ {gardees.size}</b>
          <span>gardées</span>
        </div>
      </div>
      <div className="asx-jauge" aria-hidden="true">
        <span style={{ width: `${Math.round(((i + 1) / cartes.length) * 100)}%` }} />
      </div>

      <div className="asx-pile">
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
          <div className="asx-img" style={carte.photo ? { backgroundImage: `url(${JSON.stringify(carte.photo)})` } : undefined}>
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
            {carte.fraicheur ? <div className="asx-quand">{carte.fraicheur}</div> : null}
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
          <span className="mid">Garder</span>
          <span>La boutique</span>
        </div>
      )}
      <div className="asx-aide">Glissez vers le haut pour réserver ↑</div>
    </div>
  );
}
