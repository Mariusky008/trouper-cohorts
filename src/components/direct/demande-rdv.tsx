"use client";

import { useState } from "react";
import { DELAIS, MOTS_RDV, chiffresDu } from "@/lib/direct/rendez-vous";

/**
 * 📅 LE DERNIER ÉCRAN DES TROIS PARCOURS — un essai qui devient une demande.
 *
 * ═══ UN SEUL COMPOSANT POUR LA MODE, LA BEAUTÉ ET LA DÉCO ══════════════════
 *
 * « Et même chemin pour l'étape 4 de mode, qui est trop plate et sans
 * intérêt. » Puis : « et pour la déco aussi, même raisonnement. »
 *
 * TROIS PARCOURS, TROIS FOIS LE MÊME GESTE. C'est la leçon déjà tirée trois
 * fois sur ce projet — le mot-marque, le Fantôme d'accueil, la note en
 * fantômes : écrit trois fois, il aurait trois versions au bout d'un mois, et
 * celle qu'on n'aurait pas relue serait fausse. Ce qui change d'un métier à
 * l'autre tient dans `MOTS_RDV` : une question, un bouton, un mot.
 *
 * ═══ TROIS TEMPS, ET LE TROISIÈME EST CELUI QUI VEND ═══════════════════════
 *
 * 1. LA QUESTION, la ligne de prix, le bouton. Rien d'autre : c'est la fin du
 *    parcours, on ne réexplique pas ce qu'on vient de voir.
 * 2. QUAND. Trois envies, pas un calendrier — voir `DELAIS`.
 * 3. CE QUE LE COMMERÇANT REÇOIT. « Le moment fort devient la notification. »
 *    On bascule de son côté : on lit sa notification comme il la lira, et on
 *    voit ce que cette réalisation lui rapporte déjà.
 *
 * LE TROISIÈME EST LE SEUL QUI PARLE AU COMMERÇANT, et c'est lui qu'on montre
 * en rendez-vous. Les deux premiers lui font comprendre d'où vient la demande ;
 * celui-ci lui montre ce qu'il gagne.
 */
export function DemandeRdv({
  /** `coiffure`, `mode` ou `deco` — voir `MOTS_RDV`. */
  metier,
  /** L'identifiant du commerce, pour ses chiffres. */
  commerce,
  /** Ce qu'on vient d'essayer, son prix, et chez qui. */
  quoi,
  prix,
  nom,
  /** La photo de l'essai : celle qu'on propose de joindre. */
  essai,
  /** Le préfixe des classes de l'écran hôte (`pc`, `pm`, `pd`). */
  classe,
}: {
  metier: keyof typeof MOTS_RDV;
  commerce: string;
  quoi: string;
  prix?: string;
  nom: string;
  essai: string;
  classe: string;
}) {
  /** Le temps où l'on en est : la question, le choix, la demande envoyée. */
  const [temps, setTemps] = useState<"question" | "quand" | "envoye">("question");
  const [delai, setDelai] = useState(DELAIS[1]);
  /* L'IMAGE PART PAR DÉFAUT, ET SE COUPE D'UN DOIGT. C'est ce qui rend la
     demande utile au commerçant — il voit ce qu'on veut — donc on ne le cache
     pas derrière une case à cocher que personne ne coche. Mais c'est le visage
     de quelqu'un : l'interrupteur est sur l'écran, pas dans un réglage. */
  const [joindre, setJoindre] = useState(true);
  /** Le panneau du commerçant, ouvert par la petite pastille. */
  const [cote, setCote] = useState(false);

  const mots = MOTS_RDV[metier];
  const chiffres = chiffresDu(commerce);

  return (
    <div className={`rdv ${classe}-rdv`}>
      {temps === "question" && (
        <>
          <h1 className="rdv-t">{mots.question}</h1>
          {/* LA LIGNE QU'IL A ÉCRITE, TELLE QUELLE : « Coupe homme · 22 € · Un
              barbier de la halle ». Tout ce qu'il faut pour décider, sur une
              ligne, sans une vignette de plus. */}
          <p className="rdv-ligne">
            {quoi}
            {prix ? ` · ${prix}` : ""} · <b>{nom}</b>
          </p>
          <button type="button" className="rdv-go" onClick={() => setTemps("quand")}>
            {mots.bouton}
            <s aria-hidden="true">→</s>
          </button>
        </>
      )}

      {temps === "quand" && (
        <>
          <h1 className="rdv-t">Vous voulez venir quand ?</h1>
          {/* AUCUNE HEURE N'EST PROPOSÉE, et c'est la règle du produit : on
              n'annonce pas un créneau qu'on ne peut pas tenir. On dit une
              envie, il répond avec ce qui est libre. */}
          <p className="rdv-sous">
            {nom} vous proposera l’heure — personne ne connaît son planning à sa
            place.
          </p>
          <div className="rdv-quand">
            {DELAIS.map((d) => (
              <button
                key={d.cle}
                type="button"
                className={`rdv-q${d.cle === delai.cle ? " on" : ""}`}
                onClick={() => setDelai(d)}
              >
                <i aria-hidden="true">{d.icone}</i>
                {d.mot}
              </button>
            ))}
          </div>

          {/* L'IMAGE : UN INTERRUPTEUR, PAS UNE CASE PERDUE DANS UNE PHRASE. */}
          <button
            type="button"
            className={`rdv-img${joindre ? " on" : ""}`}
            aria-pressed={joindre}
            onClick={() => setJoindre((v) => !v)}
          >
            <span className="rdv-img-v" style={{ backgroundImage: `url("${essai}")` }} aria-hidden="true" />
            <span className="rdv-img-t">
              <b>{mots.image}</b>
              <em>{joindre ? "Il verra ce que vous avez essayé" : "Il ne verra que votre demande"}</em>
            </span>
            <s className="rdv-bascule" aria-hidden="true" />
          </button>

          <button type="button" className="rdv-go" onClick={() => setTemps("envoye")}>
            Envoyer ma demande
            <s aria-hidden="true">→</s>
          </button>
        </>
      )}

      {temps === "envoye" && (
        <>
          {/* ═══ CE QU'IL REÇOIT, COMME IL LE REÇOIT ════════════════════════
              « Le moment fort devient la notification : "Nouvelle demande : un
              client a essayé votre coupe et souhaite venir cette semaine."
              C'est concret, même sans planning connecté. »
              ON LA DESSINE COMME UNE NOTIFICATION DE TÉLÉPHONE, avec le nom de
              l'application et l'heure. Écrite en paragraphe, elle se serait lue
              comme une promesse de ce que le produit fera ; dessinée, elle se
              lit comme ce qu'il verra. */}
          {/* ═══ D'ABORD CE QUI VIENT DE SE PASSER ═════════════════════════

              « Design très mauvais, à refaire en beaucoup mieux. »

              CE QUI N'ALLAIT PAS, ET IL Y AVAIT TROIS CHOSES. L'écran s'ouvrait
              sur une grande photo vide, puis sur une ligne en capitales roses
              qui se cassait en deux — « CE QUE UN BARBIER DE LA HALLE REÇOIT, À
              L'INSTANT », avec la faute de liaison en prime — posée sur une
              photo chargée. On ne savait pas ce qu'on regardait : une
              confirmation ? un aperçu ? Et rien ne disait que la demande était
              PARTIE.

              TROIS TEMPS, DANS L'ORDRE OÙ ON SE LES DEMANDE : c'est fait —
              voilà ce qu'il voit — voilà la suite. La pastille verte répond à
              la première question en un dixième de seconde, avant toute
              lecture. */}
          <span className="rdv-ok" aria-hidden="true">✓</span>
          <h1 className="rdv-t">Demande envoyée</h1>
          <p className="rdv-ligne">
            à <b>{nom}</b>
          </p>

          {/* ET VOILÀ CE QU'IL REÇOIT. La légende est courte et neutre : la
              notification porte déjà « Clikme · maintenant » dans son en-tête,
              le répéter en capitales roses au-dessus ne disait rien de plus. */}
          <p className="rdv-cap">Sur son téléphone</p>
          <div className="rdv-notif">
            <span className="rdv-notif-h">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/clikme-fantome.png" alt="" />
              Clikme
              <s>maintenant</s>
            </span>
            <b>Nouvelle demande</b>
            <p>{mots.notification(delai.dit)}</p>
            {joindre && (
              <span className="rdv-notif-v" style={{ backgroundImage: `url("${essai}")` }} aria-hidden="true" />
            )}
          </div>
          <p className="rdv-suite">
            Il propose une heure, vous confirmez. Rien n’est réservé tant que
            vous ne l’avez pas dit tous les deux.
          </p>

          {/* ═══ ET ON PASSE DE SON CÔTÉ ════════════════════════════════════
              « Après le parcours client, on passe brièvement côté salon avec un
              petit icône sur le dernier écran. »
              PAR UNE PASTILLE, ET PAS TOUT SEUL. Basculer d'office aurait mélangé
              les deux points de vue à la fin d'un parcours d'habitant ; la
              pastille laisse le commerçant l'ouvrir quand il est prêt, en
              rendez-vous, et laisse l'habitant l'ignorer. */}
          {chiffres && (
            <button
              type="button"
              className={`rdv-cote${cote ? " on" : ""}`}
              aria-expanded={cote}
              onClick={() => setCote((v) => !v)}
            >
              <s aria-hidden="true">📊</s>
              {cote ? "Masquer le côté commerçant" : `Et côté ${metier === "coiffure" ? "salon" : "boutique"} ?`}
            </button>
          )}

          {cote && chiffres && (
            <div className="rdv-bilan">
              <span className="rdv-bilan-v" style={{ backgroundImage: `url("${essai}")` }} aria-hidden="true" />
              <p className="rdv-bilan-t">
                {quoi} <em>travaille pour {nom}</em>
              </p>
              <ul className="rdv-chiffres">
                <li>
                  <b>{chiffres.essais}</b>
                  <em>l’ont essayée</em>
                </li>
                <li>
                  <b>{chiffres.gardes}</b>
                  <em>l’ont gardée</em>
                </li>
                <li className="fort">
                  <b>{chiffres.contacts}</b>
                  <em>ont écrit</em>
                </li>
              </ul>
              {/* LA MENTION EN TOUTES LETTRES, PAS EN PETIT DANS UN COIN. Voir
                  le grand commentaire de `CHIFFRES` : un chiffre montré sans
                  dire d'où il vient est pris pour une mesure. */}
              <p className="rdv-illus">
                Chiffres d’exemple, pour montrer l’écran. Dans l’application, ce
                sont les essais, les enregistrements et les messages réellement
                comptés.
              </p>
              <p className="rdv-lecon">
                Il voit lesquelles de ses réalisations donnent envie de venir —
                et il remet celles-là en avant.
              </p>
            </div>
          )}
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </div>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE = `
/* ═══ IL DEFILE QUAND LE COTE COMMERCANT S'OUVRE ═════════════════════════
   MESURE : avec le panneau ouvert, le bloc fait plus haut que l'ecran et la
   derniere ligne — celle qui explique ce que le commercant en tire — passait
   sous le bord. C'est justement la phrase pour laquelle tout cet ecran existe.
   LA HAUTEUR EST BORNEE SOUS L'EN-TETE, et le bloc defile a l'interieur.
   overscroll-behavior:contain empeche le geste de continuer sur la page
   derriere une fois arrive en bas. */
.rdv{display:flex;flex-direction:column;align-items:center;gap:0;width:100%;
  text-align:center;
  max-height:calc(100dvh - 104px);overflow-y:auto;overscroll-behavior:contain;
  padding-bottom:6px;
  scrollbar-width:thin;scrollbar-color:rgba(255,46,154,.45) transparent;}
.rdv::-webkit-scrollbar{width:4px;}
.rdv::-webkit-scrollbar-thumb{background:rgba(255,46,154,.45);
  border-radius:999px;}
/* LES BLOCS NE SE COMPRESSENT PAS EN DEFILANT : sans ca, flex les ecrase pour
   les faire tenir, et la notification perd sa hauteur. La pastille du cote
   commercant est la seule exception — elle se dimensionne sur son texte, et sa
   largeur est posee avec le reste de son dessin, plus bas. */
.rdv>*{flex:none;width:100%;}
/* LE TITRE SE REPARTIT SUR SES LIGNES AU LIEU DE LAISSER UN ORPHELIN. Mesure a
   l'ecran : « Vous voulez venir quand ? » posait le point d'interrogation seul
   sur la seconde ligne. L'espace fine insecable avant le « ? » — qui est de
   toute facon la typographie francaise — l'attache au dernier mot, et
   text-wrap:balance egalise les deux lignes. */
.rdv-t{margin:0;font-size:clamp(23px,min(7.4vw,4vh),32px);font-weight:900;
  line-height:1.08;letter-spacing:-.03em;color:#fff;text-wrap:balance;
  text-shadow:0 2px 18px rgba(0,0,0,.85);}
/* LA LIGNE DE SA MAQUETTE : « Coupe homme · 22 € · Un barbier de la halle ».
   Le nom du commerce prend le gras, parce que c'est la seule des trois
   informations qu'on ne connaissait pas avant d'ouvrir ce parcours. */
.rdv-ligne{margin:9px 0 0;font-size:13px;font-weight:700;line-height:1.35;
  color:rgba(255,255,255,.82);}
.rdv-ligne b{font-weight:900;color:#FF7FC2;}
.rdv-sous{margin:8px 0 0;max-width:32ch;font-size:12px;font-weight:650;
  line-height:1.35;color:rgba(255,255,255,.68);}
.rdv-go{margin-top:14px;width:100%;min-height:54px;border:0;border-radius:999px;
  display:flex;align-items:center;justify-content:center;gap:9px;
  font:inherit;font-size:16px;font-weight:900;letter-spacing:-.01em;
  color:#fff;cursor:pointer;
  background:linear-gradient(180deg,#FF48A8,#E4067E);
  box-shadow:0 16px 38px -14px rgba(255,46,154,.95);}
.rdv-go:active{transform:scale(.98);}
.rdv-go s{text-decoration:none;}

/* ═══ QUAND ═══════════════════════════════════════════════════════════════
   TROIS BOUTONS EN COLONNE, PAS TROIS PASTILLES EN LIGNE : « une autre date »
   ne tient pas sur un tiers de telephone, et trois largeurs differentes se
   lisent comme trois importances differentes. */
.rdv-quand{display:flex;flex-direction:column;gap:7px;width:100%;margin:12px 0 0;}
.rdv-q{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;
  padding:0 15px;border-radius:14px;cursor:pointer;
  font:inherit;font-size:14.5px;font-weight:800;color:#fff;text-align:left;
  background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.16);
  transition:border-color .18s ease,background .18s ease;}
.rdv-q i{font-style:normal;font-size:17px;line-height:1;}
.rdv-q.on{background:rgba(255,46,154,.16);border-color:#FF2E9A;}
.rdv-q:active{transform:scale(.99);}

/* L'INTERRUPTEUR DE L'IMAGE. Il montre la vignette de l'essai : on decide de
   l'envoyer en la regardant, pas en lisant son nom. */
.rdv-img{display:flex;align-items:center;gap:11px;width:100%;margin:11px 0 0;
  padding:9px 13px 9px 9px;border-radius:16px;cursor:pointer;
  font:inherit;text-align:left;color:#fff;
  background:rgba(255,255,255,.06);
  border:1.5px solid rgba(255,255,255,.14);}
.rdv-img.on{border-color:rgba(255,46,154,.6);background:rgba(255,46,154,.1);}
.rdv-img-v{flex:none;width:42px;height:52px;border-radius:10px;
  background-size:cover;background-position:center 18%;}
.rdv-img-t{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
.rdv-img-t b{font-size:13px;font-weight:850;line-height:1.2;}
.rdv-img-t em{font-style:normal;font-size:11px;font-weight:650;
  color:rgba(255,255,255,.62);line-height:1.2;}
.rdv-bascule{position:relative;flex:none;width:40px;height:23px;
  border-radius:999px;background:rgba(255,255,255,.2);
  transition:background .2s ease;}
.rdv-bascule::after{content:"";position:absolute;top:3px;left:3px;
  width:17px;height:17px;border-radius:50%;background:#fff;
  transition:transform .2s ease;}
.rdv-img.on .rdv-bascule{background:#FF2E9A;}
.rdv-img.on .rdv-bascule::after{transform:translateX(17px);}

/* ═══ CE QU'IL RECOIT ═════════════════════════════════════════════════════
   DESSINEE COMME UNE NOTIFICATION DE TELEPHONE : fond clair, coins ronds, nom
   de l'application et heure en haut. Ecrite en paragraphe, elle se serait lue
   comme une promesse ; dessinee, elle se lit comme ce qu'il verra. */
/* LA PASTILLE DU FAIT ACCOMPLI. Elle repond « c'est parti » avant qu'on ait
   lu un mot, ce qui est la premiere question qu'on se pose apres avoir appuye
   sur un bouton d'envoi. Verte, parce que c'est la seule couleur que personne
   n'a besoin d'apprendre. */
.rdv-ok{display:flex;align-items:center;justify-content:center;
  width:52px;height:52px;margin:0 auto 11px;border-radius:50%;
  font-size:25px;font-weight:900;color:#06120C;
  background:linear-gradient(180deg,#5BE9A8,#22C07C);
  box-shadow:0 14px 34px -12px rgba(34,192,124,.9);}
/* LA LEGENDE DE LA NOTIFICATION : courte, grise, en bas de casse. En capitales
   roses sur une photo chargee, elle se cassait en deux lignes et criait plus
   fort que la notification qu'elle annonce. */
.rdv-cap{margin:16px 0 8px;font-size:11px;font-weight:800;letter-spacing:.06em;
  text-transform:uppercase;color:rgba(255,255,255,.5);}
.rdv-notif{position:relative;width:100%;padding:12px 13px 13px;
  border-radius:18px;text-align:left;color:#14101C;
  background:linear-gradient(180deg,#FFFFFF,#F1ECF8);
  box-shadow:0 20px 44px -18px rgba(0,0,0,.9);}
.rdv-notif-h{display:flex;align-items:center;gap:6px;
  font-size:10.5px;font-weight:850;letter-spacing:.04em;color:#6B5E80;
  text-transform:uppercase;}
.rdv-notif-h img{width:17px;height:auto;}
.rdv-notif-h s{margin-left:auto;text-decoration:none;font-weight:700;
  text-transform:none;letter-spacing:0;color:#9A8FAC;}
.rdv-notif b{display:block;margin:7px 0 2px;font-size:15px;font-weight:900;
  letter-spacing:-.02em;}
.rdv-notif p{margin:0;font-size:13px;font-weight:650;line-height:1.35;
  color:#3C3350;padding-right:52px;}
.rdv-notif-v{position:absolute;right:12px;bottom:12px;
  width:44px;height:54px;border-radius:10px;
  background-size:cover;background-position:center 18%;
  box-shadow:0 6px 16px -6px rgba(0,0,0,.6);}
.rdv-suite{margin:10px 0 0;max-width:34ch;font-size:11.5px;font-weight:650;
  line-height:1.4;color:rgba(255,255,255,.66);}

/* ═══ LE COTE COMMERCANT ══════════════════════════════════════════════════ */
.rdv-cote{width:auto;margin:12px 0 0;padding:8px 15px;border-radius:999px;
  cursor:pointer;
  display:flex;align-items:center;gap:7px;
  font:inherit;font-size:12.5px;font-weight:850;color:#F2E9FF;
  background:rgba(255,255,255,.08);
  border:1.5px solid rgba(255,255,255,.18);}
.rdv-cote.on{border-color:#FF2E9A;background:rgba(255,46,154,.14);}
.rdv-cote s{text-decoration:none;font-size:14px;}
.rdv-bilan{width:100%;margin:11px 0 0;padding:13px;border-radius:18px;
  background:rgba(10,8,16,.82);
  border:1.5px solid rgba(255,46,154,.45);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
.rdv-bilan-v{display:block;width:74px;height:90px;margin:0 auto;
  border-radius:12px;background-size:cover;background-position:center 18%;}
.rdv-bilan-t{margin:9px 0 0;font-size:13.5px;font-weight:850;line-height:1.25;
  color:#fff;}
.rdv-bilan-t em{display:block;font-style:normal;font-weight:700;
  color:rgba(255,255,255,.7);font-size:12px;margin-top:1px;}
/* L'ENTONNOIR SE LIT DE GAUCHE A DROITE : essaye, garde, ecrit. Le dernier est
   le seul qui rapporte de l'argent, donc c'est le seul en couleur. */
.rdv-chiffres{list-style:none;display:flex;gap:7px;margin:11px 0 0;padding:0;}
.rdv-chiffres li{flex:1;padding:9px 4px;border-radius:13px;
  display:flex;flex-direction:column;align-items:center;gap:1px;
  background:rgba(255,255,255,.06);}
.rdv-chiffres b{font-size:22px;font-weight:900;letter-spacing:-.03em;
  line-height:1;color:#fff;}
.rdv-chiffres em{font-style:normal;font-size:10px;font-weight:750;
  line-height:1.2;color:rgba(255,255,255,.62);text-align:center;}
.rdv-chiffres li.fort{background:rgba(255,46,154,.2);}
.rdv-chiffres li.fort b{color:#FF7FC2;}
.rdv-chiffres li.fort em{color:#FFC7E4;}
.rdv-illus{margin:10px 0 0;font-size:10.5px;font-weight:700;line-height:1.35;
  color:rgba(255,255,255,.55);}
.rdv-lecon{margin:7px 0 0;font-size:11.5px;font-weight:750;line-height:1.35;
  color:#E9DCF4;}
@media (prefers-reduced-motion:reduce){
  .rdv-go:active,.rdv-q:active,.rdv-img:active{transform:none;}
  .rdv-bascule,.rdv-bascule::after{transition:none;}
}
`;
