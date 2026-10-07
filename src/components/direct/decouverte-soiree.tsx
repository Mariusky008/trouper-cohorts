"use client";

// 🎶 DÉCOUVRIR UNE SOIRÉE — l'ambiance, qui vient, la discussion.
//
// ═══ L'ORDRE DE LECTURE, ET C'EST LE SIEN ═════════════════════════════════
//
// « Appuyer sur "Découvrir cette soirée" → écouter (lancement automatique) s'il
// y a une musique et choisir un onglet → découvrir les personnes et leurs
// envies → choisir parmi les sept raisons, puis valider → appuyer sur
// "Discussion" pour voir ou écrire. »
//
// TROIS ONGLETS, UNE FEUILLE :
//
//   · L'AMBIANCE   — l'extrait (il part tout seul), quand, où, combien, et les
//                    fantômes de ceux qui comptent venir.
//   · QUI VIENT ?  — chacun avec son fantôme, ses envies et son petit mot.
//   · DISCUSSION   — le salon PUBLIC de la soirée, le même que celui
//                    d'Ensemble : un seul fil, deux portes.
//   · « TU VIENS POUR… » — la feuille de « Je compte venir » : deux envies au
//                    plus parmi sept, un mot, et le choix de se montrer.
//
// « JE COMPTE VENIR » DEMANDE D'ABORD SON FANTÔME, s'il n'est pas encore
// choisi : c'est lui qui apparaîtra dans « Qui vient ? » et dans le fil.
//
// LA RÈGLE DE LA SOIRÉE TIENT TOUJOURS (voir `lib/direct/soiree.ts`) : « Faire
// une rencontre » est la dernière des envies, écrite comme les autres, et
// l'écran sert aussi à celui qui ne veut parler à personne — l'ambiance et
// l'heure se lisent sans rien dire.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { INTENTIONS, intentionDe, intentionsDe, motsDe, ouEnEstLaSoiree, type Soiree } from "@/lib/direct/soiree";
import {
  abonnerPrenom,
  abonnerSalons,
  basculerVenue,
  chargerSalons,
  cleSalonDeSoiree,
  direSonPrenom,
  ecrireDansSalon,
  entrerDansSalon,
  heureCourte,
  monPrenom,
  SALONS_VIDES,
} from "@/lib/direct/salons";
import { abonnerLook, lookDe, lookParDefautDe, monLook } from "@/lib/direct/look";
import { abonnerEnvies, AUCUNES_ENVIES, chargerEnvies, poserEnvies } from "@/lib/direct/soiree-envies";
import { reduirePhoto } from "@/lib/site-internet/reduire-photo";
import { abonnerCadeaux, AUCUN_CADEAU, chargerCadeaux, lancerCadeau, oublierCadeau, retenirTirage, retenirTiragePour, ticketVu, tirer, validerCode, type Cadeau } from "@/lib/direct/soiree-cadeaux";
import { CarteCadeau, CoteBar, EcranGagne, StylesConsos, TicketEpingle } from "@/components/direct/consos-offertes";

export type OngletSoiree = "ambiance" | "qui" | "discussion";

const LOOK_PAR_DEFAUT = lookDe(null);
const pasDePrenom = () => "";

export function DecouverteSoiree({
  soiree,
  ville,
  itineraire,
  musique,
  ouvrirSur = "ambiance",
  choisirFantome,
  onEnsemble,
  demo,
}: {
  soiree: Soiree;
  ville?: string;
  /** L'adresse de l'itinéraire, quand on la connaît. */
  itineraire?: string;
  /** La musique déposée par le lieu ; à défaut, l'extrait de son essai « son ». */
  musique?: { src: string; titre?: string; duree?: number };
  ouvrirSur?: OngletSoiree;
  /** Demande le fantôme s'il n'est pas encore choisi, puis continue. Absent : on continue. */
  choisirFantome?: (apres: () => void) => void;
  /** Ouvrir le même salon dans Ensemble. */
  onEnsemble?: (cle: string) => void;
  /** La démonstration : le geste « Côté bar » des consos offertes se joue sur le téléphone. */
  demo?: boolean;
}) {
  const [onglet, setOnglet] = useState<OngletSoiree>(ouvrirSur);
  const [feuille, setFeuille] = useState(false);
  const cle = cleSalonDeSoiree(soiree);
  const salons = useSyncExternalStore(abonnerSalons, chargerSalons, () => SALONS_VIDES);
  const envies = useSyncExternalStore(abonnerEnvies, chargerEnvies, () => AUCUNES_ENVIES);
  const prenom = useSyncExternalStore(abonnerPrenom, monPrenom, pasDePrenom);
  const look = useSyncExternalStore(abonnerLook, monLook, () => LOOK_PAR_DEFAUT);
  const salon = salons[cle];
  const moi = envies[soiree.id];
  const mots = motsDe(soiree);

  // ─── LE SON ─── il part tout seul à l'ouverture ; le navigateur peut le
  // refuser, et le bouton reste alors à « écouter ».
  const essaiSon = soiree.essais.find((e) => e.forme === "son" && e.media);
  const son = musique?.src ?? essaiSon?.media;
  const duree = musique?.duree ?? essaiSon?.duree ?? 10;
  const titreSon = musique?.titre ?? (essaiSon?.etiquette ? `Extrait · ${minuscule(essaiSon.etiquette.haut)}` : "L’ambiance de ce soir");
  const audio = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  const [avance, setAvance] = useState(0);
  const [ecoute, setEcoute] = useState(false);
  // UNE FOIS, À L'OUVERTURE SUR L'AMBIANCE — et le son s'arrête avec l'écran.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (ouvrirSur === "ambiance")
      a.play().catch(() => {
        /* lecture refusée : le bouton reste à « écouter » */
      });
    return () => {
      try {
        a.pause();
      } catch {
        /* au mieux */
      }
    };
  }, [ouvrirSur]);
  const basculerSon = () => {
    const a = audio.current;
    if (!a) return;
    if (joue) a.pause();
    else
      a.play().catch(() => {
        /* refusé */
      });
  };

  // ─── L'HEURE ─── lue après le premier rendu (voir `soiree-contenu.tsx`).
  const [heure, setHeure] = useState<number | null>(null);
  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'heure du téléphone n'existe qu'après le rendu
    setHeure(d.getHours() + d.getMinutes() / 60);
  }, []);

  // ─── QUI VIENT ─── moi d'abord (si je me montre), puis ceux qui sont déjà là.
  const fantomeDe = (nom: string) => {
    const l = lookParDefautDe(`${cle}:${nom}`);
    return l.debout ?? l.image;
  };
  const autres = [...soiree.fantomes].sort((a, b) => Number(b.present) - Number(a.present));
  const total = soiree.fantomes.length + (moi ? 1 : 0);
  const monFantome = look.debout ?? look.image;

  const compterVenir = () => {
    // UN TIRAGE QUI TOURNE ATTEND CELUI QUI EST EN TRAIN DE DIRE QU'IL VIENT.
    retenirTiragePour(soiree.id, 30_000);
    (choisirFantome ?? ((f: () => void) => f()))(() => setFeuille(true));
  };

  // ─── 🎁 LES CONSOS OFFERTES ─── voir `lib/direct/soiree-cadeaux.ts`.
  const cadeaux = useSyncExternalStore(abonnerCadeaux, chargerCadeaux, () => AUCUN_CADEAU);
  const cadeau: Cadeau | undefined = cadeaux[soiree.id];
  const [coteBar, setCoteBar] = useState(false);
  const [voirTicket, setVoirTicket] = useState(false);
  const [maintenant, setMaintenant] = useState(0);
  const finCadeau = cadeau ? cadeau.tirageLe + cadeau.duree * 60_000 : 0;
  // L'HORLOGE NE TOURNE QUE PENDANT QU'IL Y A QUELQUE CHOSE À COMPTER.
  useEffect(() => {
    if (!finCadeau) return;
    const t = () => setMaintenant(Date.now());
    // L'HEURE DU TÉLÉPHONE, LUE TOUT DE SUITE PUIS CHAQUE SECONDE.
    t();
    const i = window.setInterval(t, 1000);
    return () => window.clearInterval(i);
  }, [finCadeau]);
  // LE TIRAGE : parmi ceux qui comptent venir, moi compris si je l'ai dit.
  // Il attend que la feuille « Tu viens pour… » soit refermée.
  useEffect(() => (feuille ? retenirTirage(soiree.id) : undefined), [feuille, soiree.id]);
  useEffect(() => {
    if (!cadeau || cadeau.gagnants || feuille || !maintenant || maintenant < cadeau.tirageLe) return;
    tirer(soiree.id, [...(moi ? [{ nom: prenom || "Toi", moi: true }] : []), ...soiree.fantomes.map((f) => ({ nom: f.nom }))]);
  }, [cadeau, feuille, maintenant, moi, prenom, soiree]);
  const jaiGagne = !!cadeau?.gagnants?.some((g) => g.moi);
  const fermerTicket = () => {
    ticketVu(soiree.id);
    setVoirTicket(false);
  };
  const lancer = (o: { nombre: number; quoi: string; duree: number }) => {
    const c = lancerCadeau(soiree.id, o);
    ecrireDansSalon(cle, {
      qui: soiree.lieu,
      voix: "ami",
      texte: `🎁 ${c.nombre} ${c.nombre > 1 ? "consos offertes" : "conso offerte"} ce soir ! Tirage au sort parmi ceux qui comptent venir.`,
      quand: heureCourte(),
      cadeau: c.id,
    });
    setMaintenant(Date.now());
    setCoteBar(false);
    setOnglet("discussion");
  };

  return (
    <div className="dso" style={{ "--dso-accent": "#E8338A" } as React.CSSProperties}>
      {son && (
        <audio
          ref={audio}
          src={son}
          preload="auto"
          onPlay={() => {
            setJoue(true);
            setEcoute(true);
          }}
          onPause={() => setJoue(false)}
          onEnded={() => {
            setJoue(false);
            setAvance(0);
          }}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            setAvance(a.duration ? a.currentTime / a.duration : 0);
          }}
        />
      )}

      <header className="dso-tete">
        <h2>{soiree.lieu}</h2>
        <p className="dso-meta">
          {ville && (
            <span>
              <Ico n="lieu" /> {ville}
            </span>
          )}
          <span>
            <Ico n="heure" /> {soiree.heure ?? soiree.quand}
          </span>
          {soiree.prix && <b className="dso-prix">{/gratuit/i.test(soiree.prix) ? "Gratuit" : soiree.prix.replace(/^Entrée /i, "")}</b>}
        </p>
      </header>

      <nav className="dso-onglets" role="tablist" aria-label="La soirée">
        {(
          [
            ["ambiance", "L’ambiance"],
            ["qui", "Qui vient ?"],
            ["discussion", "Discussion"],
          ] as const
        ).map(([o, mot]) => (
          <button key={o} type="button" role="tab" aria-selected={onglet === o} className={onglet === o ? "on" : ""} onClick={() => setOnglet(o)}>
            {mot}
          </button>
        ))}
      </nav>

      {/* ═══ L'AMBIANCE ═══ */}
      {onglet === "ambiance" && (
        <section className="dso-corps" role="tabpanel">
          <div className="dso-photo">
            {soiree.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={soiree.photo} alt="" />
            )}
            {son && (
              <button type="button" className={`dso-son${joue ? " joue" : ""}`} onClick={basculerSon} aria-label={joue ? "Mettre l’extrait en pause" : "Écouter l’extrait"}>
                <i aria-hidden="true">{joue ? <Ico n="pause" /> : <Ico n="lecture" />}</i>
                <span>
                  {titreSon} · {duree} s
                </span>
                <s aria-hidden="true" style={{ transform: `scaleX(${avance})` }} />
              </button>
            )}
          </div>

          <div className="dso-infos">
            <p>
              <Ico n="agenda" />
              <b>{soiree.quand.replace(/, /, " · ")}</b>
            </p>
            {soiree.adresse &&
              (itineraire ? (
                <a href={itineraire} target="_blank" rel="noreferrer noopener">
                  <Ico n="lieu" />
                  <b>{soiree.adresse}</b>
                  <Ico n="chevron" />
                </a>
              ) : (
                <p>
                  <Ico n="lieu" />
                  <b>{soiree.adresse}</b>
                </p>
              ))}
            {soiree.prix && (
              <p>
                <Ico n="billet" />
                <b>{soiree.prix}</b>
              </p>
            )}
            <hr />
            <div className="dso-gens">
              <div className="dso-gens-l">
                {[
                  ...(moi ? [{ id: "moi", nom: "Moi", src: monFantome }] : []),
                  ...autres.slice(0, moi ? 2 : 3).map((f) => ({ id: f.id, nom: f.nom, src: fantomeDe(f.nom) })),
                ].map((g) => (
                  <span key={g.id} className="dso-g">
                    <Fantome src={g.src} />
                    <em>{g.nom}</em>
                  </span>
                ))}
              </div>
              <button type="button" className="dso-gens-n" onClick={() => setOnglet("qui")}>
                <span className="dso-pile" aria-hidden="true">
                  {autres.slice(moi ? 2 : 3, (moi ? 2 : 3) + 2).map((f) => (
                    <Fantome key={f.id} src={fantomeDe(f.nom)} petit />
                  ))}
                  {total > 5 && <s>+{total - 5}</s>}
                </span>
                <b>
                  {total} comptent venir <span aria-hidden="true">→</span>
                </b>
              </button>
            </div>
          </div>
          {demo && (
            <button type="button" className="cg-demo" onClick={() => setCoteBar(true)}>
              <i aria-hidden="true">🎁</i>
              <span>
                <b>Démo · côté bar</b>
                <em>{cadeau ? "Voir le tirage et valider les codes" : "Offrir des consos, tirées au sort parmi ceux qui viennent"}</em>
              </span>
              <s aria-hidden="true">›</s>
            </button>
          )}
        </section>
      )}

      {/* ═══ QUI VIENT ? ═══ */}
      {onglet === "qui" && (
        <section className="dso-corps" role="tabpanel">
          <h3 className="dso-h">{total} comptent venir</h3>
          {/* CE QUE CHERCHE LA SOIRÉE, EN UNE LIGNE : la musique avant les rencontres. */}
          <p className="dso-tendance">
            {intentionsDe(soiree)
              .slice(0, 4)
              .map((x) => (
                <span key={x.intention.cle}>
                  {x.intention.emoji} {x.combien}
                </span>
              ))}
          </p>
          {moi && (
            <Personne
              src={monFantome}
              nom={moi.visible ? `${prenom || "Toi"} · toi` : "Toi"}
              envies={moi.envies}
              mot={moi.mot}
              note={moi.visible ? undefined : "Seul ton compte est ajouté : personne ne voit tes envies."}
              onModifier={() => setFeuille(true)}
            />
          )}
          {autres.map((f) => (
            <Personne key={f.id} src={fantomeDe(f.nom)} nom={f.nom} envies={[f.intention]} mot={f.mot} />
          ))}
        </section>
      )}

      {/* ═══ DISCUSSION ═══ */}
      {onglet === "discussion" && (
        <Discussion
          cle={cle}
          messages={salon?.messages ?? []}
          prenom={prenom}
          monFantome={monFantome}
          fantomeDe={fantomeDe}
          moi={!!moi}
          annonce={(() => {
            if (heure === null) return null;
            const programme = (soiree.programme ?? []).filter((t) => !t.siEssaye || ecoute);
            const { maintenant, suivant, passes } = ouEnEstLaSoiree(programme, heure);
            if (maintenant) return { texte: `${maintenant.quoi} · ${maintenant.heure}`, emoji: maintenant.emoji, programme };
            if (suivant) return { texte: `À ${suivant.heure} · ${suivant.quoi}`, emoji: suivant.emoji, programme };
            if (passes.length) return { texte: mots.fini, emoji: "", programme };
            return null;
          })()}
          onModifier={() => setFeuille(true)}
          onEnsemble={onEnsemble}
          consos={{
            cadeau,
            maintenant,
            lieu: soiree.lieu,
            onVenir: compterVenir,
            onTicket: () => setVoirTicket(true),
            onCoteBar: demo ? () => setCoteBar(true) : undefined,
          }}
        />
      )}

      {onglet !== "discussion" && (
        <div className="dso-cta">
          {moi ? (
            <button type="button" className="dso-b deux" onClick={() => setFeuille(true)}>
              <Fantome src={monFantome} petit />
              Tu comptes venir · <u>Modifier</u>
            </button>
          ) : (
            <button type="button" className="dso-b" onClick={compterVenir}>
              <Ico n="gens" />
              Je compte venir
            </button>
          )}
        </div>
      )}

      {feuille && (
        <TuViensPour
          soireeId={soiree.id}
          cle={cle}
          initial={moi}
          prenom={prenom}
          onFermer={() => setFeuille(false)}
          onValide={() => {
            setFeuille(false);
            setOnglet("discussion");
          }}
        />
      )}

      {coteBar && (
        <CoteBar
          lieu={soiree.lieu}
          cadeau={cadeau}
          maintenant={maintenant}
          comptentVenir={total}
          onLancer={lancer}
          onValider={(code) => validerCode(soiree.id, code)}
          onNouvelle={() => {
            oublierCadeau(soiree.id);
            setVoirTicket(false);
          }}
          onFermer={() => setCoteBar(false)}
        />
      )}
      {cadeau && jaiGagne && (voirTicket || !cadeau.vu) && !coteBar && (
        <EcranGagne
          cadeau={cadeau}
          maintenant={maintenant}
          lieu={soiree.lieu}
          monFantome={monFantome}
          prenom={prenom}
          onFermer={fermerTicket}
          onValiderDemo={
            demo
              ? () => {
                  const g = cadeau.gagnants?.find((x) => x.moi);
                  if (g) validerCode(soiree.id, g.code);
                }
              : undefined
          }
        />
      )}

      <Styles />
      <StylesConsos />
    </div>
  );
}

function minuscule(t: string) {
  return t.charAt(0) + t.slice(1).toLowerCase();
}

/** Un fantôme en médaillon : la tête et le haut du corps, jamais étiré. */
function Fantome({ src, petit }: { src: string; petit?: boolean }) {
  return (
    <span className={`dso-av${petit ? " petit" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
    </span>
  );
}

function Personne({
  src,
  nom,
  envies,
  mot,
  note,
  onModifier,
}: {
  src: string;
  nom: string;
  envies: string[];
  mot?: string;
  note?: string;
  onModifier?: () => void;
}) {
  const liste = envies.map(intentionDe).filter(Boolean) as NonNullable<ReturnType<typeof intentionDe>>[];
  return (
    <article className={`dso-p${onModifier ? " moi" : ""}`}>
      <span className="dso-p-f">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
      </span>
      <span className="dso-p-t">
        <b>{nom}</b>
        {liste.length > 0 && (
          <em>
            {liste.map((i, k) => (
              <span key={i.cle}>
                {k > 0 && " · "}
                {k === 0 && <i aria-hidden="true">{i.emoji} </i>}
                {i.mot}
              </span>
            ))}
          </em>
        )}
        {mot && <q>{mot}</q>}
        {note && <small>{note}</small>}
        {onModifier && (
          <button type="button" onClick={onModifier}>
            Modifier
          </button>
        )}
      </span>
    </article>
  );
}

/* ═══ LA DISCUSSION — le salon public de la soirée ═══ */
function Discussion({
  cle,
  messages,
  prenom,
  monFantome,
  fantomeDe,
  moi,
  annonce,
  onModifier,
  onEnsemble,
  consos,
}: {
  cle: string;
  messages: { id: string; qui: string; voix: string; texte: string; quand: string; photo?: string; cadeau?: string }[];
  prenom: string;
  monFantome: string;
  fantomeDe: (nom: string) => string;
  moi: boolean;
  annonce: { texte: string; emoji: string; programme: { heure: string; emoji: string; quoi: string }[] } | null;
  onModifier: () => void;
  onEnsemble?: (cle: string) => void;
  consos: {
    cadeau?: Cadeau;
    maintenant: number;
    lieu: string;
    onVenir: () => void;
    onTicket: () => void;
    /** Démonstration seulement : ouvrir le geste du bar. */
    onCoteBar?: () => void;
  };
}) {
  const [texte, setTexte] = useState("");
  const [nom, setNom] = useState("");
  const [programme, setProgramme] = useState(false);
  const fin = useRef<HTMLDivElement | null>(null);
  const premier = useRef(true);
  useEffect(() => {
    // LE CONTENEUR QUI DÉFILE (la feuille), JAMAIS LA PAGE : on l'amène en bas.
    let n = fin.current?.parentElement ?? null;
    while (n && !(n.scrollHeight > n.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(n).overflowY))) n = n.parentElement;
    if (n) n.scrollTo({ top: n.scrollHeight, behavior: premier.current ? "auto" : "smooth" });
    else fin.current?.scrollIntoView({ block: "end" });
    premier.current = false;
  }, [messages.length]);

  const ecrire = (m: { texte: string; photo?: string }) => {
    if (!prenom) return;
    entrerDansSalon(cle, prenom, false);
    ecrireDansSalon(cle, { qui: prenom, voix: "moi", texte: m.texte, quand: heureCourte(), ...(m.photo ? { photo: m.photo } : {}) });
  };

  return (
    <section className="dso-corps dso-disc" role="tabpanel">
      {consos.cadeau && consos.maintenant > 0 && <TicketEpingle cadeau={consos.cadeau} maintenant={consos.maintenant} onOuvrir={consos.onTicket} />}
      {consos.onCoteBar && (
        <button type="button" className="cg-pastille" onClick={consos.onCoteBar}>
          🎁 Démo · côté bar <span aria-hidden="true">›</span>
        </button>
      )}
      {moi && (
        <button type="button" className="dso-moi" onClick={onModifier}>
          <Fantome src={monFantome} petit />
          Tu comptes venir · <u>Modifier</u>
        </button>
      )}
      {annonce && (
        <div className="dso-annonce">
          <button type="button" onClick={() => setProgramme((v) => !v)} aria-expanded={programme}>
            <Ico n="porte-voix" />
            <b>{annonce.texte}</b>
            <Ico n={programme ? "haut" : "bas"} />
          </button>
          {programme && (
            <ul>
              {annonce.programme.map((t) => (
                <li key={`${t.heure}${t.quoi}`}>
                  <i aria-hidden="true">{t.emoji}</i> <b>{t.heure}</b> {t.quoi}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {onEnsemble && (
        <button type="button" className="dso-ens" onClick={() => onEnsemble(cle)}>
          Aussi dans Ensemble, en salon public <span aria-hidden="true">↗</span>
        </button>
      )}
      <div className="dso-fil">
        {messages.map((m) =>
          m.cadeau ? (
            <CarteCadeau
              key={m.id}
              cadeau={consos.cadeau?.id === m.cadeau ? consos.cadeau : undefined}
              maintenant={consos.maintenant}
              lieu={consos.lieu}
              fantomeDe={fantomeDe}
              monFantome={monFantome}
              jeViens={moi}
              onVenir={consos.onVenir}
              onTicket={consos.onTicket}
            />
          ) : m.voix === "systeme" ? (
            <p key={m.id} className="dso-sys">
              {m.texte}
            </p>
          ) : m.voix === "moi" || (prenom && m.qui === prenom) ? (
            <div key={m.id} className="dso-m moi">
              <span className="dso-m-c">
                <b>Toi</b>
                {m.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt="" />
                )}
                {m.texte && <span className="dso-bulle">{m.texte}</span>}
                <i>{m.quand}</i>
              </span>
              <Fantome src={monFantome} />
            </div>
          ) : (
            <div key={m.id} className="dso-m">
              <Fantome src={fantomeDe(m.qui)} />
              <span className="dso-m-c">
                <b>{m.qui}</b>
                {m.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt="" />
                )}
                {m.texte && <span className="dso-bulle">{m.texte}</span>}
                <i>{m.quand}</i>
              </span>
            </div>
          ),
        )}
        <div ref={fin} className="dso-fin" />
      </div>
      <div className="dso-ecrire">
        {prenom ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = texte.trim();
              if (!t) return;
              ecrire({ texte: t });
              setTexte("");
            }}
          >
            <label className="dso-rond" aria-label="Envoyer une photo">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    ecrire({ texte: "", photo: await reduirePhoto(f, 1200) });
                  } catch {
                    /* image illisible */
                  }
                }}
              />
              <Ico n="photo" />
            </label>
            <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={300} placeholder="Écrire un message…" aria-label="Ton message" />
            <button type="submit" className="dso-rond plein" disabled={!texte.trim()} aria-label="Envoyer">
              <Ico n="envoyer" />
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nom.trim()) direSonPrenom(nom.trim());
            }}
          >
            <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={24} placeholder="Ton prénom, pour écrire ici" aria-label="Ton prénom" />
            <button type="submit" className="dso-rond plein" disabled={!nom.trim()} aria-label="Valider mon prénom">
              <Ico n="envoyer" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ═══ « TU VIENS POUR… » ═══ */
function TuViensPour({
  soireeId,
  cle,
  initial,
  prenom,
  onFermer,
  onValide,
}: {
  soireeId: string;
  cle: string;
  initial?: { envies: string[]; mot: string; visible: boolean };
  prenom: string;
  onFermer: () => void;
  onValide: () => void;
}) {
  const [choix, setChoix] = useState<string[]>(initial?.envies ?? []);
  const [mot, setMot] = useState(initial?.mot ?? "");
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [nom, setNom] = useState("");
  const [trop, setTrop] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onFermer]);

  const qui = prenom || nom.trim();
  const pret = choix.length > 0 && !!qui;

  const valider = () => {
    if (!pret) return;
    if (!prenom) direSonPrenom(qui);
    poserEnvies(soireeId, { envies: choix, mot: mot.trim(), visible, at: Date.now() });
    const s = chargerSalons()[cle];
    if (s) {
      if (visible) {
        // SE MONTRER, C'EST ÊTRE DANS LE SALON PUBLIC DE LA SOIRÉE : compté parmi ceux qui viennent, et dit au groupe une fois.
        const deja = s.viennent.includes(qui);
        entrerDansSalon(cle, qui, true);
        if (!deja) ecrireDansSalon(cle, { qui, voix: "systeme", texte: `✓ ${qui} compte venir`, quand: heureCourte() });
      } else if (s.viennent.includes(qui)) {
        // REDEVENIR DISCRET : on sort de la liste publique de ceux qui viennent.
        basculerVenue(cle, qui);
      }
    }
    onValide();
  };

  const retirer = () => {
    poserEnvies(soireeId, null);
    const s = chargerSalons()[cle];
    if (s && qui && s.viennent.includes(qui)) basculerVenue(cle, qui);
    onFermer();
  };

  return (
    <div className="dso-f" role="dialog" aria-modal="true" aria-labelledby="dso-f-t">
      <button type="button" className="dso-f-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="dso-f-p">
        <i className="dso-f-poignee" aria-hidden="true" />
        <button type="button" className="dso-f-x" aria-label="Fermer" onClick={onFermer}>
          <Ico n="croix" />
        </button>
        <h3 id="dso-f-t">Tu viens pour…</h3>
        <p className="dso-f-s">{trop ? "Deux envies au plus : retire-en une d’abord." : "Choisis jusqu’à 2 envies"}</p>
        <div className="dso-envies">
          {INTENTIONS.map((i) => {
            const on = choix.includes(i.cle);
            return (
              <button
                key={i.cle}
                type="button"
                aria-pressed={on}
                className={on ? "on" : ""}
                onClick={() => {
                  if (on) {
                    setChoix((c) => c.filter((x) => x !== i.cle));
                    setTrop(false);
                  } else if (choix.length >= 2) setTrop(true);
                  else setChoix((c) => [...c, i.cle]);
                }}
              >
                <i aria-hidden="true">{i.emoji}</i>
                <span>{i.mot}</span>
                <s aria-hidden="true">{on && <Ico n="coche" />}</s>
              </button>
            );
          })}
        </div>
        {!prenom && (
          <label className="dso-champ">
            <Ico n="gens" />
            <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={24} placeholder="Ton prénom" aria-label="Ton prénom" />
          </label>
        )}
        <label className="dso-champ">
          <Ico n="crayon" />
          <input value={mot} onChange={(e) => setMot(e.target.value)} maxLength={120} placeholder="Un petit mot ? (facultatif)" aria-label="Un petit mot" />
        </label>
        <button type="button" className="dso-vis" role="switch" aria-checked={visible} onClick={() => setVisible((v) => !v)}>
          <span>
            <b>Rendre mon intention visible</b>
            <small>{visible ? "Ton fantôme, tes envies et ton mot seront publics." : "Personne ne verra tes envies : seul le compte augmente."}</small>
          </span>
          <i className={visible ? "on" : ""} aria-hidden="true" />
        </button>
        <button type="button" className="dso-b" disabled={!pret} onClick={valider}>
          Valider
        </button>
        <p className="dso-f-n">Tu pourras modifier ou retirer ton intention.</p>
        {initial && (
          <button type="button" className="dso-retirer" onClick={retirer}>
            Retirer mon intention
          </button>
        )}
      </div>
    </div>
  );
}

/** Des pictos au trait : ils prennent la couleur du texte et restent les mêmes partout. */
function Ico({ n }: { n: string }) {
  const d: Record<string, React.ReactNode> = {
    lieu: <path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11Zm0-8.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />,
    heure: (
      <>
        <circle cx="12" cy="12" r="8.6" />
        <path d="M12 7.4V12l3.2 2" />
      </>
    ),
    agenda: (
      <>
        <rect x="3.6" y="5" width="16.8" height="15.4" rx="2.6" />
        <path d="M3.6 9.8h16.8M8 3v4M16 3v4M7.8 13.6h5.4M7.8 16.8h8.4" />
      </>
    ),
    billet: <path d="M3.8 8.6V6.4h16.4v2.2a2.4 2.4 0 0 0 0 4.8v2.2H3.8v-2.2a2.4 2.4 0 0 0 0-4.8ZM14.6 6.6v10.8" />,
    chevron: <path d="m9.5 6 6 6-6 6" />,
    haut: <path d="m6 15 6-6 6 6" />,
    bas: <path d="m6 9 6 6 6-6" />,
    lecture: <path d="M8 5.6v12.8L18.4 12 8 5.6Z" fill="currentColor" />,
    pause: <path d="M8 5.6v12.8M16 5.6v12.8" />,
    gens: (
      <>
        <circle cx="9" cy="8.4" r="3.2" />
        <path d="M3.4 19.6c.5-3.4 2.7-5.4 5.6-5.4s5.1 2 5.6 5.4M15.6 5.4a3 3 0 1 1 0 6M17.4 14.4c2 .5 3.1 2.3 3.4 5.2" />
      </>
    ),
    croix: <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />,
    coche: <path d="m5.5 12.4 4.2 4.2 8.8-9" />,
    crayon: <path d="m4.4 19.6 1-4.2L15.6 5.2a2.1 2.1 0 0 1 3 3L8.4 18.4l-4 1.2Z" />,
    "porte-voix": <path d="M4 10.2v3.6h3l7.4 4.2V6L7 10.2H4ZM17.6 9.2a4 4 0 0 1 0 5.6M7.6 14l1.2 4.4" />,
    photo: (
      <>
        <rect x="3.6" y="5" width="16.8" height="14" rx="2.6" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="m4.4 17.4 5-4.6 3.6 3.2 2.6-2.2 4 3.4" />
      </>
    ),
    envoyer: <path d="M12 19V5.6M6.4 11 12 5.4l5.6 5.6" />,
  };
  return (
    <svg className="dso-ic" viewBox="0 0 24 24" aria-hidden="true">
      {d[n]}
    </svg>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.dso{--dso-fond:#231a15;position:static;color:#FFF4EA;font-family:var(--font-clikme),system-ui,sans-serif;padding-bottom:4px;}
.dso-ic{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
.dso-tete{padding:4px 40px 18px 2px;}
.dso-tete h2{margin:0;font-size:clamp(26px,7.4vw,32px);line-height:1.05;font-weight:850;letter-spacing:-.02em;color:#FFF6EE;}
.dso-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:8px 0 0;font-size:14.5px;font-weight:600;color:#F2E0D2;}
.dso-meta span{display:inline-flex;align-items:center;gap:5px;}
.dso-meta .dso-ic{width:18px;height:18px;color:#F6B54B;}
.dso-prix{padding:3px 11px;border-radius:999px;background:var(--dso-accent);color:#fff;font-size:13px;}

.dso-onglets{position:sticky;top:-2px;z-index:3;display:flex;gap:6px;margin:0 -2px 12px;padding:6px;border-radius:999px;
  background:rgba(43,26,18,.96);border:1px solid rgba(255,220,200,.12);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
.dso-onglets::before{content:"";position:absolute;left:-18px;right:-18px;bottom:100%;height:18px;background:var(--dso-fond);}
.dso-onglets button{flex:1;min-height:40px;border:0;border-radius:999px;background:none;color:#E9D3C6;font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
.dso-onglets button.on{color:#fff;background:linear-gradient(180deg,#F0418F,#C9216E);box-shadow:0 4px 14px rgba(232,51,138,.35);}

.dso-corps{display:flex;flex-direction:column;gap:12px;}
.dso-photo{position:relative;margin:0 -2px;border-radius:20px;overflow:hidden;aspect-ratio:16/10.5;background:#1a0f0a;}
.dso-photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 30%;}
.dso-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(20,10,6,.55));pointer-events:none;}
.dso-son{position:absolute;left:12px;bottom:12px;z-index:1;display:inline-flex;align-items:center;gap:10px;max-width:calc(100% - 24px);overflow:hidden;
  padding:8px 16px 8px 9px;border-radius:999px;cursor:pointer;color:#fff;font:inherit;font-size:14px;font-weight:700;
  background:rgba(18,9,5,.62);border:1.5px solid rgba(255,255,255,.8);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
.dso-son i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#fff;color:#1a0f0a;}
.dso-son i .dso-ic{width:16px;height:16px;}
.dso-son span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dso-son s{position:absolute;left:0;bottom:0;height:3px;width:100%;transform-origin:0 50%;background:var(--dso-accent);transition:transform .25s linear;}
.dso-son.joue{border-color:var(--dso-accent);}

.dso-infos{display:flex;flex-direction:column;gap:2px;padding:10px 14px 10px;border-radius:20px;background:rgba(255,236,224,.05);border:1px solid rgba(255,220,200,.12);}
.dso-infos p,.dso-infos a{display:flex;align-items:center;gap:12px;margin:0;padding:4px 2px;color:#FFF4EA;text-decoration:none;font-size:16.5px;}
.dso-infos p>.dso-ic,.dso-infos a>.dso-ic:first-child{width:24px;height:24px;color:var(--dso-accent);}
.dso-infos a b{flex:1;}
.dso-infos a>.dso-ic:last-child{color:#E9D3C6;}
.dso-infos hr{width:100%;margin:6px 0 8px;border:0;border-top:1px solid rgba(255,220,200,.12);}
.dso-gens{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;}
.dso-gens-l{display:flex;gap:6px;min-width:0;}
.dso-g{display:flex;flex-direction:column;align-items:center;gap:4px;width:58px;}
.dso-g em{max-width:100%;font-style:normal;font-size:12px;font-weight:600;color:#F2E0D2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dso-av{position:relative;display:block;flex:none;width:52px;height:52px;overflow:hidden;border-radius:50%;
  background:radial-gradient(circle at 50% 30%,#6b3d2c,#2e1a12 75%);border:1.5px solid rgba(255,220,200,.25);}
.dso-av img{position:absolute;left:50%;top:6%;width:132%;height:auto;max-width:none;transform:translateX(-50%);}
.dso-av.petit{width:30px;height:30px;}
.dso-gens-n{display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding:0;border:0;background:none;color:#FFF4EA;font:inherit;cursor:pointer;}
.dso-pile{display:flex;align-items:center;}
.dso-pile .dso-av+.dso-av,.dso-pile s{margin-left:-8px;}
.dso-pile s{display:grid;place-items:center;height:30px;min-width:30px;padding:0 6px;border-radius:999px;text-decoration:none;font-size:12px;font-weight:800;background:#7a1f4a;border:1.5px solid rgba(255,220,200,.3);}
.dso-gens-n b{font-size:13.5px;font-weight:700;text-align:right;line-height:1.25;}

.dso-h{margin:2px 0 0;font-size:24px;font-weight:850;color:#FFF6EE;}
.dso-tendance{display:flex;flex-wrap:wrap;gap:6px;margin:-4px 0 2px;}
.dso-tendance span{padding:4px 10px;border-radius:999px;font-size:13px;font-weight:700;color:#FFE2EE;background:rgba(232,51,138,.14);border:1px solid rgba(232,51,138,.35);}
.dso-p{display:flex;gap:12px;padding:10px;border-radius:18px;background:rgba(255,236,224,.05);border:1px solid rgba(255,220,200,.12);}
.dso-p.moi{border-color:rgba(232,51,138,.55);background:rgba(232,51,138,.08);}
.dso-p-f{flex:none;position:relative;width:84px;height:84px;overflow:hidden;border-radius:14px;background:radial-gradient(circle at 50% 30%,#6b3d2c,#2e1a12 80%);}
.dso-p-f img{position:absolute;left:50%;top:4%;width:118%;height:auto;max-width:none;transform:translateX(-50%);}
.dso-p-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.dso-p-t b{font-size:18px;font-weight:800;color:#FFF6EE;}
.dso-p-t em{font-style:normal;font-size:14px;font-weight:700;color:#F57AB0;}
.dso-p-t q{font-size:14.5px;line-height:1.35;color:#F2E0D2;quotes:none;}
.dso-p-t small{font-size:12.5px;color:#CDB4A6;}
.dso-p-t button{align-self:flex-start;margin-top:2px;padding:0;border:0;background:none;color:#F57AB0;font:inherit;font-size:13.5px;font-weight:700;text-decoration:underline;cursor:pointer;}

.dso-cta{position:sticky;bottom:0;z-index:2;margin:12px -2px 0;padding:10px 0 4px;background:linear-gradient(180deg,rgba(35,26,21,0),var(--dso-fond) 30%);}
.dso-b{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;border:0;border-radius:999px;cursor:pointer;
  color:#fff;font:inherit;font-size:18px;font-weight:800;background:linear-gradient(180deg,#F0418F,#C9216E);box-shadow:0 8px 22px rgba(232,51,138,.35);}
.dso-b .dso-ic{width:24px;height:24px;}
.dso-b:disabled{opacity:.45;cursor:default;box-shadow:none;}
.dso-b.deux{font-size:16px;font-weight:700;color:#FFE2EE;background:rgba(232,51,138,.12);border:1.5px solid rgba(232,51,138,.6);box-shadow:none;}
.dso-b.deux u{color:#F57AB0;}

.dso-disc{gap:10px;}
.dso-moi{display:flex;align-items:center;gap:10px;padding:4px 2px;border:0;background:none;color:#F2E0D2;font:inherit;font-size:15px;cursor:pointer;text-align:left;}
.dso-moi u{color:#F57AB0;font-weight:700;text-decoration:none;}
.dso-annonce{border-radius:16px;background:rgba(122,31,74,.4);border:1px solid rgba(232,51,138,.45);}
.dso-annonce>button{display:flex;align-items:center;gap:10px;width:100%;padding:11px 14px;border:0;background:none;color:#FFE2EE;font:inherit;font-size:15px;text-align:left;cursor:pointer;}
.dso-annonce>button b{flex:1;font-weight:700;}
.dso-annonce>button .dso-ic:first-child{color:#F57AB0;}
.dso-annonce ul{margin:0;padding:0 14px 12px 44px;list-style:none;display:flex;flex-direction:column;gap:5px;font-size:14px;color:#F2E0D2;}
.dso-ens{align-self:flex-start;padding:0;border:0;background:none;color:#F6B54B;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;}
.dso-fil{display:flex;flex-direction:column;gap:12px;padding:4px 0;}
.dso-fin{scroll-margin-bottom:96px;}
.dso-sys{align-self:center;margin:0;padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:700;color:#E9D3C6;background:rgba(255,236,224,.06);}
.dso-m{display:flex;align-items:flex-start;gap:10px;max-width:92%;}
.dso-m .dso-av{width:44px;height:44px;}
.dso-m-c{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;}
.dso-m-c b{font-size:14px;font-weight:700;color:#F2E0D2;}
.dso-bulle{padding:9px 14px;border-radius:18px 18px 18px 6px;font-size:15.5px;line-height:1.35;color:#FFF4EA;background:rgba(255,236,224,.08);}
.dso-m-c img{display:block;max-width:220px;width:100%;border-radius:14px;}
.dso-m-c i{font-style:normal;font-size:11.5px;color:#BFA597;}
.dso-m.moi{align-self:flex-end;}
.dso-m.moi .dso-m-c{align-items:flex-end;}
.dso-m.moi .dso-bulle{border-radius:18px 18px 6px 18px;color:#2a0d1b;font-weight:600;background:linear-gradient(180deg,#F49BC2,#EC74A9);}
.dso-ecrire{position:sticky;bottom:0;z-index:2;margin:4px -2px 0;padding:8px 0 4px;background:linear-gradient(180deg,rgba(35,26,21,0),var(--dso-fond) 26%);}
.dso-ecrire form{display:flex;align-items:center;gap:8px;}
.dso-ecrire input:not([type=file]){flex:1;min-width:0;height:48px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,220,200,.18);
  background:rgba(255,236,224,.06);color:#FFF4EA;font:inherit;font-size:15.5px;}
.dso-ecrire input::placeholder{color:#BFA597;}
.dso-rond{flex:none;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;cursor:pointer;color:#F57AB0;
  background:rgba(255,236,224,.06);border:1px solid rgba(255,220,200,.18);}
.dso-rond input{display:none;}
.dso-rond.plein{border:0;color:#fff;background:linear-gradient(180deg,#F0418F,#C9216E);}
.dso-rond:disabled{opacity:.4;cursor:default;}

.dso-f{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;}
.dso-f-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(14,6,3,.55);cursor:pointer;}
.dso-f-p{position:relative;max-height:94%;overflow-y:auto;overscroll-behavior:contain;padding:12px 16px calc(14px + env(safe-area-inset-bottom,0px));
  border-radius:28px 28px 0 0;background:linear-gradient(180deg,#3a2216,#2a1810);border:1px solid rgba(255,220,200,.14);border-bottom:0;
  box-shadow:0 -14px 40px rgba(0,0,0,.5);animation:dso-monte .3s cubic-bezier(.2,.8,.3,1) both;}
@keyframes dso-monte{from{transform:translateY(40px);opacity:.4;}to{transform:none;opacity:1;}}
.dso-f-poignee{display:block;width:42px;height:4px;margin:0 auto 8px;border-radius:4px;background:rgba(255,236,224,.35);}
.dso-f-x{position:absolute;top:12px;right:12px;display:grid;place-items:center;width:38px;height:38px;padding:0;border-radius:50%;cursor:pointer;
  color:#FFF4EA;background:rgba(255,236,224,.1);border:0;}
.dso-f-p h3{margin:2px 0 0;text-align:center;font-size:24px;font-weight:850;color:#FFF6EE;}
.dso-f-s{margin:2px 0 10px;text-align:center;font-size:15px;color:#E9D3C6;}
.dso-envies{display:flex;flex-direction:column;gap:6px;}
.dso-envies button{display:flex;align-items:center;gap:12px;min-height:44px;padding:4px 10px 4px 14px;border-radius:14px;cursor:pointer;text-align:left;
  color:#FFF4EA;font:inherit;font-size:15.5px;font-weight:700;background:rgba(255,236,224,.05);border:1px solid rgba(255,220,200,.14);}
.dso-envies button i{font-style:normal;font-size:22px;width:28px;text-align:center;}
.dso-envies button span{flex:1;}
.dso-envies button s{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;border:2px solid rgba(255,236,224,.5);text-decoration:none;}
.dso-envies button.on{background:rgba(122,31,74,.55);border-color:#E8338A;}
.dso-envies button.on s{background:#E8338A;border-color:#E8338A;color:#fff;}
.dso-envies button.on s .dso-ic{width:18px;height:18px;stroke-width:2.6;}
.dso-champ{display:flex;align-items:center;gap:10px;margin-top:8px;padding:0 14px;min-height:46px;border-radius:16px;
  background:rgba(255,236,224,.05);border:1px solid rgba(255,220,200,.14);color:#E9D3C6;}
.dso-champ input{flex:1;min-width:0;border:0;background:none;color:#FFF4EA;font:inherit;font-size:15.5px;outline:none;}
.dso-champ input::placeholder{color:#BFA597;}
.dso-vis{display:flex;align-items:center;gap:12px;width:100%;margin:10px 0;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.dso-vis span{flex:1;display:flex;flex-direction:column;gap:2px;}
.dso-vis b{font-size:16px;font-weight:700;color:#FFF6EE;}
.dso-vis small{font-size:13px;color:#D9C2B4;}
.dso-vis i{flex:none;position:relative;width:56px;height:32px;border-radius:999px;background:rgba(255,236,224,.18);transition:background .2s;}
.dso-vis i::after{content:"";position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;transition:transform .2s;}
.dso-vis i.on{background:#E8338A;}
.dso-vis i.on::after{transform:translateX(24px);}
.dso-f-n{margin:8px 0 0;text-align:center;font-size:13px;color:#D9C2B4;}
.dso-retirer{display:block;margin:6px auto 0;padding:6px;border:0;background:none;color:#F57AB0;font:inherit;font-size:13.5px;font-weight:700;text-decoration:underline;cursor:pointer;}
@media (max-height:640px){
  .dso-photo{aspect-ratio:16/10;}
  .dso-envies button{min-height:40px;}
  .dso-f-p h3{font-size:22px;}
}
@media (prefers-reduced-motion: reduce){.dso-f-p{animation:none;}.dso-son s{transition:none;}}
`,
      }}
    />
  );
}
