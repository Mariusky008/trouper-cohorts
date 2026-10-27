"use client";

// 👻 LA PAGE DE LA FAMILLE — ce que voit celui qui arrive par la fin de la vidéo d'un commerce.
//
// Trois moments, sur la même page (c'est la démo « Le parcours ClikMe » devenue vraie) :
//   1. L'ACCUEIL : sa vidéo (ou sa photo), son nom, la foule d'aujourd'hui et le record à battre,
//      et les trois cages, avec SON fantôme dedans. « Sans compte, sans appli à installer. »
//   2. LA FICHE, à la première cage : son fantôme (touche pour changer), son prénom, son petit
//      mot s'il veut. « Entrer dans la famille. » Celui qui est déjà de la famille n'a rien à
//      retaper : sa cage suffit.
//   3. LA FAMILLE : « Tu es le fantôme n°48 de Chez Bergine », son écusson et ce qui le fait
//      monter (les paliers de `lib/direct/famille.ts`), la vitrine du commerce avec la foule et
//      leurs petits mots, ses bons plans sur WhatsApp (le numéro de ClikMe, s'il est ouvert), et
//      « Il en manque 3 : inviter un ami » — son lien porte son code (`?de=`), qui compte pour l'or.
//
// Celui qui a déjà ouvert une cage aujourd'hui arrive directement sur sa famille.
import { useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { abonnerLook, garderLook, lookDe, LOOKS, monLook } from "@/lib/direct/look";
import { CAGES, libellesCages, type Cage } from "@/lib/direct/cages";
import { familleDuDouble } from "@/lib/direct/double-metiers";
import { MOT_MAX, motPropre, motsDeLaListe } from "@/lib/direct/petits-mots";
import {
  AVANTAGE_GRADE,
  cheminEnMots,
  EMOJI_GRADE,
  GRADES,
  manquePourRecord,
  messagePourMike,
  NOM_GRADE,
  prochainPalier,
  recordBattu,
  type EtatFamille,
  type Grade,
  type Parcours,
} from "@/lib/direct/famille";
import { deNom } from "@/lib/echanges/echanges";
import { prenomRefuse } from "@/lib/direct/prenom";
import { VitrineDuCommerce } from "@/app/autour-de-moi/vitrine-fantomes";

export type CommerceFamille = {
  slug: string;
  nom: string;
  /** Son métier tel qu'il l'a écrit (« Bistrot »). */
  metier: string;
  branche: string;
  /** « Dax ». */
  ville: string;
  villeSlug: string;
  /** Ce que la cage retient : l'adresse de sa vidéo, ou `FILM_PAGE` s'il n'en a pas encore. */
  film: string;
  /** Sa vidéo, à jouer (vide : pas encore de vidéo). */
  video: string;
  /** Sa photo en haut de page, et celle de sa salle, derrière la vitre. */
  affiche: string;
  salle: string;
  /** Son fantôme à lui, qui salue (la famille encore vide). */
  hote: string;
  /** Le numéro WhatsApp de ClikMe, au format d'un lien wa.me (vide : pas encore ouvert). */
  whatsapp: string;
};

type Ecran = "accueil" | "fiche" | "famille";

const lookServeur = () => lookDe(null);
/** « 1 234 » : l'espace fine de `toLocaleString` ne s'affiche pas partout. */
const nb = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const COULEUR_CAGE: Record<Cage, string> = { adore: "#FF2E9A", "un-jour": "#F5A23A", aujourdhui: "#3DE2A6" };
/** Le dernier palier vu sur ce téléphone, par commerce : celui qui monte se fête une fois. */
const CLE_PALIERS = "clikme-famille-paliers";
function retenirPalier(slug: string, grade: Grade): Grade | null {
  try {
    const vus = JSON.parse(window.localStorage.getItem(CLE_PALIERS) || "{}") as Record<string, Grade>;
    const avant = vus[slug];
    window.localStorage.setItem(CLE_PALIERS, JSON.stringify({ ...vus, [slug]: grade }));
    return avant && GRADES.indexOf(grade) > GRADES.indexOf(avant) ? grade : null;
  } catch {
    return null;
  }
}

const MOTS_CHEMIN: Record<keyof Parcours, [string, string]> = {
  visites: ["visite", "visites"],
  jours: ["jour de cage", "jours de cage"],
  amis: ["ami amené", "amis amenés"],
};

export function Famille({ commerce: c, de }: { commerce: CommerceFamille; de: string }) {
  const look = useSyncExternalStore(abonnerLook, monLook, lookServeur);
  const [etat, setEtat] = useState<EtatFamille | null>(null);
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [cage, setCage] = useState<Cage | null>(null);
  const [prenom, setPrenom] = useState("");
  const [mot, setMot] = useState("");
  const [motListe, setMotListe] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  /** Il vient d'entrer (« Bienvenue dans la famille ! »), ou il revient (« Re-bonjour »). */
  const [vientDEntrer, setVientDEntrer] = useState(false);
  const [copie, setCopie] = useState(false);
  /** 🥈 Son palier vient de monter depuis sa dernière visite : on le fête (une fois). */
  const [monte, setMonte] = useState<Grade | null>(null);
  const liste = motsDeLaListe(familleDuDouble({ branche: c.branche, metier: c.metier }));
  const libelles = libellesCages(c.branche);

  const lire = useCallback(async (): Promise<EtatFamille | null> => {
    try {
      const r = await fetch(`/api/direct/famille?slug=${encodeURIComponent(c.slug)}`, { cache: "no-store" });
      const j = (await r.json().catch(() => null)) as (EtatFamille & { ok?: boolean }) | null;
      if (!r.ok || !j?.ok) return null;
      setEtat(j);
      if (j.moi) {
        const m = retenirPalier(c.slug, j.moi.grade);
        if (m) setMonte(m);
      }
      return j;
    } catch {
      return null;
    }
  }, [c.slug]);

  useEffect(() => {
    let fini = false;
    void lire().then((j) => {
      if (fini || !j?.moi) return;
      setPrenom(j.moi.prenom);
      // DÉJÀ DANS LA FOULE AUJOURD'HUI : sa famille, directement.
      if (j.moi.present) setEcran("famille");
    });
    return () => {
      fini = true;
    };
  }, [lire]);

  /** Ouvrir la cage pour de bon : la route garde la cage, la foule du jour, et qui l'a amené. */
  const entrer = async (choisie: Cage, sonPrenom: string) => {
    setErreur("");
    setEnvoi(true);
    try {
      const r = await fetch("/api/direct/cage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: c.slug, film: c.film, cage: choisie, prenom: sonPrenom, look: look.id, ville: c.villeSlug, ...(de ? { de } : {}) }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) {
        setErreur(j.error || "Ta cage ne s’est pas ouverte. Réessaie dans un instant.");
        return;
      }
      const texte = motPropre(mot);
      if (texte) {
        // Son petit mot part après sa cage (il faut être de la famille pour écrire) ; s'il ne part pas, la vitrine le redemandera.
        await fetch("/api/direct/mot", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: c.slug, texte, liste: motListe && liste.includes(texte) }),
        }).catch(() => undefined);
      }
      const nouveau = !etat?.moi;
      await lire();
      setCage(choisie);
      setVientDEntrer(nouveau);
      setEcran("famille");
      window.scrollTo({ top: 0 });
    } catch {
      setErreur("Pas de réseau : ta cage ne s’est pas ouverte.");
    } finally {
      setEnvoi(false);
    }
  };

  const toucherCage = (k: Cage) => {
    setCage(k);
    setErreur("");
    // DÉJÀ DE LA FAMILLE : sa cage suffit, il est dans la foule d'aujourd'hui.
    if (etat?.moi) void entrer(k, etat.moi.prenom);
    else setEcran("fiche");
  };

  const moi = etat?.moi ?? null;
  const record = etat?.record ?? null;
  const manque = etat ? manquePourRecord(etat) : 1;
  const lien = typeof window !== "undefined" && moi ? `${window.location.origin}/f/${c.slug}?de=${moi.code}` : "";

  const inviter = async () => {
    if (!lien) return;
    const texte = `Rejoins la famille ${deNom(c.nom)} avec moi 👻 Ses fantômes ont les bons plans en premier.`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `La famille ${deNom(c.nom)}`, text: texte, url: lien });
        return;
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${texte} ${lien}`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2500);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${texte} ${lien}`)}`, "_blank", "noopener");
    }
  };

  const carteFoule = (e: EtatFamille, compacte = false) => {
    const vide = e.aujourdhui === 0;
    const battu = recordBattu(e);
    return (
      <div className={`fm-foule${compacte ? " compacte" : ""}`} aria-live="polite">
        <div className="l1">
          <b>{nb(e.aujourdhui)}</b>
          <span>
            {e.aujourdhui > 1 ? "fantômes" : "fantôme"}
            <br />
            aujourd’hui
          </span>
          {record !== null && record > 0 && (
            <em>
              🏆 Record<strong>{nb(Math.max(record, e.aujourdhui))}</strong>
            </em>
          )}
        </div>
        {record !== null && record > 0 && (
          <div className="fm-jauge">
            <i style={{ width: `${battu ? 100 : Math.min(100, (e.aujourdhui / (record + 1)) * 100).toFixed(0)}%` }} />
          </div>
        )}
        <p>
          {battu ? (
            <b>🎉 Record battu aujourd’hui ! On continue ?</b>
          ) : record !== null && record > 0 ? (
            <>
              Plus que <b>{nb(manque)}</b> pour battre le record
            </>
          ) : vide ? (
            "Personne encore aujourd’hui : sois le premier fantôme du jour !"
          ) : record === 0 ? (
            "Le premier jour de la famille : chaque fantôme compte pour le record."
          ) : (
            "Chaque jour, la foule repart de zéro."
          )}
        </p>
      </div>
    );
  };

  /* ═══ 3. LA FAMILLE ═══════════════════════════════════════════════════ */
  if (ecran === "famille" && moi) {
    const suivant = prochainPalier(moi.parcours);
    const rang = GRADES.indexOf(moi.grade);
    const jauge = suivant ? Math.max(...suivant.chemins.map((x) => x.fait / x.faut)) : 1;
    const salue = look.salue ?? look.debout ?? look.image;
    return (
      <main className="fm">
        <section className="fm-heros">
          <i className="fm-etincelle" style={{ left: "16%", top: "18%", "--d": ".2s" } as CSSProperties}>
            ✦
          </i>
          <i className="fm-etincelle" style={{ left: "80%", top: "14%", "--d": ".9s" } as CSSProperties}>
            ✦
          </i>
          <i className="fm-etincelle" style={{ left: "74%", top: "52%", "--d": "1.5s" } as CSSProperties}>
            ✦
          </i>
          <i className="fm-etincelle" style={{ left: "22%", top: "56%", "--d": ".6s" } as CSSProperties}>
            ✦
          </i>
          <div className="fm-moi">
            <span className="flotte">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={salue} alt="Ton fantôme" />
              <i className={`fm-patch ${moi.grade}${vientDEntrer || monte ? " coud" : ""}`} key={moi.grade}>
                <b>{moi.numero}</b>
              </i>
            </span>
          </div>
          <h1>{vientDEntrer ? "Bienvenue dans la famille !" : `Re-bonjour${prenom ? `, ${prenom}` : ""} !`}</h1>
          <p>
            Tu es le fantôme n°{nb(moi.numero)} {deNom(c.nom)}
          </p>
          {monte && (
            <div className="fm-monte" role="status">
              <b>
                {EMOJI_GRADE[monte]} Tu passes {NOM_GRADE[monte]} !
              </b>
              Tu as les bons plans {AVANTAGE_GRADE[monte]}.
            </div>
          )}
        </section>

        {etat && carteFoule(etat, true)}

        <div className="fm-chemin" role="list" aria-label="Ton écusson">
          {GRADES.map((g, k) => (
            <div key={g} role="listitem" className={`fm-etape${k <= rang ? " fait" : ""}${k === rang + 1 ? " prochain" : ""}`}>
              <span className="med">{EMOJI_GRADE[g]}</span>
              <b>{NOM_GRADE[g]}</b>
              <small>{AVANTAGE_GRADE[g]}</small>
            </div>
          ))}
        </div>
        <div className="fm-prochain">
          {suivant ? (
            <>
              <b>
                Prochain : l’écusson {NOM_GRADE[suivant.grade].toLowerCase()} {EMOJI_GRADE[suivant.grade]}
              </b>
              {cheminEnMots(suivant.chemins, c.nom)}
              <div className="fm-jauge">
                <i style={{ width: `${Math.max(6, Math.round(jauge * 100))}%` }} />
              </div>
              <small>
                {suivant.chemins.map((x) => `${nb(x.fait)} ${MOTS_CHEMIN[x.quoi][x.fait > 1 ? 1 : 0]} sur ${nb(x.faut)}`).join(" · ")}
                {moi.present ? " · aujourd’hui ✓" : ""}
              </small>
            </>
          ) : (
            <>
              <b>Tu es en or 🥇</b>
              Tu as les bons plans {deNom(c.nom)} en premier.
            </>
          )}
        </div>

        <div className="fm-actions">
          {c.whatsapp && (
            <>
              <a
                className="fm-bouton wa"
                href={`https://wa.me/${c.whatsapp}?text=${encodeURIComponent(messagePourMike(prenom, moi.numero, c.nom, moi.code))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 Mes bons plans sur WhatsApp
              </a>
              <p className="fm-note">Mike t’y explique tout 👻</p>
            </>
          )}
          <button type="button" className={`fm-bouton ${c.whatsapp ? "second" : "rose"}`} onClick={() => void inviter()}>
            {copie
              ? "✓ Lien copié : colle-le à un ami"
              : etat && record !== null && record > 0 && !recordBattu(etat)
                ? `📣 Il en manque ${nb(manque)} : inviter un ami`
                : "📣 Inviter un ami dans la famille"}
          </button>
        </div>

        <section className="fm-vitrine" aria-label={`La famille devant ${c.nom}`}>
          <h2>La famille, devant {c.nom}</h2>
          <p className="fm-indice">Touche un fantôme pour lire son mot</p>
          <VitrineDuCommerce
            carte={{ id: c.slug, nom: c.nom, branche: c.branche, metier: c.metier, photo: c.salle || undefined, villeReelle: c.villeSlug }}
            cage={cage ?? moi.cage ?? "adore"}
            prenom={prenom}
            moiDit="Toi"
          />
        </section>

        <a className="fm-lien" href={`/b/${encodeURIComponent(c.slug)}`}>
          Voir la page {deNom(c.nom)} ›
        </a>
        <style>{STYLES}</style>
      </main>
    );
  }

  /* ═══ 1. L'ACCUEIL (et 2. la fiche, par-dessus) ═══════════════════════ */
  const debout = look.debout ?? look.image;
  const familleVide = etat !== null && etat.membres === 0;
  return (
    <main className={`fm${ecran === "fiche" ? " a-fiche" : ""}`}>
      {c.video || c.affiche ? (
        <div className="fm-video" style={c.affiche ? { backgroundImage: `url(${c.affiche})` } : undefined}>
          {c.video ? <video src={c.video} poster={c.affiche || undefined} autoPlay muted loop playsInline preload="metadata" aria-label={`La vidéo ${deNom(c.nom)}`} /> : null}
        </div>
      ) : (
        // NI VIDÉO NI PHOTO ENCORE : son fantôme à lui, qui salue, plutôt qu'un grand vide.
        <div className="fm-video sans">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.hote} alt="" />
        </div>
      )}
      <div className="fm-ident">
        <b>{c.nom}</b>
        <small>{[c.metier, c.ville].filter(Boolean).join(" · ")}</small>
      </div>

      <div className="fm-accroche">
        <b>👻 Rejoins la famille {deNom(c.nom)} !</b>
        Tu l’aides à se faire connaître, et ses fantômes ont les bons plans en premier.
      </div>

      {familleVide ? (
        <div className="fm-premier">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {c.video || c.affiche ? <img src={c.hote} alt="" /> : null}
          <p>
            <b>Sois le tout premier fantôme {deNom(c.nom)} !</b>
            Le n°1, c’est pour toujours.
          </p>
        </div>
      ) : etat ? (
        carteFoule(etat)
      ) : (
        <div className="fm-foule attente" aria-hidden="true" />
      )}

      {moi && !moi.present && (
        <p className="fm-revient">
          Re-bonjour, fantôme n°{nb(moi.numero)} {EMOJI_GRADE[moi.grade]} ! Ouvre une cage pour compter aujourd’hui.
        </p>
      )}
      <p className="fm-appel">Ouvre une cage pour rejoindre la famille</p>
      <DegradesCage />
      <div className="fm-cages" role="group" aria-label="Les trois cages">
        {CAGES.map((k) => (
          <button key={k} type="button" className={`fm-cage-b${cage === k ? " ouverte" : ""}`} disabled={envoi} onClick={() => toucherCage(k)}>
            <span className="fm-cage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={debout} alt="" className={cage === k ? "envol" : undefined} draggable={false} />
              <CageSvg couleur={COULEUR_CAGE[k]} />
            </span>
            <span className="lib">{libelles[k]}</span>
          </button>
        ))}
      </div>
      {erreur && ecran === "accueil" && (
        <p className="fm-erreur" role="alert">
          {erreur}
        </p>
      )}
      <p className="fm-sans">Sans compte, sans appli à installer</p>

      {ecran === "fiche" && cage && (
        <div className="fm-voile" onClick={() => !envoi && setEcran("accueil")}>
          <form
            className="fm-fiche"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const p = prenom.trim();
              if (!p) {
                setErreur("Dis-nous ton prénom : c’est lui qu’on verra à côté de ton fantôme.");
                return;
              }
              const refus = prenomRefuse(p);
              if (refus) {
                setErreur(refus);
                return;
              }
              garderLook(look.id);
              void entrer(cage, p);
            }}
          >
            <div className="tete">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={look.salue ?? debout} alt="" />
              <b>
                Ton fantôme est libre ! 🎉
                <small>Encore un pas, et tu es dans la famille.</small>
              </b>
            </div>
            <label>
              Ton fantôme <i>(touche pour changer)</i>
            </label>
            <div className="fm-looks" role="radiogroup" aria-label="Ton fantôme">
              {LOOKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={l.id === look.id}
                  aria-label={l.nom}
                  className={`fm-look${l.id === look.id ? " pris" : ""}`}
                  onClick={() => garderLook(l.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.debout ?? l.image} alt="" draggable={false} />
                </button>
              ))}
            </div>
            <label htmlFor="fm-prenom">Ton prénom</label>
            <input id="fm-prenom" className="fm-champ" value={prenom} maxLength={24} autoComplete="given-name" onChange={(e) => setPrenom(e.target.value)} />
            <label htmlFor="fm-mot">
              Ton petit mot pour {c.nom} <i>(facultatif)</i>
            </label>
            <div className="fm-mots">
              {liste.slice(0, 4).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={motListe && mot === m ? "pris" : undefined}
                  onClick={() => {
                    setMot(m);
                    setMotListe(true);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              id="fm-mot"
              className="fm-champ"
              rows={2}
              maxLength={MOT_MAX}
              value={mot}
              placeholder="Ou écris le tien…"
              onChange={(e) => {
                setMot(e.target.value);
                setMotListe(false);
              }}
            />
            {erreur && (
              <p className="fm-erreur" role="alert">
                {erreur}
              </p>
            )}
            <button type="submit" className="fm-bouton rose" disabled={envoi}>
              {envoi ? "Un instant…" : "Entrer dans la famille"}
            </button>
            <p className="fm-note">Ton prénom et ton fantôme se verront devant {c.nom}.</p>
          </form>
        </div>
      )}
      <style>{STYLES}</style>
    </main>
  );
}

/** L'or des cages, posé une seule fois dans la page (trois cages, mêmes dégradés). */
function DegradesCage() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="fm-or" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF3C4" />
          <stop offset=".28" stopColor="#F2C46B" />
          <stop offset=".62" stopColor="#A9742A" />
          <stop offset=".82" stopColor="#FFE3A0" />
          <stop offset="1" stopColor="#7E5219" />
        </linearGradient>
        <linearGradient id="fm-orb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7A4E1A" />
          <stop offset=".45" stopColor="#FFE9AE" />
          <stop offset=".7" stopColor="#C8933F" />
          <stop offset="1" stopColor="#6E4516" />
        </linearGradient>
        <clipPath id="fm-dome">
          <path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** La cage dorée des tours, avec la couleur de son geste sur le socle et le nœud. */
function CageSvg({ couleur }: { couleur: string }) {
  return (
    <svg viewBox="0 0 150 220" aria-hidden="true">
      <path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200Z" fill="rgba(255,235,210,.05)" />
      <g clipPath="url(#fm-dome)" fill="url(#fm-orb)">
        <rect x="30" y="0" width="5" height="210" />
        <rect x="52" y="0" width="5" height="210" />
        <rect x="93" y="0" width="5" height="210" />
        <rect x="115" y="0" width="5" height="210" />
      </g>
      <rect x="8" y="92" width="134" height="7" rx="3" fill="url(#fm-or)" />
      <path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200" fill="none" stroke="url(#fm-or)" strokeWidth="7" />
      <circle cx="75" cy="7" r="7" fill="none" stroke="url(#fm-or)" strokeWidth="4" />
      <g fill={couleur}>
        <ellipse cx="65" cy="20" rx="11" ry="6" />
        <ellipse cx="85" cy="20" rx="11" ry="6" />
        <circle cx="75" cy="20" r="5" />
      </g>
      <g className="porte">
        <path d="M52 200V146C52 130 62 120 75 120S98 130 98 146V200" fill="rgba(30,15,20,.15)" stroke="url(#fm-or)" strokeWidth="5" />
        <rect x="73" y="122" width="4" height="78" fill="url(#fm-orb)" />
      </g>
      <rect x="2" y="196" width="146" height="22" rx="9" fill="url(#fm-or)" />
      <rect x="6" y="210" width="138" height="6" rx="3" fill={couleur} />
    </svg>
  );
}

const STYLES = `
.fm{--nuit:#12060F;--creme:#FFF4E6;--doux:#D9C3CB;--pale:#A88E99;--rose:#FF2E9A;--or:#F2C46B;--bronze:#C98A4B;--argent:#C9CED6;
  --carnet-texte:#2C0912;--carnet-doux:#7A5560;
  position:relative;max-width:480px;min-height:100dvh;margin:0 auto;padding:0 0 28px;overflow-x:hidden;
  background:linear-gradient(180deg,#1E0C18 0%,#12060F 60%);color:var(--creme);
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
.fm *{box-sizing:border-box}
.fm button{font:inherit;color:inherit;cursor:pointer}
.fm.a-fiche{overflow:hidden;max-height:100dvh}
.fm-video{position:relative;height:min(56vw,270px);background:#2A1222 center/cover}
.fm-video video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fm-video.sans{height:170px;display:flex;align-items:flex-end;justify-content:center;background:radial-gradient(60% 80% at 50% 70%,rgba(242,196,107,.28),rgba(255,46,154,.12) 55%,transparent 80%)}
.fm-video.sans img{height:150px;width:auto;filter:drop-shadow(0 10px 16px rgba(0,0,0,.5));animation:fm-flotte 3s ease-in-out infinite}
.fm-video::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 50%,#1E0C18 100%);pointer-events:none}
.fm-ident{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px;padding:6px 16px 0}
.fm-ident b{font-size:20px;font-weight:800;line-height:1.15}
.fm-ident small{color:var(--pale);font-size:13px}
.fm-accroche{margin:12px 16px 0;padding:12px 14px;border-radius:16px;background:var(--rose);color:#fff;font-size:14px;line-height:1.35;box-shadow:0 8px 24px rgba(255,46,154,.25)}
.fm-accroche b{display:block;font-size:17px;font-weight:800;margin-bottom:2px}
.fm-foule{margin:12px 16px 0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:12px 14px}
.fm-foule.attente{height:86px}
.fm-foule .l1{display:flex;align-items:center;gap:10px}
.fm-foule .l1 b{font-size:34px;font-weight:800;line-height:1}
.fm-foule .l1>span{font-size:13px;color:var(--doux);line-height:1.2}
.fm-foule .l1 em{margin-left:auto;text-align:right;font-style:normal;font-size:12px;font-weight:600;color:var(--or);line-height:1.15}
.fm-foule .l1 em strong{display:block;font-size:20px;font-weight:800}
.fm-foule p{margin:8px 0 0;font-size:13px;color:var(--doux)}
.fm-foule p b{color:var(--creme)}
.fm-foule.compacte{margin-top:14px}
.fm-jauge{height:8px;border-radius:4px;background:rgba(255,255,255,.1);margin-top:10px;overflow:hidden}
.fm-jauge i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--rose),var(--or));transition:width .6s}
.fm-premier{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:10px 14px;border-radius:16px;background:rgba(242,196,107,.12);border:1px solid rgba(242,196,107,.35)}
.fm-premier img{width:64px;height:auto;flex:none;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}
.fm-premier p{margin:0;font-size:13px;color:var(--doux)}
.fm-premier b{display:block;font-size:15px;color:var(--creme)}
.fm-revient{margin:12px 16px 0;font-size:13px;color:var(--or);text-align:center}
.fm-appel{margin:18px 16px 0;text-align:center;font-size:16px;font-weight:800}
.fm-cages{display:flex;justify-content:space-around;margin:8px 8px 0}
.fm-cage-b{flex:0 0 31%;display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:none;padding:6px 2px;border-radius:14px;-webkit-tap-highlight-color:transparent}
.fm-cage-b:focus-visible{outline:2px solid var(--or);outline-offset:2px}
.fm-cage-b:disabled{opacity:.6}
.fm-cage{position:relative;width:84px;height:122px}
.fm-cage svg{position:absolute;inset:0;width:100%;height:100%;z-index:2}
.fm-cage img{position:absolute;left:50%;bottom:11px;width:52px;margin-left:-26px;z-index:1}
.fm-cage-b .lib{font-size:13px;font-weight:600;line-height:1.2;text-align:center;white-space:pre-line}
.fm-cage .porte{transform-box:fill-box;transform-origin:left center}
.fm-cage-b.ouverte .porte{animation:fm-porte .6s ease .1s forwards}
.fm-cage img.envol{animation:fm-envol 1.1s cubic-bezier(.3,.1,.3,1) .35s forwards}
@keyframes fm-porte{to{transform:scaleX(.12)}}
@keyframes fm-envol{0%{transform:none}40%{transform:translateY(-50px) scale(1.2) rotate(-6deg)}100%{transform:translateY(-110px) scale(1.4);opacity:0}}
.fm-sans{margin:14px 0 0;text-align:center;font-size:12px;color:var(--pale)}
.fm-erreur{margin:10px 16px 0;padding:8px 12px;border-radius:10px;background:rgba(255,176,58,.15);color:#FFD08A;font-size:13px;text-align:center}
.fm-fiche .fm-erreur{margin:10px 0 0;background:#FFF0D9;color:#8A4B00}
.fm-voile{position:fixed;inset:0;z-index:20;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,3,8,.55);animation:fm-fondu .25s ease}
.fm-fiche{width:100%;max-width:480px;max-height:92dvh;overflow-y:auto;background:var(--creme);color:var(--carnet-texte);border-radius:24px 24px 0 0;padding:18px 18px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.5);animation:fm-monte .35s cubic-bezier(.2,.9,.3,1)}
.fm-fiche .tete{display:flex;align-items:center;gap:12px}
.fm-fiche .tete img{width:56px;height:auto}
.fm-fiche .tete b{font-size:16px;line-height:1.25}
.fm-fiche .tete small{display:block;font-size:13px;color:var(--carnet-doux);font-weight:600}
.fm-fiche label{display:block;font-size:12px;font-weight:600;color:var(--carnet-doux);margin:12px 0 5px}
.fm-fiche label i{font-style:normal;font-weight:400}
.fm-looks{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.fm-looks::-webkit-scrollbar{display:none}
.fm-look{flex:0 0 54px;display:grid;place-items:center;height:58px;border:2px solid #EBD9C6;background:#fff;border-radius:12px;padding:0}
.fm-look img{height:48px;width:auto}
.fm-look.pris{border-color:var(--rose);background:#FFE4F2}
.fm-champ{display:block;width:100%;border:1.5px solid #E2CDB8;border-radius:10px;padding:10px 12px;font:inherit;font-size:16px;font-weight:600;background:#fff;color:var(--carnet-texte);resize:none}
.fm-champ:focus{outline:none;border-color:var(--rose)}
.fm-mots{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.fm-mots button{border:1.5px solid #E2CDB8;background:#fff;border-radius:999px;padding:5px 10px;font-size:13px;color:var(--carnet-texte)}
.fm-mots button.pris{border-color:var(--rose);background:#FFE4F2}
.fm-bouton{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;border:0;border-radius:14px;padding:14px;font-weight:700;font-size:15px;text-decoration:none;text-align:center}
.fm-bouton.rose{background:var(--rose);color:#fff}
.fm-bouton.wa{background:#25D366;color:#06301A}
.fm-bouton.second{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:var(--creme)}
.fm-bouton:disabled{opacity:.7}
.fm-note{margin:8px 0 0;font-size:12px;color:var(--pale);text-align:center}
.fm-fiche .fm-note{color:var(--carnet-doux)}
.fm-heros{position:relative;padding:28px 16px 6px;text-align:center;background:radial-gradient(70% 75% at 50% 38%,rgba(242,196,107,.3),rgba(255,46,154,.12) 48%,transparent 75%)}
.fm-heros h1{margin:6px 0 0;font-family:var(--font-enseigne),"Playfair Display",Georgia,serif;font-style:italic;font-weight:700;font-size:26px;line-height:1.1}
.fm-heros p{margin:4px 0 0;font-size:14px;color:var(--doux)}
.fm-moi{position:relative;width:118px;height:118px;margin:0 auto}
.fm-moi .flotte{position:absolute;inset:0;animation:fm-flotte 3s ease-in-out infinite}
.fm-moi img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,.5))}
.fm-patch{position:absolute;width:32%;aspect-ratio:1;left:44%;top:74%;transform:translate(-50%,-50%) rotate(-8deg);border-radius:50%;container-type:inline-size;display:grid;place-items:center;background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.45),transparent 58%),var(--e);box-shadow:0 1px 2px rgba(0,0,0,.5)}
.fm-patch::before{content:"";position:absolute;inset:10%;border-radius:50%;border:max(.6px,5cqw) dashed rgba(255,248,234,.85)}
.fm-patch b{font-size:34cqw;font-weight:800;color:#3A1D08;line-height:1}
.fm-patch.bronze{--e:#C98A4B}.fm-patch.argent{--e:#BFC5CF}.fm-patch.or{--e:#E2B04A}
.fm-patch.coud{animation:fm-coud .9s cubic-bezier(.2,1.5,.4,1) .4s both}
.fm-etincelle{position:absolute;font-style:normal;color:var(--or);font-size:16px;opacity:0;animation:fm-scintille 2.4s ease-in-out infinite;animation-delay:var(--d,0s)}
.fm-monte{display:inline-block;margin:10px auto 0;padding:8px 14px;border-radius:14px;background:linear-gradient(90deg,rgba(242,196,107,.25),rgba(255,46,154,.2));border:1px solid rgba(242,196,107,.5);font-size:13px;color:var(--doux);animation:fm-pop .5s cubic-bezier(.2,1.4,.4,1) .6s both}
.fm-monte b{display:block;font-size:16px;color:var(--creme)}
@keyframes fm-pop{from{opacity:0;transform:scale(.6)}}
.fm-chemin{display:flex;align-items:flex-start;margin:16px 16px 0}
.fm-etape{flex:0 0 84px;text-align:center;line-height:1.2;position:relative}
.fm-etape+.fm-etape{margin-left:auto}
.fm-chemin{background:linear-gradient(var(--bronze),var(--bronze)) no-repeat 42px 22px/calc(100% - 84px) 2px}
.fm-etape .med{display:grid;place-items:center;width:44px;height:44px;margin:0 auto 4px;border-radius:50%;font-size:24px;background:#24101D;border:2px solid rgba(255,255,255,.15)}
.fm-etape b{display:block;font-size:13px}
.fm-etape small{display:block;font-size:11.5px;color:var(--pale)}
.fm-etape.fait .med{border-color:var(--bronze);background:#3A2016;box-shadow:0 0 0 4px rgba(201,138,75,.18),0 0 18px rgba(201,138,75,.55)}
.fm-etape.prochain .med{border-style:dashed;border-color:var(--argent)}
.fm-etape:not(.fait):not(.prochain) .med{opacity:.6}
.fm-prochain{margin:12px 16px 0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 14px;font-size:13px;color:var(--doux);line-height:1.4}
.fm-prochain b{display:block;font-size:14px;color:var(--creme);margin-bottom:2px}
.fm-prochain .fm-jauge{margin-top:8px}
.fm-prochain .fm-jauge i{background:linear-gradient(90deg,var(--bronze),var(--argent))}
.fm-prochain small{display:block;margin-top:5px;font-size:11.5px;color:var(--pale)}
.fm-actions{margin:4px 16px 0}
.fm-vitrine{margin:26px 16px 0}
.fm-vitrine h2{margin:0;font-size:17px;font-weight:800}
.fm-indice{margin:2px 0 8px;font-size:12.5px;color:var(--pale)}
.fm-lien{display:block;margin:18px 16px 0;text-align:center;font-size:14px;color:var(--or);text-decoration:none;font-weight:600}
@keyframes fm-fondu{from{opacity:0}}
@keyframes fm-monte{from{transform:translateY(100%)}}
@keyframes fm-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes fm-scintille{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.15)}}
@keyframes fm-coud{0%{opacity:0;transform:translate(-50%,-50%) scale(2.8) rotate(-40deg)}60%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) rotate(-8deg)}}
@media (prefers-reduced-motion:reduce){.fm *{animation:none!important;transition:none!important}.fm-cage img.envol{opacity:0}.fm-cage-b.ouverte .porte{transform:scaleX(.12)}}
`;
