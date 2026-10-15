"use client";

// 🎁 L'ÉCHANGE DE BONS ENTRE COMMERÇANTS — démonstration.
//
// « J'ai un restaurant, alors j'offre un coupon pour deux d'une valeur de 50 €
// pour venir manger chez moi, et en échange j'attends la même valeur chez un
// autre commerçant — un magasin de chaussures, un coiffeur — valable pour les
// employés ou pour le commerçant lui-même. Je crée un coupon, je le mets sur le
// "Tinder" des coupons, je swipe à droite, et si l'autre a swipé à droite
// aussi, il y a un match et un échange de coupons. »
//
// POURQUOI C'EST LA BONNE PORTE : ça marche SANS HABITANTS. Dès que deux
// commerçants de la ville sont inscrits, il y a quelque chose à échanger.
// Chacun donne au prix coûtant et reçoit au prix public, et chaque échange
// fait découvrir un commerce à un autre — puis à son équipe.
//
// CE QUI EST UNE DÉMONSTRATION : les bons des autres commerçants sont des
// EXEMPLES (étiquetés comme tels), et tout reste dans ce téléphone. Le sien,
// lui, est le vrai : son nom, son métier, sa photo.
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { COMMERCES_DEMO } from "@/lib/direct/missions-commercant";
import { tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";

type Modele = { titre: string; valeur: number; conditions: string[]; photo: string };

/** Ce que chaque métier mettrait naturellement en jeu — il change tout. */
const MODELES: Record<FamilleDouble, Modele> = {
  table: { titre: "Un dîner pour deux", valeur: 50, conditions: ["Du lundi au jeudi", "Le midi en semaine", "Hors jours fériés"], photo: "/direct/table/magret/3.jpg" },
  bar: { titre: "L’apéro pour quatre", valeur: 40, conditions: ["Avant 20 h", "Hors soirs de match", "Du mardi au jeudi"], photo: "/direct/soiree/saxo-du-soir.jpg" },
  coiffure: { titre: "Une coupe et un brushing", valeur: 45, conditions: ["En semaine avant 16 h", "Hors samedi", "Sur rendez-vous"], photo: "/direct/coiffure1.jpg" },
  ongles: { titre: "Une pose semi-permanente", valeur: 40, conditions: ["Le mardi et le mercredi", "Sur rendez-vous", "Hors samedi"], photo: "/direct/avis-ongles.jpg" },
  fleurs: { titre: "Un bouquet de saison", valeur: 35, conditions: ["Hors fête des mères", "À retirer en boutique", "En semaine"], photo: "/direct/bouquet-du-jour.jpg" },
  mode: { titre: "Un bon d’achat", valeur: 50, conditions: ["Hors soldes", "Sur toute la boutique", "Hors samedi"], photo: "/direct/mode-pull-mohair-marine.jpeg" },
  createur: { titre: "Un atelier bougie", valeur: 45, conditions: ["Le mercredi après-midi", "Sur réservation", "Pour une personne"], photo: "/direct/atelier-bougies.jpeg" },
  lunettes: { titre: "Un bon sur une monture", valeur: 50, conditions: ["Hors verres", "Sur toute la collection", "En semaine"], photo: "/direct/lunettes1.jpg" },
  seance: { titre: "Une séance découverte", valeur: 50, conditions: ["Sur rendez-vous", "En semaine", "Une heure"], photo: "/direct/cabinet-hypnose.jpeg" },
  librairie: { titre: "Deux livres au choix", valeur: 40, conditions: ["Hors beaux livres", "Sur tout le rayon poche", "En semaine"], photo: "/direct/livres/harry-quebert.jpg" },
};

const DISTANCES = ["120 m", "350 m", "200 m", "600 m", "450 m", "90 m", "800 m", "300 m", "250 m", "700 m"];

type Bon = {
  id: string;
  commerce: string;
  metier: string;
  prenom: string;
  visage: string;
  titre: string;
  valeur: number;
  conditions: string;
  jusqua: string;
  photo: string;
  distance: string;
  /** Il a déjà glissé à droite sur le tien : si tu l'aimes, c'est un match. */
  aime: boolean;
};

type MonBon = { titre: string; valeur: number; conditions: string; jusqua: string; photo: string };
type Etat = { monBon?: MonBon; vus: string[]; aimes: string[]; matchs: string[] };

const VIDE: Etat = { vus: [], aimes: [], matchs: [] };
const cle = (c: CommerceComptoir) => `clikme-echanges-${c.id}`;

function charger(c: CommerceComptoir): Etat {
  if (typeof window === "undefined") return VIDE;
  try {
    const o = JSON.parse(window.localStorage.getItem(cle(c)) ?? "null") as Etat | null;
    return o && Array.isArray(o.vus) ? { ...VIDE, ...o } : VIDE;
  } catch {
    return VIDE;
  }
}
function garder(c: CommerceComptoir, e: Etat) {
  try {
    window.localStorage.setItem(cle(c), JSON.stringify(e));
  } catch {
    /* plein ou interdit : l'écran marche quand même, le temps de la visite */
  }
}

const finDeMois = (mois: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + mois + 1, 0);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
};
const DUREES = [
  { mot: "1 mois", jusqua: () => finDeMois(0) },
  { mot: "3 mois", jusqua: () => finDeMois(2) },
  { mot: "Fin d’année", jusqua: () => "31 décembre" },
];

/** Les bons des autres commerçants de la démonstration — le deuxième et le quatrième t'ont déjà aimé. */
function bonsDesAutres(moi: CommerceComptoir): Bon[] {
  return COMMERCES_DEMO.filter((c) => c.famille !== moi.famille).map((c, i) => {
    const m = MODELES[c.famille];
    const dossier = tenueDu({ branche: c.branche, metier: c.metier })?.enPied ?? "/direct/double/pied/";
    return {
      id: c.id,
      commerce: c.nom,
      metier: c.metier,
      prenom: c.prenom,
      visage: `${dossier}visage.webp`,
      titre: m.titre,
      valeur: m.valeur,
      conditions: m.conditions[0],
      jusqua: i % 2 ? "31 décembre" : finDeMois(2),
      photo: m.photo,
      distance: DISTANCES[i % DISTANCES.length],
      aime: i === 1 || i === 3,
    };
  });
}

/** Le code à présenter sur place. */
function useQr(texte: string | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!texte) return;
    let fini = false;
    QRCode.toDataURL(texte, { margin: 1, width: 360, color: { dark: "#1C1411", light: "#FFF4E6" } })
      .then((u) => {
        if (!fini) setUrl(u);
      })
      .catch(() => {
        /* sans code, le numéro du bon s'affiche quand même */
      });
    return () => {
      fini = true;
    };
  }, [texte]);
  return texte ? url : "";
}

/** Un code court et stable pour un échange — lisible au comptoir, sans lettres ambiguës. */
function codeDu(moi: CommerceComptoir, b: Bon): string {
  let h = 2166136261;
  for (const ch of `${moi.id}|${b.id}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0, x = h >>> 0; i < 6; i++, x = Math.floor(x / alphabet.length)) code += alphabet[x % alphabet.length];
  return `CLK-${code}`;
}

/* ═══ LA CARTE DE L'ACCUEIL ═══════════════════════════════════════════════ */
export function CarteEchanges({ commerce, onOuvrir }: { commerce: CommerceComptoir; onOuvrir: () => void }) {
  const [etat] = useState<Etat>(() => charger(commerce));
  const recus = bonsDesAutres(commerce).filter((b) => etat.matchs.includes(b.id));
  return (
    <button type="button" className={`cz-relance cz-echanges${etat.monBon ? "" : " chaud"}`} onClick={onOuvrir}>
      <span className="cz-relance-i">🎁</span>
      <span>
        <b>
          Échanger avec les commerçants
          <i className="cz-pastille calme">Exemple</i>
        </b>
        <em>
          {recus.length
            ? `${recus.length} échange${recus.length > 1 ? "s" : ""} : ${recus.reduce((s, b) => s + b.valeur, 0)} € reçus chez tes voisins.`
            : "Ton bon contre celui d’un voisin : le resto, le coiffeur, la boutique…"}
        </em>
      </span>
      <s aria-hidden="true">→</s>
    </button>
  );
}

/* ═══ L'ÉCRAN ═════════════════════════════════════════════════════════════ */
export function EchangesComptoir({ commerce, dossier, onRetour }: { commerce: CommerceComptoir; dossier: string; onRetour: () => void }) {
  const [etat, setEtat] = useState<Etat>(() => charger(commerce));
  const changer = (maj: (e: Etat) => Etat) =>
    setEtat((e) => {
      const suite = maj(e);
      garder(commerce, suite);
      return suite;
    });
  const autres = useMemo(() => bonsDesAutres(commerce), [commerce]);
  const [vue, setVue] = useState<"jeu" | "mes">("jeu");
  const [edition, setEdition] = useState(false);
  const [match, setMatch] = useState<Bon | null>(null);
  const [envoye, setEnvoye] = useState<Bon | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);

  const reste = autres.filter((b) => !etat.vus.includes(b.id));
  const recus = autres.filter((b) => etat.matchs.includes(b.id));
  const enAttente = autres.filter((b) => etat.aimes.includes(b.id) && !etat.matchs.includes(b.id));

  const decider = (b: Bon, aime: boolean) => {
    changer((e) => ({
      ...e,
      vus: [...e.vus, b.id],
      aimes: aime ? [...e.aimes, b.id] : e.aimes,
      matchs: aime && b.aime ? [...e.matchs, b.id] : e.matchs,
    }));
    if (aime && b.aime) setMatch(b);
    else if (aime) {
      setEnvoye(b);
      window.setTimeout(() => setEnvoye((x) => (x === b ? null : x)), 2600);
    }
  };

  const recommencer = () => changer((e) => ({ ...e, vus: [], aimes: [], matchs: [] }));

  return (
    <div className="ec">
      <StylesEchanges />
      <div className="ec-haut">
        <button type="button" className="ec-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="ec-exemple">Exemple</span>
      </div>

      {!etat.monBon || edition ? (
        <MonBonForm
          commerce={commerce}
          dossier={dossier}
          initial={etat.monBon}
          onValider={(monBon) => {
            changer((e) => ({ ...e, monBon }));
            setEdition(false);
          }}
        />
      ) : (
        <>
          <div className="ec-onglets" role="tablist">
            <button type="button" role="tab" aria-selected={vue === "jeu"} className={vue === "jeu" ? "on" : ""} onClick={() => setVue("jeu")}>
              Découvrir · {reste.length}
            </button>
            <button type="button" role="tab" aria-selected={vue === "mes"} className={vue === "mes" ? "on" : ""} onClick={() => setVue("mes")}>
              Mes échanges{recus.length ? ` · ${recus.length}` : ""}
            </button>
          </div>

          {vue === "jeu" ? (
            <>
              {envoye ? (
                /* LE CŒUR SANS MATCH SE DIT À LA PLACE DE SON BON — pas par-dessus les boutons. */
                <p className="ec-toast" role="status">
                  ♥ Envoyé à {envoye.prenom}. S’il aime ton bon aussi, c’est un match.
                </p>
              ) : (
                <div className="ec-mien" onClick={() => setEdition(true)} role="button" tabIndex={0} onKeyDown={(ev) => ev.key === "Enter" && setEdition(true)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={etat.monBon.photo} alt="" />
                  <span>
                    <em>Ton bon en jeu</em>
                    <b>
                      {etat.monBon.titre} · {etat.monBon.valeur} €
                    </b>
                  </span>
                  <i>Modifier</i>
                </div>
              )}

              {reste.length ? (
                <Pile key={reste[0].id} bons={reste} onDecider={decider} />
              ) : (
                <div className="ec-fin">
                  <p>Tu as vu tous les bons de la ville pour aujourd’hui.</p>
                  <p className="ec-gris">De nouveaux commerçants arrivent chaque semaine.</p>
                  <button type="button" className="cz-lien" onClick={recommencer}>
                    Recommencer la démonstration
                  </button>
                </div>
              )}
            </>
          ) : (
            <section className="ec-mes">
              <div className="ec-bilan">
                <span>
                  <b>{recus.length}</b> échange{recus.length > 1 ? "s" : ""}
                </span>
                <span>
                  <b>{recus.reduce((s, b) => s + b.valeur, 0)} €</b> reçus
                </span>
                <span>
                  <b>{enAttente.length}</b> en attente
                </span>
              </div>
              {recus.length === 0 && <p className="ec-gris">Pas encore de match : glisse à droite les bons qui te font envie.</p>}
              {recus.map((b) => (
                <BonRecu key={b.id} b={b} code={codeDu(commerce, b)} ouvert={ouvert === b.id} onOuvrir={() => setOuvert((x) => (x === b.id ? null : b.id))} />
              ))}
              {enAttente.length > 0 && (
                <>
                  <h3>En attente de leur réponse</h3>
                  {enAttente.map((b) => (
                    <div key={b.id} className="ec-attente">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.visage} alt="" />
                      <span>
                        <b>{b.commerce}</b>
                        <em>
                          {b.titre} · {b.valeur} €
                        </em>
                      </span>
                    </div>
                  ))}
                </>
              )}
              <section className="ec-aide">
                <h3>Bon à savoir</h3>
                <p>Tu donnes au prix coûtant, tu reçois au prix public : ton dîner à 50 € te coûte bien moins que 50 €.</p>
                <p>Limite ton bon à tes heures creuses : ce que tu offres te coûte encore moins.</p>
                <p>Un échange entre professionnels se facture des deux côtés : demande l’avis de ton comptable.</p>
              </section>
            </section>
          )}
        </>
      )}

      {match && etat.monBon && (
        <Match moi={commerce} monBon={etat.monBon} lui={match} code={codeDu(commerce, match)} dossier={dossier} onFermer={() => setMatch(null)} onVoir={() => {
          setMatch(null);
          setVue("mes");
          setOuvert(match.id);
        }} />
      )}
    </div>
  );
}

/* ═══ SON BON ═════════════════════════════════════════════════════════════ */
function MonBonForm({
  commerce,
  dossier,
  initial,
  onValider,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  initial?: MonBon;
  onValider: (b: MonBon) => void;
}) {
  const m = MODELES[commerce.famille];
  const [titre, setTitre] = useState(initial?.titre ?? m.titre);
  const [valeur, setValeur] = useState(initial?.valeur ?? m.valeur);
  const [conditions, setConditions] = useState(initial?.conditions ?? m.conditions[0]);
  const [duree, setDuree] = useState(1);
  const [photo, setPhoto] = useState(initial?.photo ?? commerce.photo ?? m.photo);
  const fichier = useRef<HTMLInputElement>(null);

  const choisir = async (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    try {
      const img = await new Promise<HTMLImageElement>((ok, ko) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = ko;
        i.src = url;
      });
      const k = Math.min(1, 900 / Math.max(img.width, img.height));
      const toile = document.createElement("canvas");
      toile.width = Math.round(img.width * k);
      toile.height = Math.round(img.height * k);
      toile.getContext("2d")?.drawImage(img, 0, 0, toile.width, toile.height);
      setPhoto(toile.toDataURL("image/jpeg", 0.82));
    } catch {
      /* photo illisible : on garde la précédente */
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <section className="ec-form">
      <div className="ec-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Ton bon à échanger</h2>
          <p>Ce que tu offres à un autre commerçant de la ville. En échange, tu reçois le sien, de la même valeur.</p>
        </div>
      </div>

      <button type="button" className="ec-photo" onClick={() => fichier.current?.click()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" />
        <span>📸 Changer la photo</span>
      </button>
      <input ref={fichier} type="file" accept="image/*" hidden onChange={(e) => void choisir(e.target.files?.[0])} />

      <label className="ec-champ">
        <span>Ce que tu offres</span>
        <input value={titre} maxLength={60} onChange={(e) => setTitre(e.target.value)} />
      </label>

      <div className="ec-champ">
        <span>Sa valeur</span>
        <div className="ec-puces">
          {[30, 40, 50, 80].map((v) => (
            <button key={v} type="button" className={valeur === v ? "on" : ""} onClick={() => setValeur(v)}>
              {v} €
            </button>
          ))}
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={300}
            aria-label="Autre valeur"
            value={valeur}
            onChange={(e) => setValeur(Math.max(0, Math.min(300, Number(e.target.value) || 0)))}
          />
        </div>
      </div>

      <div className="ec-champ">
        <span>Quand il est valable</span>
        <div className="ec-puces">
          {m.conditions.map((c) => (
            <button key={c} type="button" className={conditions === c ? "on" : ""} onClick={() => setConditions(c)}>
              {c}
            </button>
          ))}
        </div>
        <em className="ec-astuce">Astuce : tes heures creuses. Ce que tu offres te coûte alors le moins.</em>
      </div>

      <div className="ec-champ">
        <span>Jusqu’à quand</span>
        <div className="ec-puces">
          {DUREES.map((d, i) => (
            <button key={d.mot} type="button" className={duree === i ? "on" : ""} onClick={() => setDuree(i)}>
              {d.mot}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="cz-go grand"
        disabled={!titre.trim() || valeur < 10}
        onClick={() => onValider({ titre: titre.trim(), valeur, conditions, jusqua: DUREES[duree].jusqua(), photo })}
      >
        🎁 Mettre mon bon en jeu
      </button>
    </section>
  );
}

/* ═══ LA PILE À GLISSER ═══════════════════════════════════════════════════ */
function Pile({ bons, onDecider }: { bons: Bon[]; onDecider: (b: Bon, aime: boolean) => void }) {
  const [dx, setDx] = useState(0);
  const [sortie, setSortie] = useState<"g" | "d" | null>(null);
  /** Le doigt est posé : la carte suit sans transition. */
  const [tire, setTire] = useState(false);
  const depart = useRef<number | null>(null);
  const b = bons[0];
  const suivant = bons[1];

  const partir = (aime: boolean) => {
    if (sortie) return;
    setSortie(aime ? "d" : "g");
    window.setTimeout(() => onDecider(b, aime), 260);
  };

  const style = sortie
    ? { transform: `translateX(${sortie === "d" ? 140 : -140}%) rotate(${sortie === "d" ? 18 : -18}deg)`, transition: "transform .26s ease-in" }
    : { transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: tire ? "none" : "transform .2s" };

  return (
    <div className="ec-pile">
      {suivant && <CarteBon b={suivant} dessous />}
      <div
        className="ec-glisse"
        style={style}
        onPointerDown={(e) => {
          depart.current = e.clientX;
          setTire(true);
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (depart.current !== null) setDx(e.clientX - depart.current);
        }}
        onPointerUp={() => {
          const d = dx;
          depart.current = null;
          setTire(false);
          if (d > 90) partir(true);
          else if (d < -90) partir(false);
          else setDx(0);
        }}
        onPointerCancel={() => {
          depart.current = null;
          setTire(false);
          setDx(0);
        }}
      >
        <CarteBon b={b} />
        <span className="ec-tampon oui" style={{ opacity: Math.max(0, Math.min(1, dx / 90)) }}>
          ÉCHANGER
        </span>
        <span className="ec-tampon non" style={{ opacity: Math.max(0, Math.min(1, -dx / 90)) }}>
          PAS CETTE FOIS
        </span>
      </div>
      <div className="ec-gestes">
        <button type="button" className="ec-non" aria-label="Passer" onClick={() => partir(false)}>
          ✕
        </button>
        <button type="button" className="ec-oui" aria-label="Je veux l’échanger" onClick={() => partir(true)}>
          ♥
        </button>
      </div>
    </div>
  );
}

function CarteBon({ b, dessous = false }: { b: Bon; dessous?: boolean }) {
  return (
    <article className={`ec-carte${dessous ? " dessous" : ""}`} aria-hidden={dessous || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ec-carte-photo" src={b.photo} alt="" draggable={false} />
      <span className="ec-valeur">{b.valeur} €</span>
      <div className="ec-carte-t">
        <div className="ec-qui">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.visage} alt="" draggable={false} />
          <span>
            <b>{b.commerce}</b>
            <em>
              {b.metier} · {b.distance}
            </em>
          </span>
        </div>
        <h3>{b.titre}</h3>
        <p>
          {b.conditions} · jusqu’au {b.jusqua}
        </p>
      </div>
    </article>
  );
}

/* ═══ LE MATCH ════════════════════════════════════════════════════════════ */
function Match({
  moi,
  monBon,
  lui,
  code,
  dossier,
  onFermer,
  onVoir,
}: {
  moi: CommerceComptoir;
  monBon: MonBon;
  lui: Bon;
  code: string;
  dossier: string;
  onFermer: () => void;
  onVoir: () => void;
}) {
  return (
    <div className="ec-match" role="dialog" aria-label="C’est un match">
      <div className="cz-confettis" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, ["--r" as string]: `${(i * 53) % 360}deg` }} />
        ))}
      </div>
      <h2>C’est un match !</h2>
      <p>
        {lui.prenom} veut ton bon, et tu veux le sien.
      </p>
      <div className="ec-duo">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={monBon.photo} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ec-duo-v" src={`${dossier}visage.webp`} alt="" />
          <figcaption>
            <b>{moi.nom}</b>
            {monBon.titre} · {monBon.valeur} €
          </figcaption>
        </figure>
        <span className="ec-duo-x" aria-hidden="true">
          ⇄
        </span>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lui.photo} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ec-duo-v" src={lui.visage} alt="" />
          <figcaption>
            <b>{lui.commerce}</b>
            {lui.titre} · {lui.valeur} €
          </figcaption>
        </figure>
      </div>
      <p className="ec-gris">Ton bon {code} est prêt : présente-le chez {lui.commerce}. Le tien part chez lui.</p>
      <button type="button" className="cz-go" onClick={onVoir}>
        Voir mon bon <s aria-hidden="true">→</s>
      </button>
      <button type="button" className="cz-lien" onClick={onFermer}>
        Continuer à découvrir
      </button>
    </div>
  );
}

function BonRecu({ b, code, ouvert, onOuvrir }: { b: Bon; code: string; ouvert: boolean; onOuvrir: () => void }) {
  const qr = useQr(ouvert ? `ClikMe · Bon d’échange ${code} · ${b.titre} (${b.valeur} €) chez ${b.commerce} · Exemple` : null);
  return (
    <article className={`ec-recu${ouvert ? " ouvert" : ""}`}>
      <button type="button" className="ec-recu-h" onClick={onOuvrir} aria-expanded={ouvert}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.photo} alt="" />
        <span>
          <b>{b.titre}</b>
          <em>
            {b.commerce} · {b.valeur} €
          </em>
          <small>
            {b.conditions} · jusqu’au {b.jusqua}
          </small>
        </span>
        <i>{ouvert ? "▲" : "QR"}</i>
      </button>
      {ouvert && (
        <div className="ec-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt={`Code ${code}`} /> : <span className="ec-qr-vide" />}
          <b>{code}</b>
          <p>À présenter chez {b.commerce} : il le scanne, c’est réglé.</p>
        </div>
      )}
    </article>
  );
}

function StylesEchanges() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ec{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));
  scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.ec::-webkit-scrollbar{display:none;}
.ec-haut{display:flex;align-items:center;justify-content:space-between;}
.ec-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.ec-exemple{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;
  background:rgba(245,162,58,.18);color:var(--ambre);}
.ec-gris{color:var(--gris);font-size:14px;line-height:1.4;margin:0;}
.ec-intro{display:grid;grid-template-columns:60px 1fr;gap:12px;align-items:center;padding:14px;border-radius:22px;
  background:var(--nappe);border:1px solid var(--trait);}
.ec-intro img{width:60px;height:60px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ec-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;}
.ec-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.ec-form{display:flex;flex-direction:column;gap:14px;}
.ec-photo{position:relative;padding:0;border:1px solid var(--trait);border-radius:20px;overflow:hidden;background:var(--nappe2);}
.ec-photo img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;}
.ec-photo span{position:absolute;right:10px;bottom:10px;padding:7px 12px;border-radius:999px;background:rgba(18,12,9,.72);
  color:var(--creme);font-size:13px;font-weight:700;}
.ec-champ{display:flex;flex-direction:column;gap:7px;}
.ec-champ > span{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.ec-champ input{height:46px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font-size:16px;}
.ec-puces{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.ec-puces button{height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);
  color:var(--creme);font-weight:700;font-size:14px;}
.ec-puces button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.ec-puces input{width:84px;height:40px;}
.ec-astuce{font-style:normal;font-size:13px;color:var(--gris);}
.ec-onglets{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:5px;border-radius:999px;background:var(--nappe);border:1px solid var(--trait);}
.ec-onglets button{height:38px;border:0;border-radius:999px;background:none;color:var(--gris);font-weight:800;font-size:14px;}
.ec-onglets button.on{background:var(--ambre);color:#2A1608;}
.ec-mien{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;padding:8px 12px 8px 8px;border-radius:16px;
  background:var(--nappe);border:1px dashed rgba(245,162,58,.45);cursor:pointer;}
.ec-mien img{width:44px;height:44px;border-radius:12px;object-fit:cover;}
.ec-mien em{display:block;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.ec-mien b{display:block;font-size:14px;}
.ec-mien i{font-style:normal;font-size:13px;color:var(--gris);text-decoration:underline;}
.ec-pile{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;max-width:400px;margin:0 auto;}
.ec-pile > .ec-carte.dessous{position:absolute;top:0;left:0;right:0;transform:scale(.95) translateY(10px);opacity:.6;}
.ec-glisse{position:relative;width:100%;touch-action:pan-y;cursor:grab;user-select:none;z-index:1;}
.ec-carte{position:relative;width:100%;border-radius:24px;overflow:hidden;background:var(--nappe);border:1px solid var(--trait);
  box-shadow:0 18px 40px -18px rgba(0,0,0,.7);}
.ec-carte-photo{display:block;width:100%;aspect-ratio:4/4.2;max-height:46vh;object-fit:cover;pointer-events:none;}
.ec-valeur{position:absolute;top:14px;right:14px;padding:8px 14px;border-radius:999px;background:var(--ambre);color:#2A1608;
  font-family:var(--font-clikme),sans-serif;font-weight:900;font-size:20px;box-shadow:0 6px 18px rgba(245,162,58,.45);}
.ec-carte-t{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;}
.ec-qui{display:flex;align-items:center;gap:10px;}
.ec-qui img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:var(--nappe2);pointer-events:none;}
.ec-qui b{display:block;font-size:15px;}
.ec-qui em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-carte h3{margin:2px 0 0;font-family:var(--font-clikme),sans-serif;font-size:22px;font-weight:800;line-height:1.15;}
.ec-carte p{margin:0;font-size:13.5px;color:var(--gris);}
.ec-tampon{position:absolute;top:28px;padding:6px 12px;border:3px solid;border-radius:10px;font-weight:900;font-size:20px;
  letter-spacing:.04em;pointer-events:none;}
.ec-tampon.oui{left:18px;color:#7CF0A2;transform:rotate(-12deg);}
.ec-tampon.non{right:18px;color:#FF8FB8;transform:rotate(12deg);}
.ec-gestes{display:flex;gap:28px;}
.ec-gestes button{width:66px;height:66px;border-radius:50%;font-size:28px;font-weight:900;border:0;}
.ec-non{background:var(--nappe);color:#FF8FB8;border:1px solid var(--trait) !important;}
.ec-oui{background:var(--rose);color:#fff;box-shadow:0 10px 26px -8px rgba(255,46,154,.7);}
.ec-toast{margin:0;min-height:62px;display:flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:16px;
  background:rgba(245,162,58,.16);border:1px solid rgba(245,162,58,.45);font-size:14px;font-weight:700;text-align:center;}
.ec-fin{display:flex;flex-direction:column;align-items:center;gap:6px;padding:26px 14px;border-radius:20px;
  border:1px dashed var(--trait);text-align:center;}
.ec-fin p{margin:0;}
.ec-match{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  padding:24px 16px;text-align:center;background:radial-gradient(circle at 50% 30%,rgba(255,46,154,.32),transparent 62%),#120C09;}
.ec-match h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:36px;font-weight:900;color:#fff;
  animation:ec-pop .5s cubic-bezier(.2,1.4,.4,1) both;}
@keyframes ec-pop{from{transform:scale(.4);opacity:0;}to{transform:none;opacity:1;}}
.ec-match p{margin:0;max-width:340px;}
.ec-duo{display:flex;align-items:center;gap:10px;margin:6px 0;}
.ec-duo figure{position:relative;margin:0;width:132px;}
.ec-duo figure > img:first-child{width:132px;height:150px;border-radius:18px;object-fit:cover;border:2px solid var(--ambre);}
.ec-duo-v{position:absolute;top:-14px;left:-10px;width:44px;height:44px;border-radius:50%;object-fit:cover;background:var(--nappe2);
  border:2px solid var(--ambre);}
.ec-duo figcaption{margin-top:6px;font-size:12.5px;line-height:1.3;color:var(--gris);}
.ec-duo figcaption b{display:block;color:var(--creme);font-size:13.5px;}
.ec-duo-x{font-size:28px;color:var(--ambre);font-weight:900;}
.ec-match .cz-go{width:auto;min-width:220px;}
.ec-mes{display:flex;flex-direction:column;gap:10px;}
.ec-mes h3,.ec-aide h3{margin:8px 0 0;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.ec-bilan{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.ec-bilan span{padding:12px 6px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);text-align:center;font-size:12.5px;color:var(--gris);}
.ec-bilan b{display:block;font-family:var(--font-clikme),sans-serif;font-size:22px;color:var(--creme);}
.ec-recu{border-radius:18px;background:var(--nappe);border:1px solid var(--trait);overflow:hidden;}
.ec-recu.ouvert{border-color:rgba(245,162,58,.55);}
.ec-recu-h{display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:center;width:100%;padding:10px;border:0;background:none;
  color:var(--creme);text-align:left;}
.ec-recu-h img{width:62px;height:62px;border-radius:14px;object-fit:cover;}
.ec-recu-h b{display:block;font-size:15px;}
.ec-recu-h em{display:block;font-style:normal;font-size:13px;color:var(--ambre);font-weight:700;}
.ec-recu-h small{display:block;font-size:12px;color:var(--gris);}
.ec-recu-h i{font-style:normal;font-weight:900;font-size:12px;padding:6px 10px;border-radius:999px;background:var(--ambre);color:#2A1608;}
.ec-qr{display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px 14px 16px;}
.ec-qr img,.ec-qr-vide{width:190px;height:190px;border-radius:14px;background:#FFF4E6;}
.ec-qr b{font-family:var(--font-clikme),sans-serif;font-size:20px;letter-spacing:.08em;}
.ec-qr p{margin:0;font-size:13px;color:var(--gris);}
.ec-attente{display:grid;grid-template-columns:40px 1fr;gap:10px;align-items:center;padding:8px 10px;border-radius:14px;
  background:var(--nappe);border:1px dashed var(--trait);}
.ec-attente img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ec-attente b{display:block;font-size:14px;}
.ec-attente em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-aide{padding:12px 14px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.ec-aide p{margin:6px 0 0;font-size:13.5px;line-height:1.4;color:var(--gris);}
`,
      }}
    />
  );
}
