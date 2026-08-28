"use client";

// L'ANNONCE RÉDUITE À CE QU'ON DOIT COMPRENDRE EN UNE SECONDE — MAIS COMPLÈTE.
//
// CE QUI EST GARDÉ DE L'ESSAI : la photo prend 80 % de l'écran, et ce qu'on
// lit au centre, c'est la nature, l'offre et le prix. Le nom du commerce ne
// pèse plus plus lourd que ce qu'il sert.
//
// CE QUI REVIENT, ET POURQUOI IL LE FALLAIT. Un écran vide est agréable et
// inutilisable : on ne pouvait plus changer de métier, ouvrir un salon, voir
// le détail, ni redescendre dans La Ville. La règle n'est donc pas « moins de
// boutons », elle est PLUS PRÉCISE :
//
//   · LE CENTRE DE LA PHOTO NE PORTE QUE LA DÉCISION — nature, offre, prix,
//     chez qui, jusqu'à quand. Rien ne s'y pose d'autre.
//   · TOUT LE RESTE VIT AUX BORDS : le métier en haut à gauche, les actions
//     et les onglets dans le bandeau du bas.
//   · UNE SEULE ACTION EST COLORÉE. Les deux autres sont des cercles gris.
//     C'est ce qui distingue cette version de l'ancienne : là-bas quatre
//     boutons de même poids posaient une question ; ici il y en a un qui
//     répond, et deux qui attendent.
//
// LE NOM DU COMMERCE EST REVENU DANS LA CARTE, ET C'EST UNE DEMANDE JUSTE :
// un restaurant qu'on n'aime pas, on n'y va pas, quoi qu'il serve. Il est donc
// lisible — mais sous le prix, à la taille d'une information, pas d'un titre.
import { useEffect, useMemo, useRef, useState } from "react";

type Branche = "restaurant" | "coiffeur" | "fleuriste" | "mode";

const METIERS: { cle: Branche; label: string; emoji: string }[] = [
  { cle: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { cle: "coiffeur", label: "Coiffeurs", emoji: "✂️" },
  { cle: "fleuriste", label: "Fleuristes", emoji: "💐" },
  { cle: "mode", label: "Boutiques", emoji: "🛍️" },
];

type Offre = {
  id: string;
  branche: Branche;
  nature: string;
  /** Ce qu'on vend aujourd'hui. Le titre de l'écran, quel que soit le métier. */
  offre: string;
  prix: string;
  photo: string;
  cadrage?: string;
  commerce: string;
  distance: string;
  action: string;
  /**
   * CE QUI PRESSE — ET ON NE MET LÀ QUE CE QU'ON SAIT VRAIMENT.
   *
   * DÉFAUT CORRIGÉ : la pastille disait « il reste 6 parts ». Nous ne le
   * savons pas. Un restaurateur photographie son ardoise le matin ; il ne
   * décomptera pas ses portions pendant le service. Ce chiffre serait inventé
   * — et une rareté inventée est pire que pas de rareté : la première fois
   * que quelqu'un arrive et qu'il en reste vingt, ou zéro, l'application a
   * menti, et elle ne s'en remet pas.
   *
   * CE QU'ON SAIT SANS RIEN DEMANDER À PERSONNE : l'heure. Un plat du jour
   * existe entre midi et quatorze heures, un pain sort du four à seize.
   *
   * LA RARETÉ RESTE POSSIBLE quand c'est le commerçant qui la publie : elle
   * est alors dans la NATURE de l'annonce, et sans chiffre.
   */
  quand?: string;
};

const OFFRES: Offre[] = [
  {
    id: "magret", branche: "restaurant",
    nature: "Menu du jour", offre: "Le magret", prix: "19 €",
    photo: "/direct/plat-du-jour.jpg", cadrage: "52%",
    commerce: "Le Bocal de Margot", distance: "180 m",
    action: "Réserver ma table", quand: "Servi jusqu’à 14 h",
  },
  {
    id: "lasagnes", branche: "restaurant",
    nature: "Menu du jour", offre: "Les lasagnes", prix: "11 €",
    photo: "/direct/plat-lasagnes.jpg", cadrage: "50%",
    commerce: "Chez Bergine", distance: "240 m",
    action: "Réserver ma table", quand: "Servi jusqu’à 14 h",
  },
  {
    // La rareté quand elle existe vraiment : c'est le commerçant qui l'a
    // publiée, et elle ne porte aucun chiffre que nous aurions inventé.
    id: "garbure", branche: "restaurant",
    nature: "Dernières portions", offre: "La garbure", prix: "9 €",
    photo: "/direct/plat-garbure.jpg", cadrage: "50%",
    commerce: "L’Ardoise Landaise", distance: "410 m",
    action: "Réserver ma table", quand: "Servi jusqu’à 14 h",
  },
  {
    id: "tourte", branche: "restaurant",
    nature: "Sortie du four", offre: "La tourte de seigle", prix: "4,20 €",
    photo: "/direct/sortie-du-four.jpg", cadrage: "55%",
    commerce: "Le Pétrin d’Amanieu", distance: "320 m",
    action: "Je la garde", quand: "Sortie du four à 16 h",
  },
  {
    id: "coupe", branche: "coiffeur",
    nature: "Créneau libre", offre: "Coupe et brushing", prix: "28 €",
    photo: "/direct/fauteuil-coiffeur.jpg", cadrage: "50%",
    commerce: "Un salon du centre", distance: "260 m",
    action: "Prendre le créneau", quand: "Aujourd’hui à 14 h 30",
  },
  {
    id: "soin", branche: "coiffeur",
    nature: "Créneau libre", offre: "Coloration végétale", prix: "55 €",
    photo: "/direct/salon-neuf.jpg", cadrage: "50%",
    commerce: "Un salon qui vient d’ouvrir", distance: "480 m",
    action: "Prendre le créneau", quand: "Aujourd’hui à 16 h",
  },
  {
    id: "bouquet", branche: "fleuriste",
    nature: "Arrivé ce matin", offre: "Le bouquet du marché", prix: "18 €",
    photo: "/direct/bouquet-du-jour.jpg", cadrage: "50%",
    commerce: "Une fleuriste du marché", distance: "300 m",
    action: "Je le réserve", quand: "Jusqu’à 19 h",
  },
  {
    id: "collection", branche: "mode",
    nature: "Nouvelle collection", offre: "Les manteaux d’hiver", prix: "dès 129 €",
    photo: "/direct/portant-boutique.jpg", cadrage: "50%",
    commerce: "Une boutique de la rue piétonne", distance: "450 m",
    action: "Je passe la voir", quand: "Ouvert jusqu’à 19 h",
  },
];

type Onglet = "direct" | "ville" | "salons" | "moi";

const AILLEURS: Record<Exclude<Onglet, "direct">, { titre: string; dit: string }> = {
  ville: {
    titre: "La Ville",
    dit: "Ce que les habitants racontent en ce moment. Tout s’efface au bout de quelques heures.",
  },
  salons: {
    titre: "Mes salons",
    dit: "Les sorties que vous avez lancées avec vos amis, et celles où l’on vous attend.",
  },
  moi: {
    titre: "Moi",
    dit: "Ce que vous avez gardé, réservé et photographié. Aucun compte, rien ne quitte ce téléphone.",
  },
};

export default function EssaiAnnonce() {
  const [branche, setBranche] = useState<Branche>("restaurant");
  const [onglet, setOnglet] = useState<Onglet>("direct");
  const [k, setK] = useState(0);
  const [feuille, setFeuille] = useState<"" | "metier" | "detail" | "salon">("");
  /**
   * LE VOILE EST UN INTERRUPTEUR, PAS UNE DÉCISION PRISE À VOTRE PLACE.
   * Écrire en blanc sur une photo sans voile, c'est prendre le risque d'un
   * texte illisible dès que la photo est claire à cet endroit — et c'est
   * exactement le défaut qu'on corrige. On regarde les deux sur le même plat.
   */
  const [voile, setVoile] = useState(true);
  const [echo, setEcho] = useState("");

  const liste = useMemo(() => OFFRES.filter((x) => x.branche === branche), [branche]);
  const o = liste[k % liste.length];
  const suivant = liste[(k + 1) % liste.length];
  const metier = METIERS.find((m) => m.cle === branche)!;

  useEffect(() => {
    if (!echo) return;
    const t = window.setTimeout(() => setEcho(""), 2800);
    return () => window.clearTimeout(t);
  }, [echo]);

  /** Changer de métier repart de la première annonce de ce métier. */
  function choisirMetier(b: Branche) {
    setBranche(b);
    setK(0);
    setFeuille("");
  }

  /**
   * LE BALAYAGE, À LA SOURIS COMME AU DOIGT — ET POSÉ SUR L'ÉLÉMENT, PAS DANS
   * UN EFFET.
   *
   * DÉFAUT CORRIGÉ, ET IL ÉTAIT INVISIBLE À L'ŒIL : les écouteurs étaient
   * attachés dans un `useEffect` sans dépendance. On allait dans « Mes
   * salons », on revenait au direct — la carte était remontée, mais l'effet
   * ne rejouait pas : la nouvelle carte n'avait plus aucun écouteur. Le
   * balayage cessait de marcher, et rien ne le signalait. Posés en propriétés
   * de l'élément, ils sont là par construction, quel que soit le nombre de
   * remontages.
   */
  const geste = useRef<{ x0: number | null; dx: number }>({ x0: null, dx: 0 });

  function tampons(c: HTMLElement, gauche: number, droite: number) {
    const non = c.querySelector<HTMLElement>(".es-tampon.non");
    const oui = c.querySelector<HTMLElement>(".es-tampon.oui");
    if (non) non.style.opacity = String(gauche);
    if (oui) oui.style.opacity = String(droite);
  }

  function auDoigt(ev: React.PointerEvent<HTMLDivElement>) {
    if ((ev.target as HTMLElement).closest("button")) return;
    geste.current = { x0: ev.clientX, dx: 0 };
    try {
      ev.currentTarget.setPointerCapture(ev.pointerId);
    } catch {
      /* certains navigateurs refusent : le geste marche quand même */
    }
  }

  function pendant(ev: React.PointerEvent<HTMLDivElement>) {
    const g = geste.current;
    if (g.x0 === null) return;
    g.dx = ev.clientX - g.x0;
    const c = ev.currentTarget;
    c.style.transition = "none";
    c.style.transform = `translate3d(${g.dx}px,0,0) rotate(${g.dx / 26}deg)`;
    tampons(c, g.dx < 0 ? Math.min(1, -g.dx / 80) : 0, g.dx > 0 ? Math.min(1, g.dx / 80) : 0);
  }

  function relache(ev: React.PointerEvent<HTMLDivElement>) {
    const g = geste.current;
    if (g.x0 === null) return;
    const parti = g.dx;
    geste.current = { x0: null, dx: 0 };
    const c = ev.currentTarget;
    c.style.transition = "transform .3s cubic-bezier(.16,1,.3,1),opacity .3s";
    if (Math.abs(parti) > 70) {
      c.style.transform = `translate3d(${parti > 0 ? 460 : -460}px,0,0) rotate(${parti > 0 ? 18 : -18}deg)`;
      c.style.opacity = "0";
      window.setTimeout(() => {
        if (parti > 0) setFeuille("salon");
        else setK((n) => n + 1);
        c.style.transition = "none";
        c.style.transform = "";
        c.style.opacity = "";
        tampons(c, 0, 0);
      }, 230);
      return;
    }
    c.style.transform = "";
    tampons(c, 0, 0);
  }

  return (
    <div className="es">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .es{min-height:100dvh;background:#05100C;color:#F2EFE4;
          font-family:"Inter Tight",-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
          display:flex;flex-direction:column;align-items:center;
          padding:12px 12px 20px;gap:10px;}

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
          height:min(calc(100dvh - 92px),840px);
          border-radius:30px;overflow:hidden;background:#05100C;
          border:1px solid rgba(255,255,255,.09);}

        .es-pile{position:absolute;inset:0;}
        .es-der{position:absolute;inset:0;transform:scale(.94) translateY(10px);
          opacity:.32;pointer-events:none;}
        .es-carte{position:absolute;inset:0;touch-action:none;cursor:grab;
          user-select:none;-webkit-user-select:none;}
        .es-carte:active{cursor:grabbing;}

        /* ── LA PHOTO : QUATRE-VINGTS POUR CENT ───────────────────────── */
        .es-photo{position:absolute;left:0;right:0;top:0;height:80%;overflow:hidden;}
        .es-photo img{width:100%;height:100%;object-fit:cover;display:block;
          -webkit-user-drag:none;}

        /* LE VOILE N'ASSOMBRIT QUE LA ZONE DU TEXTE. Un voile sur toute la
           photo eteint le plat, qui est la seule chose qui donne faim. Celui-ci
           monte du bas et s'arrete au tiers. */
        .es-voile{position:absolute;left:0;right:0;bottom:0;height:60%;
          pointer-events:none;
          background:linear-gradient(180deg,rgba(3,10,8,0) 0%,rgba(3,10,8,.28) 38%,
            rgba(3,10,8,.70) 78%,rgba(3,10,8,.88) 100%);}
        /* Un souffle sombre en haut, juste pour la pastille du metier. */
        .es-haut-v{position:absolute;left:0;right:0;top:0;height:16%;
          pointer-events:none;
          background:linear-gradient(180deg,rgba(3,10,8,.55),transparent);}

        /* ── LE METIER : LE SEUL ELEMENT EN HAUT ──────────────────────── */
        .es-metier{position:absolute;left:12px;top:12px;z-index:2;
          display:flex;align-items:center;gap:7px;font:inherit;font-size:12.5px;
          font-weight:700;cursor:pointer;color:#F2EFE4;border-radius:999px;
          padding:8px 13px;border:1px solid rgba(255,255,255,.18);
          background:rgba(6,16,13,.55);-webkit-backdrop-filter:blur(8px);
          backdrop-filter:blur(8px);}
        .es-metier i{font-style:normal;font-size:14px;line-height:1;}
        .es-metier s{text-decoration:none;opacity:.55;font-size:10px;}

        /* ── CE QU'ON LIT : LA DECISION, ET RIEN D'AUTRE ──────────────── */
        .es-dit{position:absolute;left:0;right:0;bottom:calc(20% + 16px);
          padding:0 20px;text-align:center;pointer-events:none;}
        .es-nature{margin:0;font-size:11px;font-weight:800;letter-spacing:.26em;
          text-transform:uppercase;color:#EFEAD9;opacity:.92;}
        .es-offre{margin:8px 0 0;font-family:Georgia,"Times New Roman",serif;
          font-weight:700;font-size:clamp(30px,9.4vw,42px);line-height:1.02;
          letter-spacing:-.02em;text-transform:uppercase;}
        .es-prix{margin:8px 0 0;font-size:clamp(27px,8.2vw,36px);font-weight:800;
          letter-spacing:-.02em;line-height:1;}
        /* LE NOM DU COMMERCE EST REVENU, ET IL EST LISIBLE. Un restaurant
           qu'on n'aime pas, on n'y va pas quoi qu'il serve : c'est une
           information de decision. Elle est sous le prix, a la taille d'une
           information — pas d'un titre. */
        .es-chez{margin:11px 0 0;font-size:14.5px;font-weight:600;color:#EAF2EC;
          line-height:1.25;}
        .es-chez s{text-decoration:none;font-weight:400;color:#B4C6BB;}
        .es-quand{display:inline-block;margin-top:11px;font-size:11.5px;
          font-weight:800;letter-spacing:.06em;text-transform:uppercase;
          color:#04150E;background:#F0B429;border-radius:999px;padding:5px 11px;}

        /* Les tampons du geste : ils disent ce qui va se passer AVANT. */
        .es-tampon{position:absolute;top:34%;z-index:2;padding:9px 14px;
          border-radius:12px;font-weight:800;font-size:14px;opacity:0;
          pointer-events:none;transition:opacity .12s linear;}
        .es-tampon.non{left:14px;background:#D2604A;color:#fff;transform:rotate(-7deg);}
        .es-tampon.oui{right:14px;background:#3DE2A6;color:#04150E;transform:rotate(7deg);}

        /* ── LE BANDEAU DU BAS : LES ACTIONS, PUIS LES ONGLETS ─────────
           UNE SEULE EST COLOREE. C'est ce qui distingue cette version de
           l'ancienne : la-bas quatre boutons de meme poids posaient une
           question ; ici il y en a un qui repond, et deux qui attendent. */
        .es-bas{position:absolute;left:0;right:0;bottom:0;height:20%;z-index:2;
          display:flex;flex-direction:column;justify-content:center;gap:10px;
          padding:0 12px 8px;background:#05100C;}
        .es-actes{display:flex;gap:9px;align-items:center;}
        .es-rond{flex:none;width:48px;height:48px;border-radius:50%;font:inherit;
          font-size:19px;cursor:pointer;display:flex;align-items:center;
          justify-content:center;color:#CFE0D6;
          border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);}
        .es-rond:active{transform:scale(.94);}
        .es-cta{flex:1;min-width:0;font:inherit;font-size:15.5px;font-weight:800;
          cursor:pointer;border:0;border-radius:15px;padding:15px 10px;
          background:#3DE2A6;color:#04150E;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .es-cta:active{transform:scale(.99);}

        .es-tabs{display:grid;grid-template-columns:repeat(4,1fr);
          border-top:1px solid rgba(255,255,255,.08);padding-top:7px;}
        .es-tabs button{font:inherit;font-size:9.5px;font-weight:600;cursor:pointer;
          background:none;border:0;color:#6E8479;display:flex;flex-direction:column;
          align-items:center;gap:3px;padding:2px 0;}
        .es-tabs button i{font-style:normal;font-size:16px;line-height:1;
          filter:grayscale(1);opacity:.55;}
        .es-tabs button.on{color:#3DE2A6;}
        .es-tabs button.on i{filter:none;opacity:1;}

        /* ── LES AUTRES ONGLETS, EN MAQUETTE ──────────────────────────── */
        .es-ailleurs{position:absolute;left:0;right:0;top:0;bottom:20%;z-index:1;
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;text-align:center;padding:0 32px;gap:10px;
          background:#05100C;}
        .es-ailleurs b{font-family:Georgia,serif;font-size:24px;font-weight:700;}
        .es-ailleurs span{font-size:13px;line-height:1.5;color:#8FA79A;}
        .es-ailleurs em{font-style:normal;font-size:10.5px;letter-spacing:.16em;
          text-transform:uppercase;color:#4E6459;}

        /* ── CE QUI SE POSE PAR-DESSUS ────────────────────────────────── */
        .es-fond{position:absolute;inset:0;z-index:5;background:rgba(3,9,7,.66);
          border:0;padding:0;cursor:pointer;}
        .es-feuille{position:absolute;left:0;right:0;bottom:0;z-index:6;
          background:#0C1815;border-radius:20px 20px 0 0;padding:16px 14px 20px;
          border-top:1px solid rgba(255,255,255,.12);}
        .es-feuille h3{margin:0 0 4px;font-size:16px;font-weight:800;}
        .es-feuille p{margin:0 0 12px;font-size:12.5px;line-height:1.45;color:#8FA79A;}
        .es-liste{display:flex;flex-direction:column;gap:7px;}
        .es-liste button{display:flex;align-items:center;gap:10px;width:100%;
          font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-align:left;
          color:#EAF2EC;border:1px solid rgba(255,255,255,.1);border-radius:13px;
          padding:11px 13px;background:rgba(255,255,255,.04);}
        .es-liste button.on{border-color:#3DE2A6;color:#3DE2A6;
          background:rgba(61,226,166,.1);}
        .es-liste button i{font-style:normal;font-size:17px;line-height:1;}
        .es-jrn{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:8px;}
        .es-jrn li{display:grid;grid-template-columns:58px 1fr;gap:10px;
          align-items:baseline;font-size:13px;}
        .es-jrn b{font-size:11px;font-weight:700;color:#F0B429;letter-spacing:.06em;}
        .es-jrn span{color:#CFE0D6;}

        .es-echo{position:absolute;left:12px;right:12px;bottom:calc(20% + 10px);
          z-index:7;background:#0C1C16;border:1px solid #3DE2A6;border-radius:14px;
          padding:11px 13px;font-size:12.5px;color:#CFF7E6;text-align:center;}

        .es-pied{margin:0;text-align:center;font-size:10px;letter-spacing:.16em;
          text-transform:uppercase;color:#4E6459;}
        .es-note{max-width:392px;font-size:11.5px;line-height:1.45;color:#6E8479;
          text-align:center;margin:0;}
        .es-note a{color:#8FE9C4;}
      `,
        }}
      />

      <div className="es-outil">
        <b>Essai</b>
        <button type="button" className={voile ? "" : "on"} onClick={() => setVoile(false)}>
          Sans voile
        </button>
        <button type="button" className={voile ? "on" : ""} onClick={() => setVoile(true)}>
          Voile sous le texte
        </button>
      </div>

      <div className="es-tel">
        {onglet === "direct" ? (
          <div className="es-pile">
            <div className="es-der" aria-hidden="true">
              <div className="es-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={suivant.photo}
                  alt=""
                  style={{ objectPosition: `50% ${suivant.cadrage ?? "50%"}` }}
                />
              </div>
            </div>

            <div
              className="es-carte"
              onPointerDown={auDoigt}
              onPointerMove={pendant}
              onPointerUp={relache}
              onPointerCancel={relache}
            >
              <div className="es-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.photo}
                  alt={`${o.offre}, chez ${o.commerce}`}
                  style={{ objectPosition: `50% ${o.cadrage ?? "50%"}` }}
                />
                <span className="es-haut-v" aria-hidden="true" />
                {voile && <span className="es-voile" aria-hidden="true" />}
              </div>

              {/* LE MÉTIER : le seul élément posé en haut de la photo. */}
              <button type="button" className="es-metier" onClick={() => setFeuille("metier")}>
                <i aria-hidden="true">{metier.emoji}</i>
                {metier.label}
                <s aria-hidden="true">▾</s>
              </button>

              <span className="es-tampon non">Passer</span>
              <span className="es-tampon oui">En parler</span>

              <div className="es-dit">
                <p className="es-nature">{o.nature}</p>
                <h1 className="es-offre">{o.offre}</h1>
                <p className="es-prix">{o.prix}</p>
                <p className="es-chez">
                  {o.commerce} <s>· Dax · {o.distance}</s>
                </p>
                {o.quand && <span className="es-quand">{o.quand}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="es-ailleurs">
            <b>{AILLEURS[onglet].titre}</b>
            <span>{AILLEURS[onglet].dit}</span>
            <em>Maquette — non dessiné ici</em>
          </div>
        )}

        {/* ── LE BANDEAU : DEUX CERCLES GRIS, UNE ACTION VERTE, PUIS LES
             ONGLETS. Il reste visible sur tous les onglets : c'est la colonne
             vertébrale de l'application, pas une décoration de l'annonce. */}
        <div className="es-bas">
          {onglet === "direct" && (
            <div className="es-actes">
              <button
                type="button"
                className="es-rond"
                aria-label="Le détail"
                onClick={() => setFeuille("detail")}
              >
                ⌄
              </button>
              <button
                type="button"
                className="es-rond"
                aria-label="En parler à mes amis"
                onClick={() => setFeuille("salon")}
              >
                💬
              </button>
              <button
                type="button"
                className="es-cta"
                onClick={() => setEcho(`✓ ${o.action} — ${o.commerce} vous répond dans un instant.`)}
              >
                {o.action}
              </button>
            </div>
          )}

          <nav className="es-tabs">
            {([
              ["direct", "⚡", "Le direct"],
              ["ville", "🏛️", "La Ville"],
              ["salons", "💬", "Mes salons"],
              ["moi", "🙂", "Moi"],
            ] as [Onglet, string, string][]).map(([cle, emo, lab]) => (
              <button
                key={cle}
                type="button"
                className={onglet === cle ? "on" : ""}
                onClick={() => {
                  setOnglet(cle);
                  setFeuille("");
                }}
              >
                <i aria-hidden="true">{emo}</i>
                {lab}
              </button>
            ))}
          </nav>
        </div>

        {echo && <div className="es-echo">{echo}</div>}

        {feuille && (
          <>
            <button
              type="button"
              className="es-fond"
              aria-label="Fermer"
              onClick={() => setFeuille("")}
            />
            <div className="es-feuille" role="dialog" aria-modal="true">
              {feuille === "metier" && (
                <>
                  <h3>Autour de vous</h3>
                  <p>Ce qui se passe maintenant, par métier.</p>
                  <div className="es-liste">
                    {METIERS.map((m) => (
                      <button
                        key={m.cle}
                        type="button"
                        className={m.cle === branche ? "on" : ""}
                        onClick={() => choisirMetier(m.cle)}
                      >
                        <i aria-hidden="true">{m.emoji}</i>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {feuille === "detail" && (
                <>
                  <h3>{o.commerce}</h3>
                  <p>
                    {o.nature} · {o.offre} · {o.prix} · Dax, à {o.distance}
                  </p>
                  <ul className="es-jrn">
                    <li>
                      <b>10 h 00</b>
                      <span>L’ardoise du jour est écrite</span>
                    </li>
                    <li>
                      <b>12 h 00</b>
                      <span>Il reste des tables en terrasse</span>
                    </li>
                    <li>
                      <b>14 h 30</b>
                      <span>Les dernières parts à emporter</span>
                    </li>
                    <li>
                      <b>19 h 30</b>
                      <span>La grande tablée du soir</span>
                    </li>
                  </ul>
                </>
              )}

              {feuille === "salon" && (
                <>
                  <h3>En parler à mes amis</h3>
                  <p>
                    Un salon s’ouvre sur cette annonce. Vos amis répondent sans
                    créer de compte, vous proposez, vous votez, vous réservez.
                  </p>
                  <div className="es-liste">
                    <button
                      type="button"
                      onClick={() => {
                        setFeuille("");
                        setEcho("👥 Le lien part sur WhatsApp. Ils répondent sans rien installer.");
                      }}
                    >
                      <i aria-hidden="true">👥</i>
                      Inviter mes amis
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <p className="es-pied">Clikme — l’opportunité est là. Maintenant.</p>
      <p className="es-note">
        Maquette d’essai. Balayez à gauche pour passer, à droite pour en parler.
        L’application reste sur <a href="/autour-de-moi">/autour-de-moi</a>.
      </p>
    </div>
  );
}
