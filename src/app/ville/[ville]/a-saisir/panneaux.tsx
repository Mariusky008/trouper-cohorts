"use client";

// LES DEUX PANNEAUX DU MODE SWIPE — et ils remplacent deux impasses.
//
// AVANT. Le geste vers le haut s'appelait « réserver » et ne réservait rien :
// il rangeait la carte dans les gardées, exactement comme le geste vers la
// droite, puis passait à la suivante. Deux gestes différents, un seul effet, et
// le plus engageant des deux ne menait nulle part. Le troisième bouton, lui,
// envoyait sur le site du commerçant — c'est-à-dire qu'il faisait QUITTER
// l'écran, en perdant la sélection en cours.
//
// MAINTENANT. Les deux ouvrent un panneau, et on revient à la pile en le
// fermant :
//
//   · JE RÉSERVE — ce qu'on vient de prendre, et le message tout écrit qu'il
//     ne reste qu'à envoyer au commerce. C'est le seul écran de l'application
//     où l'habitant s'engage ; il ne doit rien lui rester à rédiger.
//
//   · LE PRO — où c'est, comment y aller, comment appeler. Ce qu'on veut
//     savoir AVANT de décider, et qu'on n'obtenait qu'en quittant l'écran.
//
// RIEN N'EST INVENTÉ NI GRISÉ. Un commerce sans numéro n'affiche pas un bouton
// « Appeler » inerte : il n'affiche pas de bouton. Un bouton qui ne fait rien
// coûte plus cher que son absence — il apprend qu'on ne peut pas s'y fier.
import Link from "next/link";
import type { FichePro } from "@/lib/direct/fiche-pro";
import { lienItineraire } from "@/lib/direct/fiche-pro";
import { messageReservation, lienWhatsapp } from "@/lib/direct/whatsapp-reservation";
import type { CarteVue } from "../_ui/carte";

/** La façon retenue par l'habitant, ou l'annonce elle-même s'il n'y en a pas. */
export type ChoixReserve = {
  carte: CarteVue;
  facon: CarteVue["facons"][number] | null;
};

export function PanneauReserve({
  choix,
  fiche,
  prenom,
  ville,
  onFermer,
}: {
  choix: ChoixReserve;
  fiche: FichePro | null;
  /** Le prénom laissé, pour signer le message. Vide : le message reste correct. */
  prenom: string;
  ville: string;
  onFermer: () => void;
}) {
  const { carte, facon } = choix;
  const tel = carte.telephone || fiche?.telephoneWhatsapp || "";
  const message = messageReservation({
    commerce: carte.auteurNom,
    facon: facon?.label || "",
    type: facon?.type || "simple",
    titre: carte.texte,
    code: "",
    quand: facon?.quand || carte.echeance || "",
    gain: "",
    groupe: "",
    prenom,
  });
  const lien = lienWhatsapp(tel, message);

  return (
    <div className="pnx" role="dialog" aria-modal="true" aria-label="Réserver">
      <button type="button" className="pnx-fond" onClick={onFermer} aria-label="Fermer" />
      <div className="pnx-feuille">
        <span className="pnx-poignee" aria-hidden="true" />

        <div className="pnx-titre">C&apos;est à vous <span aria-hidden="true">✨</span></div>
        <p className="pnx-sous">
          Rangé dans <b>Ma carte</b>. Vous passez le chercher&nbsp;? Prévenez le commerce, il vous le garde.
        </p>

        {/* CE QU'ON VIENT DE PRENDRE, écrit noir sur blanc. Sans ce rappel, on
            confirme de mémoire — et on découvre à l'arrivée qu'on avait pris
            autre chose. */}
        <div className="pnx-obj">
          <span className="pnx-obj-ic" aria-hidden="true">
            {facon?.type === "cadeau" ? "🎁" : facon?.type === "express" ? "⚡" : facon?.type === "collectif" ? "👥" : "🕐"}
          </span>
          <span className="pnx-obj-c">
            <b>{facon?.label || carte.texte}</b>
            <i>{carte.auteurNom}{carte.auteurMetier ? ` · ${carte.auteurMetier}` : ""}</i>
            {facon?.quand ? <em>{facon.quand}</em> : carte.echeance ? <em>{carte.echeance}</em> : null}
          </span>
          {facon?.prix ? (
            <span className="pnx-obj-pr">
              {facon.prix}
              {facon.prixAvant ? <s>{facon.prixAvant}</s> : null}
            </span>
          ) : null}
        </div>

        {/* LE MESSAGE EST DÉJÀ ÉCRIT, et on le montre AVANT d'ouvrir WhatsApp.
            Un bouton qui ouvre une conversation avec un texte qu'on découvre en
            arrivant, c'est un texte qu'on efface. */}
        {lien ? (
          <>
            <div className="pnx-msg">
              <span className="pnx-msg-k">Message prêt à envoyer</span>
              <span className="pnx-msg-t">{message}</span>
            </div>
            <a className="pnx-go" href={lien} target="_blank" rel="noreferrer noopener" onClick={onFermer}>
              <span aria-hidden="true">💬</span> Réserver via WhatsApp
            </a>
          </>
        ) : (
          /* SANS NUMÉRO, ON NE PROMET PAS. Le commerce n'a pas donné de mobile :
             le geste reste utile — c'est rangé — mais on le dit. */
          <div className="pnx-sans">
            Ce commerce n&apos;a pas encore donné de numéro pour les réservations.
            C&apos;est gardé dans <b>Ma carte</b> : montrez-le sur place.
          </div>
        )}

        <button type="button" className="pnx-plus" onClick={onFermer}>Garder pour plus tard</button>
        <div className="pnx-fin">
          Retrouvez-le dans <Link href={`/ville/${ville}/mes-commerces`} prefetch={false}>Ma carte</Link>.
        </div>
      </div>
    </div>
  );
}

export function PanneauPro({
  carte,
  fiche,
  onFermer,
  onReserver,
}: {
  carte: CarteVue;
  fiche: FichePro | null;
  onFermer: () => void;
  onReserver: () => void;
}) {
  const nom = fiche?.nom || carte.auteurNom;
  const metier = fiche?.metier || carte.auteurMetier;
  const itineraire = fiche ? lienItineraire(fiche, carte.lat, carte.lng) : "";

  return (
    <div className="pnx" role="dialog" aria-modal="true" aria-label={nom}>
      <button type="button" className="pnx-fond" onClick={onFermer} aria-label="Fermer" />
      <div className="pnx-feuille">
        <span className="pnx-poignee" aria-hidden="true" />

        {/* La photo de l'annonce fait l'en-tête : c'est celle qu'on vient de
            voir, et la reconnaître évite de se demander où l'on a atterri. */}
        <div
          className="pnx-tete"
          style={carte.photo ? { backgroundImage: `url(${JSON.stringify(carte.photo)})` } : undefined}
        >
          <span className="pnx-tete-v" aria-hidden="true" />
          <span className="pnx-tete-n">{nom}</span>
        </div>

        <div className="pnx-ou">
          <span><i aria-hidden="true">📍</i>{[metier, fiche?.ville || ""].filter(Boolean).join(" · ")}</span>
          {fiche?.adresse ? <span className="adr"><i aria-hidden="true">📮</i>{fiche.adresse}</span> : null}
          {fiche?.note ? <span className="note"><i aria-hidden="true">★</i>{fiche.note}{fiche.avis ? ` · ${fiche.avis} avis` : ""}</span> : null}
        </div>

        {/* Trois actions, et seulement celles qui aboutissent quelque part. */}
        <div className="pnx-act">
          {itineraire ? (
            <a href={itineraire} target="_blank" rel="noreferrer noopener" className="pnx-a go">
              <span aria-hidden="true">🧭</span> Y aller
            </a>
          ) : null}
          {fiche?.telephoneAppel ? (
            <a href={`tel:${fiche.telephoneAppel}`} className="pnx-a">
              <span aria-hidden="true">📞</span> Appeler
            </a>
          ) : null}
          {/* `/site-internet/<slug>` EST LA PAGE DU QR DE LA LETTRE, pas le site
              du commerçant : elle s'adresse à LUI, avec un formulaire de
              contact. Le site public, c'est `/site-internet/apercu/<slug>` —
              c'est d'ailleurs déjà l'adresse qu'employait l'ancien bouton
              « la boutique ». Le paramètre dit d'où vient le visiteur, ce qui
              alimente les statistiques du commerçant. */}
          {carte.auteurSlug ? (
            <a
              href={`/site-internet/apercu/${carte.auteurSlug}?via=direct&pub=${carte.id}`}
              className="pnx-a"
            >
              <span aria-hidden="true">🌐</span> Son site
            </a>
          ) : null}
        </div>

        {fiche?.presentation ? <p className="pnx-pres">{fiche.presentation}</p> : null}

        {carte.histoire ? (
          <div className="pnx-hist">
            <span aria-hidden="true">{carte.histoire.emoji}</span>
            {carte.histoire.texte}
          </div>
        ) : null}

        <button type="button" className="pnx-go" onClick={onReserver}>
          Voir ce qu&apos;il propose
        </button>
        <button type="button" className="pnx-plus" onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}

/** Les styles des deux panneaux. Posés une fois par l'écran qui les utilise. */
export function StylesPanneaux() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .pnx{position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;
          font-family:'Inter',system-ui,sans-serif;}
        .pnx-fond{position:absolute;inset:0;border:0;padding:0;cursor:pointer;
          background:rgba(4,8,6,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
          animation:pnxFond .3s ease;}
        @keyframes pnxFond{from{opacity:0}to{opacity:1}}
        /* La feuille MONTE. Elle ne se substitue pas à la pile : on la voit
           encore derrière, et c'est ce qui dit qu'on va y revenir. */
        .pnx-feuille{position:relative;width:100%;max-width:520px;max-height:92dvh;overflow-y:auto;
          -webkit-overflow-scrolling:touch;background:#0E1613;border-radius:26px 26px 0 0;
          border-top:1px solid rgba(255,255,255,.09);box-shadow:0 -30px 70px -20px rgba(0,0,0,.9);
          padding:10px 18px calc(20px + env(safe-area-inset-bottom));color:#EAF3EE;
          animation:pnxMonte .42s cubic-bezier(.16,1,.3,1);}
        @keyframes pnxMonte{from{transform:translateY(14%);opacity:0}to{transform:none;opacity:1}}
        .pnx-poignee{display:block;width:38px;height:4px;border-radius:3px;margin:0 auto 14px;background:rgba(255,255,255,.22);}

        .pnx-titre{text-align:center;font-size:22px;font-weight:850;letter-spacing:-.03em;color:#fff;}
        .pnx-sous{margin:6px 0 0;text-align:center;font-size:13.5px;line-height:1.5;color:#A9BDB3;}
        .pnx-sous b{color:#8FE9C4;}

        .pnx-obj{display:flex;align-items:center;gap:11px;margin-top:16px;padding:13px 14px;border-radius:16px;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);}
        .pnx-obj-ic{font-size:20px;line-height:1;flex:none;}
        .pnx-obj-c{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
        .pnx-obj-c b{font-size:14.5px;font-weight:800;color:#fff;letter-spacing:-.01em;}
        .pnx-obj-c i{font-style:normal;font-size:12px;color:#9FB3A8;}
        .pnx-obj-c em{font-style:normal;font-size:11.5px;font-weight:700;color:#8FE9C4;}
        .pnx-obj-pr{flex:none;display:flex;flex-direction:column;align-items:flex-end;
          font-size:17px;font-weight:850;color:#3DE2A6;letter-spacing:-.02em;}
        .pnx-obj-pr s{font-size:11px;font-weight:600;color:#7E938A;}

        .pnx-msg{margin-top:12px;padding:12px 13px;border-radius:15px;background:rgba(18,185,129,.09);
          border:1px solid rgba(126,230,192,.22);display:flex;flex-direction:column;gap:6px;}
        .pnx-msg-k{font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:#6FCBA6;}
        .pnx-msg-t{font-size:13px;line-height:1.5;color:#D6E7DE;white-space:pre-wrap;}

        .pnx-go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;
          border:0;border-radius:16px;padding:16px 18px;font-family:inherit;font-size:15.5px;font-weight:850;
          letter-spacing:-.01em;color:#04150E;text-decoration:none;cursor:pointer;
          background:linear-gradient(135deg,#3DE2A6,#0BA97B);box-shadow:0 16px 34px -14px rgba(18,185,129,.8);
          transition:transform .18s cubic-bezier(.34,1.4,.64,1);}
        .pnx-go:active{transform:scale(.97);}
        .pnx-plus{width:100%;margin-top:9px;border:0;background:none;color:#9FB3A8;font-family:inherit;
          font-size:13.5px;font-weight:700;padding:11px;cursor:pointer;}
        .pnx-sans{margin-top:13px;padding:12px 13px;border-radius:15px;font-size:13px;line-height:1.5;
          color:#C7B79A;background:rgba(240,180,41,.1);border:1px solid rgba(240,180,41,.24);}
        .pnx-sans b{color:#F0D9A0;}
        .pnx-fin{margin-top:6px;text-align:center;font-size:11.5px;color:#7E938A;}
        .pnx-fin a{color:#8FE9C4;}

        .pnx-tete{position:relative;height:132px;border-radius:18px;overflow:hidden;margin-bottom:12px;
          background:linear-gradient(155deg,#22463A,#0D1A15 70%);background-size:cover;background-position:center;}
        .pnx-tete-v{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,8,6,0) 30%,rgba(4,8,6,.9) 100%);}
        .pnx-tete-n{position:absolute;left:14px;bottom:12px;font-family:Georgia,serif;font-size:22px;font-weight:700;
          color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.8);}

        .pnx-ou{display:flex;flex-direction:column;gap:5px;font-size:13px;color:#C4D2CA;}
        .pnx-ou span{display:flex;align-items:flex-start;gap:7px;}
        .pnx-ou i{font-style:normal;font-size:12px;line-height:1.35;flex:none;}
        .pnx-ou .adr{color:#9FB3A8;}
        .pnx-ou .note{color:#F0C860;font-weight:700;}

        .pnx-act{display:flex;gap:8px;margin-top:14px;}
        .pnx-a{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 8px;
          border-radius:14px;font-size:13px;font-weight:800;text-decoration:none;color:#EAF3EE;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);}
        .pnx-a.go{color:#04150E;background:linear-gradient(135deg,#3DE2A6,#0BA97B);border:0;}
        .pnx-pres{margin:14px 0 0;font-size:13.5px;line-height:1.6;color:#B9CBC1;}
        .pnx-hist{display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:11px 13px;border-radius:15px;
          font-size:13px;line-height:1.5;color:#D6E7DE;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.08);}

        @media (prefers-reduced-motion:reduce){
          .pnx-fond,.pnx-feuille{animation:none;}
          .pnx-go{transition:none;}
        }
      `,
      }}
    />
  );
}
