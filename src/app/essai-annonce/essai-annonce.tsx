"use client";

// L'ANNONCE RÉDUITE À CE QU'ON DOIT COMPRENDRE EN UNE SECONDE.
//
// TROIS CHOSES AU CENTRE, PAS DIX : la nature (menu du jour, sortie du four),
// le plat, le prix. Tout le reste — le commerce, la ville, la distance —
// descend dans un bandeau fin, parce que ce n'est pas ça qui décide.
//
// UNE SEULE ACTION EN BAS. L'annonce actuelle en propose quatre de front
// (passer, en parler, réserver, détails) : quatre boutons de même poids, c'est
// une question posée à quelqu'un qui n'a encore rien décidé. Ici il y a un
// geste, et le balayage reste pour dire non.
import { useEffect, useRef, useState } from "react";

type Offre = {
  id: string;
  nature: string;
  plat: string;
  prix: string;
  photo: string;
  /** Le cadrage de la photo : certaines assiettes sont en haut, d'autres au centre. */
  cadrage?: string;
  commerce: string;
  distance: string;
  action: string;
  /**
   * CE QUI PRESSE — ET ON NE MET LÀ QUE CE QU'ON SAIT VRAIMENT.
   *
   * DÉFAUT CORRIGÉ, ET C'ÉTAIT LE PLUS GRAVE DE CET ESSAI : la pastille disait
   * « il reste 6 parts ». Nous ne le savons pas. Un restaurateur photographie
   * son ardoise le matin ; il ne va pas décompter ses portions pendant le
   * service. Ce chiffre serait donc inventé — et une rareté inventée est pire
   * que pas de rareté du tout : la première fois que quelqu'un arrive et qu'il
   * en reste vingt, ou zéro, l'application a menti, et elle ne s'en remet pas.
   *
   * CE QU'ON SAIT SANS RIEN DEMANDER À PERSONNE : l'heure. Un plat du jour
   * existe entre midi et quatorze heures, un pain sort du four à seize. C'est
   * vrai, c'est vérifiable, et ça presse tout autant.
   *
   * LA RARETÉ RESTE POSSIBLE, mais elle vient du commerçant et elle est
   * annoncée comme telle : c'est LUI qui publie « dernières portions », et
   * c'est alors la nature de l'annonce qui le dit — sans chiffre.
   */
  quand?: string;
};

const OFFRES: Offre[] = [
  {
    id: "magret",
    nature: "Menu du jour",
    plat: "Le magret",
    prix: "19 €",
    photo: "/direct/plat-du-jour.jpg",
    cadrage: "52%",
    commerce: "Le Bocal de Margot",
    distance: "180 m",
    action: "Réserver mon plat",
    quand: "Servi jusqu’à 14 h",
  },
  {
    id: "lasagnes",
    nature: "Menu du jour",
    plat: "Les lasagnes",
    prix: "11 €",
    photo: "/direct/plat-lasagnes.jpg",
    cadrage: "50%",
    commerce: "Chez Bergine",
    distance: "240 m",
    action: "Réserver mon plat",
    quand: "Servi jusqu’à 14 h",
  },
  {
    id: "tourte",
    nature: "Sortie du four",
    plat: "La tourte de seigle",
    prix: "4,20 €",
    photo: "/direct/sortie-du-four.jpg",
    cadrage: "55%",
    commerce: "Le Pétrin d’Amanieu",
    distance: "320 m",
    action: "Je la garde",
    quand: "Sortie du four à 16 h",
  },
  {
    // LA RARETÉ QUAND ELLE EXISTE VRAIMENT : c'est le commerçant qui l'a
    // publiée, elle est dans la nature de l'annonce, et elle ne porte aucun
    // chiffre que nous aurions inventé.
    id: "garbure",
    nature: "Dernières portions",
    plat: "La garbure",
    prix: "9 €",
    photo: "/direct/plat-garbure.jpg",
    cadrage: "50%",
    commerce: "L’Ardoise Landaise",
    distance: "410 m",
    action: "Réserver mon plat",
    quand: "Servi jusqu’à 14 h",
  },
];

export default function EssaiAnnonce() {
  const [k, setK] = useState(0);
  /**
   * LE VOILE EST UN INTERRUPTEUR, PAS UNE DÉCISION PRISE À VOTRE PLACE.
   * La demande dit « sans voile sombre ». Le risque est réel : sur une photo
   * claire, du blanc sur blanc ne se lit pas — et c'est le défaut qu'on
   * corrige. On regarde donc les deux sur le même plat.
   */
  const [voile, setVoile] = useState(true);
  const [dit, setDit] = useState("");
  const carte = useRef<HTMLDivElement | null>(null);

  const o = OFFRES[k % OFFRES.length];
  const suivant = OFFRES[(k + 1) % OFFRES.length];

  useEffect(() => {
    if (!dit) return;
    const t = window.setTimeout(() => setDit(""), 2600);
    return () => window.clearTimeout(t);
  }, [dit]);

  /**
   * LE BALAYAGE, À LA SOURIS COMME AU DOIGT. `pointer` couvre les deux : cette
   * page est regardée sur un téléphone, mais jugée sur un ordinateur.
   */
  useEffect(() => {
    const c = carte.current;
    if (!c) return;
    let x0: number | null = null;
    let dx = 0;
    const debut = (ev: PointerEvent) => {
      if ((ev.target as HTMLElement).closest("button")) return;
      x0 = ev.clientX;
      dx = 0;
      try {
        c.setPointerCapture(ev.pointerId);
      } catch {
        /* certains navigateurs refusent : le geste marche quand même */
      }
    };
    const bouge = (ev: PointerEvent) => {
      if (x0 === null) return;
      dx = ev.clientX - x0;
      c.style.transition = "none";
      c.style.transform = `translate3d(${dx}px,0,0) rotate(${dx / 26}deg)`;
      c.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 460));
    };
    const fin = () => {
      if (x0 === null) return;
      x0 = null;
      c.style.transition = "transform .3s cubic-bezier(.16,1,.3,1),opacity .3s";
      if (Math.abs(dx) > 70) {
        c.style.transform = `translate3d(${dx > 0 ? 460 : -460}px,0,0) rotate(${dx > 0 ? 18 : -18}deg)`;
        c.style.opacity = "0";
        window.setTimeout(() => {
          setK((n) => n + 1);
          c.style.transition = "none";
          c.style.transform = "";
          c.style.opacity = "";
        }, 230);
        return;
      }
      c.style.transform = "";
      c.style.opacity = "";
    };
    c.addEventListener("pointerdown", debut);
    c.addEventListener("pointermove", bouge);
    c.addEventListener("pointerup", fin);
    c.addEventListener("pointercancel", fin);
    return () => {
      c.removeEventListener("pointerdown", debut);
      c.removeEventListener("pointermove", bouge);
      c.removeEventListener("pointerup", fin);
      c.removeEventListener("pointercancel", fin);
    };
  }, []);

  return (
    <div className="es">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .es{min-height:100dvh;background:#05100C;color:#F2EFE4;
          font-family:"Inter Tight",-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
          display:flex;flex-direction:column;align-items:center;
          padding:14px 12px 22px;gap:12px;}

        /* L'interrupteur vit HORS du telephone : ce n'est pas une fonction du
           produit, c'est un outil pour juger la maquette. */
        .es-outil{display:flex;gap:6px;align-items:center;flex-wrap:wrap;
          justify-content:center;font-size:11px;color:#7F988B;}
        .es-outil b{font-weight:700;letter-spacing:.14em;text-transform:uppercase;
          font-size:9.5px;color:#5E7268;}
        .es-outil button{font:inherit;font-size:11px;font-weight:700;cursor:pointer;
          border-radius:999px;padding:6px 12px;border:1px solid rgba(255,255,255,.14);
          background:none;color:#9BB0A4;}
        .es-outil button.on{border-color:#3DE2A6;color:#3DE2A6;
          background:rgba(61,226,166,.12);}

        /* ── LE TELEPHONE ─────────────────────────────────────────────── */
        .es-tel{position:relative;width:min(100%,392px);
          height:min(calc(100dvh - 96px),820px);
          border-radius:30px;overflow:hidden;background:#05100C;
          border:1px solid rgba(255,255,255,.09);}

        /* LA PILE : la carte suivante se devine derriere, et c'est tout ce
           qu'elle a a faire — dire qu'il y en a une autre. */
        .es-pile{position:absolute;inset:0;}
        .es-der{position:absolute;inset:0;transform:scale(.94) translateY(10px);
          opacity:.35;pointer-events:none;}
        .es-carte{position:absolute;inset:0;touch-action:none;cursor:grab;
          user-select:none;-webkit-user-select:none;}
        .es-carte:active{cursor:grabbing;}

        /* ── LA PHOTO : QUATRE-VINGTS POUR CENT, ET RIEN DESSUS ────────── */
        .es-photo{position:absolute;left:0;right:0;top:0;height:80%;overflow:hidden;}
        .es-photo img{width:100%;height:100%;object-fit:cover;display:block;
          -webkit-user-drag:none;}

        /* LE VOILE N'ASSOMBRIT QUE LA ZONE DU TEXTE. Un voile sur toute la
           photo, c'est ce qu'on vient d'enlever : il eteint le plat, qui est
           la seule chose qui donne faim. Celui-ci monte du bas et s'arrete au
           tiers — la photo reste vive la ou on la regarde. */
        .es-voile{position:absolute;left:0;right:0;bottom:0;height:62%;
          pointer-events:none;
          background:linear-gradient(180deg,rgba(3,10,8,0) 0%,rgba(3,10,8,.30) 38%,
            rgba(3,10,8,.72) 78%,rgba(3,10,8,.88) 100%);}

        /* ── LES TROIS SEULES CHOSES QU'ON LIT ────────────────────────── */
        .es-dit{position:absolute;left:0;right:0;bottom:calc(20% + 18px);
          padding:0 22px;text-align:center;pointer-events:none;}
        .es-nature{margin:0;font-size:11px;font-weight:800;letter-spacing:.26em;
          text-transform:uppercase;color:#EFEAD9;opacity:.92;}
        .es-plat{margin:8px 0 0;font-family:Georgia,"Times New Roman",serif;
          font-weight:700;font-size:clamp(34px,10.5vw,46px);line-height:1.02;
          letter-spacing:-.02em;text-transform:uppercase;}
        .es-prix{margin:10px 0 0;font-size:clamp(30px,9vw,40px);font-weight:800;
          letter-spacing:-.02em;line-height:1;}
        /* CE QUI PRESSE, ET QU'ON SAIT VRAIMENT : l'heure. Un « il reste 6
           parts » que personne ne tient a jour est un mensonge qui se decouvre
           sur place. Voir le champ quand, plus haut, pour le raisonnement.
           (Aucun accent grave dans cette feuille : il referme la chaine de
           gabarit et casse le fichier. Septieme fois.) */
        .es-reste{display:inline-block;margin-top:12px;font-size:11.5px;
          font-weight:800;letter-spacing:.06em;text-transform:uppercase;
          color:#04150E;background:#F0B429;border-radius:999px;padding:5px 11px;}

        /* CE QUI TOMBE DANS LE BANDEAU FIN : le commerce, la distance. Ce
           n'est pas ca qui decide, donc ce n'est pas ca qu'on lit d'abord. */
        /* Le bandeau garde ses vingt pour cent, mais son contenu se centre :
           colle en bas, il laissait un trou noir sous la photo. */
        .es-bas{position:absolute;left:0;right:0;bottom:0;height:20%;
          display:flex;flex-direction:column;justify-content:center;
          padding:0 16px;gap:12px;background:#05100C;}
        .es-ligne{display:flex;align-items:center;gap:8px;font-size:12px;
          color:#8FA79A;min-width:0;}
        .es-ligne b{color:#D8E2DB;font-weight:600;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;}
        .es-ligne s{text-decoration:none;color:#5E7268;}
        .es-ligne u{margin-left:auto;text-decoration:none;white-space:nowrap;}

        /* UNE SEULE ACTION, ET ELLE PREND TOUTE LA LARGEUR. */
        .es-cta{width:100%;font:inherit;font-size:16px;font-weight:800;
          letter-spacing:.01em;cursor:pointer;border:0;border-radius:16px;
          padding:16px 12px;background:#3DE2A6;color:#04150E;}
        .es-cta:active{transform:scale(.99);}

        .es-pied{margin:0;text-align:center;font-size:10px;letter-spacing:.16em;
          text-transform:uppercase;color:#4E6459;}

        /* Ce qu'on repond quand on appuie : la maquette ne reserve rien. */
        .es-echo{position:absolute;left:12px;right:12px;bottom:calc(20% + 12px);
          z-index:3;background:#0C1C16;border:1px solid #3DE2A6;border-radius:14px;
          padding:11px 13px;font-size:12.5px;color:#CFF7E6;text-align:center;}

        .es-note{max-width:392px;font-size:11.5px;line-height:1.45;color:#6E8479;
          text-align:center;margin:0;}
        .es-note a{color:#8FE9C4;}
      `,
        }}
      />

      <div className="es-outil">
        <b>Essai</b>
        <button
          type="button"
          className={voile ? "" : "on"}
          onClick={() => setVoile(false)}
        >
          Sans voile
        </button>
        <button
          type="button"
          className={voile ? "on" : ""}
          onClick={() => setVoile(true)}
        >
          Voile sous le texte
        </button>
      </div>

      <div className="es-tel">
        <div className="es-pile">
          {/* Celle d'après, juste devinée. */}
          <div className="es-der" aria-hidden="true">
            <div className="es-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={suivant.photo}
                alt=""
                style={{ objectPosition: `50% ${suivant.cadrage ?? "50%"}` }}
              />
            </div>
            <div className="es-bas" />
          </div>

          <div className="es-carte" ref={carte}>
            <div className="es-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.photo}
                alt={`${o.plat}, chez ${o.commerce}`}
                style={{ objectPosition: `50% ${o.cadrage ?? "50%"}` }}
              />
              {voile && <span className="es-voile" aria-hidden="true" />}
            </div>

            <div className="es-dit">
              <p className="es-nature">{o.nature}</p>
              <h1 className="es-plat">{o.plat}</h1>
              <p className="es-prix">{o.prix}</p>
              {o.quand && <span className="es-reste">{o.quand}</span>}
            </div>

            {dit && <div className="es-echo">{dit}</div>}

            <div className="es-bas">
              <div className="es-ligne">
                <b>{o.commerce}</b>
                <s>·</s>
                <span>Dax</span>
                <u>📍 {o.distance}</u>
              </div>
              <button
                type="button"
                className="es-cta"
                onClick={() => setDit(`✓ ${o.action} — ${o.commerce} vous répond dans un instant.`)}
              >
                {o.action}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="es-pied">Clikme — l’opportunité est là. Maintenant.</p>

      <p className="es-note">
        Maquette d’essai. Balayez pour passer à l’annonce suivante.
        L’application reste sur <a href="/autour-de-moi">/autour-de-moi</a>.
      </p>
    </div>
  );
}
