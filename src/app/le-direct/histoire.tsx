"use client";

// L'HISTOIRE EN QUATRE TEMPS.
//
// Chaque temps est un écran plein, et on descend d'un temps à l'autre. Le
// dernier — « on décide » — est le seul qui bouge tout seul : le bandeau du
// salon bascule d'un commerce à l'autre, parce que c'est ce basculement qui
// EST la démonstration. Le montrer en tableau de scores serait une autre
// promesse, et l'application n'affiche pas de tableau : la première ouverture
// démentirait la page.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function Histoire() {
  /**
   * LE BASCULEMENT DU BANDEAU, EN BOUCLE.
   *
   * Deux captures du MÊME salon, à deux instants : les lasagnes du Bocal mènent
   * par deux voix sur trois, puis Marc déplace la sienne et la garbure de Chez
   * Bergine passe devant. C'est exactement ce que fait l'application, et tout
   * suit — la photo, le nom, le prix, la distance, la réservation.
   *
   * C'EST LA SORTIE DES TROIS ÉCRANS D'AVANT. Le salon s'ouvre sur les lasagnes
   * qu'on vient de voir : une page qui changerait de commerce en chemin
   * raconterait deux histoires, et on n'en suivrait aucune.
   *
   * ON ALTERNE TOUTES LES 2,6 SECONDES, pas plus vite : il faut le temps de
   * lire les deux noms, sinon on voit un clignotement au lieu d'une décision.
   */
  const [bascule, setBascule] = useState(false);
  /** On n'anime que lorsque l'écran est visible : sinon on tourne pour rien. */
  const zone = useRef<HTMLDivElement | null>(null);
  const [vu, setVu] = useState(false);

  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const o = new IntersectionObserver(
      (e) => setVu(e[0]?.isIntersecting ?? false),
      { threshold: 0.35 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);

  useEffect(() => {
    if (!vu) return;
    // On respecte le réglage du système : une page qui bouge malgré lui est
    // pénible, et pour certaines personnes elle est inutilisable.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setBascule((b) => !b), 2600);
    return () => clearInterval(t);
  }, [vu]);

  return (
    <>
      {/* ─── 1 · LA PROMESSE ─────────────────────────────────────────────
          Trois mots, et l'écran de l'application. Pas d'explication : la
          question qu'on se pose vraiment à midi tient en trois mots. */}
      <section className="ld-e ld-e1">
        <div className="ld-mot">
          <p className="ld-oeil">Autour de vous, maintenant</p>
          <h1 className="ld-t1">ON FAIT QUOI&nbsp;?</h1>
          <p className="ld-s">
            Clikme vous montre ce qui se passe autour de vous. Ce qu’on mange
            aujourd’hui, ce qui est libre à 14 h, ce qui se joue ce soir.
          </p>
          <Link href="/autour-de-moi" className="ld-cta">
            Voir autour de moi
          </Link>
          <p className="ld-n">Sans compte, sans installer quoi que ce soit.</p>
        </div>
        <div className="ld-tel">
          <Image
            src="/le-direct/direct.jpg"
            alt="L’écran d’accueil de Clikme : le menu du jour d’un restaurant à 180 mètres."
            width={480}
            height={928}
            priority
          />
        </div>
      </section>

      {/* ─── 2 · JE TROUVE ─────────────────────────────────────────────── */}
      <section className="ld-e ld-e2">
        <div className="ld-mot">
          <p className="ld-oeil vert">Un pouce suffit</p>
          <h2 className="ld-t2">VOYEZ CE QUI SE PASSE.</h2>
          <ul className="ld-cartes">
            <li>
              <i aria-hidden="true">🍝</i>
              <b>Menu du jour</b>
              <em>350 m</em>
            </li>
            <li>
              <i aria-hidden="true">✂️</i>
              <b>Créneau libre, maintenant</b>
              <em>180 m</em>
            </li>
            <li>
              <i aria-hidden="true">🎤</i>
              <b>Concert ce soir</b>
              <em>600 m</em>
            </li>
            <li>
              <i aria-hidden="true">🥐</i>
              <b>Dernières portions</b>
              <em>220 m</em>
            </li>
          </ul>
          {/* CE QUI EST NOUVEAU N'EST PAS LA LISTE, C'EST LA JOURNÉE. Un
              annuaire donne un horaire ; ici un commerce raconte ses heures. */}
          <p className="ld-s">
            Et un commerce ne publie pas une fois&nbsp;: il raconte sa journée.
            Le menu à 10&nbsp;h, les dernières tables à 12&nbsp;h&nbsp;30, ce
            qu’il reste à 16&nbsp;h&nbsp;30.
          </p>
        </div>
        <div className="ld-tel">
          <Image
            src="/le-direct/journee.jpg"
            alt="La journée d’un commerce, heure par heure : ce qui est passé, ce qui est en cours, ce qu’il en reste."
            width={480}
            height={980}
          />
        </div>
      </section>

      {/* ─── 3 · J'EN PARLE ─────────────────────────────────────────────
          LE SALON N'EST PAS UN CHAT, et c'est tout le sujet de cet écran :
          c'est l'endroit où le groupe va décider. Le présenter comme une
          messagerie de plus tuerait la seule chose que WhatsApp ne fait pas. */}
      <section className="ld-e ld-e3">
        <div className="ld-mot">
          <p className="ld-oeil">Le moment qui change tout</p>
          <h2 className="ld-t2">
            NE CHOISISSEZ<br />PLUS SEUL.
          </h2>
          <ol className="ld-pas">
            <li>Trouvez quelque chose qui vous plaît.</li>
            <li>Invitez vos amis.</li>
            <li>Laissez-les proposer.</li>
            <li>Décidez ensemble.</li>
          </ol>
          <p className="ld-s">
            Vos amis ouvrent le lien et répondent&nbsp;: ils n’ont ni compte à
            créer, ni application à installer.
          </p>
        </div>
        <div className="ld-tel">
          <Image
            src="/le-direct/salon-vide.jpg"
            alt="Un salon Clikme qui vient de s’ouvrir : l’annonce, et une seule chose à faire — inviter."
            width={480}
            height={928}
          />
        </div>
      </section>

      {/* ─── 4 · ON DÉCIDE ─────────────────────────────────────────────── */}
      <section className="ld-e ld-e4" ref={zone}>
        <div className="ld-mot">
          <p className="ld-oeil ambre">Là où ça devient utile</p>
          <h2 className="ld-t2">
            QUELQU’UN PROPOSE<br />AUTRE CHOSE&nbsp;?
          </h2>
          <p className="ld-s">
            Clikme lui montre ce qui est <b>ouvert autour de vous</b>, avec les
            menus du jour, les prix et les distances. Il pose sa proposition sur
            la table. Vous votez.
          </p>
          {/* PAS DE TABLEAU DE SCORES. Ce que l'application montre, c'est le
              BANDEAU qui change de commerce — et donc la réservation avec. */}
          <p className="ld-bascule-dit">
            <i aria-hidden="true">🏆</i>
            Le haut du salon change tout seul, et la réservation avec.
          </p>
          <p className="ld-s">
            Et quand c’est décidé, une seule demande part&nbsp;:
            <b> « nous sommes trois, avez-vous de la place ce midi&nbsp;? »</b>
          </p>
        </div>
        <div className="ld-tel">
          {/* Les deux images sont empilées : on ne fait varier que l'opacité,
              pour que le basculement se lise comme un changement d'écran et
              non comme un chargement. */}
          <div className="ld-pile">
            <Image
              src="/le-direct/bascule-a.jpg"
              alt="Le salon : les lasagnes du Bocal de Margot sont en tête, deux voix sur trois."
              width={480}
              height={980}
              className={bascule ? "" : "on"}
            />
            <Image
              src="/le-direct/bascule-b.jpg"
              alt="Le même salon après que Marc a déplacé sa voix : la garbure de Chez Bergine est passée en tête."
              width={480}
              height={980}
              className={bascule ? "on" : ""}
            />
          </div>
        </div>
      </section>
    </>
  );
}
