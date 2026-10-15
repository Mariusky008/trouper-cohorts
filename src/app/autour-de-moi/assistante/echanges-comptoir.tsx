"use client";

// 🔁 L'ÉCHANGE ENTRE COMMERÇANTS — démonstration, en quatre étapes et en euros.
//
// « L'idée est bien parce qu'elle permet de prendre ce qu'on veut, et partout,
// mais c'est très mal expliqué : on ne saisit pas comment ça marche. Il faudrait
// au départ des étapes :
//   1. quel produit mets-tu à disposition des autres commerçants — "produit du
//      jour" ou autre ;
//   2. quelle est sa valeur — pas de crédit, du véritable argent ;
//   3. quel est le montant maximal que tu es prêt à concéder — par exemple pas
//      plus de 500 €, donc j'aurais 500 € à dépenser chez les autres ;
//   4. je découvre les autres annonces. »
//
// ET LA QUESTION QUI MANQUAIT : « au final j'ai eu le produit gratuitement si
// personne ne vient chez moi parce que mon service n'est pas utile aux autres
// commerçants ». La règle qui y répond est écrite à l'écran, en une phrase :
// CE QUE TU PRENDS, TU LE RENDS — en produits quand un commerçant en veut,
// sinon en euros au bout de 3 mois. Personne n'a rien gratuitement : au pire,
// on a acheté au prix public en payant plus tard.
//
// PLUS DE « CRÉDITS », DE « SOLDE » NI D'ONGLETS : des euros, une seule
// phrase en haut (« Tu peux dépenser : 500 € »), une seule page.
//
// CE QUI EST UNE DÉMONSTRATION : les autres commerçants sont des EXEMPLES
// (étiquetés), tout reste dans ce téléphone, et le premier voisin qui prend
// son produit est simulé, pour qu'il voie ce que donner lui rapporte.
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { COMMERCES_DEMO } from "@/lib/direct/missions-commercant";
import { tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";

/** `entier` : une couverture de livre se montre en entier, pas recadrée. */
type Modele = { titre: string; prix: number; photo: string; entier?: boolean };

/** Ce que chaque métier mettrait naturellement à disposition — il change tout. */
const MODELES: Record<FamilleDouble, Modele> = {
  table: { titre: "Un dîner pour deux", prix: 50, photo: "/direct/table/magret/3.jpg" },
  bar: { titre: "L’apéro pour quatre", prix: 40, photo: "/direct/soiree/saxo-du-soir.jpg" },
  coiffure: { titre: "Une coupe et un brushing", prix: 45, photo: "/direct/coiffure1.jpg" },
  ongles: { titre: "Une pose semi-permanente", prix: 40, photo: "/direct/avis-ongles.jpg" },
  fleurs: { titre: "Un bouquet de saison", prix: 35, photo: "/direct/bouquet-du-jour.jpg" },
  mode: { titre: "Un bon d’achat", prix: 50, photo: "/direct/mode-pull-mohair-marine.jpeg" },
  createur: { titre: "Un atelier bougie", prix: 45, photo: "/direct/atelier-bougies.jpeg" },
  lunettes: { titre: "Un bon sur une monture", prix: 50, photo: "/direct/lunettes1.jpg" },
  seance: { titre: "Une séance de sophrologie", prix: 50, photo: "/direct/cabinet-hypnose.jpeg" },
  librairie: { titre: "Deux livres au choix", prix: 40, photo: "/direct/livres/harry-quebert.jpg", entier: true },
};

const PLAFONDS = [200, 500, 1000];
const DISTANCES = ["120 m", "350 m", "200 m", "600 m", "450 m", "90 m", "800 m", "300 m", "250 m", "700 m"];

type Offre = {
  id: string;
  commerce: string;
  prenom: string;
  metier: string;
  visage: string;
  ville: string;
  titre: string;
  prix: number;
  photo: string;
  ou: string;
  hotel?: boolean;
  cadrage?: string;
  entier?: boolean;
};
type Mien = { duJour: boolean; titre: string; prix: number; photo: string; plafond: number };
type Bon = { id: string; code: string; titre: string; commerce: string; prenom: string; ville: string; prix: number; photo: string; le?: number };
type Etat = {
  mien?: Mien;
  /** Ce que les autres ont pris chez lui (en euros). */
  donne: number;
  /** Ce qu'il a pris chez les autres. */
  bons: Bon[];
  /** Le premier voisin qui prend son produit (simulé une fois). */
  premier?: string;
};

const NEUF: Etat = { donne: 0, bons: [] };
const cle = (c: CommerceComptoir) => `clikme-echanges-euros-${c.id}`;
function charger(c: CommerceComptoir): Etat {
  if (typeof window === "undefined") return NEUF;
  try {
    const o = JSON.parse(window.localStorage.getItem(cle(c)) ?? "null") as Etat | null;
    return o && Array.isArray(o.bons) ? { ...NEUF, ...o } : NEUF;
  } catch {
    return NEUF;
  }
}
function garder(c: CommerceComptoir, e: Etat) {
  try {
    window.localStorage.setItem(cle(c), JSON.stringify(e));
  } catch {
    /* plein ou interdit : l'écran marche le temps de la visite */
  }
}

/** Comment on le nomme, en lui parlant : « ton produit du jour », « un dîner pour deux ». */
const nomDuMien = (m: Mien) => (m.duJour ? "ton produit du jour" : `${m.titre.charAt(0).toLowerCase()}${m.titre.slice(1)}`);
const nomAffiche = (m: Mien) => (m.duJour ? "Ton produit du jour" : m.titre);

const pris = (e: Etat) => e.bons.reduce((s, b) => s + b.prix, 0);
/** Ce qu'il peut encore dépenser : sa limite, plus ce qu'il a donné, moins ce qu'il a pris. */
const aDepenser = (e: Etat) => (e.mien ? Math.max(0, e.mien.plafond + e.donne - pris(e)) : 0);
/** Ce qu'il doit rendre : ce qu'il a pris de plus que ce qu'il a donné. */
const aRendre = (e: Etat) => Math.max(0, pris(e) - e.donne);
const TROIS_MOIS = 91 * 24 * 3600 * 1000;
/** L'échéance : trois mois après le premier produit pris (le plus ancien). */
function echeanceDe(e: Etat): string {
  const debut = Math.min(...e.bons.map((b) => b.le ?? Infinity));
  if (!Number.isFinite(debut)) return "dans 3 mois";
  return `avant le ${new Date(debut + TROIS_MOIS).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

const visageDe = (branche: string, metier: string) => `${tenueDu({ branche, metier })?.enPied ?? "/direct/double/pied/"}visage.webp`;

/* LES AUTRES COMMERÇANTS — EXEMPLES. Sa ville : ceux de la démonstration.
   Ailleurs : des commerces décrits par ce qu'ils sont, sans nom propre. */
const AILLEURS: Offre[] = [
  { id: "bz-hotel", commerce: "Hôtel face à l’océan", prenom: "l’hôtel", metier: "Hôtel ★★★", visage: visageDe("", ""), ville: "Biarritz", titre: "Une nuit pour deux, petit-déjeuner compris", prix: 180, photo: "/direct/ensemble/scene-ocean.webp", ou: "Biarritz", hotel: true, cadrage: "50% 24%" },
  { id: "bz-bistrot", commerce: "Bistrot du port", prenom: "le bistrot", metier: "Restaurant", visage: visageDe("restaurant", "Restaurant"), ville: "Biarritz", titre: "Un déjeuner pour deux", prix: 60, photo: "/direct/terrasse-au-soleil.jpg", ou: "Biarritz" },
  { id: "by-hotel", commerce: "Hôtel du centre historique", prenom: "l’hôtel", metier: "Hôtel ★★", visage: visageDe("", ""), ville: "Bayonne", titre: "Une nuit pour deux", prix: 120, photo: "/direct/maison/piece-interieur.webp", ou: "Bayonne", hotel: true },
  { id: "by-barbier", commerce: "Barbier des quais", prenom: "le barbier", metier: "Barbier", visage: visageDe("coiffeur", "Barbier"), ville: "Bayonne", titre: "Coupe et taille de barbe", prix: 35, photo: "/direct/essayeurs/coif-barbier-1.jpg", ou: "Bayonne" },
];

function offresDeSaVille(moi: CommerceComptoir): Offre[] {
  return COMMERCES_DEMO.filter((c) => c.famille !== moi.famille).map((c, i) => {
    const m = MODELES[c.famille];
    return {
      id: c.id,
      commerce: c.nom,
      prenom: c.prenom,
      metier: c.metier,
      visage: visageDe(c.branche, c.metier),
      ville: "",
      titre: m.titre,
      prix: m.prix,
      photo: m.photo,
      entier: m.entier,
      ou: DISTANCES[i % DISTANCES.length],
    };
  });
}

function codeDe(graine: string): string {
  let h = 2166136261;
  for (const ch of graine) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0, x = h >>> 0; i < 6; i++, x = Math.floor(x / alphabet.length)) code += alphabet[x % alphabet.length];
  return `CLK-${code}`;
}

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
        /* sans dessin, le code écrit suffit */
      });
    return () => {
      fini = true;
    };
  }, [texte]);
  return texte ? url : "";
}

/* ═══ LA CARTE DE L'ACCUEIL ═══════════════════════════════════════════════ */
export function CarteEchanges({ commerce, onOuvrir }: { commerce: CommerceComptoir; onOuvrir: () => void }) {
  const [etat] = useState<Etat>(() => charger(commerce));
  return (
    <button type="button" className={`cz-relance cz-echanges${etat.mien ? "" : " chaud"}`} onClick={onOuvrir}>
      <span className="cz-relance-i">🔁</span>
      <span>
        <b>
          Échanger avec les commerçants
          <i className="cz-pastille calme">Exemple</i>
        </b>
        <em>
          {etat.mien
            ? `Tu peux dépenser ${aDepenser(etat)} € chez les autres commerçants.`
            : "Donne ton produit à d’autres commerçants, prends ce que tu veux chez eux — même un hôtel à Biarritz."}
        </em>
      </span>
      <s aria-hidden="true">→</s>
    </button>
  );
}

/* ═══ L'ÉCRAN ═════════════════════════════════════════════════════════════ */
export function EchangesComptoir({ commerce, dossier, onRetour }: { commerce: CommerceComptoir; dossier: string; onRetour: () => void }) {
  const [etat, setEtat] = useState<Etat>(() => charger(commerce));
  const changer = useCallback(
    (maj: (e: Etat) => Etat) =>
      setEtat((e) => {
        const suite = maj(e);
        garder(commerce, suite);
        return suite;
      }),
    [commerce],
  );
  const [modifier, setModifier] = useState(false);

  return (
    <div className="ec">
      <StylesEchanges />
      <div className="ec-haut">
        <button type="button" className="ec-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="ec-exemple">Exemple</span>
      </div>
      {!etat.mien || modifier ? (
        <Depart
          commerce={commerce}
          dossier={dossier}
          initial={etat.mien}
          onFini={(mien) => {
            changer((e) => ({ ...e, mien }));
            setModifier(false);
          }}
        />
      ) : (
        <Echanger commerce={commerce} etat={etat} changer={changer} onModifier={() => setModifier(true)} />
      )}
    </div>
  );
}

/* ═══ LES QUATRE ÉTAPES DE DÉPART ═════════════════════════════════════════ */
function Depart({
  commerce,
  dossier,
  initial,
  onFini,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  initial?: Mien;
  onFini: (m: Mien) => void;
}) {
  const m = MODELES[commerce.famille];
  const [etape, setEtape] = useState(1);
  const [duJour, setDuJour] = useState(initial?.duJour ?? false);
  const [titre, setTitre] = useState(initial?.titre ?? m.titre);
  const [prix, setPrix] = useState(initial?.prix ?? m.prix);
  const [plafond, setPlafond] = useState(initial?.plafond ?? 500);
  const photo = initial?.photo ?? commerce.photo ?? m.photo;

  const QUESTIONS = [
    "Que mets-tu à disposition des autres commerçants ?",
    "Combien il vaut ?",
    "Jusqu’à combien es-tu prêt à donner ?",
    "C’est prêt !",
  ];

  return (
    <section className="ec-depart">
      <div className="ec-pas-barre" aria-label={`Étape ${etape} sur 4`}>
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= etape ? "on" : ""} />
        ))}
      </div>
      <div className="ec-question">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <em>Étape {etape} sur 4</em>
          <h2>{QUESTIONS[etape - 1]}</h2>
        </div>
      </div>

      {etape === 1 && (
        <>
          <div className="ec-choix">
            <button type="button" className={duJour ? "on" : ""} onClick={() => setDuJour(true)}>
              <b>Mon produit du jour</b>
              <span>Celui que je publie chaque matin : il change tous les jours.</span>
            </button>
            <button type="button" className={!duJour ? "on" : ""} onClick={() => setDuJour(false)}>
              <b>Un produit précis</b>
              <span>Toujours le même. Écris-le :</span>
            </button>
            {!duJour && <input value={titre} maxLength={60} onChange={(e) => setTitre(e.target.value)} aria-label="Le produit" />}
          </div>
          <button type="button" className="cz-go grand" disabled={!duJour && !titre.trim()} onClick={() => setEtape(2)}>
            Suivant <s aria-hidden="true">→</s>
          </button>
        </>
      )}

      {etape === 2 && (
        <>
          <p className="ec-dit">
            {duJour
              ? "Son prix habituel, en vrais euros : ce que coûte ton produit du jour, en moyenne."
              : "Son vrai prix, en euros : celui de ta carte ou de ta vitrine."}
          </p>
          <div className="ec-prix-saisie">
            <input type="number" inputMode="numeric" min={5} max={2000} value={prix} onChange={(e) => setPrix(Math.max(0, Math.min(2000, Number(e.target.value) || 0)))} aria-label="Prix en euros" />
            <span>€</span>
          </div>
          <button type="button" className="cz-go grand" disabled={prix < 5} onClick={() => setEtape(3)}>
            Suivant <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(1)}>
            ‹ Retour
          </button>
        </>
      )}

      {etape === 3 && (
        <>
          <div className="ec-puces grandes">
            {PLAFONDS.map((p) => (
              <button key={p} type="button" className={plafond === p ? "on" : ""} onClick={() => setPlafond(p)}>
                {p} €
              </button>
            ))}
          </div>
          <p className="ec-dit">
            C’est aussi <b>ce que tu peux dépenser tout de suite</b> chez les autres commerçants : {plafond} €.
          </p>
          <p className="ec-regle">
            ⚖️ <b>Ce que tu prends, tu le rends</b> : en donnant ton produit quand un commerçant en veut — sinon en euros, au bout de 3 mois. Personne n’a rien gratuitement.
          </p>
          <button type="button" className="cz-go grand" onClick={() => setEtape(4)}>
            Suivant <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(2)}>
            ‹ Retour
          </button>
        </>
      )}

      {etape === 4 && (
        <>
          <article className="ec-resume">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" />
            <div>
              <em>Tu offres aux commerçants</em>
              <b>
                {duJour ? "Ton produit du jour" : titre} · {prix} €
              </b>
            </div>
          </article>
          <div className="ec-gros">
            <span>Tu peux dépenser dès maintenant</span>
            <b>{plafond} €</b>
            <em>chez les autres commerçants, dans ta ville ou ailleurs.</em>
          </div>
          <button type="button" className="cz-go grand" onClick={() => onFini({ duJour, titre: duJour ? "Mon produit du jour" : titre.trim(), prix, photo, plafond })}>
            Voir ce que proposent les autres <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(3)}>
            ‹ Retour
          </button>
        </>
      )}
    </section>
  );
}

/* ═══ LA PAGE : CE QU'IL PEUT DÉPENSER, ET CE QUE PROPOSENT LES AUTRES ═══ */
function Echanger({
  commerce,
  etat,
  changer,
  onModifier,
}: {
  commerce: CommerceComptoir;
  etat: Etat;
  changer: (maj: (e: Etat) => Etat) => void;
  onModifier: () => void;
}) {
  const mien = etat.mien as Mien;
  const [ville, setVille] = useState("");
  const [choisie, setChoisie] = useState<Offre | null>(null);
  const [recu, setRecu] = useState<Bon | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState<string | null>(null);
  const toutes = useMemo(() => [...offresDeSaVille(commerce), ...AILLEURS], [commerce]);
  const visibles = toutes.filter((o) => o.ville === ville);
  const reste = aDepenser(etat);
  const du = aRendre(etat);

  /* LE PREMIER VOISIN QUI PREND SON PRODUIT — simulé une fois, pour qu'il
     voie ce que donner lui rapporte. */
  useEffect(() => {
    if (etat.premier) return;
    const voisin = COMMERCES_DEMO.find((c) => c.famille !== commerce.famille);
    if (!voisin) return;
    const t = window.setTimeout(() => {
      changer((e) => (e.premier ? e : { ...e, premier: voisin.nom, donne: e.donne + mien.prix }));
      setNouvelle(`🎉 ${voisin.prenom} (${voisin.nom}) vient de prendre ${nomDuMien(mien)}. Tu peux dépenser ${mien.prix} € de plus.`);
    }, 2400);
    return () => window.clearTimeout(t);
  }, [etat.premier, commerce.famille, changer, mien]);

  const prendre = (o: Offre) => {
    const bon: Bon = {
      id: `${o.id}-${Date.now()}`,
      code: codeDe(`${commerce.id}|${o.id}|${Date.now()}`),
      titre: o.titre,
      commerce: o.commerce,
      prenom: o.prenom,
      ville: o.ville,
      prix: o.prix,
      photo: o.photo,
      le: Date.now(),
    };
    changer((e) => ({ ...e, bons: [bon, ...e.bons] }));
    setChoisie(null);
    setRecu(bon);
  };

  return (
    <section className="ec-page">
      <div className="ec-gros">
        <span>Tu peux dépenser</span>
        <b key={reste}>{reste} €</b>
        <em>
          Tu as donné <strong>{etat.donne} €</strong> · tu as pris <strong>{pris(etat)} €</strong>
        </em>
      </div>

      {du > 0 && (
        <p className="ec-regle">
          ⚖️ <b>À rendre : {du} €</b> — en produits dès qu’un commerçant prend chez toi, sinon en euros {echeanceDe(etat)}.
        </p>
      )}

      {nouvelle && (
        <p className="ec-vente" role="status">
          {nouvelle}
        </p>
      )}

      <section className="ec-comment">
        <h3>Comment ça marche</h3>
        <ol>
          <li>
            Un commerçant prend ton produit → <b>tu peux dépenser</b> son prix chez les autres.
          </li>
          <li>
            Tu prends chez un autre → <b>lui pourra dépenser</b> ce prix ailleurs.
          </li>
          <li>
            Ce que tu prends, tu le rends : en produits, sinon en euros au bout de 3 mois.
          </li>
        </ol>
      </section>

      <h3 className="ec-titre">Chez les autres commerçants</h3>
      <div className="ec-villes">
        {[
          ["", "📍 Ta ville"],
          ["Biarritz", "Biarritz"],
          ["Bayonne", "Bayonne"],
        ].map(([v, mot]) => (
          <button key={v || "ici"} type="button" className={ville === v ? "on" : ""} onClick={() => setVille(v)}>
            {mot}
          </button>
        ))}
      </div>
      {visibles.map((o) => (
        <article key={o.id} className={`ec-offre${o.hotel ? " hotel" : ""}`}>
          <div className="ec-offre-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.photo} alt="" className={o.entier ? "entier" : undefined} style={o.cadrage ? { objectPosition: o.cadrage } : undefined} />
            <span className="ec-prix">{o.prix} €</span>
            {o.hotel && <span className="ec-hotel">🏨 Hôtel</span>}
          </div>
          <div className="ec-offre-t">
            <div className="ec-qui">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.visage} alt="" />
              <span>
                <b>{o.commerce}</b>
                <em>
                  {o.metier} · {o.ou}
                </em>
              </span>
            </div>
            <h4>{o.titre}</h4>
            <button type="button" className="ec-prendre" onClick={() => setChoisie(o)}>
              Je prends · {o.prix} €
            </button>
          </div>
        </article>
      ))}

      {etat.bons.length > 0 && <h3 className="ec-titre">Ce que tu as pris</h3>}
      {etat.bons.map((b) => (
        <BonPris key={b.id} b={b} ouvert={ouvert === b.id} onOuvrir={() => setOuvert((x) => (x === b.id ? null : b.id))} />
      ))}

      <h3 className="ec-titre">Ce que tu offres</h3>
      <article className="ec-resume">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mien.photo} alt="" />
        <div>
          <b>
            {nomAffiche(mien)} · {mien.prix} €
          </b>
          <em>Jusqu’à {mien.plafond} €</em>
        </div>
        <button type="button" className="cz-lien" onClick={onModifier}>
          Modifier
        </button>
      </article>

      {choisie && (
        <div className="ec-feuille" role="dialog" aria-label="Je prends">
          <div className="ec-feuille-c">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={choisie.photo} alt="" style={choisie.cadrage ? { objectPosition: choisie.cadrage } : undefined} />
            <h2>{choisie.titre}</h2>
            <p className="ec-gris">
              Chez {choisie.commerce}
              {choisie.ville ? `, à ${choisie.ville}` : ""}
            </p>
            {reste >= choisie.prix ? (
              <>
                <p className="ec-calcul">
                  Après : tu pourras encore dépenser <b>{reste - choisie.prix} €</b>.
                </p>
                <button type="button" className="cz-go grand" onClick={() => prendre(choisie)}>
                  Je prends · {choisie.prix} €
                </button>
              </>
            ) : (
              <p className="ec-calcul">
                Il te manque <b>{choisie.prix - reste} €</b>. Dès qu’un commerçant prend ton produit, tu peux dépenser plus.
              </p>
            )}
            <button type="button" className="cz-lien" onClick={() => setChoisie(null)}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {recu && (
        <div className="ec-feuille" role="dialog" aria-label="C’est à toi">
          <div className="ec-feuille-c">
            <h2 className="ec-bravo">C’est à toi !</h2>
            <BonPris b={recu} ouvert onOuvrir={() => undefined} />
            <p className="ec-gris ec-centre">
              {recu.commerce} pourra dépenser {recu.prix} € chez n’importe quel commerçant.
            </p>
            <button type="button" className="cz-go" onClick={() => setRecu(null)}>
              C’est noté
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function BonPris({ b, ouvert, onOuvrir }: { b: Bon; ouvert: boolean; onOuvrir: () => void }) {
  const qr = useQr(ouvert ? `ClikMe · Bon ${b.code} · ${b.titre} (${b.prix} €) chez ${b.commerce} · Exemple` : null);
  return (
    <article className={`ec-recu${ouvert ? " ouvert" : ""}`}>
      <button type="button" className="ec-recu-h" onClick={onOuvrir} aria-expanded={ouvert}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.photo} alt="" />
        <span>
          <b>{b.titre}</b>
          <em>
            {b.commerce}
            {b.ville ? ` · ${b.ville}` : ""} · {b.prix} €
          </em>
        </span>
        <i>{ouvert ? "▲" : "QR"}</i>
      </button>
      {ouvert && (
        <div className="ec-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt={`Code ${b.code}`} /> : <span className="ec-qr-vide" />}
          <b>{b.code}</b>
          <p>Présente ce code chez {b.commerce} : il le scanne, c’est réglé.</p>
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
.ec-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.ec-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.ec-exemple{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;
  background:rgba(245,162,58,.18);color:var(--ambre);}
.ec-gris{color:var(--gris);font-size:14px;line-height:1.4;margin:0;}
.ec-centre{text-align:center;}
.ec-depart,.ec-page{display:flex;flex-direction:column;gap:14px;}
.ec-pas-barre{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
.ec-pas-barre i{height:5px;border-radius:99px;background:var(--nappe2);}
.ec-pas-barre i.on{background:var(--ambre);}
.ec-question{display:grid;grid-template-columns:58px 1fr;gap:12px;align-items:center;}
.ec-question img{width:58px;height:58px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ec-question em{font-style:normal;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.ec-question h2{margin:2px 0 0;font-family:var(--font-clikme),sans-serif;font-size:23px;font-weight:800;line-height:1.15;}
.ec-choix{display:flex;flex-direction:column;gap:10px;}
.ec-choix > button{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;padding:16px;border-radius:18px;
  border:2px solid var(--trait);background:var(--nappe);color:var(--creme);}
.ec-choix > button.on{border-color:var(--rose);background:rgba(255,46,154,.08);}
.ec-choix b{font-size:17px;}
.ec-choix span{font-size:14px;color:var(--gris);}
.ec-choix input{margin-top:-4px;width:100%;height:46px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);
  background:var(--fond);color:var(--creme);font-size:16px;}
.ec-dit{margin:0;font-size:16px;line-height:1.45;}
.ec-dit b{color:var(--ambre);}
.ec-prix-saisie{position:relative;}
.ec-prix-saisie input{width:100%;height:72px;padding:0 54px 0 20px;border-radius:20px;border:2px solid var(--ambre);background:var(--nappe);
  color:var(--creme);font-family:var(--font-clikme),sans-serif;font-size:34px;font-weight:900;}
.ec-prix-saisie span{position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:30px;font-weight:900;color:var(--ambre);}
.ec-puces{display:flex;flex-wrap:wrap;gap:8px;}
.ec-puces button{height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);
  font-weight:700;font-size:14px;}
.ec-puces.grandes{display:grid;grid-template-columns:repeat(3,1fr);}
.ec-puces.grandes button{height:60px;font-size:20px;font-weight:900;border-radius:18px;}
.ec-puces button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.ec-regle{margin:0;padding:12px 14px;border-radius:16px;background:rgba(245,162,58,.1);border:1px solid rgba(245,162,58,.4);
  font-size:14.5px;line-height:1.45;}
.ec-resume{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:10px;border-radius:18px;
  background:var(--nappe);border:1px solid var(--trait);}
.ec-resume img{width:56px;height:56px;border-radius:12px;object-fit:cover;}
.ec-resume em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-resume b{display:block;font-size:15.5px;}
.ec-gros{display:flex;flex-direction:column;align-items:center;gap:2px;padding:18px 14px;border-radius:22px;text-align:center;
  background:linear-gradient(160deg,rgba(245,162,58,.2),rgba(255,46,154,.08));border:1px solid rgba(245,162,58,.45);}
.ec-gros span{font-weight:800;font-size:15px;}
.ec-gros b{font-family:var(--font-clikme),sans-serif;font-size:50px;line-height:1.05;color:var(--ambre);animation:ec-pouls .5s ease-out;}
@keyframes ec-pouls{from{transform:scale(1.15);}to{transform:none;}}
.ec-gros em{font-style:normal;font-size:13.5px;color:var(--gris);}
.ec-gros strong{color:var(--creme);}
.ec-vente{margin:0;padding:12px 14px;border-radius:16px;background:rgba(124,240,162,.12);border:1px solid rgba(124,240,162,.45);
  color:#C9F7D7;font-weight:700;font-size:14.5px;line-height:1.4;}
.ec-comment{padding:12px 14px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.ec-comment h3,.ec-titre{margin:0;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.ec-titre{margin-top:6px;}
.ec-comment ol{list-style:decimal;margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.4;color:var(--gris);}
.ec-comment b{color:var(--creme);}
.ec-comment li::marker{color:var(--ambre);font-weight:900;}
.ec-villes{display:flex;flex-wrap:wrap;gap:8px;}
.ec-villes button{height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);
  font-weight:800;font-size:14px;}
.ec-villes button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.ec-offre{border-radius:22px;overflow:hidden;background:var(--nappe);border:1px solid var(--trait);}
.ec-offre.hotel{border-color:rgba(245,162,58,.55);box-shadow:0 0 26px rgba(245,162,58,.14);}
.ec-offre-photo{position:relative;}
.ec-offre-photo img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;}
.ec-offre-photo img.entier{object-fit:contain;padding:12px 0;background:var(--nappe2);}
.ec-prix{position:absolute;left:12px;bottom:12px;padding:7px 12px;border-radius:999px;background:var(--ambre);color:#2A1608;
  font-family:var(--font-clikme),sans-serif;font-weight:900;font-size:17px;}
.ec-hotel{position:absolute;left:12px;top:12px;padding:5px 10px;border-radius:999px;background:rgba(18,12,9,.72);color:var(--creme);
  font-size:12.5px;font-weight:800;}
.ec-offre-t{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;}
.ec-qui{display:flex;align-items:center;gap:10px;}
.ec-qui img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ec-qui b{display:block;font-size:14.5px;}
.ec-qui em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-offre h4{margin:2px 0 0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;line-height:1.2;}
.ec-prendre{margin-top:4px;height:46px;border:0;border-radius:999px;background:var(--rose);color:#fff;font-weight:900;font-size:15px;
  box-shadow:0 10px 24px -10px rgba(255,46,154,.7);}
.ec-recu{border-radius:18px;background:var(--nappe);border:1px solid var(--trait);overflow:hidden;}
.ec-recu.ouvert{border-color:rgba(245,162,58,.55);}
.ec-recu-h{display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:center;width:100%;padding:10px;border:0;background:none;
  color:var(--creme);text-align:left;}
.ec-recu-h img{width:62px;height:62px;border-radius:14px;object-fit:cover;}
.ec-recu-h b{display:block;font-size:15px;}
.ec-recu-h em{display:block;font-style:normal;font-size:13px;color:var(--ambre);font-weight:700;}
.ec-recu-h i{font-style:normal;font-weight:900;font-size:12px;padding:6px 10px;border-radius:999px;background:var(--ambre);color:#2A1608;}
.ec-qr{display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px 14px 16px;}
.ec-qr img,.ec-qr-vide{width:180px;height:180px;border-radius:14px;background:#FFF4E6;}
.ec-qr b{font-family:var(--font-clikme),sans-serif;font-size:20px;letter-spacing:.08em;}
.ec-qr p{margin:0;font-size:13px;color:var(--gris);text-align:center;}
.ec-feuille{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,7,5,.7);}
.ec-feuille-c{width:100%;max-width:560px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;
  padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));border-radius:26px 26px 0 0;background:#1C1411;
  border-top:1px solid rgba(245,162,58,.4);animation:ec-monte .28s ease-out;}
@keyframes ec-monte{from{transform:translateY(40px);opacity:0;}to{transform:none;opacity:1;}}
.ec-feuille-c > img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:18px;}
.ec-feuille-c h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:22px;font-weight:800;}
.ec-feuille-c .cz-lien{align-self:center;}
.ec-calcul{margin:0;font-size:15px;line-height:1.4;}
.ec-calcul b{color:var(--ambre);font-size:18px;}
.ec-bravo{text-align:center;font-size:30px !important;color:#fff;}
`,
      }}
    />
  );
}
