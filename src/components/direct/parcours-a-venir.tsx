"use client";

// 🚧 CE QUE SA PAGE FERA — montré au commerçant, à la place du mur dépassé.
//
// ═══ CE QU'IL REMPLACE, ET DANS SES MOTS ══════════════════════════════════
//
// « Photos 1 et 2 : c'est l'ancien concept. Pour les restaurants, les bars et
// les événements, le concept a évolué vers autre chose. L'app démo reprend bien
// les bons concepts, mais la page commerçant est encore sur les anciens designs
// — "Qui est là" n'est plus d'actualité pour les restaurants, et c'est un
// parcours en quatre étapes qui a été mis en place. »
//
// LE COMPOSANT NE DÉCIDE RIEN, IL DESSINE. Quel parcours, combien d'écrans,
// ce que chacun attend de lui : tout vient de `parcours-promis.ts`, dont
// l'en-tête explique pourquoi on annonce le parcours au lieu d'en fabriquer un
// faux depuis sa fiche Google.
//
// ═══ IL EST ÉCRIT POUR LUI, ET C'EST POURQUOI IL EST RÉSERVÉ À SA PAGE ════
//
// « Votre plat du jour », « votre voix » : ce bloc TUTOIE LE MÉTIER. Servi à un
// habitant qui regarde ce restaurant, il n'aurait aucun sens — on lui
// demanderait une seconde photo d'un plat qui n'est pas le sien. Il n'apparaît
// donc que sur la page adressée au commerçant, celle qui porte déjà la voix de
// démonstration et le formulaire de fin.
//
// CE QUI VEUT DIRE QUE L'HABITANT, LUI, VOIT ENCORE LE MUR DE PRÉSENCE sur un
// restaurant sans parcours. C'est délibéré et c'est limité : retirer le mur de
// l'application est une décision de produit — elle enlève quelque chose à
// quelqu'un — et elle ne se prend pas en passant, au détour d'une correction de
// page commerçant.

import type { ParcoursPromis } from "@/lib/direct/parcours-promis";

export function ParcoursAVenir({ p, nom }: { p: ParcoursPromis; nom: string }) {
  return (
    <div className="pv">
      <Styles />
      <div className="pv-h">
        {/* CE QUI SE PASSERA, ANNONCÉ COMME TEL. Un bloc qui décrit un parcours
            absent sans dire qu'il est absent se lit comme un parcours présent,
            et c'est la seule façon de perdre la confiance d'un commerçant
            avant même d'avoir commencé. */}
        <span className="pv-et">Ce que votre page fera</span>
        <h3>{p.titre}</h3>
        <p className="pv-s">
          Chez {nom}, en {p.combien}. C’est le parcours de l’application, pas une
          maquette à part.
        </p>
      </div>

      <ol className="pv-l">
        {p.etapes.map((e) => (
          <li key={e.n} className={e.fournir ? undefined : "pv-prete"}>
            <b aria-hidden="true">{e.n}</b>
            <div>
              <strong>{e.titre}</strong>
              <p>{e.dit}</p>
              {/* CE QU'IL DOIT DONNER, OU POURQUOI ON NE LUI DEMANDE RIEN.
                  LES DEUX PHRASES SONT ÉCRITES DANS LA BIBLIOTHÈQUE, et c'est
                  voulu : « déjà prêt » et « rien à préparer » ne disent pas la
                  même chose, et seule l'étape sait laquelle est vraie chez
                  elle. Voir `sans` dans `parcours-promis.ts`. */}
              {e.fournir ? (
                <em className="pv-f">{e.fournir}</em>
              ) : e.sans ? (
                <em className="pv-d">{e.sans}</em>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <p className="pv-c">{p.comment}</p>
    </div>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
.pv{margin:14px 0 0;padding:16px 15px 15px;border-radius:18px;
  background:var(--bq-carte,#FBF8FC);
  border:1px solid var(--bq-ligne,rgba(20,16,40,.09));}
.pv-h{margin-bottom:13px;}
.pv-et{display:block;font-size:10.5px;font-weight:800;letter-spacing:.11em;
  text-transform:uppercase;color:var(--bq-menthe,#E8267F);}
.pv-h h3{margin:6px 0 0;font-size:19.5px;font-weight:850;line-height:1.2;
  letter-spacing:-.018em;color:var(--bq-encre,#151B33);}
.pv-s{margin:6px 0 0;font-size:12.5px;line-height:1.5;
  color:var(--bq-pale,#6E7690);}

.pv-l{list-style:none;margin:0;padding:0;display:flex;
  flex-direction:column;gap:11px;}
.pv-l li{display:flex;gap:11px;align-items:flex-start;}
/* LE NUMERO EST UN REPERE, PAS UNE PUCE : il porte le compte que le titre
   annonce, donc il se lit de loin et il ne bouge pas quand le texte d'a cote
   fait deux lignes ou cinq. */
.pv-l b{flex:none;width:25px;height:25px;border-radius:999px;
  display:inline-flex;align-items:center;justify-content:center;
  font-size:12.5px;font-weight:850;color:#fff;margin-top:1px;
  background:var(--bq-encre,#151B33);}
.pv-l li>div{min-width:0;}
.pv-l strong{display:block;font-size:14.5px;font-weight:800;
  line-height:1.3;color:var(--bq-encre,#151B33);}
.pv-l p{margin:3px 0 0;font-size:12.5px;line-height:1.5;
  color:var(--bq-pale,#6E7690);}
.pv-f,.pv-d{display:block;margin-top:5px;font-style:normal;
  font-size:11.5px;font-weight:700;line-height:1.4;}
/* A FOURNIR : la fleche dit qu'on attend quelque chose de lui, et la couleur
   d'accent la distingue de la description juste au-dessus. */
.pv-f{color:var(--bq-menthe,#E8267F);}
.pv-f::before{content:"\\2192\\00a0";}
.pv-d{color:#2E7D55;}
.pv-d::before{content:"\\2713\\00a0";}
/* L'ETAPE QUI TOURNE DEJA EST PLUS CLAIRE, PAS PLUS PALE : son numero passe
   au vert plutot que de s'effacer. Une etape grisee se lit desactivee, ce qui
   est l'inverse exact de ce qu'elle dit. */
.pv-prete b{background:#2E7D55;}

.pv-c{margin:14px 0 0;padding-top:12px;font-size:12.5px;line-height:1.55;
  color:var(--bq-encre,#151B33);
  border-top:1px solid var(--bq-ligne,rgba(20,16,40,.09));}
`,
      }}
    />
  );
}
