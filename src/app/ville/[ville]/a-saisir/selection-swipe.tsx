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
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CarteVue } from "../_ui/carte";
import { teinte, initiales } from "../_ui/teinte";
import type { FichePro } from "@/lib/direct/fiche-pro";
import { PanneauPro, PanneauReserve, StylesPanneaux, type ChoixReserve } from "./panneaux";

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
  fiches,
  prenom = "",
}: {
  cartes: CarteVue[];
  ville: string;
  villeNom: string;
  gardeesInitiales: string[];
  /** La fiche du commerce de chaque carte, par identifiant d'annonce. */
  fiches: Record<string, FichePro>;
  /** Le prénom laissé par l'habitant, pour signer le message de réservation. */
  prenom?: string;
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
  /** LE PANNEAU OUVERT, s'il y en a un. Deux, jamais en même temps : « je
   *  réserve » vient après un choix, « le pro » avant. */
  const [aReserver, setAReserver] = useState<ChoixReserve | null>(null);
  const [proOuvert, setProOuvert] = useState<CarteVue | null>(null);

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

  /**
   * CE QUE CHAQUE GESTE FAIT VRAIMENT — et deux d'entre eux ne faisaient rien.
   *
   * « réserver » (le glissement vers le haut) rangeait la carte dans les
   * gardées et passait à la suivante : exactement l'effet du glissement vers la
   * DROITE. Deux gestes distincts, un seul résultat, et le plus engageant des
   * deux ne menait nulle part.
   *
   * « boutique » envoyait sur le site du commerçant, c'est-à-dire qu'il faisait
   * QUITTER l'écran en perdant la sélection en cours.
   *
   * Désormais :
   *   · GAUCHE  → on passe.
   *   · DROITE  → c'est gardé DANS Ma carte, et le panneau propose aussitôt de
   *               prévenir le commerce. C'est le seul endroit où l'on s'engage.
   *   · HAUT    → la fiche du commerce, sans quitter la pile.
   */
  const agir = useCallback(
    (g: Geste) => {
      if (!carte) return;
      if (g === "boutique") {
        setDrag(null);
        setProOuvert(carte);
        return;
      }
      if (g === "garder" || g === "reserver") {
        void garder(carte.id);
        setDrag(null);
        // La façon la mieux placée est celle que le serveur a mise en tête —
        // du prix le plus haut au plus bas. Sans façon, on réserve l'annonce.
        setAReserver({ carte, facon: carte.facons.find((f) => f.etat !== "epuise") ?? null });
        return;
      }
      setDrag(null);
      setI((n) => n + 1);
    },
    [carte, garder]
  );

  /** On ferme le panneau ET on avance : la carte est traitée, la garder à
   *  l'écran obligerait à la repasser une seconde fois. */
  const suivante = useCallback(() => {
    setAReserver(null);
    setProOuvert(null);
    setI((n) => n + 1);
  }, []);

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
    if (drag.y < -SEUIL_PX && Math.abs(drag.y) > Math.abs(drag.x)) agir("boutique");
    else if (drag.x > SEUIL_PX) agir("garder");
    else if (drag.x < -SEUIL_PX) agir("passer");
    else setDrag(null);
  };

  // Le clavier n'est pas un supplément : sans lui, cet écran est inutilisable
  // pour qui ne peut pas glisser.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      // Un panneau ouvert prend la main : sans ce garde-fou, une flèche tapée
      // en lisant la fiche faisait défiler la pile derrière.
      if (aReserver || proOuvert) {
        if (e.key === "Escape") { setAReserver(null); setProOuvert(null); }
        return;
      }
      if (e.key === "ArrowLeft") agir("passer");
      else if (e.key === "ArrowRight") agir("garder");
      else if (e.key === "ArrowUp") agir("boutique");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [agir, aReserver, proOuvert]);

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

  // On ne « veut » pas une table, on la réserve ; on ne « réserve » pas une
  // fournée, on la veut. Le mot suit la famille de l'annonce.
  const action = carte.famille === "menu" || carte.famille === "place" ? "Je réserve" : "Je veux";
  const rot = drag ? Math.max(-9, Math.min(9, drag.x / 14)) : 0;
  const tampon = drag && drag.y < -SEUIL_PX ? "LE PRO" : drag && drag.x > SEUIL_PX ? "JE RÉSERVE" : drag && drag.x < -SEUIL_PX ? "PASSÉ" : "";

  return (
    <div className="asx">
      <StylesPanneaux />
      {/* MA CARTE EST EN HAUT À DROITE, et elle est CLIQUABLE.
          Le compte des gardées vivait dans une ligne de texte sous le titre :
          on gardait des annonces sans jamais voir où elles allaient, et sans
          pouvoir y aller. Une pastille en haut à droite, c'est la place que
          tout le monde cherche des yeux. */}
      <div className="asx-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">Sélectionné pour vous</div>
          <div className="s">{i + 1} sur {cartes.length} · les plus proches, les plus urgents</div>
        </div>
        <Link href={`/ville/${ville}/mes-commerces`} prefetch={false} className={`asx-carte-a${gardees.size ? " on" : ""}`}>
          <span aria-hidden="true">💚</span>Ma carte
          {gardees.size > 0 ? <b>{gardees.size}</b> : null}
        </Link>
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

      {/* LES TROIS GESTES SONT MAINTENANT NOMMÉS EN PERMANENCE.
          Les icônes seules ne sont pas évidentes — la troisième surtout — et la
          légende ne s'affichait qu'aux trois premiers usages. Or ce sont trois
          engagements très différents : passer, réserver, se renseigner. On les
          écrit, tout le temps. */}
      <div className="asx-boutons">
        <button type="button" className="b s" onClick={() => agir("passer")}>
          <i aria-hidden="true">✕</i><em>Passer</em>
        </button>
        <button type="button" className="b g" onClick={() => agir("garder")}>
          <i aria-hidden="true">♥</i><em>{action}</em>
        </button>
        <button type="button" className="b s" onClick={() => agir("boutique")}>
          <i aria-hidden="true">↑</i><em>Le pro</em>
        </button>
      </div>
      {legende && <div className="asx-aide">Glissez la carte pour décider · ↑ pour voir le commerce</div>}

      {aReserver && (
        <PanneauReserve
          choix={aReserver}
          fiche={fiches[aReserver.carte.id] ?? null}
          prenom={prenom}
          ville={ville}
          onFermer={suivante}
        />
      )}
      {proOuvert && (
        <PanneauPro
          carte={proOuvert}
          fiche={fiches[proOuvert.id] ?? null}
          onFermer={() => setProOuvert(null)}
          onReserver={() => {
            const c = proOuvert;
            setProOuvert(null);
            void garder(c.id);
            setAReserver({ carte: c, facon: c.facons.find((f) => f.etat !== "epuise") ?? null });
          }}
        />
      )}
    </div>
  );
}
