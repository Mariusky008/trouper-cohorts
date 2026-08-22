"use client";

// ⚠️ MAQUETTE DE CONCEPT, MONTRÉE À DES HABITANTS — pas le produit.
//
// À QUOI ELLE SERT. Tout le reste du site s'adresse au commerçant. Cette page
// s'adresse à celui qui marche dans la rue, et elle sert à une seule chose :
// savoir si l'idée lui parle avant qu'on la construise. Elle met donc en scène
// des fonctions qui N'EXISTENT PAS — chercher par envie, filtrer par prix,
// demander à être prévenu. La liste complète et la raison de la séparation sont
// en tête de `lib/direct/apercu-habitant.ts`.
//
// LE BANDEAU DU HAUT N'EST PAS UNE PRÉCAUTION JURIDIQUE, C'EST LA QUESTION
// POSÉE. Quelqu'un qui croit utiliser un vrai service répond « c'est pratique »
// ; quelqu'un qui sait regarder un projet répond « ça, oui, ça non ». On veut la
// deuxième réponse, donc on le dit tout de suite.
//
// CE QUI PORTE LA DÉMONSTRATION, DANS L'ORDRE :
//
//  1. L'HEURE RÉELLE DU VISITEUR. La page ne dit pas « imaginez qu'il soit
//     midi » : elle lit son horloge et ouvre sur ce qui se passerait
//     maintenant. C'est le premier effet, il coûte trois lignes, et c'est lui
//     qui fait comprendre en une seconde que le contenu SUIT LE TEMPS.
//  2. LE BALAYAGE AU DOIGT, tout de suite, sans bouton « lancer ». On ne
//     comprend pas un mode swipe en le lisant. Tant qu'il n'a rien balayé, une
//     main animée le lui montre ; au premier geste, elle disparaît pour de bon.
//  3. LE CURSEUR DES HEURES, sous le téléphone. C'est l'argument entier, rendu
//     manipulable : on tire de 11 h à 22 h et la ville change sous le doigt. Un
//     annuaire ne peut pas faire ça, et on n'a pas besoin de l'écrire.
//  4. LA DEMANDE, dans l'autre sens. C'est la partie qui n'existe pas, elle est
//     badgée comme telle, et c'est précisément celle qu'on teste.
//  5. LE VERDICT. Trois boutons, puis un lien pour dire pourquoi. Sans cette
//     dernière marche, la page est une jolie démonstration dont on ne rapporte
//     rien.
import { useRef, useState, useSyncExternalStore } from "react";
import { CarteSwipe, StylesDirect } from "@/components/direct/carte-swipe";
import {
  ENVIES,
  HEURE_MAX,
  HEURE_MIN,
  autourDeMoi,
  heureLisible,
  rubriqueDe,
  selonEnvies,
  type CleEnvie,
} from "@/lib/direct/apercu-habitant";
import { MARQUE } from "@/lib/marque";

/** Au-delà de cette distance en pixels, le doigt a décidé : la carte part. */
const SEUIL = 84;
/** La durée de l'envol, la même qu'en CSS. */
const VOL_MS = 420;

export function ApercuHabitant({ contact }: { contact: string }) {
  // L'HEURE DU VISITEUR, SANS CASSER L'HYDRATATION.
  //
  // Le serveur ne connaît pas son fuseau : rendre `new Date().getHours()` des
  // deux côtés produit deux HTML différents et React se plaint. `useSyncExter-
  // nalStore` est fait pour ça — un instantané serveur (midi) et un instantané
  // client (l'heure vraie), et React remplace l'un par l'autre proprement. Pas
  // d'abonnement : l'heure ne bougera pas pendant la visite.
  const heureVraie = useSyncExternalStore(
    () => () => {},
    () => new Date().getHours(),
    () => 12,
  );
  const [heureChoisie, setHeureChoisie] = useState<number | null>(null);
  // Hors 11 h - 22 h, on n'invente pas une ville ouverte à 4 h du matin : on
  // ouvre à midi et la phrase change de temps.
  const dansLaJournee = heureVraie >= HEURE_MIN && heureVraie <= HEURE_MAX;
  const heure = heureChoisie ?? (dansLaJournee ? heureVraie : 12);

  const [passees, setPassees] = useState<string[]>([]);
  const [gardees, setGardees] = useState<string[]>([]);
  const [dx, setDx] = useState(0);
  const [sortant, setSortant] = useState<"" | "gauche" | "droite">("");
  const [aJoue, setAJoue] = useState(false);
  const prise = useRef<{ x0: number; id: string } | null>(null);
  const minuteries = useRef<number[]>([]);

  const [envies, setEnvies] = useState<CleEnvie[]>([]);
  const [alerte, setAlerte] = useState(false);
  const [verdict, setVerdict] = useState<string>("");

  const enLigne = autourDeMoi(heure);
  const pile = enLigne.filter((c) => !passees.includes(c.id));
  const dessus = pile[0];
  const dessous = pile[1];
  const resultats = selonEnvies(enLigne, envies);

  /** Remet le paquet à zéro — au changement d'heure comme sur « Rejouer ». */
  function rejouer() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setPassees([]);
    setGardees([]);
    setDx(0);
    setSortant("");
  }

  function partir(sens: "gauche" | "droite") {
    if (!dessus || sortant) return;
    setAJoue(true);
    setSortant(sens);
    setDx(sens === "droite" ? 420 : -420);
    const id = dessus.id;
    minuteries.current.push(
      window.setTimeout(() => {
        if (sens === "droite") setGardees((g) => (g.includes(id) ? g : [...g, id]));
        setPassees((p) => [...p, id]);
        setDx(0);
        setSortant("");
      }, VOL_MS),
    );
  }

  const marcheLaPlusCourte = gardees.length
    ? Math.min(...enLigne.filter((c) => gardees.includes(c.id)).map((c) => c.metres))
    : 0;

  return (
    <main className="am">
      <StylesDirect />

      {/* ── CE QUE CETTE PAGE EST ──────────────────────────────────────── */}
      <div className="am-bandeau">
        <b>Aperçu</b> Une idée qu&apos;on teste. Rien n&apos;est réservé pour de vrai —
        dites-nous ce que vous en pensez.
      </div>

      {/* ── 1 · CE QUI SE PASSE MAINTENANT ─────────────────────────────── */}
      <section className="am-hero">
        <div className="am-kick">
          <span className="am-pt" aria-hidden="true" />
          {dansLaJournee ? "Autour de vous, maintenant" : "Autour de vous, à midi"}
        </div>
        <h1 className="am-h1">
          {/* « DEMAIN » ÉTAIT FAUX LA MOITIÉ DU TEMPS. La phrase de repli servait
              aussi bien à 8 h du matin qu'à 2 h du matin, et à 8 h le prochain
              midi n'est pas demain. Trois cas, trois phrases. */}
          {dansLaJournee
            ? `Il est ${heureLisible(heureVraie)}.`
            : heureVraie < HEURE_MIN
              ? "Tout à l'heure, à midi."
              : "Demain, à midi."}
          <b>Voilà ce qu&apos;on peut manger à 200 m.</b>
        </h1>
        {/* DEUX LIGNES, PAS TROIS. Le titre occupait la moitié de l'écran et le
            téléphone passait sous la ligne de flottaison : sur une page dont
            tout l'effet est « regardez, ça bouge », ce qui bouge doit être
            visible sans faire défiler. */}
        <p className="am-sous">
          Pas les restaurants de la ville. <b>Ce qu&apos;ils ont, maintenant.</b>
        </p>

        <div className="am-scene">
          {/* LE COMPTEUR EST AU-DESSUS DU TÉLÉPHONE parce que c'est le score :
              il doit être dans le champ de vision au moment où on balaie, sinon
              le geste n'a pas de conséquence visible. */}
          <div className="am-score">
            <span className="am-s">
              <i aria-hidden="true">📍</i>
              {pile.length} autour de vous
            </span>
            <span className={`am-s vert${gardees.length ? " plein" : ""}`}>
              <i aria-hidden="true">💚</i>Ma carte<b>{gardees.length}</b>
            </span>
          </div>

          <div className="am-tel">
            <div className="am-ecran">
              {dessus ? (
                <div className="am-pile">
                  {dessous && (
                    <CarteSwipe
                      key={`dessous-${dessous.id}`}
                      carte={dessous}
                      className="am-carte dessous"
                    />
                  )}
                  {/* LE DOIGT NE SE DÉPLACE PAS AVEC LA CARTE : il montre le
                      geste à faire, il n'est pas le geste. Il disparaît au
                      premier balayage et ne revient jamais — un tutoriel qui
                      se répète devient un reproche. */}
                  {!aJoue && <span className="am-doigt" aria-hidden="true">👆</span>}
                  <div
                    className={`am-dessus${sortant ? ` vole ${sortant}` : ""}`}
                    style={{ transform: `translate3d(${dx}px,0,0) rotate(${dx * 0.045}deg)` }}
                    onPointerDown={(e) => {
                      if (sortant) return;
                      prise.current = { x0: e.clientX, id: dessus.id };
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!prise.current) return;
                      setDx(e.clientX - prise.current.x0);
                    }}
                    onPointerUp={() => {
                      if (!prise.current) return;
                      prise.current = null;
                      if (dx > SEUIL) partir("droite");
                      else if (dx < -SEUIL) partir("gauche");
                      else setDx(0);
                    }}
                    onPointerCancel={() => {
                      prise.current = null;
                      setDx(0);
                    }}
                  >
                    <CarteSwipe key={dessus.id} carte={dessus} className="am-carte" />
                    {/* LES DEUX TAMPONS APPARAISSENT PENDANT LE GLISSEMENT, pas
                        après : c'est ce qui dit au doigt ce qu'il est en train
                        de choisir, et qui permet de changer d'avis en revenant. */}
                    <span className="am-tampon non" style={{ opacity: Math.min(1, Math.max(0, -dx / SEUIL)) }} aria-hidden="true">✕</span>
                    <span className="am-tampon oui" style={{ opacity: Math.min(1, Math.max(0, dx / SEUIL)) }} aria-hidden="true">♥</span>
                  </div>
                </div>
              ) : (
                /* LA RÉCOMPENSE. Un paquet qui se vide sur un écran noir donne
                   l'impression d'avoir cassé quelque chose ; ici il se vide sur
                   un décompte de ce qu'on a gagné. */
                <div className="am-fini">
                  <span className="am-fini-e" aria-hidden="true">✨</span>
                  <b>Vous avez gardé {gardees.length} {gardees.length > 1 ? "choses" : "chose"}.</b>
                  {gardees.length > 0 ? (
                    <span>La plus proche est à {marcheLaPlusCourte} m. Trois minutes à pied.</span>
                  ) : (
                    <span>Rien ne vous tentait&nbsp;? Changez d&apos;heure, la ville change aussi.</span>
                  )}
                  <button type="button" className="am-rejouer" onClick={rejouer}>
                    ↻ Rejouer
                  </button>
                </div>
              )}
              {/* LES GESTES DU PRODUIT, MAIS CLIQUABLES.
                  Ils étaient rendus par `GestesDirect` — inertes — et doublés
                  par deux boutons sous le téléphone : deux fois les mêmes
                  actions à l'écran, dont une qui ne réagissait pas. On garde
                  les classes du composant (donc son allure exacte) et on met de
                  vrais boutons dedans, parce qu'au clavier et à la souris le
                  balayage n'existe pas : sans eux, la moitié des gens ne
                  peuvent pas jouer. */}
              <div className="cd-gestes am-gestes">
                <button type="button" className="cd-g" onClick={() => partir("gauche")} disabled={!dessus}>
                  <i aria-hidden="true">✕</i>
                  <em>Passer</em>
                </button>
                <button type="button" className="cd-g grand" onClick={() => partir("droite")} disabled={!dessus}>
                  <i aria-hidden="true">♥</i>
                  <em>Je garde</em>
                </button>
                {/* Le troisième geste du vrai écran ouvre la fiche du commerce.
                    Ici il n'y a pas de fiche à ouvrir : il reste visible pour
                    que l'écran soit celui du produit, et il est désactivé. */}
                <button type="button" className="cd-g" disabled aria-hidden="true" tabIndex={-1}>
                  <i>↑</i>
                  <em>Le pro</em>
                </button>
              </div>
            </div>
          </div>

          {/* ── LE CURSEUR DES HEURES ──
              C'est le cœur de la démonstration. On tire, et le contenu change :
              l'argument « Google sait qui existe, nous savons ce qui se passe »
              n'a plus besoin d'être écrit, il est dans le doigt. */}
          <div className="am-temps">
            <div className="am-temps-h">
              <b>{heureLisible(heure)}</b>
              <span>{rubriqueDe(heure)}</span>
            </div>
            <input
              className="am-curseur"
              type="range"
              min={HEURE_MIN}
              max={HEURE_MAX}
              step={1}
              value={heure}
              aria-label="Choisir l'heure de la journée"
              onChange={(e) => {
                setHeureChoisie(Number(e.target.value));
                rejouer();
              }}
            />
            <div className="am-temps-b">
              <span>{heureLisible(HEURE_MIN)}</span>
              <span className="am-temps-l">Le même téléphone. <b>La ville change.</b></span>
              <span>{heureLisible(HEURE_MAX)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · ET DANS L'AUTRE SENS ───────────────────────────────────── */}
      <section className="am-envie">
        <div className="am-projet">
          <b>En projet</b> Ça n&apos;existe pas encore. C&apos;est exactement ce
          qu&apos;on aimerait vous voir essayer.
        </div>
        <h2 className="am-h2">
          Et si vous pouviez <b>demander</b> au lieu de chercher&nbsp;?
        </h2>
        <p className="am-sous">
          Vous ne cherchez pas «&nbsp;un restaurant&nbsp;». Vous cherchez ce dont vous avez envie,
          maintenant, à côté.
        </p>

        <div className="am-chips">
          {ENVIES.map((e) => {
            const on = envies.includes(e.cle);
            return (
              <button
                key={e.cle}
                type="button"
                aria-pressed={on}
                className={`am-chip${on ? " on" : ""}`}
                onClick={() =>
                  setEnvies((v) => (v.includes(e.cle) ? v.filter((x) => x !== e.cle) : [...v, e.cle]))
                }
              >
                <i aria-hidden="true">{e.emoji}</i>
                {e.label}
              </button>
            );
          })}
        </div>

        <div className="am-res" aria-live="polite">
          {resultats.length > 0 ? (
            <>
              <div className="am-res-t">
                <b>{resultats.length}</b>
                {resultats.length > 1 ? " choses" : " chose"} autour de vous, à{" "}
                {heureLisible(heure)}
              </div>
              <ul className="am-mini">
                {resultats.map((c) => (
                  <li key={c.id} className="am-m">
                    <span
                      className="am-m-img"
                      style={{ backgroundImage: `url("${c.photo}")`, backgroundPosition: `center ${c.cadrage}` }}
                      aria-hidden="true"
                    />
                    <span className="am-m-t">
                      <b>{c.quoi}</b>
                      <i>{c.prix} · {c.distance}</i>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="am-vide">
              <span aria-hidden="true">🔍</span>
              Personne ne propose ça à {heureLisible(heure)}.
            </div>
          )}
        </div>

        {/* LA DEMANDE QUI RESTE. C'est la vraie idée testée ici : quand la ville
            n'a rien, on ne referme pas l'application, on laisse sa demande. Et
            cette demande vaut pour le commerçant d'en face autant que pour
            l'habitant — c'est le seul écran qui relie les deux. */}
        <div className={`am-alerte${alerte ? " on" : ""}`}>
          {!alerte ? (
            <>
              <p className="am-al-q">
                Voulez-vous être prévenu·e <b>quand quelqu&apos;un le proposera&nbsp;?</b>
              </p>
              <button type="button" className="am-al-b" onClick={() => setAlerte(true)}>
                🔔 Prévenez-moi
              </button>
            </>
          ) : (
            <>
              <p className="am-al-ok">
                <span aria-hidden="true">✓</span> C&apos;est noté.
              </p>
              <div className="am-al-deux">
                <div className="am-al-c">
                  <span className="am-al-k">Vous recevriez</span>
                  <b>«&nbsp;Un restaurant à 240 m vient de proposer ce que vous cherchiez.&nbsp;»</b>
                </div>
                <span className="am-al-fl" aria-hidden="true" />
                <div className="am-al-c">
                  <span className="am-al-k">Et le commerçant d&apos;en face verrait</span>
                  <b>«&nbsp;37 personnes cherchent ça ce midi, à moins de 500 m de chez vous.&nbsp;»</b>
                </div>
              </div>
              <p className="am-al-n">
                Chiffre d&apos;illustration&nbsp;: rien n&apos;est encore compté nulle part.
              </p>
              <button type="button" className="am-al-r" onClick={() => setAlerte(false)}>
                ↻ Revoir
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── 3 · LE VERDICT ─────────────────────────────────────────────── */}
      <section className="am-fin">
        <h2 className="am-h2">Vous l&apos;utiliseriez&nbsp;?</h2>
        {!verdict ? (
          <div className="am-votes">
            {["Oui, souvent", "De temps en temps", "Non, pas pour moi"].map((v) => (
              <button key={v} type="button" className="am-v" onClick={() => setVerdict(v)}>
                {v}
              </button>
            ))}
          </div>
        ) : (
          <div className="am-merci">
            <p>
              <b>«&nbsp;{verdict}&nbsp;»</b> — merci.
            </p>
            <p className="am-merci-p">
              Ce qui nous manque maintenant, c&apos;est <b>pourquoi</b>. Une phrase suffit.
            </p>
            <a
              className="am-wa"
              href={`${contact}${encodeURIComponent(` Mon avis sur la page « autour de moi » : « ${verdict} », parce que `)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              💬 Dire pourquoi en une phrase
            </a>
            <button type="button" className="am-al-r" onClick={() => setVerdict("")}>
              ↻ Changer d&apos;avis
            </button>
          </div>
        )}
        <p className="am-pied">
          {MARQUE} · une idée en cours de construction, ville après ville.
        </p>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine. */

        .am{background:radial-gradient(120% 48% at 50% 0%,#152232 0%,#080D0B 60%),#080D0B;
          color:#EAF2EC;min-height:100dvh;padding-bottom:60px;
          font-family:'Inter',system-ui,-apple-system,sans-serif;}

        /* CE QUE CETTE PAGE EST — en haut, avant tout le reste. */
        .am-bandeau{font-size:12.5px;line-height:1.45;text-align:center;color:#B9C6CE;
          background:rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.09);
          padding:10px 16px;}
        .am-bandeau b{display:inline-block;font-size:10px;font-weight:850;letter-spacing:.14em;
          text-transform:uppercase;color:#0A1410;background:#F0B429;border-radius:5px;
          padding:2px 7px;margin-right:8px;vertical-align:1px;}

        /* LA GOUTTIERE SEULEMENT, PAS LE PADDING ENTIER. Ecrit en raccourci
           (padding:0 18px), ce selecteur — plus specifique, un type et une
           classe — ecrasait le padding-top de chaque section : « Vous
           l'utiliseriez ? » venait se coller au bloc du dessus. */
        .am section{max-width:640px;margin:0 auto;padding-inline:18px;}
        .am-hero{padding-top:18px;}

        .am-kick{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:850;
          letter-spacing:.14em;text-transform:uppercase;color:#7FD8B4;}
        /* Le point qui bat dit « en direct ». C'est le seul element de la page
           qui bouge sans qu'on le touche, et c'est voulu. */
        .am-pt{width:7px;height:7px;border-radius:50%;background:#3DE2A6;
          box-shadow:0 0 0 0 rgba(61,226,166,.7);animation:amBat 2s ease-out infinite;}
        @keyframes amBat{
          0%{box-shadow:0 0 0 0 rgba(61,226,166,.65);}
          70%{box-shadow:0 0 0 10px rgba(61,226,166,0);}
          100%{box-shadow:0 0 0 0 rgba(61,226,166,0);}
        }

        .am-h1{margin:9px 0 0;font-size:24px;line-height:1.18;letter-spacing:-.03em;
          font-weight:800;color:#8FA3B0;text-wrap:balance;}
        .am-h1 b{display:block;color:#fff;font-weight:850;}
        .am-sous{margin:10px 0 0;font-size:15px;line-height:1.5;color:#93A8A0;text-wrap:balance;}
        .am-sous b{color:#EAF2EC;font-weight:750;}

        .am-scene{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:16px;}

        .am-score{display:flex;gap:8px;}
        .am-s{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:750;
          color:#B9C6CE;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);
          border-radius:999px;padding:7px 13px;transition:all .3s ease;}
        .am-s i{font-style:normal;font-size:11px;}
        .am-s b{margin-left:3px;font-weight:850;color:#fff;}
        .am-s.vert.plein{color:#8FE9C4;border-color:rgba(61,226,166,.45);
          background:rgba(61,226,166,.13);transform:scale(1.04);}

        .am-tel{border:1px solid rgba(255,255,255,.14);border-radius:30px;padding:12px 10px 8px;
          background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.01));
          box-shadow:0 0 0 1px rgba(0,0,0,.5),0 40px 76px -34px rgba(0,0,0,.95);}
        .am-ecran{width:340px;zoom:.8;display:flex;flex-direction:column;gap:10px;}

        /* LA PILE RESERVE SA PLACE. Sans hauteur propre, le depart de la
           derniere carte fait remonter d'un coup tout ce qui suit, et la page
           saute au moment precis ou l'on veut qu'elle recompense.
           LE RAPPORT EST CELUI DE LA CARTE, PAS UN NOMBRE CHOISI. Une hauteur
           en pixels avait ete posee au juge (432) : la carte en fait 470 a
           340 px de large, et son bas passait par-dessus les trois gestes. En
           reprenant son aspect-ratio, la pile suit la carte quoi qu'il arrive. */
        .am-pile{position:relative;width:100%;max-width:340px;margin-inline:auto;
          aspect-ratio:3/4.15;overflow:hidden;border-radius:26px;}
        .am-carte{position:absolute;left:0;right:0;top:0;margin-inline:auto;}
        .am-carte.dessous{transform:scale(.955) translateY(9px);filter:brightness(.72);}
        .am-dessus{position:absolute;inset:0;touch-action:pan-y;cursor:grab;
          will-change:transform;}
        .am-dessus:active{cursor:grabbing;}
        .am-dessus.vole{transition:transform ${VOL_MS}ms cubic-bezier(.4,0,.6,1),opacity ${VOL_MS}ms ease;
          opacity:0;}
        .am-dessus.vole.droite{transform:translate3d(420px,-30px,0) rotate(19deg)!important;}
        .am-dessus.vole.gauche{transform:translate3d(-420px,-30px,0) rotate(-19deg)!important;}

        .am-tampon{position:absolute;top:26px;font-size:34px;font-weight:900;line-height:1;
          border:4px solid currentColor;border-radius:14px;padding:8px 16px;pointer-events:none;}
        .am-tampon.non{right:20px;color:#FF6B6B;transform:rotate(15deg);}
        .am-tampon.oui{left:20px;color:#3DE2A6;transform:rotate(-15deg);}

        /* LA MAIN SE BALADE DANS LA PHOTO, PAS DANS LE TEXTE. Posee au milieu de
           la carte elle masquait le prix ; posee tout en bas, elle passait sur
           l'etiquette. Le tiers haut est la seule bande ou il n'y a jamais rien
           a lire — c'est la qu'elle va. */
        .am-doigt{position:absolute;left:50%;margin-left:-16px;top:30%;z-index:3;
          font-size:32px;pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.7));
          animation:amDoigt 2.4s ease-in-out infinite;}
        @keyframes amDoigt{
          0%,100%{transform:translate3d(0,0,0);opacity:.35;}
          25%{transform:translate3d(-46px,0,0);opacity:1;}
          55%{transform:translate3d(38px,0,0);opacity:1;}
          80%{transform:translate3d(0,0,0);opacity:.35;}
        }

        .am-fini{width:100%;max-width:340px;margin-inline:auto;aspect-ratio:3/4.15;
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:9px;text-align:center;padding:0 22px;
          border:1px dashed rgba(255,255,255,.16);border-radius:22px;
          animation:amFini .5s cubic-bezier(.16,1,.3,1);}
        @keyframes amFini{from{opacity:0;transform:scale(.96);}to{opacity:1;transform:none;}}
        .am-fini-e{font-size:38px;}
        .am-fini b{font-size:21px;color:#fff;font-weight:850;letter-spacing:-.02em;}
        .am-fini span:not(.am-fini-e){font-size:15px;color:#93A8A0;line-height:1.45;}
        .am-rejouer{margin-top:8px;font:inherit;font-size:14px;font-weight:800;color:#04150E;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border:0;border-radius:999px;
          padding:12px 22px;cursor:pointer;}

        /* Les gestes reprennent les classes du composant, donc son allure ; il
           ne reste qu'a rendre les BOUTONS neutres (un bouton porte sa propre
           police, son fond et sa bordure) et a leur donner le curseur. */
        .am-gestes .cd-g{font:inherit;background:none;border:0;padding:0;cursor:pointer;}
        .am-gestes .cd-g:active i{transform:scale(.92);}
        .am-gestes .cd-g:disabled{cursor:default;opacity:.32;}
        .am-gestes .cd-g:disabled:active i{transform:none;}
        .am-gestes .cd-g:focus-visible{outline:2px solid #3DE2A6;outline-offset:4px;border-radius:12px;}

        /* ── LE CURSEUR DES HEURES ── */
        .am-temps{width:100%;max-width:360px;margin-top:12px;}
        .am-temps-h{display:flex;align-items:baseline;justify-content:center;gap:10px;
          margin-bottom:9px;}
        .am-temps-h b{font-size:15px;font-weight:850;letter-spacing:.09em;color:#F0B429;
          font-variant-numeric:tabular-nums;}
        .am-temps-h span{font-size:17px;font-weight:800;letter-spacing:-.02em;color:#fff;}
        .am-curseur{width:100%;height:34px;-webkit-appearance:none;appearance:none;
          background:transparent;cursor:pointer;}
        .am-curseur::-webkit-slider-runnable-track{height:6px;border-radius:999px;
          background:linear-gradient(90deg,#F0B429,#D2604A 45%,#4EA8DE 75%,#9B7BFF);}
        .am-curseur::-moz-range-track{height:6px;border-radius:999px;
          background:linear-gradient(90deg,#F0B429,#D2604A 45%,#4EA8DE 75%,#9B7BFF);}
        .am-curseur::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
          width:26px;height:26px;margin-top:-10px;border-radius:50%;background:#fff;
          border:3px solid #0B1512;box-shadow:0 4px 14px rgba(0,0,0,.6);}
        .am-curseur::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:#fff;
          border:3px solid #0B1512;box-shadow:0 4px 14px rgba(0,0,0,.6);}
        .am-curseur:focus-visible{outline:2px solid #3DE2A6;outline-offset:6px;border-radius:8px;}
        .am-temps-b{display:flex;align-items:center;justify-content:space-between;gap:10px;
          font-size:11px;color:#6C8078;font-variant-numeric:tabular-nums;}
        .am-temps-l{font-size:12.5px;color:#93A8A0;text-align:center;}
        .am-temps-l b{color:#fff;font-weight:850;}

        /* ── LA DEMANDE ── */
        .am-envie{padding-top:64px;}
        .am-projet{font-size:12.5px;line-height:1.45;color:#B9C6CE;
          background:rgba(155,123,255,.1);border:1px solid rgba(155,123,255,.3);
          border-radius:12px;padding:10px 13px;margin-bottom:18px;}
        .am-projet b{display:inline-block;font-size:10px;font-weight:850;letter-spacing:.14em;
          text-transform:uppercase;color:#0A1410;background:#C4AEFF;border-radius:5px;
          padding:2px 7px;margin-right:8px;vertical-align:1px;}
        .am-h2{margin:0;font-size:25px;line-height:1.22;letter-spacing:-.03em;font-weight:800;
          color:#8FA3B0;text-wrap:balance;}
        .am-h2 b{color:#fff;font-weight:850;}

        .am-chips{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 18px;}
        .am-chip{display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:13.5px;
          font-weight:750;cursor:pointer;color:#C7D8CE;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:10px 16px;
          transition:transform .15s ease,background .25s ease,border-color .25s ease,color .25s ease;}
        .am-chip i{font-style:normal;font-size:14px;}
        .am-chip:active{transform:scale(.95);}
        .am-chip.on{color:#04150E;font-weight:850;border-color:transparent;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);
          box-shadow:0 12px 26px -14px rgba(18,185,129,.9);}

        .am-res{min-height:96px;}
        .am-res-t{font-size:16px;color:#93A8A0;margin-bottom:11px;}
        .am-res-t b{font-size:26px;font-weight:850;color:#fff;letter-spacing:-.02em;
          margin-right:2px;}
        .am-mini{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
        .am-m{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:9px 12px;
          animation:amMini .4s cubic-bezier(.16,1,.3,1);}
        @keyframes amMini{from{opacity:0;transform:translate3d(0,8px,0);}to{opacity:1;transform:none;}}
        .am-m-img{width:44px;height:44px;flex:none;border-radius:10px;background-size:cover;
          background-color:#16241E;}
        .am-m-t{display:flex;flex-direction:column;gap:2px;min-width:0;}
        .am-m-t b{font-size:14.5px;font-weight:800;color:#fff;}
        .am-m-t i{font-style:normal;font-size:12.5px;color:#93A8A0;}

        .am-vide{display:flex;align-items:center;gap:10px;font-size:15px;color:#93A8A0;
          background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.16);
          border-radius:14px;padding:16px 16px;}
        .am-vide span{font-size:20px;}

        .am-alerte{margin-top:18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;
          padding:18px;background:rgba(255,255,255,.04);transition:border-color .4s ease;}
        .am-alerte.on{border-color:rgba(61,226,166,.4);background:rgba(61,226,166,.07);}
        .am-al-q{margin:0 0 13px;font-size:16.5px;line-height:1.4;color:#C7D8CE;}
        .am-al-q b{color:#fff;font-weight:850;}
        .am-al-b{font:inherit;font-size:15px;font-weight:850;color:#04150E;border:0;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:14px;
          padding:14px 24px;cursor:pointer;box-shadow:0 16px 34px -16px rgba(18,185,129,.9);
          transition:transform .15s ease;}
        .am-al-b:active{transform:scale(.96);}
        .am-al-ok{margin:0 0 14px;font-size:19px;font-weight:850;color:#8FE9C4;
          animation:amOk .45s cubic-bezier(.16,1,.3,1);}
        @keyframes amOk{from{opacity:0;transform:scale(.9);}to{opacity:1;transform:none;}}
        .am-al-deux{display:flex;flex-direction:column;align-items:stretch;gap:0;}
        .am-al-c{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:12px 14px;}
        .am-al-k{display:block;font-size:10.5px;font-weight:850;letter-spacing:.13em;
          text-transform:uppercase;color:#7F988B;margin-bottom:5px;}
        .am-al-c b{font-family:Georgia,serif;font-size:15px;font-weight:400;color:#fff;
          line-height:1.4;}
        .am-al-fl{align-self:center;width:2px;height:16px;
          background:linear-gradient(180deg,rgba(126,230,192,.15),#3DE2A6);}
        .am-al-n{margin:12px 0 0;font-size:11.5px;color:#6C8078;}
        .am-al-r{margin-top:10px;font:inherit;font-size:12.5px;font-weight:750;color:#93A8A0;
          background:none;border:0;padding:4px 0;cursor:pointer;text-decoration:underline;}

        /* ── LE VERDICT ── */
        .am-fin{padding-top:64px;text-align:center;}
        .am-votes{display:flex;flex-direction:column;gap:9px;margin-top:20px;}
        .am-v{font:inherit;font-size:16px;font-weight:800;color:#EAF2EC;cursor:pointer;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);
          border-radius:15px;padding:16px;transition:transform .15s ease,background .25s ease,border-color .25s ease;}
        .am-v:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.26);}
        .am-v:active{transform:scale(.97);}
        .am-merci{margin-top:20px;animation:amOk .45s cubic-bezier(.16,1,.3,1);}
        .am-merci p{margin:0;font-size:19px;color:#C7D8CE;}
        .am-merci p b{color:#fff;font-weight:850;}
        .am-merci-p{margin-top:8px!important;font-size:15px!important;color:#93A8A0!important;}
        .am-wa{display:inline-block;margin-top:16px;text-decoration:none;font-size:16px;
          font-weight:850;color:#04150E;background:linear-gradient(140deg,#3DE2A6,#0BA97B);
          border-radius:15px;padding:15px 26px;box-shadow:0 18px 38px -18px rgba(18,185,129,.9);}
        .am-pied{margin:46px 0 0;font-size:12px;color:#5E706A;}

        @media (min-width:720px){
          /* SUR GRAND ECRAN LE TEXTE SE CENTRE, comme le telephone. Cale a
             gauche dans une colonne de 640 px au milieu d'un ecran de 1280, il
             partait d'un cote pendant que l'objet de la page etait de l'autre. */
          .am-hero{padding-top:40px;text-align:center;}
          .am-envie,.am-fin{text-align:center;}
          .am-chips{justify-content:center;}
          .am-res-t,.am-projet{text-align:center;}
          .am-m{text-align:left;}
          .am-h1{font-size:38px;}
          .am-h2{font-size:31px;}
          .am-ecran{zoom:.92;}
          .am-votes{flex-direction:row;justify-content:center;}
          .am-v{flex:1;}
          .am-al-deux{flex-direction:row;align-items:center;}
          .am-al-c{flex:1;}
          .am-al-fl{width:20px;height:2px;
            background:linear-gradient(90deg,rgba(126,230,192,.15),#3DE2A6);}
        }
        @media (prefers-reduced-motion:reduce){
          .am-pt,.am-doigt{animation:none;}
          .am-dessus.vole{transition-duration:.01ms;}
          .am-fini,.am-m,.am-al-ok,.am-merci{animation:none;}
        }
      `,
        }}
      />
    </main>
  );
}
