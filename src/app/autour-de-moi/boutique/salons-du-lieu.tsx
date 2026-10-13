"use client";

// 🛋️ LES SALONS DU LIEU — la table des fantômes, avant d'entrer dans le salon.
//
// « Sur la page du commerçant, l'onglet Amis nous amène sur le salon de
// discussion directement, mais j'aime bien le visuel de nos petits fantômes
// assis à la table qu'on a déjà sur l'application. Ce visuel avant de rentrer
// sur le salon, et par la même occasion la possibilité de voir d'autres
// salons publics concernant ce commerçant, spécifiquement et uniquement. »
//
// LA MÊME TABLE QU'ENSEMBLE, PAS UNE COPIE : la scène est `Alcove`, le décor
// d'un salon est celui qu'il a dans l'application (`sceneDuSalon`), et ce qui
// est posé sur la table est ce que le salon contient vraiment
// (`contenuDuSalon`). Deux listes, seulement chez ce commerçant :
//
//   · MES SALONS ICI — le salon de la boutique et celui de chaque essai,
//     et les salons « Ça me va ? » ouverts sur ce téléphone (le sien, avec
//     ses amis ou ClikMe, et ceux où un ami l'a invité) ;
//   · SALONS PUBLICS — ceux qui parlent de ce commerce : ceux du téléphone
//     (la démonstration) et, dans une vraie ville, ceux du serveur. Le
//     serveur ne les rattache aujourd'hui qu'au NOM du lieu (`ou`) : on
//     compare les noms, sans accents ni majuscules.
//
// RIEN N'EST INVENTÉ : les fantômes assis sont de vrais participants ; sans
// salon, c'est ma place seule à une table vide, et l'invitation à l'ouvrir.
// Lire un salon public de la vraie ville se fait dans l'application, où l'on
// choisit sa place pour le rejoindre — les mêmes règles qu'Ensemble.

import { useRef, useState } from "react";
import { Alcove, type AlcoveData, type Assis } from "../alcove";
import { contenuDuSalon, sceneDuSalon } from "../ensemble";
import type { Salon } from "@/lib/direct/salons";
import type { SalonADecouvrir } from "@/lib/direct/conversations-sync";
import type { SalonEssaiConnu } from "@/lib/direct/avis-amis-client";

/** « Oxygène by Alexis » et « OXYGENE BY ALEXIS » sont le même lieu. */
export const memeLieu = (a?: string, b?: string) => {
  const n = (s?: string) =>
    (s ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return !!n(a) && n(a) === n(b);
};

/** Une alcôve de la liste, et ce que son bouton fait. */
type Entree = { a: AlcoveData; mien: boolean; exemple?: boolean; ouvrir: () => void };

export function SalonsDuLieu({
  nom,
  miens,
  publicsDuTelephone,
  publicsDeLaVille,
  estMoi,
  cleBoutique,
  exemple,
  essais = [],
  onEntrer,
  onEntrerEssai,
  onLirePublic,
}: {
  nom: string;
  /** Mes salons ici, le plus récent d'abord. */
  miens: Salon[];
  /** Les salons publics de ce commerce gardés sur le téléphone (la démonstration). */
  publicsDuTelephone: Salon[];
  /** Les salons publics de ce commerce sur le serveur (vraie ville). */
  publicsDeLaVille: SalonADecouvrir[];
  estMoi: (qui: string) => boolean;
  cleBoutique: string;
  /** La démonstration : les salons publics du téléphone sont des exemples, et le disent. */
  exemple: boolean;
  /** Les salons « Ça me va ? » de ce commerce ouverts sur ce téléphone, le plus récent d'abord. */
  essais?: SalonEssaiConnu[];
  /** Entrer dans un salon du téléphone (le mien, ou un public de la démo) ; sans clé : ouvrir le mien. */
  onEntrer: (cle: string | null) => void;
  /** Rouvrir un salon « Ça me va ? » (voir `SalonEssai`). */
  onEntrerEssai?: (jeton: string) => void;
  /** Lire un salon public de la vraie ville, dans l'application. */
  onLirePublic: (id: string) => void;
}) {
  const alcoveDu = (x: Salon, membre: boolean): AlcoveData => {
    const autres: Assis[] = x.acces?.participants
      ? x.acces.participants.filter((p) => !p.moi).map((p) => ({ cle: p.auteur, qui: p.qui, look: p.look }))
      : [...new Set([x.parQui, ...x.presents].filter((q) => q && !estMoi(q) && q !== "Le commerce"))].map((q) => ({ cle: q, qui: q }));
    const dernier = [...x.messages].reverse().find((m) => m.voix !== "systeme" && m.texte);
    return {
      cle: x.cle,
      scene: sceneDuSalon(x.cle),
      titre: x.cle === cleBoutique ? `Chez ${nom}` : (x.annonce ?? x.sujet),
      prive: x.acces ? x.acces.prive : x.prive !== false,
      membre,
      nb: x.acces ? x.acces.nb : autres.length + (membre ? 1 : 0),
      autres,
      ...(dernier ? { dernier: { qui: dernier.voix === "moi" || estMoi(dernier.qui) ? "Vous" : dernier.qui, texte: dernier.texte } } : {}),
      nonLus: 0,
      contenu: contenuDuSalon(x),
    };
  };
  /* UN SALON « ÇA ME VA ? » À LA TABLE : l'essai posé dessus, ceux qui ont
     parlé assis autour — ClikMe compris —, son dernier mot. */
  const alcoveDEssai = (x: SalonEssaiConnu): AlcoveData => {
    const cle = `essai:${x.j}`;
    return {
      cle,
      scene: sceneDuSalon(cle),
      titre: x.auteur ? `Ça me va ? « ${x.quoi} »` : `${x.prenom ? `L’essai de ${x.prenom}` : "Ça me va ?"} « ${x.quoi} »`,
      prive: true,
      membre: true,
      nb: x.qui.length + 1,
      autres: x.qui.map((q) => ({ cle: q, qui: q })),
      ...(x.dernier ? { dernier: x.dernier } : {}),
      nonLus: 0,
      contenu: [`/api/direct/avis-amis/image?j=${encodeURIComponent(x.j)}`],
    };
  };
  /* LES DEUX SORTES DE SALONS, DU PLUS RÉCENT AU PLUS ANCIEN — chaque liste
     garde son ordre : on vient de quitter un salon d'essai, il est devant. */
  const mesEntrees: Entree[] = [];
  {
    const a = miens.map((x) => ({ t: x.activite ?? 0, e: { a: alcoveDu(x, true), mien: true, ouvrir: () => onEntrer(x.cle) } }));
    const b = essais.map((x) => ({ t: x.t, e: { a: alcoveDEssai(x), mien: true, ouvrir: () => onEntrerEssai?.(x.j) } }));
    let i = 0;
    let k = 0;
    while (i < a.length || k < b.length) mesEntrees.push(k >= b.length || (i < a.length && a[i].t >= b[k].t) ? a[i++].e : b[k++].e);
  }
  const publiques: Entree[] = [
    ...publicsDeLaVille.map((x) => {
      const scene = `pub:${x.id}`;
      return {
        a: {
          cle: scene,
          scene,
          titre: x.sujet,
          prive: false,
          membre: false,
          nb: x.nb,
          autres: (x.visibles ?? []).map((v) => ({ cle: v.auteur, qui: v.qui, look: v.look })),
          ...(x.dernier ? { dernier: x.dernier } : {}),
          nonLus: 0,
          contenu: x.photo && /^(https?:|\/)/.test(x.photo) ? [x.photo] : [],
        },
        mien: false,
        ouvrir: () => onLirePublic(x.id),
      };
    }),
    ...publicsDuTelephone.map((x) => {
      const membre = x.presents.some(estMoi) || estMoi(x.parQui);
      return { a: alcoveDu(x, membre), mien: membre, exemple, ouvrir: () => onEntrer(x.cle) };
    }),
  ];

  const [source, setSource] = useState<"miens" | "publics">(() => (mesEntrees.length || !publiques.length ? "miens" : "publics"));
  const [rang, setRang] = useState(0);
  const liste = source === "miens" ? mesEntrees : publiques;
  const i = Math.min(rang, Math.max(0, liste.length - 1));
  const courante = liste[i];
  const changer = (s: "miens" | "publics") => {
    setSource(s);
    setRang(0);
  };
  const aller = (d: number) => setRang((r) => (liste.length ? (Math.min(r, liste.length - 1) + d + liste.length) % liste.length : 0));

  /* LE GLISSER D'UN SALON À L'AUTRE, comme dans Ensemble. */
  const depart = useRef<number | null>(null);

  /* SANS SALON À MOI : ma place, seule, à une table vide — et l'invitation à l'ouvrir. */
  const tableVide: AlcoveData = {
    cle: cleBoutique,
    scene: sceneDuSalon(cleBoutique),
    titre: `Chez ${nom}`,
    prive: true,
    membre: true,
    nb: 1,
    autres: [],
    nonLus: 0,
    contenu: [],
  };
  const vide = !courante;
  const scene = courante?.a ?? (source === "miens" ? tableVide : null);

  return (
    <section className="sl" aria-label={`Les salons chez ${nom}`}>
      <StylesSalonsDuLieu />
      <div className="sl-onglets" role="tablist">
        <button type="button" role="tab" aria-selected={source === "miens"} onClick={() => changer("miens")}>
          Mes salons ici <b>{mesEntrees.length}</b>
        </button>
        <button type="button" role="tab" aria-selected={source === "publics"} onClick={() => changer("publics")}>
          Salons publics <b>{publiques.length}</b>
        </button>
      </div>

      {scene ? (
        <div
          className="sl-scene"
          onPointerDown={(e) => {
            depart.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (depart.current == null) return;
            const dx = e.clientX - depart.current;
            depart.current = null;
            if (Math.abs(dx) > 40 && liste.length > 1) aller(dx < 0 ? 1 : -1);
          }}
        >
          <Alcove key={scene.scene ?? scene.cle} a={scene} vous />
          {courante?.exemple && <span className="sl-exemple">Exemple</span>}
          {liste.length > 1 && (
            <>
              <button type="button" className="sl-fleche g" aria-label="Salon précédent" onClick={() => aller(-1)}>
                ‹
              </button>
              <button type="button" className="sl-fleche d" aria-label="Salon suivant" onClick={() => aller(1)}>
                ›
              </button>
              <span className="sl-rang">
                {i + 1} / {liste.length}
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="sl-rien">
          <p>
            Pas encore de salon public chez {nom}.<span>Quand quelqu’un en ouvre un, il apparaît ici.</span>
          </p>
        </div>
      )}

      {scene && (
        <div className="sl-bas">
          <p className="sl-meta">
            {scene.prive ? "🔒 Privé" : "🌐 Public"} · {scene.nb} participant{scene.nb > 1 ? "s" : ""}
          </p>
          <h3>{scene.titre}</h3>
          {vide ? (
            <p className="sl-dit">Personne ici pour l’instant. Ouvrez votre salon, puis invitez qui vous voulez.</p>
          ) : scene.dernier ? (
            <p className="sl-dit">
              <b>{scene.dernier.qui} :</b> {scene.dernier.texte}
            </p>
          ) : null}
          <button type="button" className="sl-cta" onClick={() => (courante ? courante.ouvrir() : onEntrer(null))}>
            {vide ? "Ouvrir mon salon ici" : courante?.mien ? "Entrer dans la discussion" : "Voir la discussion"} <span aria-hidden="true">→</span>
          </button>
          {liste.length > 1 && <p className="sl-glisse">Glissez pour voir un autre salon</p>}
        </div>
      )}
    </section>
  );
}

function StylesSalonsDuLieu() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.sl{display:flex;flex-direction:column;gap:12px;padding:12px 16px 16px;}
.sl-onglets{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;}
.sl-onglets::-webkit-scrollbar{display:none;}
.sl-onglets button{flex:none;display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;cursor:pointer;font:inherit;font-size:14px;font-weight:800;
  color:#FFF4E6;background:rgba(255,244,230,.06);border:1.5px solid rgba(255,244,230,.14);}
.sl-onglets button[aria-selected="true"]{color:#2A1708;background:linear-gradient(180deg,#FFC867,#F5A23A);border-color:transparent;}
.sl-onglets b{min-width:20px;padding:1px 6px;border-radius:999px;font-size:12px;text-align:center;background:rgba(0,0,0,.2);}
.sl-scene{position:relative;height:clamp(250px,46vh,420px);border-radius:22px;overflow:hidden;touch-action:pan-y;
  border:1px solid rgba(255,214,150,.18);box-shadow:0 18px 40px -20px rgba(0,0,0,.8);}
.sl-fleche{position:absolute;top:50%;z-index:5;width:36px;height:36px;margin-top:-18px;border-radius:50%;border:1px solid rgba(255,244,230,.3);cursor:pointer;
  font:inherit;font-size:22px;line-height:1;color:#FFF4E6;background:rgba(20,12,8,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
.sl-fleche.g{left:10px;}
.sl-fleche.d{right:10px;}
.sl-rang{position:absolute;top:10px;left:50%;z-index:5;transform:translateX(-50%);padding:3px 10px;border-radius:999px;font-size:12px;font-weight:800;
  color:#FFF4E6;background:rgba(20,12,8,.55);}
.sl-exemple{position:absolute;top:10px;left:10px;z-index:5;padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:800;color:#2A1708;background:#FFE1A6;}
.sl-rien{display:grid;place-items:center;min-height:160px;padding:20px;border-radius:22px;text-align:center;
  background:rgba(255,244,230,.04);border:1px dashed rgba(255,244,230,.18);}
.sl-rien p{margin:0;font-size:15px;font-weight:800;color:#FFF4E6;}
.sl-rien span{display:block;margin-top:6px;font-size:13px;font-weight:600;color:#CDB8A4;}
.sl-bas{display:flex;flex-direction:column;gap:6px;}
.sl-meta{margin:0;font-size:13px;font-weight:700;color:#CDB8A4;}
.sl-bas h3{margin:0;font-size:22px;line-height:1.15;font-weight:900;color:#FFF4E6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.sl-dit{margin:0;font-size:14px;line-height:1.4;color:#E9D7C2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.sl-dit b{color:#FFF4E6;}
.sl-cta{margin-top:6px;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 18px;border:0;border-radius:999px;cursor:pointer;
  font:inherit;font-size:16px;font-weight:900;color:#2A1708;background:linear-gradient(180deg,#FFC867,#F5A23A);box-shadow:0 12px 26px -10px rgba(245,162,58,.55);}
.sl-glisse{margin:2px 0 0;text-align:center;font-size:12.5px;color:#A99B92;}
`,
      }}
    />
  );
}
