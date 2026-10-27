"use client";

// 🏪 LA VITRINE — la scène du commerce, avec les fantômes libérés à la fin de ses vidéos.
//
// Reprise de la scène du prototype « Les trois fantômes » : la façade dessinée,
// l'enseigne à son nom, le store, la vitrine sur sa salle (sa photo), le carnet
// où s'écrivent les prénoms de ceux qui viendront, la porte et son fantôme qui
// salue, le trottoir. Les fantômes se posent par leurs pieds : « J'adore » sur le
// trottoir, « Un jour » à la porte, « Aujourd'hui » à table derrière la vitre.
// Le sien est au premier rang, sur un halo rose, « Vous · Léa ».
//
// TOUT SE TOUCHE : un fantôme touché dit son prénom (s'il ne l'a pas caché), son
// geste et quand. Sous la scène, l'ardoise du commerçant, et pour soi « Cacher
// mon prénom ». Voir `lib/direct/vitrine-fantomes.ts`.
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { abonnerLook, lookDe, monLook } from "@/lib/direct/look";
import { quandEnClair } from "@/lib/direct/carnet";
import { tenueDu } from "@/lib/direct/double-metiers";
import { copieNommee } from "@/lib/direct/copies-presentation";
import type { Cage } from "@/lib/direct/cages";
import { fouleDemo, geste, placer, type Place, type Vitrine } from "@/lib/direct/vitrine-fantomes";
import { MOT_MAX, motPropre, motsDeLaListe } from "@/lib/direct/petits-mots";
import { ECUSSON, PLACES_ECUSSONS, type Ecusson } from "@/lib/direct/ecussons";
import { familleDuDouble } from "@/lib/direct/double-metiers";
import { EMOJI_GRADE, NOM_GRADE } from "@/lib/direct/famille";

/** L'image d'un fantôme selon sa cage : debout bras ouverts, la main levée, assis. */
function imageDe(look: string, cage: Place["f"]["cage"]): string {
  const l = lookDe(look);
  if (cage === "adore") return l.debout ?? l.image;
  if (cage === "un-jour") return l.salue ?? l.image;
  return l.image;
}

/** La place d'un fantôme dans la scène entière (ceux de la salle sont placés dans la vitrine). */
const dansLaScene = (p: Place) => (p.dedans ? { x: 4 + p.x * 0.5, y: 28 + p.y * 0.355 } : { x: p.x, y: p.y });

export function VitrineFantomes({
  nom,
  sous,
  interieur,
  hote,
  branche,
  vitrine,
  onPrenom,
  mots,
  onMot,
  moiDit = "Vous",
}: {
  nom: string;
  /** Sous l'enseigne : « RESTAURANT · DAX ». */
  sous?: string;
  /** La photo de sa salle, derrière la vitre. */
  interieur?: string;
  /** Son fantôme à lui, qui salue à la porte. */
  hote?: string;
  branche: string;
  vitrine: Vitrine;
  /** Montrer ou cacher son prénom (seulement quand son fantôme est là). */
  onPrenom?: (visible: boolean) => void;
  /** 💌 Les mots de la liste, et l'envoi de son petit mot (rend l'erreur à dire, ou `null`). */
  mots?: string[];
  onMot?: (texte: string, liste: boolean) => Promise<string | null>;
  /** Le mot sous son fantôme : « Vous » dans l'appli, « Toi » sur la page de la famille. */
  moiDit?: string;
}) {
  const [touche, setTouche] = useState<string | null>(null);
  const [maintenant] = useState(() => Date.now());
  const { places, reste } = placer(vitrine.fantomes);
  const dehors = places.filter((p) => !p.dedans);
  const dedans = places.filter((p) => p.dedans);
  const promis = places.filter((p) => p.f.cage === "un-jour" && p.f.prenom).slice(0, 4);
  const moi = vitrine.fantomes.find((f) => f.moi);
  const choisi = places.find((p) => p.f.id === touche);

  const fantome = (p: Place) => {
    const f = p.f;
    const style = { left: `${p.x}%`, top: `${p.y}%`, "--s": p.s, "--d": `${(Number(f.id.replace(/\D/g, "")) % 7) * 0.31}s` } as CSSProperties;
    return (
      <button
        key={f.id}
        type="button"
        className={`vf-fg ${f.cage}${f.moi ? " moi" : ""}`}
        style={style}
        aria-label={f.moi ? "Ton fantôme" : `${f.prenom || "Un fantôme"}, ${geste(f.cage, branche)}`}
        onClick={(e) => {
          e.stopPropagation();
          setTouche(touche === f.id ? null : f.id);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageDe(f.look, f.cage)} alt="" draggable={false} />
        {f.moi && <span className="nom">{f.prenom && vitrine.prenomVisible ? `${moiDit} · ${f.prenom}` : moiDit}</span>}
        {f.coeur && !f.ecussons?.includes("coeur") && (
          <i className="vf-coeur" aria-hidden="true">
            💛
          </i>
        )}
        {f.ecussons && f.ecussons.length > 0 && <Ecussons liste={f.ecussons} />}
        {/* 👻 Son écusson de la famille : la couleur de son palier, cousue à son numéro. */}
        {f.grade && f.numero ? (
          <i className={`vf-palier ${f.grade}`} aria-hidden="true">
            <b>{f.numero}</b>
          </i>
        ) : null}
      </button>
    );
  };

  return (
    <div className="vf">
      <div className="vf-sc" onClick={() => setTouche(null)}>
        <div className="vf-fac" />
        <div className="vf-ens">
          <b>{nom}</b>
          {sous && <small>{sous}</small>}
        </div>
        <div className="vf-store" />
        <div className="vf-vit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {interieur ? <img src={interieur} alt="" /> : null}
          <div className="vf-salle">{dedans.map(fantome)}</div>
        </div>
        <div className="vf-carnet" aria-label="Le carnet">
          <b>Le carnet</b>
          {promis.map((p) => (
            <span key={p.f.id}>{p.f.prenom}</span>
          ))}
        </div>
        <div className="vf-pied" />
        <div className="vf-porte">
          <i />
        </div>
        <span className="vf-ouvert">OUVERT</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hote ? <img className="vf-hote" src={hote} alt="" /> : null}
        <div className="vf-trot" />
        <div className="vf-calque">{dehors.map(fantome)}</div>
        {reste > 0 && <span className="vf-plus">+{reste}</span>}
        {choisi && (
          <div className="vf-bulle" style={{ left: `${Math.min(68, Math.max(32, dansLaScene(choisi).x))}%`, top: `${dansLaScene(choisi).y}%` } as CSSProperties}>
            <b>{choisi.f.moi ? "C’est toi !" : choisi.f.prenom || "Un fantôme"}</b>
            {choisi.f.grade && choisi.f.numero ? (
              <i className="vf-num">
                Fantôme n°{choisi.f.numero} · {EMOJI_GRADE[choisi.f.grade]} {NOM_GRADE[choisi.f.grade]}
              </i>
            ) : null}
            <span>
              {geste(choisi.f.cage, branche)} · {quandEnClair(choisi.f.le, maintenant)}
            </span>
            {choisi.f.mot && <q>{choisi.f.mot}</q>}
            {/* Ses écussons — sans redire le coup de cœur que la maison a eu ici (dit juste dessous). */}
            {(() => {
              const dits = (choisi.f.ecussons ?? []).filter((e) => e !== "coeur" || !choisi.f.coeur);
              return dits.length > 0 && <small>{dits.map((e) => `${ECUSSON[e].icone} ${e === "pin" ? "Pin de la maison" : ECUSSON[e].nom}`).join(" · ")}</small>;
            })()}
            {choisi.f.cadeau ? <em>🎁 La maison lui a offert {choisi.f.cadeau}</em> : choisi.f.coeur ? <em>💛 Coup de cœur de la maison</em> : null}
          </div>
        )}
      </div>

      {(vitrine.ardoise || vitrine.coupDeCoeur) && (
        <div className="vf-ardoise">
          {vitrine.ardoise && (
            <p>
              <small>L’ardoise</small>
              {vitrine.ardoise}
            </p>
          )}
          {vitrine.coupDeCoeur && (
            <p className="coeur">
              <small>💛 Le coup de cœur de la maison</small>« {vitrine.coupDeCoeur.texte} »{vitrine.coupDeCoeur.prenom ? ` — ${vitrine.coupDeCoeur.prenom}` : ""}
            </p>
          )}
        </div>
      )}
      {moi && onMot && mots && <PetitMot nom={nom} mots={mots} deja={Boolean(vitrine.ecritAujourdhui)} sien={moi.mot} onMot={onMot} />}
      {moi && onPrenom && (
        <p className="vf-moi">
          {moi.prenom && vitrine.prenomVisible ? "Ton fantôme et ton prénom sont" : "Ton fantôme est"} dans cette vitrine.{" "}
          {moi.prenom && (
            <button type="button" onClick={() => onPrenom(!vitrine.prenomVisible)}>
              {vitrine.prenomVisible ? "Cacher mon prénom" : "Montrer mon prénom"}
            </button>
          )}
        </p>
      )}
      <style>{STYLES + STYLES_ECUSSONS}</style>
    </div>
  );
}

/** Le petit pin du commerce (une fourchette, comme dans le prototype). */
const ICONE_PIN = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 3v7a2 2 0 0 0 2 2M12 3v18M8 3v4M16 3c-1.5 2-1.5 6 0 8v10" />
  </svg>
);

/** 🧵 SES ÉCUSSONS, cousus sur le bas de son fantôme (`neufs` : ceux qui se cousent sous nos yeux). */
export function Ecussons({ liste, neufs = [] }: { liste: Ecusson[]; neufs?: Ecusson[] }) {
  const places = PLACES_ECUSSONS[Math.min(3, liste.length)];
  return (
    <span className="vf-ecussons" aria-hidden="true">
      {liste.slice(0, 3).map((id, k) => (
        <span
          key={id}
          className={`vf-ecus${id === "pin" ? " pin" : ""}${neufs.includes(id) ? " neuf" : ""}`}
          style={{ left: `${places[k][0]}%`, top: `${places[k][1]}%`, "--e": ECUSSON[id].couleur, "--r": `${k % 2 ? 8 : -8}deg` } as CSSProperties}
        >
          {id === "pin" ? ICONE_PIN : <i>{ECUSSON[id].icone}</i>}
        </span>
      ))}
    </span>
  );
}

/** 💌 « UN PETIT MOT À… » : un mot de la liste d'un appui, ou le sien, écrit (140 signes) — un par jour. */
function PetitMot({
  nom,
  mots,
  deja,
  sien,
  onMot,
}: {
  nom: string;
  mots: string[];
  deja: boolean;
  sien?: string;
  onMot: (texte: string, liste: boolean) => Promise<string | null>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [ennui, setEnnui] = useState("");
  const [occupe, setOccupe] = useState(false);
  const envoyer = async (t: string, liste: boolean) => {
    setEnnui("");
    setOccupe(true);
    const e = await onMot(t, liste);
    setOccupe(false);
    if (e) setEnnui(e);
    else {
      setEnvoye(true);
      setOuvert(false);
    }
  };
  if (envoye || deja)
    return (
      <p className="vf-mot-fait">
        💌 Ton petit mot du jour est parti{sien ? ` : « ${sien} »` : ""}. {nom} le lira à son comptoir.
      </p>
    );
  if (!ouvert)
    return (
      <button type="button" className="vf-mot-ouvrir" onClick={() => setOuvert(true)}>
        ✍️ Un petit mot pour {nom}
      </button>
    );
  return (
    <div className="vf-mot">
      <b>Un petit mot pour {nom}</b>
      <div className="vf-mot-liste">
        {mots.map((m) => (
          <button key={m} type="button" disabled={occupe} onClick={() => void envoyer(m, true)}>
            {m}
          </button>
        ))}
      </div>
      <textarea value={texte} maxLength={MOT_MAX} rows={2} placeholder="Ou écris le tien…" onChange={(e) => setTexte(e.target.value)} aria-label="Ton petit mot" />
      <div className="vf-mot-bas">
        <small>Un mot écrit apparaît dans sa vitrine s’il a un coup de cœur. Un par jour.</small>
        <button type="button" className="vf-mot-envoyer" disabled={occupe || !texte.trim()} onClick={() => void envoyer(texte, false)}>
          Envoyer
        </button>
      </div>
      {ennui && (
        <p className="vf-mot-ennui" role="alert">
          {ennui}
        </p>
      )}
    </div>
  );
}

/* SON PETIT MOT DU JOUR DANS LA DÉMONSTRATION, par commerce : gardé dans ce téléphone. */
const CLE_MOTS = "clikme-mots-demo-v1";
function lireMotDemo(cle: string): string {
  try {
    const v = (JSON.parse(window.localStorage.getItem(CLE_MOTS) || "{}") as Record<string, { texte: string; jour: string }>)[cle];
    return v && v.jour === new Date().toISOString().slice(0, 10) ? v.texte : "";
  } catch {
    return "";
  }
}
function garderMotDemo(cle: string, texte: string) {
  try {
    const tous = JSON.parse(window.localStorage.getItem(CLE_MOTS) || "{}") as Record<string, unknown>;
    window.localStorage.setItem(CLE_MOTS, JSON.stringify({ ...tous, [cle]: { texte, jour: new Date().toISOString().slice(0, 10) } }));
  } catch {
    /* stockage indisponible */
  }
}

/* SON PRÉNOM DANS LES VITRINES DE LA DÉMONSTRATION : gardé dans ce téléphone (« non » : caché). */
const CLE_PRENOM = "clikme-vitrine-prenom";
const prenomDemoVisible = () => {
  try {
    return window.localStorage.getItem(CLE_PRENOM) !== "non";
  } catch {
    return true;
  }
};

/**
 * LA VITRINE D'UN COMMERCE, SOUS SES CAGES : celle de la base dans une vraie ville
 * (`api/direct/vitrine`), la foule inventée d'un commerce de la démonstration — jamais
 * pour un vrai commerçant (copie de présentation) : sa vitrine resterait vide d'autres.
 */
export function VitrineDuCommerce({
  carte,
  cage,
  prenom,
  ardoise,
  moiDit,
}: {
  carte: { id: string; nom: string; branche: string; metier?: string; photo?: string; villeReelle?: string };
  /** La cage qu'il vient de libérer. */
  cage: Cage;
  prenom: string;
  /** Dans la démonstration : ce qui se passe en ce moment (« Le service du midi »). */
  ardoise?: string;
  /** « Toi » sur la page de la famille (« Vous » sinon). */
  moiDit?: string;
}) {
  const look = useSyncExternalStore(abonnerLook, monLook, monLook);
  const reelle = Boolean(carte.villeReelle);
  const [vraie, setVraie] = useState<Vitrine | null>(null);
  const [visibleDemo, setVisibleDemo] = useState(prenomDemoVisible);
  const [maintenant] = useState(() => Date.now());
  /** Relire la vitrine (après son petit mot). */
  const [tour, setTour] = useState(0);
  const [motDemo, setMotDemo] = useState(() => lireMotDemo(carte.id));
  const liste = motsDeLaListe(familleDuDouble(carte));

  useEffect(() => {
    if (!reelle) return;
    let fini = false;
    const lire = () =>
      void fetch(`/api/direct/vitrine?slug=${encodeURIComponent(carte.id)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: (Vitrine & { ok?: boolean }) | null) => {
          if (!fini && j?.ok)
            setVraie({
              fantomes: j.fantomes ?? [],
              ardoise: j.ardoise ?? null,
              prenomVisible: j.prenomVisible !== false,
              coupDeCoeur: j.coupDeCoeur ?? null,
              ecritAujourdhui: Boolean(j.ecritAujourdhui),
            });
        })
        .catch(() => undefined);
    lire();
    // SA CAGE PART EN MÊME TEMPS QUE CETTE LECTURE : on relit un peu après, pour la trouver chez le serveur.
    const t = window.setTimeout(lire, 2500);
    return () => {
      fini = true;
      window.clearTimeout(t);
    };
    // `cage` : sa cage vient de changer, la vitrine se relit ; `tour` : son petit mot vient de partir.
  }, [reelle, carte.id, cage, tour]);

  /** 💌 Son petit mot : à la route dans une vraie ville, dans ce téléphone dans la démonstration. */
  const envoyerMot = async (texte: string, deLaListe: boolean): Promise<string | null> => {
    const propre = motPropre(texte);
    if (!propre) return "Le mot est vide.";
    if (!reelle) {
      garderMotDemo(carte.id, propre);
      setMotDemo(propre);
      return null;
    }
    try {
      const r = await fetch("/api/direct/mot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: carte.id, texte: propre, liste: deLaListe }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) return j.error || "Le mot n’est pas parti. Réessaie dans un instant.";
      setTour((x) => x + 1);
      return null;
    } catch {
      return "Pas de réseau : le mot n’est pas parti.";
    }
  };

  const changerPrenom = (visible: boolean) => {
    if (!reelle) {
      try {
        window.localStorage.setItem(CLE_PRENOM, visible ? "oui" : "non");
      } catch {
        /* stockage indisponible */
      }
      setVisibleDemo(visible);
      return;
    }
    setVraie((v) => (v ? { ...v, prenomVisible: visible } : v));
    void fetch("/api/direct/vitrine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prenom", visible }) }).catch(() => undefined);
  };

  const sien = { id: "moi", prenom, look: look.id, cage, le: new Date(maintenant).toISOString(), moi: true };
  // Dans la vraie ville, son fantôme est là tout de suite — même si sa cage n'est pas encore arrivée au serveur.
  let vitrine: Vitrine | null = vraie && {
    ...vraie,
    fantomes: vraie.fantomes.some((f) => f.moi) ? vraie.fantomes.map((f) => (f.moi ? { ...f, cage } : f)) : [...vraie.fantomes, sien],
  };
  if (!reelle) {
    if (copieNommee(carte.id)) return null;
    vitrine = {
      // La foule inventée porte des mots de la liste (un sur trois), et des écussons (qui a promis a souvent tenu parole).
      fantomes: [
        ...fouleDemo(carte.id, maintenant).map((f, k) => ({
          ...f,
          ...(k % 3 === 0 ? { mot: liste[k % liste.length] } : {}),
          ...(f.cage !== "adore" && k % 2 === 0 ? { ecussons: (k % 4 === 0 ? ["parole", "pin"] : ["parole"]) as Ecusson[] } : k % 5 === 1 ? { ecussons: ["coeur"] as Ecusson[] } : {}),
        })),
        { ...sien, ...(motDemo ? { mot: motDemo } : {}) },
      ],
      ardoise: ardoise ?? null,
      prenomVisible: visibleDemo,
      ecritAujourdhui: Boolean(motDemo),
    };
  }
  if (!vitrine) return null;
  const ville = carte.villeReelle ? carte.villeReelle.replace(/^./, (x) => x.toUpperCase()) : "";
  return (
    <VitrineFantomes
      nom={carte.nom}
      sous={[carte.metier, ville].filter(Boolean).join(" · ")}
      interieur={carte.photo}
      hote={`${tenueDu(carte)?.enPied ?? "/direct/double/pied/"}salut-1.webp`}
      branche={carte.branche}
      vitrine={vitrine}
      onPrenom={changerPrenom}
      mots={liste}
      onMot={envoyerMot}
      moiDit={moiDit}
    />
  );
}

/** 🏠 DANS LES RÉGLAGES DE MA MAISON : son prénom dans les vitrines, visible ou caché. */
export function PrenomDansLesVitrines({ reelle }: { reelle: boolean }) {
  const [visible, setVisible] = useState<boolean | null>(() => (reelle ? null : prenomDemoVisible()));
  useEffect(() => {
    if (!reelle) return;
    let fini = false;
    void fetch("/api/direct/vitrine?moi=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { prenomVisible?: boolean } | null) => {
        if (!fini) setVisible(j?.prenomVisible !== false);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [reelle]);
  if (visible === null) return null;
  const changer = () => {
    const v = !visible;
    setVisible(v);
    if (!reelle) {
      try {
        window.localStorage.setItem(CLE_PRENOM, v ? "oui" : "non");
      } catch {
        /* stockage indisponible */
      }
      return;
    }
    void fetch("/api/direct/vitrine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prenom", visible: v }) }).catch(() => undefined);
  };
  return (
    <div className="ap-aide">
      <b>Mes vitrines</b>
      <button type="button" onClick={changer} aria-pressed={visible}>
        <span>
          Mon prénom dans les vitrines
          <em>{visible ? "Visible à côté de ton fantôme, chez les commerces où tu l’as libéré" : "Caché : seul ton fantôme se voit"}</em>
        </span>
        <s aria-hidden="true">{visible ? "Oui" : "Non"}</s>
      </button>
    </div>
  );
}

/** Le style des écussons — dans la vitrine, et sur le grand fantôme de Ma Maison (`mes-ecussons.tsx`). */
export const STYLES_ECUSSONS = `
.vf-ecussons{position:absolute;inset:0;pointer-events:none;}
.vf-fg.aujourdhui .vf-ecussons{top:6%;}
.vf-ecus{position:absolute;width:17%;aspect-ratio:1;transform:translate(-50%,-50%) rotate(var(--r,0deg));border-radius:50%;container-type:inline-size;display:grid;place-items:center;
  background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.38),transparent 58%),var(--e);box-shadow:0 1px 2px rgba(0,0,0,.5);}
.vf-ecus::before{content:"";position:absolute;inset:9%;border-radius:50%;border:max(.6px,5cqw) dashed rgba(255,248,234,.85);}
.vf-ecus i{font-style:normal;font-size:52cqw;line-height:1;color:#FFF8EA;text-shadow:0 1px 1px rgba(0,0,0,.35);}
.vf-ecus svg{width:58%;height:58%;fill:none;stroke:#6A1626;stroke-width:2.6;stroke-linecap:round;}
.vf-ecus.pin{background:radial-gradient(circle at 35% 30%,#FFE6A6,#C9962E);}
.vf-ecus.pin::before{border-color:rgba(106,22,38,.5);}
.vf-ecus.neuf{animation:vf-coud .9s cubic-bezier(.2,1.5,.4,1) both;}
@keyframes vf-coud{0%{opacity:0;transform:translate(-50%,-50%) scale(2.8) rotate(-40deg)}60%{opacity:1}}
@media (prefers-reduced-motion:reduce){.vf-ecus.neuf{animation:none!important;}}
`;

const STYLES = `
.vf{--or:#E8C77A;--papier:#FFF8EA;--encre:#2A1A10;--bordeaux:#5E1628;--rose:#FF2E9A;--creme:#FFF4E6;display:flex;flex-direction:column;gap:8px;margin-top:10px;}
.vf-sc{position:relative;z-index:0;isolation:isolate;width:100%;aspect-ratio:360/430;container-type:inline-size;overflow:hidden;border-radius:18px;background:linear-gradient(#0B0608,#170C10 40%);}
.vf-sc::before{content:"";position:absolute;left:-20%;top:-30%;width:70%;height:60%;background:radial-gradient(closest-side,rgba(255,196,120,.22),transparent);z-index:1;}
.vf-fac{position:absolute;left:0;right:0;top:2%;height:64%;z-index:2;
  background:linear-gradient(90deg,rgba(0,0,0,.3),transparent 18%,transparent 82%,rgba(0,0,0,.35)),repeating-linear-gradient(90deg,transparent 0 11.6cqw,rgba(0,0,0,.12) 11.6cqw 11.9cqw),linear-gradient(#62182B,#45101F);}
.vf-ens{position:absolute;left:7%;right:7%;top:3.2%;height:12%;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6cqw;border-radius:1cqw;background:#2C0912;
  box-shadow:inset 0 0 0 .55cqw #2C0912,inset 0 0 0 .85cqw rgba(201,164,92,.75),0 1.2cqw 2.4cqw rgba(0,0,0,.45);}
.vf-ens b{max-width:92%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:italic 700 6.6cqw/1.05 Georgia,serif;color:var(--or);text-shadow:0 0 3cqw rgba(232,199,122,.4);}
.vf-ens small{font:700 1.9cqw/1 system-ui,sans-serif;letter-spacing:.4em;color:rgba(232,199,122,.8);text-transform:uppercase;}
.vf-store{position:absolute;left:3%;right:3%;top:16.8%;height:8.2%;z-index:4;
  background:linear-gradient(rgba(0,0,0,.28),transparent 45%),repeating-linear-gradient(90deg,#F3E5D0 0 5.4cqw,#8E1C33 5.4cqw 10.8cqw);
  -webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 2.7cqw) no-repeat,radial-gradient(circle at 50% 0,#000 2.65cqw,transparent 2.75cqw) bottom/5.4cqw 2.7cqw repeat-x;
  mask:linear-gradient(#000 0 0) top/100% calc(100% - 2.7cqw) no-repeat,radial-gradient(circle at 50% 0,#000 2.65cqw,transparent 2.75cqw) bottom/5.4cqw 2.7cqw repeat-x;
  filter:drop-shadow(0 1cqw 1cqw rgba(0,0,0,.5));}
.vf-vit{position:absolute;left:4%;width:50%;top:28%;height:35.5%;z-index:3;border-radius:1cqw;overflow:hidden;background:radial-gradient(ellipse at 50% 80%,#7A3A1C,#1A0D08 75%);
  box-shadow:inset 0 0 0 1.2cqw #2A0810,0 0 0 .55cqw #C9A45C,0 0 9cqw rgba(255,170,90,.38);container-type:inline-size;}
.vf-vit > img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 70%;filter:saturate(1.08) brightness(1.02);}
.vf-vit::after{content:"";position:absolute;inset:0;z-index:30;pointer-events:none;
  background:linear-gradient(90deg,transparent calc(50% - .5cqw),#2A0810 calc(50% - .5cqw) calc(50% + .5cqw),transparent 0),
    linear-gradient(112deg,rgba(255,255,255,.16),transparent 26%,transparent 62%,rgba(255,255,255,.07) 70%,transparent 78%);
  box-shadow:inset 0 0 0 1.2cqw #2A0810;}
.vf-salle{position:absolute;inset:0;z-index:20;}
.vf-salle .vf-fg{height:calc(var(--s) * 31cqw);}
.vf-carnet{position:absolute;left:56.5%;width:14.5%;top:41%;height:14.5%;z-index:4;padding:1.1cqw 1.1cqw .6cqw;border-radius:.6cqw;background:var(--papier);color:var(--encre);
  background-image:linear-gradient(90deg,transparent calc(50% - .15cqw),rgba(0,0,0,.18) calc(50% - .15cqw) calc(50% + .15cqw),transparent 0),repeating-linear-gradient(transparent 0 2.6cqw,rgba(70,90,160,.18) 2.6cqw 2.75cqw);
  box-shadow:0 1cqw 1.6cqw rgba(0,0,0,.55);transform:rotate(-3deg);overflow:hidden;}
.vf-carnet b{display:block;font:700 2.6cqw/1 Georgia,serif;color:#E0167A;}
.vf-carnet span{display:block;font:600 2.35cqw/1.12 Georgia,serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vf-pied{position:absolute;left:63.2%;width:1.6%;top:55%;height:11%;z-index:3;background:linear-gradient(90deg,#2A140A,#4A2814);border-radius:.4cqw;}
.vf-porte{position:absolute;left:73%;width:22%;top:29%;height:37%;z-index:3;border-radius:1.2cqw 1.2cqw 0 0;background:linear-gradient(#3C0C17,#290810);box-shadow:inset 0 0 0 .6cqw #C9A45C;}
.vf-porte i{position:absolute;left:14%;right:14%;top:8%;height:47%;border-radius:.8cqw;background:radial-gradient(ellipse at 50% 85%,#FFC27A,#B9652B 58%,#4A1E10);box-shadow:inset 0 0 2cqw rgba(0,0,0,.55);}
.vf-porte::after{content:"";position:absolute;right:12%;top:60%;width:2.2cqw;height:2.2cqw;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFE6A6,#B98A2E);}
.vf-ouvert{position:absolute;left:78.5%;top:36%;z-index:5;padding:.5cqw 1.4cqw;border-radius:.6cqw;background:var(--papier);color:var(--bordeaux);font:800 2cqw/1 system-ui,sans-serif;letter-spacing:.12em;transform:rotate(-4deg);box-shadow:0 .6cqw 1cqw rgba(0,0,0,.4);}
.vf-hote{position:absolute;left:84%;top:66%;height:24cqw;z-index:6;transform:translate(-50%,-100%);filter:drop-shadow(0 1cqw 1cqw rgba(0,0,0,.5));pointer-events:none;}
.vf-trot{position:absolute;left:0;right:0;top:66%;bottom:0;z-index:2;
  background:radial-gradient(ellipse 60% 70% at 29% 0,rgba(255,180,100,.26),transparent 70%),radial-gradient(ellipse 30% 50% at 84% 0,rgba(255,180,100,.18),transparent 70%),
    repeating-linear-gradient(90deg,transparent 0 9cqw,rgba(0,0,0,.2) 9cqw 9.35cqw),linear-gradient(#3E322D,#262020);}
.vf-trot::before{content:"";position:absolute;left:0;right:0;top:0;height:1.4cqw;background:linear-gradient(rgba(0,0,0,.55),transparent);}
.vf-calque{position:absolute;inset:0;z-index:10;pointer-events:none;}
.vf-calque .vf-fg{pointer-events:auto;}
.vf-plus{position:absolute;left:3%;top:68.5%;z-index:400;padding:.6cqw 2cqw;border-radius:9cqw;background:rgba(20,12,9,.78);font:800 2.6cqw/1.2 system-ui,sans-serif;color:var(--creme);}
.vf-fg{position:absolute;height:calc(var(--s) * 15.5cqw);aspect-ratio:.91;transform:translate(-50%,-100%);padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.vf-fg img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 .7cqw .6cqw rgba(0,0,0,.5));transform-origin:50% 100%;pointer-events:none;}
.vf-fg.adore img{animation:vf-hop 2.6s ease-in-out infinite;animation-delay:var(--d,0s);}
.vf-fg.un-jour img{animation:vf-penche 3.4s ease-in-out infinite;animation-delay:var(--d,0s);}
.vf-fg.aujourdhui img{animation:vf-souffle 4s ease-in-out infinite;animation-delay:var(--d,0s);}
@keyframes vf-hop{0%,66%,100%{transform:none}74%{transform:translateY(-13%) rotate(-4deg)}82%{transform:none}90%{transform:translateY(-6%) rotate(3deg)}}
@keyframes vf-penche{0%,100%{transform:rotate(0)}50%{transform:rotate(-6deg)}}
@keyframes vf-souffle{50%{transform:translateY(-3%)}}
.vf-fg .nom{position:absolute;left:50%;top:0;z-index:2;transform:translate(-50%,-140%);padding:.6cqw 2.3cqw;border-radius:9cqw;background:var(--rose);color:#fff;
  font:800 3.2cqw/1.25 system-ui,sans-serif;white-space:nowrap;box-shadow:0 0 0 .45cqw #fff,0 1cqw 2cqw rgba(0,0,0,.55);animation:vf-repere 1.7s ease-in-out infinite;}
.vf-salle .vf-fg .nom{font-size:6cqw;}
.vf-fg.moi{z-index:5;}
.vf-fg.moi::before{content:"";position:absolute;left:-22%;right:-22%;bottom:-10%;height:26%;border-radius:50%;z-index:-1;
  background:radial-gradient(closest-side,rgba(255,46,154,.95),rgba(255,46,154,.4) 55%,transparent);animation:vf-halo 1.7s ease-in-out infinite;}
@keyframes vf-repere{50%{transform:translate(-50%,-158%)}}
@keyframes vf-halo{50%{opacity:.55;transform:scale(.82)}}
.vf-bulle{position:absolute;z-index:450;transform:translate(-50%,calc(-100% - 17cqw));max-width:60%;padding:1.6cqw 2.6cqw;border-radius:2.6cqw;background:#fff;color:#1E1E22;
  display:flex;flex-direction:column;gap:.4cqw;box-shadow:0 1.4cqw 3cqw rgba(0,0,0,.45);pointer-events:none;}
.vf-bulle b{font:800 3.4cqw/1.15 system-ui,sans-serif;}
.vf-bulle span{font:600 2.9cqw/1.25 system-ui,sans-serif;color:#4A3A30;}
.vf-ardoise{display:flex;flex-direction:column;gap:8px;padding:10px 14px;border-radius:12px;background:#1E1E1C;border:3px solid #6B4A2E;color:#F4F1E8;font:600 15px/1.35 "Segoe Print","Comic Sans MS",cursive;text-align:center;}
.vf-ardoise p{margin:0;}
.vf-ardoise p.coeur{font-size:14px;}
.vf-ardoise p + p{padding-top:8px;border-top:1px dashed rgba(244,241,232,.25);}
.vf-ardoise small{display:block;margin-bottom:2px;font:800 10.5px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#E8C77A;}
@media (prefers-reduced-motion:reduce){.vf-fg img,.vf-fg .nom,.vf-fg.moi::before{animation:none!important;}}
.vf-bulle small{font:700 2.6cqw/1.3 system-ui,sans-serif;color:#1E8F69;}
.vf-bulle .vf-num{font:700 2.6cqw/1.3 system-ui,sans-serif;font-style:normal;color:#8A5A2B;}
.vf-palier{position:absolute;left:50%;top:50%;z-index:1;width:27%;aspect-ratio:1;transform:translate(-50%,-50%) rotate(-8deg);border-radius:50%;container-type:inline-size;display:grid;place-items:center;pointer-events:none;
  background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.45),transparent 58%),var(--e);box-shadow:0 1px 2px rgba(0,0,0,.5);}
.vf-palier::before{content:"";position:absolute;inset:10%;border-radius:50%;border:max(.5px,5cqw) dashed rgba(255,248,234,.85);}
.vf-palier b{font:800 38cqw/1 system-ui,sans-serif;color:#3A1D08;}
.vf-palier.bronze{--e:#C98A4B;}.vf-palier.argent{--e:#BFC5CF;}.vf-palier.or{--e:#E2B04A;}
.vf-fg.aujourdhui .vf-palier{top:56%;}
.vf-coeur{position:absolute;right:-6%;top:6%;font-style:normal;font-size:4.6cqw;line-height:1;filter:drop-shadow(0 .3cqw .5cqw rgba(0,0,0,.5));pointer-events:none;}
.vf-salle .vf-coeur{font-size:9cqw;}
.vf-bulle q{font:italic 600 2.9cqw/1.3 Georgia,serif;color:#2B1D16;}
.vf-bulle em{font:700 2.7cqw/1.25 system-ui,sans-serif;font-style:normal;color:#C4146E;}
.vf-mot-ouvrir{align-self:center;min-height:40px;padding:0 18px;border-radius:999px;border:1.5px solid #FF2E9A;background:rgba(255,46,154,.1);color:#FFC2E2;font-weight:800;font-size:14px;cursor:pointer;}
.vf-mot{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:#1F150F;border:1px solid rgba(255,235,215,.12);color:#FFF4E6;}
.vf-mot b{font-size:15px;font-weight:800;}
.vf-mot-liste{display:flex;flex-wrap:wrap;gap:6px;}
.vf-mot-liste button{padding:7px 12px;border-radius:999px;border:1px solid rgba(255,235,215,.2);background:#2A1D15;color:#FFF4E6;font-size:13px;font-weight:600;text-align:left;cursor:pointer;}
.vf-mot textarea{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,235,215,.2);background:#170F0B;color:#FFF4E6;font:inherit;font-size:14.5px;resize:vertical;}
.vf-mot-bas{display:flex;align-items:center;gap:10px;}
.vf-mot-bas small{flex:1;font-size:11.5px;line-height:1.35;color:#B3A59D;}
.vf-mot-envoyer{min-height:38px;padding:0 16px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:800;font-size:14px;cursor:pointer;}
.vf-mot-envoyer:disabled{opacity:.45;}
.vf-mot-ennui{margin:0;font-size:13px;color:#FFC2E2;}
.vf-mot-fait{margin:0;font-size:13px;line-height:1.4;color:#B3A59D;text-align:center;}
.vf-moi{margin:0;font-size:12.5px;line-height:1.4;color:#B3A59D;text-align:center;}
.vf-moi button{border:0;background:none;padding:0;color:#FF8CC6;text-decoration:underline;font:inherit;font-weight:700;cursor:pointer;}
`;
