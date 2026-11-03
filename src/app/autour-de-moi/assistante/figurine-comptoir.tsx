"use client";

/**
 * 🪀 MA FIGURINE, À PARTIR D'UN SELFIE — au comptoir : « Ma figurine du mois » (l'accueil et Ma boutique, `MaFigurine`)
 * et depuis le Studio (`studio-comptoir.tsx`, `FabriquerFigurine`).
 *
 * Un selfie, son accord coché par lui, et le moteur d'image fabrique sa figurine (une minute environ — voir
 * `lib/direct/figurine-pro.ts` et la route `/api/site-internet/pro/figurine`). Il la voit sur son ressort et son socle,
 * comme dans ses vidéos, et dit « C'est moi ! » — ou refait (trois essais par jour). Rien ne passe dans une vidéo avant
 * son « C'est moi ».
 *
 * 🍂 SA FIGURINE DU MOIS : la même, habillée pour l'édition du moment (l'Automne, Noël… — `collection.ts`). Ses clients
 * la gagnent en venant pendant l'édition ; elle est aussi dans ses vidéos. Elle se fait à partir de sa figurine
 * validée, en un geste : le visage ne change pas, seule la tenue change.
 *
 * 🗂 SA COLLECTION : chaque figurine qu'il valide reste (`etat.collection`), avec son histoire — créée quand, à quoi
 * elle sert pendant son édition, et après (`histoireDeLaFigurine`). Il la remet dans un petit film quand il veut.
 */
import { useEffect, useRef, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { SELFIE_MAX_PX, figurineDuMoment, figurineEntiere, histoireDeLaFigurine, moisEnMots, type EtatFigurinePro, type FigurineDeCollection } from "@/lib/direct/figurine-pro";
import { editionsDuMoment } from "@/lib/direct/collection";
import { jourParis } from "@/lib/jour-paris";

type Reponse = { ok?: boolean; etat?: EtatFigurinePro; error?: string };

async function demander(c: CommerceComptoir, corps: Record<string, unknown>): Promise<Reponse> {
  if (!c.reel) return { error: "Ta figurine se fabrique avec ton lien pro." };
  try {
    const r = await fetch("/api/site-internet/pro/figurine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: c.reel.slug, token: c.reel.token, ...corps }),
    });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    return r.ok ? j : { ...j, error: j.error ?? "La fabrication n'a pas pu se faire. Réessaie." };
  } catch {
    return { error: "Pas de réseau : réessaie dans un instant." };
  }
}

/** Où en est sa figurine (et sa collection) — pour le Studio aussi. `null` sans lien pro ou sans réseau. */
export async function lireMaFigurine(c: CommerceComptoir): Promise<EtatFigurinePro | null> {
  if (!c.reel) return null;
  return (await demander(c, { action: "etat" })).etat ?? null;
}

/** Son selfie, réduit par le téléphone (1 024 px au plus) : il part léger, et le sens de la photo est déjà le bon. */
async function reduireSelfie(f: File): Promise<string> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("Cette photo ne s'ouvre pas."));
      i.src = url;
    });
    const k = Math.min(1, SELFIE_MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Le ressort de l'aperçu : des demi-ellipses, l'arrière sombre et l'avant en acier (comme dans ses vidéos). */
function Ressort() {
  const spires = Array.from({ length: 9 }, (_, k) => 6 + k * 7.4);
  return (
    <svg className="fg-ressort" viewBox="0 0 60 76" aria-hidden="true">
      <defs>
        <linearGradient id="fg-acier" x1="0" x2="1">
          <stop offset="0" stopColor="#2d2930" />
          <stop offset=".46" stopColor="#f4f0f6" />
          <stop offset="1" stopColor="#36313b" />
        </linearGradient>
      </defs>
      {spires.map((y) => (
        <g key={y}>
          <path d={`M 10 ${y} A 20 4.5 0 0 1 50 ${y}`} fill="none" stroke="#3b3540" strokeWidth="3" strokeLinecap="round" />
          <path d={`M 10 ${y} A 20 4.5 0 0 0 50 ${y}`} fill="none" stroke="url(#fg-acier)" strokeWidth="4.2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/** Sa figurine telle qu'elle sera dans ses vidéos : son buste, le ressort, le socle commun. Elle rebondit doucement. */
export function ApercuFigurine({ src, petit, mini, geant }: { src: string; petit?: boolean; mini?: boolean; geant?: boolean }) {
  const classe = `fg-apercu${petit ? " petit" : ""}${mini ? " mini" : ""}${geant ? " geant" : ""}`;
  // LA FIGURINE ENTIÈRE (son ressort et son socle, fabriqués avec elle) : telle quelle, qui se balance doucement
  if (figurineEntiere(src))
    return (
      <div className={classe}>
        <style>{STYLES_APERCU}</style>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fg-entiere" src={src} alt="Ta figurine" />
      </div>
    );
  return (
    <div className={classe}>
      {/* SES STYLES AVEC LUI : l'aperçu sert aussi hors de cet écran (le choix « avec ou sans » du Studio) */}
      <style>{STYLES_APERCU}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fg-buste" src={src} alt="Ta figurine" />
      <Ressort />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fg-socle" src="/studio/socle.webp" alt="" />
    </div>
  );
}

/**
 * 🔍 VOIR EN GRAND — « je peux pas agrandir la figurine, donc j'ai fait une capture d'écran et la qualité n'est pas
 * bonne ». Sa figurine ENTIÈRE (sur son ressort et son socle : c'est ce qui en fait une figurine — le buste seul, en
 * grand, avait l'air d'une caricature peinte), à la taille de l'écran, pour la juger avant de dire « C'est moi » ; et
 * l'image seule, à ouvrir pour zoomer avec les doigts.
 */
export function VoirEnGrand({ src, voie }: { src: string; voie?: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <style>{STYLES_GRAND}</style>
      <button type="button" className="fg-loupe" onClick={() => setOuvert(true)}>
        🔍 Voir en grand
      </button>
      {ouvert && (
        <div className="fg-grand" role="dialog" aria-modal="true" aria-label="Ta figurine en grand" onClick={() => setOuvert(false)}>
          <ApercuFigurine src={src} geant />
          {voie && <small className="fg-grand-voie">par {voie}</small>}
          <div className="fg-grand-b" onClick={(e) => e.stopPropagation()}>
            <a href={src} target="_blank" rel="noopener noreferrer">
              Ouvrir l’image seule
            </a>
            <button type="button" onClick={() => setOuvert(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const STYLES_GRAND = `
.fg-loupe{border:1px solid var(--trait);border-radius:999px;padding:7px 14px;background:var(--nappe);color:var(--creme);font-size:13.5px;font-weight:700;}
.fg-grand{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));background:radial-gradient(70% 55% at 50% 50%,#FFF3F5,#F8DCE2 55%,#EEC2CC);}
.fg-grand-b{display:flex;gap:10px;}
.fg-grand-voie{font-size:13px;font-weight:700;color:#7A3B55;}
.fg-grand-b a,.fg-grand-b button{border:0;border-radius:999px;padding:11px 18px;background:#21160F;color:#FFF4E6;font-size:14.5px;font-weight:800;text-decoration:none;}
`;

/**
 * LES PROPOSITIONS D'UN ESSAI (deux, une par voie — `propositions` côté serveur) : il touche celle qui lui ressemble,
 * la regarde en grand, et c'est elle que « C'est moi » valide. Une seule : elle, en grand, comme avant.
 */
function ChoixPropositions({ urls, voies = [], choix, onChoix }: { urls: string[]; voies?: string[]; choix: number; onChoix: (k: number) => void }) {
  if (urls.length <= 1)
    return urls[0] ? (
      <>
        <ApercuFigurine src={urls[0]} />
        <VoirEnGrand src={urls[0]} />
      </>
    ) : null;
  return (
    <div className="fg-choix" role="radiogroup" aria-label="Les propositions">
      {urls.map((u, k) => (
        <div key={u} className={`fg-choix-p${k === choix ? " on" : ""}`}>
          <button type="button" role="radio" aria-checked={k === choix} onClick={() => onChoix(k)}>
            <ApercuFigurine src={u} petit />
            <b>{k === choix ? "✓ Celle-ci" : `Proposition ${k + 1}`}</b>
            {voies[k] && <small>par {voies[k]}</small>}
          </button>
          <VoirEnGrand src={u} voie={voies[k]} />
        </div>
      ))}
    </div>
  );
}

export function FabriquerFigurine({
  commerce,
  onPrete,
  onRetour,
}: {
  commerce: CommerceComptoir;
  /** « C'est moi ! » : sa figurine validée. */
  onPrete: (url: string) => void;
  onRetour: () => void;
}) {
  const [etat, setEtat] = useState<EtatFigurinePro | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [accord, setAccord] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [secondes, setSecondes] = useState(0);
  /** La proposition qu'il a touchée (la première d'office). */
  const [choix, setChoix] = useState(0);
  const prendrePhoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // sans lien pro (la visite du comptoir), rien à demander : l'écran le dit dès le début (`visite`)
    if (!commerce.reel) return;
    let vivant = true;
    void demander(commerce, { action: "etat" }).then((r) => {
      if (!vivant) return;
      if (r.etat) setEtat(r.etat);
      else if (r.error) setErreur(r.error);
    });
    return () => {
      vivant = false;
    };
  }, [commerce]);

  // LE TEMPS QUI PASSE PENDANT LA FABRICATION : une minute, ça se montre
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [enCours]);

  const prendre = async (f: File | undefined) => {
    if (!f) return;
    setErreur(null);
    try {
      setSelfie(await reduireSelfie(f));
    } catch (e) {
      setErreur(String((e as Error)?.message ?? e));
    }
  };

  const fabriquer = async () => {
    if (!selfie || !accord || enCours) return;
    setSecondes(0);
    setEnCours(true);
    setErreur(null);
    const r = await demander(commerce, { action: "fabriquer", selfie, accord: true, famille: commerce.famille });
    setEnCours(false);
    if (r.etat) setEtat(r.etat);
    if (r.error) setErreur(r.error);
  };

  const valider = async () => {
    setErreur(null);
    const r = await demander(commerce, { action: "valider", choix });
    if (r.etat?.validee) {
      setEtat(r.etat);
      onPrete(r.etat.validee);
    } else setErreur(r.error ?? "La validation n'a pas pu se faire. Réessaie.");
  };

  /** `null` tant qu'on ne sait pas (l'état arrive, ou n'a pas pu arriver) : le serveur compte, on ne bloque pas pour rien. */
  const restants = etat ? etat.essaisRestants : null;
  const proposees = etat?.proposees?.length ? etat.proposees : etat?.proposee ? [etat.proposee] : [];
  /** LA VISITE DU COMPTOIR (sans lien pro) : rien ne se fabrique, et on le dit AVANT qu'il prenne son selfie. */
  const visite = !commerce.reel;
  const ETAPES_ATTENTE = ["Je regarde ton selfie…", "Je sculpte ta tête…", "Je peins les détails…", "Je choisis ses accessoires…", "Presque fini…"];

  return (
    <div className="fg">
      <style>{STYLES}</style>
      {enCours ? (
        <section className="fg-attente" aria-live="polite">
          <div className="fg-tourne" aria-hidden="true">
            🪀
          </div>
          <h2>Je fabrique ta figurine</h2>
          <p>{ETAPES_ATTENTE[Math.min(ETAPES_ATTENTE.length - 1, Math.floor(secondes / 14))]}</p>
          <small>Une minute environ ({secondes} s). Garde cet écran ouvert.</small>
        </section>
      ) : etat?.proposee ? (
        <section className="fg-proposee">
          <h2>{proposees.length > 1 ? "Laquelle te ressemble ?" : "C’est toi ?"}</h2>
          <ChoixPropositions urls={proposees} voies={etat.voies} choix={Math.min(choix, proposees.length - 1)} onChoix={setChoix} />
          <p>Elle sera dans tes vidéos : elle présente, elle rebondit, elle dit bonjour par bulles.</p>
          <button type="button" className="cz-go grand" onClick={() => void valider()}>
            ✅ C’est moi !
          </button>
          {restants !== null && restants > 0 ? (
            <button type="button" className="cz-second" onClick={() => setEtat({ ...etat, proposee: null, proposees: [] })}>
              ↺ En refaire une ({restants} {restants > 1 ? "essais" : "essai"} aujourd’hui)
            </button>
          ) : (
            <small className="fg-note">Plus d’essai aujourd’hui : tu pourras en refaire une demain.</small>
          )}
        </section>
      ) : (
        <section className="fg-selfie">
          <h2>Ta figurine, à partir d’un selfie</h2>
          <p>Une figurine de collection à ton image, sur son ressort : elle présentera tes vidéos.</p>
          {visite && (
            <p className="fg-visite">
              👀 Ici, c’est la visite du comptoir : ta figurine se fabrique dans <b>ton</b> comptoir, celui que tu ouvres avec ton lien pro.
            </p>
          )}
          <ul className="fg-conseils">
            <li>🤳 De face, à la lumière du jour, le visage bien net.</li>
            <li>🙂 Toi seul sur la photo, sans lunettes de soleil.</li>
          </ul>
          <input ref={prendrePhoto} type="file" accept="image/*" capture="user" hidden onChange={(e) => void prendre(e.target.files?.[0])} />
          {selfie ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="fg-photo" src={selfie} alt="Ton selfie" onClick={() => prendrePhoto.current?.click()} />
          ) : (
            <button type="button" className="fg-prendre" onClick={() => prendrePhoto.current?.click()}>
              <span aria-hidden="true">🤳</span> Prendre mon selfie
            </button>
          )}
          <label className="fg-accord">
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
            <span>
              C’est bien moi, et j’accepte que ClikMe fabrique ma figurine à partir de cette photo. La photo n’est pas gardée.
            </span>
          </label>
          <button type="button" className="cz-go grand" disabled={visite || !selfie || !accord || restants === 0} onClick={() => void fabriquer()}>
            🪀 Fabriquer ma figurine
          </button>
          {/* LE BOUTON GRIS DIT POURQUOI : il ne reste jamais muet */}
          {!visite && restants === 0 && <small className="fg-note">Trois figurines aujourd’hui, c’est le maximum : à demain !</small>}
          {!visite && restants !== 0 && (!selfie || !accord) && (
            <small className="fg-note">{!selfie ? "D’abord ton selfie." : "Coche la case juste au-dessus : c’est ton accord."}</small>
          )}
          {etat?.validee && (
            <button type="button" className="cz-second" onClick={() => onPrete(etat.validee as string)}>
              Garder ma figurine actuelle
            </button>
          )}
        </section>
      )}
      {erreur && <p className="fg-erreur">{erreur}</p>}
      {!enCours && (
        <button type="button" className="cz-second" onClick={onRetour}>
          ‹ Retour
        </button>
      )}
    </div>
  );
}

/** 🍂 MA FIGURINE DU MOIS — l'écran entier, ouvert depuis l'accueil du comptoir ou Ma boutique. */
export function MaFigurine({
  commerce,
  onRetour,
  onStudio,
}: {
  commerce: CommerceComptoir;
  onRetour: () => void;
  /** Le Studio, avec cette figurine choisie d'office. */
  onStudio?: (figurine: string | null) => void;
}) {
  const [etat, setEtat] = useState<EtatFigurinePro | null>(null);
  /** La figurine de sa collection dont il lit l'histoire. */
  const [fiche, setFiche] = useState<FigurineDeCollection | null>(null);
  const [selfie, setSelfie] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // sans lien pro (la démonstration), rien à demander : l'écran de fabrication le dit lui-même
    if (!commerce.reel) return;
    let vivant = true;
    void demander(commerce, { action: "etat" }).then((r) => {
      if (!vivant) return;
      if (r.etat) setEtat(r.etat);
      else if (r.error) setErreur(r.error);
    });
    return () => {
      vivant = false;
    };
  }, [commerce]);

  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [enCours]);

  const habiller = async () => {
    if (enCours) return;
    setSecondes(0);
    setEnCours(true);
    setErreur(null);
    const r = await demander(commerce, { action: "fabriquer-edition" });
    setEnCours(false);
    if (r.etat) setEtat(r.etat);
    if (r.error) setErreur(r.error);
  };

  const validerEdition = async () => {
    setErreur(null);
    const r = await demander(commerce, { action: "valider-edition", choix: choixEdition });
    if (r.etat) setEtat(r.etat);
    if (r.error) setErreur(r.error);
  };

  const ed = etat?.edition ?? null;
  const [choixEdition, setChoixEdition] = useState(0);
  const proposeesEdition = ed?.proposees?.length ? ed.proposees : ed?.proposee ? [ed.proposee] : [];
  /** pour la présenter avant même la réponse du serveur (ou sans lien pro) */
  const [duJour] = useState(() => editionsDuMoment(jourParis()).maintenant);
  const [aujourdhui] = useState(() => jourParis());
  const restants = etat?.essaisRestants ?? 0;
  const dejaEnGrand = !!ed && !ed.validee && !ed.proposee && !enCours && !!etat?.validee;
  /** L'écran du selfie. Aussi quand l'état n'a pas pu venir : pas bloqué devant « Je regarde… », il peut essayer. */
  const fabrication = selfie || (etat && !etat.validee) || !commerce.reel || (!etat && !!erreur);
  const ETAPES = ["Je sors ta figurine…", "Je choisis sa tenue…", "Je peins les détails…", "Presque fini…"];

  return (
    <div className="mf">
      <style>{STYLES}</style>
      <style>{STYLES_MF}</style>
      <div className="mf-haut">
        <button type="button" className="mf-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="mf-titre">🪀 Ma figurine</span>
      </div>
      <div className="mf-corps">
        {fabrication ? (
          <>
            {!commerce.reel || (etat && !etat.validee) ? (
              <p className="mf-intro">
                Tes clients gagnent <b>ta figurine</b> en venant chez toi, une édition chaque mois
                {ed ?? duJour ? (
                  <>
                    {" "}
                    — en ce moment, <b>l’édition {(ed ?? duJour)?.nom} {(ed ?? duJour)?.emoji}</b>
                  </>
                ) : null}
                . D’abord ta figurine, à partir d’un selfie ; ensuite je l’habille pour l’édition.
              </p>
            ) : null}
            <FabriquerFigurine
              commerce={commerce}
              onPrete={(u) => {
                setSelfie(false);
                setEtat((e) => (e ? { ...e, validee: u, proposee: null } : e));
                void demander(commerce, { action: "etat" }).then((r) => r.etat && setEtat(r.etat));
              }}
              onRetour={() => (selfie ? setSelfie(false) : onRetour())}
            />
          </>
        ) : !etat ? (
          <p className="mf-intro">Je regarde où en est ta figurine…</p>
        ) : (
          <>
            {ed ? (
              <section className="mf-edition">
                <h2>
                  Ma figurine du mois <span>{ed.emoji}</span>
                </h2>
                <p>
                  <b>Édition {ed.nom}</b> · encore {ed.jours} {ed.jours > 1 ? "jours" : "jour"}. Tes clients la gagnent en venant pendant l’édition ; elle est
                  aussi dans tes petits films.
                </p>
                {enCours ? (
                  <div className="fg-attente" aria-live="polite">
                    <div className="fg-tourne" aria-hidden="true">
                      {ed.emoji}
                    </div>
                    <p>{ETAPES[Math.min(ETAPES.length - 1, Math.floor(secondes / 15))]}</p>
                    <small>Une minute environ ({secondes} s). Garde cet écran ouvert.</small>
                  </div>
                ) : ed.validee ? (
                  <>
                    <ApercuFigurine src={ed.validee} />
                    <VoirEnGrand src={ed.validee} />
                    <p className="mf-prete">✅ Ta figurine de l’édition {ed.nom} est prête.</p>
                  </>
                ) : ed.proposee ? (
                  <>
                    {proposeesEdition.length > 1 && <p className="mf-laquelle">Laquelle te plaît ?</p>}
                    <ChoixPropositions urls={proposeesEdition} voies={ed.voies} choix={Math.min(choixEdition, proposeesEdition.length - 1)} onChoix={setChoixEdition} />
                    <button type="button" className="cz-go grand" onClick={() => void validerEdition()}>
                      ✅ Elle est parfaite
                    </button>
                    {restants > 0 && (
                      <button type="button" className="cz-second" onClick={() => void habiller()}>
                        ↺ Une autre tenue ({restants} {restants > 1 ? "essais" : "essai"} aujourd’hui)
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {etat.validee && <ApercuFigurine src={etat.validee} />}
                    <button type="button" className="cz-go grand" disabled={restants <= 0} onClick={() => void habiller()}>
                      {ed.emoji} L’habiller pour l’édition {ed.nom}
                    </button>
                    {restants <= 0 && <small className="fg-note">Plus d’essai aujourd’hui : à demain !</small>}
                  </>
                )}
              </section>
            ) : null}
            {/* pas deux fois la même : tant qu'elle n'est pas habillée, elle est déjà en grand juste au-dessus */}
            <section className={`mf-base${dejaEnGrand ? " seule" : ""}`}>
              {etat.validee && !dejaEnGrand && <ApercuFigurine src={etat.validee} petit />}
              <div>
                <b>Ma figurine</b>
                <em>Celle de ton selfie, sans tenue d’édition.</em>
                <button type="button" className="cz-second" onClick={() => setSelfie(true)}>
                  ↺ La refaire avec un selfie
                </button>
              </div>
            </section>
            {onStudio && (
              <button type="button" className="cz-second" onClick={() => onStudio(figurineDuMoment(etat))}>
                🎬 Faire un petit film avec elle
              </button>
            )}
            {/* 🗂 SA COLLECTION : toutes celles qu'il a validées, gardées pour toujours */}
            {etat.collection.length > 0 && (
              <section className="mf-collection">
                <h3>
                  🗂 Ma collection{" "}
                  <span>
                    {etat.collection.length} {etat.collection.length > 1 ? "figurines" : "figurine"}
                  </span>
                </h3>
                <p>Chaque figurine que tu valides reste ici. Touche-en une pour son histoire, ou pour la remettre dans un petit film.</p>
                <div className="mf-grille">
                  {etat.collection.map((f) => {
                    const h = histoireDeLaFigurine(f, aujourdhui);
                    return (
                      <button key={f.url} type="button" className="mf-piece" onClick={() => setFiche(f)}>
                        <ApercuFigurine src={f.url} mini />
                        <b>
                          {f.emoji} {f.nom}
                        </b>
                        <em>{moisEnMots(f.le)}</em>
                        {f.dansLesFilms ? (
                          <i className="mf-pastille films">Dans tes films</i>
                        ) : h.moment === "en-cours" ? (
                          <i className="mf-pastille">En ce moment</i>
                        ) : h.moment === "passee" ? (
                          <i className="mf-pastille finie">Édition finie</i>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            {etat.ensuite && (
              <p className="mf-ensuite">
                Ensuite : l’édition {etat.ensuite.nom} {etat.ensuite.emoji}, dans {etat.ensuite.jours} {etat.ensuite.jours > 1 ? "jours" : "jour"}.
              </p>
            )}
          </>
        )}
        {/* sur l'écran du selfie, c'est lui qui dit les erreurs (une seule fois) */}
        {erreur && !fabrication && <p className="fg-erreur">{erreur}</p>}
      </div>
      {fiche && <FicheFigurine f={fiche} aujourdhui={aujourdhui} onFermer={() => setFiche(null)} onStudio={onStudio && (() => onStudio(fiche.url))} />}
    </div>
  );
}

/** 🗂 LA FICHE D'UNE FIGURINE DE SA COLLECTION : elle en grand, et son histoire en trois lignes. */
function FicheFigurine({ f, aujourdhui, onFermer, onStudio }: { f: FigurineDeCollection; aujourdhui: string; onFermer: () => void; onStudio?: () => void }) {
  const h = histoireDeLaFigurine(f, aujourdhui);
  return (
    <div className="mf-fiche" role="dialog" aria-modal="true" aria-label={h.titre}>
      <div className="mf-fiche-c">
        <ApercuFigurine src={f.url} />
        <VoirEnGrand src={f.url} />
        <h2>{h.titre}</h2>
        {f.dansLesFilms && <i className="mf-pastille films">🎬 C’est elle qui présente tes petits films</i>}
        <ul className="mf-histoire">
          <li>
            <span aria-hidden="true">🗓</span>
            <div>
              <b>Sa création</b>
              <p>{h.creee}</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">⏳</span>
            <div>
              <b>{h.moment === "toujours" ? "À quoi elle sert" : h.moment === "en-cours" ? "Pendant l’édition" : "Pendant son édition"}</b>
              <p>{h.pendant}</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">🗂</span>
            <div>
              <b>{h.moment === "toujours" ? "Et ensuite" : "Après l’édition"}</b>
              <p>{h.apres}</p>
            </div>
          </li>
        </ul>
        {onStudio && (
          <button type="button" className="cz-go grand" onClick={onStudio}>
            🎬 Faire un petit film avec elle
          </button>
        )}
        <button type="button" className="cz-second" onClick={onFermer}>
          Fermer
        </button>
      </div>
    </div>
  );
}

const STYLES_MF = `
.mf{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:var(--fond);overflow:hidden;}
.mf-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 0;}
.mf-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.mf-titre{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rose);}
.mf-corps{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:14px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;}
.mf-corps::-webkit-scrollbar{display:none;}
.mf-intro{margin:0;padding:14px;border-radius:20px;background:var(--nappe);border:1px solid var(--trait);font-size:15px;line-height:1.42;}
.mf-intro b{color:var(--ambre);}
.mf-edition{display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px;border-radius:24px;background:linear-gradient(160deg,rgba(255,46,154,.14),rgba(245,162,58,.08));border:1px solid rgba(255,46,154,.4);text-align:center;}
.mf-edition h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;}
.mf-edition p{margin:0;font-size:14.5px;line-height:1.42;color:var(--gris);}
.mf-edition p b{color:var(--creme);}
.mf-prete{font-weight:800;color:#3DE2A6!important;}
.mf-base{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;padding:12px;border-radius:20px;background:var(--nappe);border:1px solid var(--trait);}
.mf-base.seule{grid-template-columns:1fr;}
.mf-base div{display:flex;flex-direction:column;align-items:flex-start;gap:6px;}
.mf-base b{font-size:16px;}
.mf-base em{font-style:normal;font-size:13px;color:var(--gris);}
.mf-ensuite{margin:0;text-align:center;font-size:13.5px;color:var(--gris);}
.mf-collection{display:flex;flex-direction:column;gap:10px;padding:14px 12px;border-radius:22px;background:var(--nappe);border:1px solid var(--trait);}
.mf-collection h3{margin:0;display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:19px;}
.mf-collection h3 span{font-family:inherit;font-size:13px;font-weight:700;color:var(--gris);}
.mf-collection>p{margin:0;font-size:13.5px;line-height:1.4;color:var(--gris);}
.mf-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:10px;}
.mf-piece{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px 10px;border-radius:18px;border:1px solid var(--trait);background:var(--nappe2);color:var(--creme);text-align:center;}
.mf-piece b{font-size:13px;line-height:1.2;}
.mf-piece em{font-style:normal;font-size:12px;color:var(--gris);}
.mf-pastille{font-style:normal;font-size:11px;font-weight:800;white-space:nowrap;padding:3px 7px;border-radius:999px;background:rgba(245,162,58,.18);color:var(--ambre);}
.mf-pastille.films{background:rgba(255,46,154,.16);color:var(--rose);}
.mf-pastille.finie{background:rgba(255,244,230,.08);color:var(--gris);}
.mf-fiche{position:absolute;inset:0;z-index:2;background:rgba(10,6,4,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);overflow-y:auto;padding:16px 16px calc(24px + env(safe-area-inset-bottom,0px));}
.mf-fiche-c{display:flex;flex-direction:column;align-items:center;gap:12px;max-width:440px;margin:0 auto;padding:18px 16px;border-radius:26px;background:var(--fond);border:1px solid var(--trait);}
.mf-fiche-c h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;text-align:center;}
.mf-histoire{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;width:100%;}
.mf-histoire li{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:start;padding:10px 12px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);}
.mf-histoire span{font-size:20px;line-height:1.2;}
.mf-histoire b{font-size:14px;}
.mf-histoire p{margin:2px 0 0;font-size:13.5px;line-height:1.42;color:var(--gris);}
`;

const STYLES = `
.fg{display:flex;flex-direction:column;gap:12px;}
.fg h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;text-align:center;}
.fg p{margin:0;font-size:15px;line-height:1.42;text-align:center;color:var(--gris);}
.fg-selfie,.fg-proposee,.fg-attente{display:flex;flex-direction:column;align-items:center;gap:12px;}
.fg-choix{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;}
.fg-choix-p{display:flex;flex-direction:column;align-items:center;gap:8px;}
.fg-choix-p>button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 6px 10px;border-radius:20px;border:2px solid var(--trait);background:var(--nappe);color:var(--creme);width:100%;}
.fg-choix-p.on>button{border-color:var(--rose);background:rgba(255,46,154,.12);}
.fg-choix-p b{font-size:13.5px;}
.fg-choix-p small{font-size:11.5px;color:var(--gris);}
.mf-laquelle{margin:0;font-weight:800;color:var(--creme)!important;}
.fg-conseils{margin:0;padding:12px 14px;border-radius:18px;background:rgba(255,244,230,.04);border:1px dashed var(--trait);list-style:none;display:grid;gap:7px;font-size:13.5px;line-height:1.4;color:var(--gris);width:100%;}
.fg-prendre{width:100%;min-height:120px;border-radius:22px;border:2px dashed var(--rose);background:rgba(255,46,154,.08);color:var(--creme);font-size:18px;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;}
.fg-prendre span{font-size:34px;}
.fg-photo{width:150px;height:150px;object-fit:cover;border-radius:50%;border:3px solid var(--rose);box-shadow:0 10px 30px rgba(0,0,0,.4);}
.fg-accord{display:flex;align-items:flex-start;gap:10px;font-size:14px;line-height:1.4;text-align:left;}
.fg-accord input{flex:none;width:22px;height:22px;margin-top:1px;accent-color:var(--rose);}
.fg-note{font-size:13px;color:var(--gris);text-align:center;}
.fg .fg-visite{padding:12px 14px;border-radius:16px;background:rgba(245,162,58,.12);border:1px solid rgba(245,162,58,.45);color:var(--creme);font-size:14px;}
.fg-erreur{margin:0;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;background:rgba(245,162,58,.16);border:1px solid rgba(245,162,58,.5);color:var(--creme);}
.fg-attente{padding:30px 0;}
.fg-tourne{font-size:64px;animation:fg-saute 1.1s ease-in-out infinite;}
@keyframes fg-saute{0%,100%{transform:translateY(0) scaleY(1)}40%{transform:translateY(-26px) scaleY(1.05)}55%{transform:translateY(0) scaleY(.88)}}
.fg-attente small{font-size:13px;color:var(--gris);}
@media (prefers-reduced-motion: reduce){.fg-tourne{animation:none}}
`;

const STYLES_APERCU = `
.fg-apercu{position:relative;width:210px;height:330px;border-radius:24px;background:radial-gradient(70% 55% at 50% 60%,#FFF3F5,#F8DCE2 55%,#EEC2CC);overflow:hidden;}
.fg-apercu.petit{width:120px;height:190px;border-radius:16px;}
.fg-apercu.mini{width:88px;height:138px;border-radius:14px;}
.fg-apercu.geant{width:min(92vw,calc((100dvh - 120px) * .636));height:auto;aspect-ratio:210/330;border-radius:28px;box-shadow:0 18px 50px rgba(120,40,70,.25);}
.fg-apercu.mini .fg-buste,.fg-apercu.mini .fg-ressort,.fg-apercu.mini .fg-entiere{animation:none;}
.fg-entiere{position:absolute;left:50%;bottom:4%;width:auto;height:92%;max-width:96%;object-fit:contain;object-position:50% 100%;transform:translateX(-50%);transform-origin:50% 100%;animation:fg-balance 3.2s ease-in-out infinite;}
@keyframes fg-balance{0%,100%{transform:translateX(-50%) rotate(0)}30%{transform:translateX(-50%) rotate(-1.4deg)}62%{transform:translateX(-50%) rotate(1.1deg)}}
.fg-buste{position:absolute;z-index:1;left:50%;bottom:28.5%;width:auto;height:64%;max-width:94%;object-fit:contain;object-position:50% 100%;transform:translateX(-50%);transform-origin:50% 100%;animation:fg-rebond 2.6s ease-in-out infinite;}
.fg-ressort{position:absolute;left:50%;bottom:14.5%;width:17%;height:17%;transform:translateX(-50%);transform-origin:50% 100%;animation:fg-ressort 2.6s ease-in-out infinite;}
.fg-socle{position:absolute;left:50%;bottom:6%;width:62%;transform:translateX(-50%);}
@keyframes fg-rebond{0%,100%{transform:translateX(-50%) translateY(0) rotate(0)}30%{transform:translateX(-50%) translateY(-4%) rotate(-3deg)}60%{transform:translateX(-50%) translateY(1%) rotate(2deg)}}
@keyframes fg-ressort{0%,100%{transform:translateX(-50%) scaleY(1)}30%{transform:translateX(-50%) scaleY(1.18)}60%{transform:translateX(-50%) scaleY(.92)}}
@media (prefers-reduced-motion: reduce){.fg-buste,.fg-ressort,.fg-entiere{animation:none}}
`;
