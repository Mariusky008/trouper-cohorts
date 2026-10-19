"use client";

// ☀️ LA PROPOSITION DU MATIN, AU COMPTOIR — « oui », et c'est publié.
//
// Le fantôme a choisi ce matin une pièce de sa vitrine (voir
// `lib/direct/proposition-matin.ts`). Elle est en haut de son accueil, avec
// sa photo, son nom, son prix et la raison du jour quand le calendrier en
// donne une. Un geste : « ✨ Oui, publie-la » — Le Direct, sa page, ses
// réseaux. « Voir avant » ouvre le récapitulatif (il peut ajouter sa voix,
// changer le prix), « Une autre » en propose une autre, « Pas aujourd'hui »
// range la carte jusqu'à demain.
//
// LA DÉMONSTRATION propose une pièce d'exemple de son métier, étiquetée comme
// telle : c'est elle qu'on montre aux commerçants.
import { useCallback, useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { jourParis } from "@/lib/jour-paris";
import type { PieceComptoir } from "@/lib/site-internet/pieces-comptoir";
import { apresLeGeste, avecLaPiece, etatDuJour, propositionDuJour, type EtatProposition, type Proposition } from "@/lib/direct/proposition-matin";

export type PieceProposee = NonNullable<Proposition["piece"]>;
type EtatCarte = { proposition: Proposition | null; statut: string; whatsapp: boolean; whatsappPossible: boolean };

/* LES PIÈCES D'EXEMPLE DE LA DÉMONSTRATION — sans prix : on n'invente pas le sien. */
const EXEMPLES: Partial<Record<FamilleDouble, { nom: string; photo: string }[]>> = {
  mode: [
    { nom: "Le pull mohair marine", photo: "/direct/mode-pull-mohair-marine.jpeg" },
    { nom: "La robe à pois dorés", photo: "/direct/mode-robe-pois-dores.jpg" },
  ],
  coiffure: [{ nom: "Le carré flou", photo: "/direct/coiffure-femme-face.jpg" }],
  ongles: [{ nom: "La pose nude rosée", photo: "/direct/avis-ongles.jpg" }],
  fleurs: [{ nom: "Le bouquet de saison", photo: "/direct/bouquet-du-jour.jpg" }],
  lunettes: [{ nom: "La monture écaille", photo: "/direct/lunettes1.jpg" }],
  createur: [{ nom: "La bougie parfumée", photo: "/direct/atelier-bougies.jpeg" }],
  seance: [{ nom: "Le flash du moment", photo: "/direct/atelier-tatouage.jpeg" }],
  librairie: [{ nom: "La Vérité sur l’affaire Harry Quebert", photo: "/direct/livres/harry-quebert.jpg" }],
};

const exemplesDe = (f: FamilleDouble): PieceComptoir[] =>
  (EXEMPLES[f] ?? []).map((x, i) => ({ id: `exemple-${f}-${i}`, nom: x.nom, photo: x.photo, rayon: "Nouveautés", publieLe: new Date(0).toISOString(), vitrine: true }));

async function appeler(reel: NonNullable<CommerceComptoir["reel"]>, corps: Record<string, unknown>): Promise<EtatCarte> {
  const r = await fetch("/api/site-internet/pro/proposition", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: reel.slug, token: reel.token, ...corps }),
  });
  const j = (await r.json().catch(() => ({}))) as EtatCarte & { error?: string };
  if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
  return j;
}

/** La proposition du jour, partagée par l'accueil et le comptoir. `etat` est `null` tant qu'on ne sait pas. */
export function useProposition(commerce: CommerceComptoir) {
  const slug = commerce.reel?.slug;
  const token = commerce.reel?.token;
  const famille = commerce.famille;
  const [etat, setEtat] = useState<EtatCarte | null>(null);
  /* LA DÉMONSTRATION GARDE SON ÉTAT DU JOUR EN MÉMOIRE. */
  const [demo, setDemo] = useState<EtatProposition | null>(null);

  useEffect(() => {
    let fini = false;
    if (slug && token) {
      appeler({ slug, token }, { action: "lire", famille })
        .then((e) => {
          if (!fini) setEtat(e);
        })
        .catch(() => {
          /* hors ligne : pas de carte, le comptoir marche sans */
        });
    } else {
      const e0 = etatDuJour(null, jourParis());
      const proposition = propositionDuJour({ famille, pieces: exemplesDe(famille), etat: e0 });
      Promise.resolve().then(() => {
        if (fini) return;
        setDemo(avecLaPiece(e0, proposition?.piece?.id));
        setEtat({ proposition, statut: e0.statut, whatsapp: false, whatsappPossible: false });
      });
    }
    return () => {
      fini = true;
    };
  }, [slug, token, famille]);

  const geste = useCallback(
    async (action: "autre" | "passer" | "publiee", pieceId?: string) => {
      if (slug && token) {
        try {
          setEtat(await appeler({ slug, token }, { action, famille, pieceId }));
        } catch {
          /* hors ligne : on cache la carte plutôt que de la laisser mentir */
          if (action !== "autre") setEtat((e) => (e ? { ...e, proposition: null, statut: action === "publiee" ? "publiee" : "passee" } : e));
        }
        return;
      }
      if (!demo) return;
      const suite0 = apresLeGeste(demo, action, pieceId);
      const proposition = propositionDuJour({ famille, pieces: exemplesDe(famille), etat: suite0 });
      setDemo(avecLaPiece(suite0, proposition?.piece?.id));
      setEtat((e) => ({ proposition, statut: suite0.statut, whatsapp: e?.whatsapp ?? false, whatsappPossible: false }));
    },
    [slug, token, famille, demo],
  );

  const basculerWhatsapp = useCallback(
    async (on: boolean) => {
      if (!slug || !token) return;
      try {
        setEtat(await appeler({ slug, token }, { action: "whatsapp", on, famille }));
      } catch {
        /* rien n'a changé : l'interrupteur reste où il était */
      }
    },
    [slug, token, famille],
  );

  return { etat, geste, basculerWhatsapp };
}
export type PropositionDuComptoir = ReturnType<typeof useProposition>;

/** Ce qui s'affiche : une pièce prête, une vitrine à remplir, ou — avec une date — la photo du jour. */
export function propositionAMontrer(p: PropositionDuComptoir): Proposition | null {
  const x = p.etat?.proposition;
  if (!x) return null;
  return x.genre === "photo" && !x.occasion ? null : x;
}

export function CarteProposition({
  proposition: p,
  onOui,
  onVoir,
  onPhoto,
  onVitrine,
}: {
  commerce: CommerceComptoir;
  proposition: PropositionDuComptoir;
  onOui: (piece: PieceProposee) => void;
  onVoir: (piece: PieceProposee) => void;
  onPhoto: () => void;
  onVitrine: () => void;
}) {
  const [occupe, setOccupe] = useState(false);
  const x = propositionAMontrer(p);
  if (!x) return null;
  const piece = x.piece;
  return (
    <section className="pm" aria-label="Ta proposition du jour">
      <StylesProposition />
      <div className="pm-tete">
        <span>☀️ Ta proposition du jour</span>
      </div>
      {x.occasion && <p className="pm-occasion">🗓️ {x.occasion}</p>}

      {x.genre === "piece" && piece ? (
        <>
          <figure className="pm-piece">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={piece.photo} alt="" />
            <figcaption>
              <b>{piece.nom}</b>
              {piece.prix && <em>{piece.prix}</em>}
              <span>De ta vitrine · prête à publier</span>
            </figcaption>
          </figure>
          <button
            type="button"
            className="cz-go grand pm-oui"
            disabled={occupe}
            onClick={() => {
              setOccupe(true);
              onOui(piece);
            }}
          >
            ✨ Oui, publie-la
          </button>
          <div className="pm-liens">
            <button type="button" className="cz-lien" onClick={() => onVoir(piece)}>
              Voir avant
            </button>
            <button type="button" className="cz-lien" onClick={() => void p.geste("autre", piece.id)}>
              Une autre
            </button>
            <button type="button" className="cz-lien" onClick={() => void p.geste("passer", piece.id)}>
              Pas aujourd’hui
            </button>
          </div>
        </>
      ) : x.genre === "vitrine" ? (
        <>
          <p className="pm-phrase">Mets quelques photos dans ta vitrine : chaque matin, je t’en proposerai une, prête à publier.</p>
          <button type="button" className="cz-go pm-oui" onClick={onVitrine}>
            📸 Remplir ma vitrine
          </button>
        </>
      ) : (
        <>
          <p className="pm-phrase">{x.phrase}</p>
          <button type="button" className="cz-go pm-oui" onClick={onPhoto}>
            📸 Prendre la photo
          </button>
        </>
      )}

      {/* LE MATIN, SUR SON TÉLÉPHONE — seulement quand le message peut vraiment partir. */}
      {p.etat?.whatsappPossible && (
        <label className="pm-whatsapp">
          <input type="checkbox" checked={p.etat.whatsapp} onChange={(e) => void p.basculerWhatsapp(e.target.checked)} />
          <span>📲 Me l’envoyer chaque matin sur WhatsApp</span>
        </label>
      )}
    </section>
  );
}

function StylesProposition() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.pm{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:22px;
  background:linear-gradient(160deg,rgba(245,162,58,.16),rgba(255,46,154,.08));border:1px solid rgba(245,162,58,.45);
  box-shadow:0 0 28px rgba(245,162,58,.14);}
.pm-tete{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.pm-exemple{font-style:normal;font-size:10.5px;padding:3px 9px;border-radius:999px;background:rgba(245,162,58,.18);}
.pm-occasion{margin:0;font-size:15px;font-weight:700;line-height:1.35;}
.pm-piece{display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;margin:0;}
.pm-piece img{width:96px;height:120px;border-radius:14px;object-fit:cover;background:var(--nappe2);}
.pm-piece figcaption{min-width:0;display:flex;flex-direction:column;gap:3px;}
.pm-piece b{font-size:17px;line-height:1.25;}
.pm-piece em{font-style:normal;font-weight:800;color:var(--ambre);}
.pm-piece span{font-size:12.5px;color:var(--gris);}
.pm-phrase{margin:0;font-size:15px;line-height:1.4;}
.pm-liens{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 6px;}
.pm-liens .cz-lien{font-size:14px;}
.pm-whatsapp{display:flex;align-items:center;gap:10px;padding-top:4px;font-size:14px;color:var(--gris);cursor:pointer;}
.pm-whatsapp input{width:20px;height:20px;accent-color:var(--rose);}
`,
      }}
    />
  );
}
