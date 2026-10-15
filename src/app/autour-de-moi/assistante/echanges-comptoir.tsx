"use client";

// 🎁 L'ÉCHANGE ENTRE COMMERÇANTS, AVEC DES CRÉDITS — démonstration.
//
// LA PREMIÈRE VERSION ÉTAIT UN « TINDER DES BONS » : ton bon contre le sien,
// de la même valeur, s'il y avait match. « Le souci que je vois, c'est que
// certains mettront 50, d'autres 20 et d'autres 200 : il ne pourra jamais y
// avoir de match. » Et la négociation (« proposer un bon retour, accepter, faire
// une contre-proposition ») aurait fait marchander des voisins entre eux.
//
// D'OÙ LES CRÉDITS :
//   · chacun publie ses OFFRES au prix public, multipliées par le nombre qu'il
//     veut (« Dîner pour deux, 50 € × 4 »), avec ses conditions ;
//   · quand un autre commerçant en prend une, il GAGNE son prix en crédits ;
//   · il les dépense chez n'importe quel commerçant, DANS N'IMPORTE QUELLE
//     VILLE — un hôtel à Biarritz compris (« si c'est un hôtel, les montants
//     peuvent être plus importants ») ;
//   · pas de match à attendre, pas de prix à discuter.
//
// CE QUI EST UNE DÉMONSTRATION : les offres des autres sont des EXEMPLES
// (étiquetés), et tout reste dans ce téléphone. Ses offres à lui sont les
// siennes ; le premier commerçant qui en « prend » une est simulé, pour qu'il
// voie ses crédits arriver.
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { COMMERCES_DEMO } from "@/lib/direct/missions-commercant";
import { tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";

type Modele = { titre: string; prix: number; conditions: string[]; photo: string };

/** Ce que chaque métier mettrait naturellement en jeu — il change tout. */
const MODELES: Record<FamilleDouble, Modele> = {
  table: { titre: "Un dîner pour deux", prix: 50, conditions: ["Du lundi au jeudi", "Le midi en semaine", "Hors jours fériés"], photo: "/direct/table/magret/3.jpg" },
  bar: { titre: "L’apéro pour quatre", prix: 40, conditions: ["Avant 20 h", "Hors soirs de match", "Du mardi au jeudi"], photo: "/direct/soiree/saxo-du-soir.jpg" },
  coiffure: { titre: "Une coupe et un brushing", prix: 45, conditions: ["En semaine avant 16 h", "Hors samedi", "Sur rendez-vous"], photo: "/direct/coiffure1.jpg" },
  ongles: { titre: "Une pose semi-permanente", prix: 40, conditions: ["Le mardi et le mercredi", "Sur rendez-vous", "Hors samedi"], photo: "/direct/avis-ongles.jpg" },
  fleurs: { titre: "Un bouquet de saison", prix: 35, conditions: ["Hors fête des mères", "À retirer en boutique", "En semaine"], photo: "/direct/bouquet-du-jour.jpg" },
  mode: { titre: "Un bon d’achat", prix: 50, conditions: ["Hors soldes", "Sur toute la boutique", "Hors samedi"], photo: "/direct/mode-pull-mohair-marine.jpeg" },
  createur: { titre: "Un atelier bougie", prix: 45, conditions: ["Le mercredi après-midi", "Sur réservation", "Pour une personne"], photo: "/direct/atelier-bougies.jpeg" },
  lunettes: { titre: "Un bon sur une monture", prix: 50, conditions: ["Hors verres", "Sur toute la collection", "En semaine"], photo: "/direct/lunettes1.jpg" },
  seance: { titre: "Une séance découverte", prix: 50, conditions: ["Sur rendez-vous", "En semaine", "Une heure"], photo: "/direct/cabinet-hypnose.jpeg" },
  librairie: { titre: "Deux livres au choix", prix: 40, conditions: ["Hors beaux livres", "Sur tout le rayon poche", "En semaine"], photo: "/direct/livres/harry-quebert.jpg" },
};

/** L'avance de bienvenue : de quoi prendre une offre avant d'avoir donné. */
const AVANCE = 100;
const PLAFONDS = [100, 200, 500, 0];
const DISTANCES = ["120 m", "350 m", "200 m", "600 m", "450 m", "90 m", "800 m", "300 m", "250 m", "700 m"];

type Offre = {
  id: string;
  commerce: string;
  metier: string;
  visage: string;
  ville: string;
  titre: string;
  prix: number;
  restantes: number;
  conditions: string;
  photo: string;
  ou: string;
  hotel?: boolean;
  /** Où regarder dans la photo (`object-position`) — la vue sur l'océan est en haut. */
  cadrage?: string;
};
type MonOffre = { id: string; titre: string; prix: number; quantite: number; restantes: number; conditions: string; photo: string };
type Mouvement = { id: string; at: number; montant: number; quoi: string; avec: string };
type Bon = { id: string; code: string; at: number; titre: string; commerce: string; ville: string; prix: number; conditions: string; photo: string };
type Etat = {
  mesOffres: MonOffre[];
  solde: number;
  mouvements: Mouvement[];
  envies: string[];
  bons: Bon[];
  /** Combien de fois chaque offre des autres a été prise ici. */
  prises: Record<string, number>;
  plafond: number;
  /** Le premier commerçant qui a pris une de ses offres (simulé une fois). */
  premiereVente?: boolean;
};

const NEUF = (): Etat => ({
  mesOffres: [],
  solde: AVANCE,
  mouvements: [{ id: "avance", at: Date.now(), montant: AVANCE, quoi: "L’avance de bienvenue", avec: "ClikMe" }],
  envies: [],
  bons: [],
  prises: {},
  plafond: 200,
});

const cle = (c: CommerceComptoir) => `clikme-credits-${c.id}`;
function charger(c: CommerceComptoir): Etat {
  if (typeof window === "undefined") return NEUF();
  try {
    const o = JSON.parse(window.localStorage.getItem(cle(c)) ?? "null") as Etat | null;
    return o && Array.isArray(o.mesOffres) && typeof o.solde === "number" ? { ...NEUF(), ...o } : NEUF();
  } catch {
    return NEUF();
  }
}
function garder(c: CommerceComptoir, e: Etat) {
  try {
    window.localStorage.setItem(cle(c), JSON.stringify(e));
  } catch {
    /* plein ou interdit : l'écran marche quand même, le temps de la visite */
  }
}

const visageDe = (branche: string, metier: string) => `${tenueDu({ branche, metier })?.enPied ?? "/direct/double/pied/"}visage.webp`;

/* ═══ LES OFFRES DES AUTRES — EXEMPLES ═════════════════════════════════════
   Sa ville : les commerces de la démonstration. Ailleurs : des commerces
   décrits par ce qu'ils sont (« Hôtel face à l'océan »), sans nom propre — ce
   sont des exemples, pas des commerces qui existent. */
const AILLEURS: Offre[] = [
  { id: "bz-hotel", commerce: "Hôtel face à l’océan", metier: "Hôtel ★★★", visage: visageDe("", ""), ville: "Biarritz", titre: "Une nuit pour deux, petit-déjeuner compris", prix: 180, restantes: 2, conditions: "Du dimanche au jeudi, hors juillet-août", photo: "/direct/ensemble/scene-ocean.webp", ou: "Biarritz", hotel: true, cadrage: "50% 24%" },
  { id: "bz-bistrot", commerce: "Bistrot du port", metier: "Restaurant", visage: visageDe("restaurant", "Restaurant"), ville: "Biarritz", titre: "Un déjeuner pour deux", prix: 60, restantes: 3, conditions: "Le midi en semaine", photo: "/direct/terrasse-au-soleil.jpg", ou: "Biarritz" },
  { id: "bz-bar", commerce: "Bar de la plage", metier: "Bar", visage: visageDe("bar", "Bar"), ville: "Biarritz", titre: "Le concert du jeudi, verres compris pour deux", prix: 40, restantes: 4, conditions: "Le jeudi soir", photo: "/direct/soiree/tablee-au-concert.jpg", ou: "Biarritz" },
  { id: "by-hotel", commerce: "Hôtel du centre historique", metier: "Hôtel ★★", visage: visageDe("", ""), ville: "Bayonne", titre: "Une nuit pour deux", prix: 120, restantes: 2, conditions: "Le week-end, hors fêtes de Bayonne", photo: "/direct/maison/piece-interieur.webp", ou: "Bayonne", hotel: true },
  { id: "by-barbier", commerce: "Barbier des quais", metier: "Barbier", visage: visageDe("coiffeur", "Barbier"), ville: "Bayonne", titre: "Coupe et taille de barbe", prix: 35, restantes: 4, conditions: "En semaine", photo: "/direct/essayeurs/coif-barbier-1.jpg", ou: "Bayonne" },
  { id: "by-tapas", commerce: "Bar à tapas", metier: "Bar", visage: visageDe("bar", "Bar"), ville: "Bayonne", titre: "Tapas et verres pour deux", prix: 40, restantes: 3, conditions: "Avant 20 h", photo: "/direct/terrasse-du-soir.jpg", ou: "Bayonne" },
];

function offresDeSaVille(moi: CommerceComptoir): Offre[] {
  return COMMERCES_DEMO.filter((c) => c.famille !== moi.famille).map((c, i) => {
    const m = MODELES[c.famille];
    return {
      id: c.id,
      commerce: c.nom,
      metier: c.metier,
      visage: visageDe(c.branche, c.metier),
      ville: "",
      titre: m.titre,
      prix: m.prix,
      restantes: 1 + (i % 4),
      conditions: m.conditions[0],
      photo: m.photo,
      ou: DISTANCES[i % DISTANCES.length],
    };
  });
}

/** Un code court et stable — lisible au comptoir, sans lettres ambiguës. */
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
        /* sans code dessiné, le code écrit suffit */
      });
    return () => {
      fini = true;
    };
  }, [texte]);
  return texte ? url : "";
}

const quand = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/* ═══ LA CARTE DE L'ACCUEIL ═══════════════════════════════════════════════ */
export function CarteEchanges({ commerce, onOuvrir }: { commerce: CommerceComptoir; onOuvrir: () => void }) {
  const [etat] = useState<Etat>(() => charger(commerce));
  const actif = etat.mesOffres.length > 0 || etat.bons.length > 0;
  return (
    <button type="button" className={`cz-relance cz-echanges${actif ? "" : " chaud"}`} onClick={onOuvrir}>
      <span className="cz-relance-i">🎁</span>
      <span>
        <b>
          Échanger avec les commerçants
          <i className="cz-pastille calme">Exemple</i>
        </b>
        <em>
          {actif
            ? `Ton solde : ${etat.solde} crédits, à dépenser chez n’importe quel commerçant, même dans une autre ville.`
            : "Offre un service, gagne des crédits, dépense-les chez n’importe quel commerçant — même un hôtel à Biarritz."}
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
  const [vue, setVue] = useState<"decouvrir" | "offres" | "solde">(() => (charger(commerce).mesOffres.length ? "decouvrir" : "offres"));
  const [ville, setVille] = useState("");
  const [envies, setEnvies] = useState(false);
  const [aPrendre, setAPrendre] = useState<Offre | null>(null);
  const [pris, setPris] = useState<Bon | null>(null);
  const [vente, setVente] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);

  const toutes = useMemo(() => [...offresDeSaVille(commerce), ...AILLEURS], [commerce]);
  const visibles = toutes
    .filter((o) => o.ville === ville)
    .filter((o) => !envies || etat.envies.includes(o.id))
    .map((o) => ({ ...o, restantes: Math.max(0, o.restantes - (etat.prises[o.id] ?? 0)) }));

  /* LE PREMIER COMMERÇANT QUI PREND UNE DE SES OFFRES — simulé une fois, pour
     qu'il voie ce que donner lui rapporte. */
  const minuterie = useRef<number | null>(null);
  useEffect(() => () => {
    if (minuterie.current) window.clearTimeout(minuterie.current);
  }, []);
  const simulerUneVente = (offre: MonOffre) => {
    const voisin = COMMERCES_DEMO.find((c) => c.famille !== commerce.famille);
    if (!voisin) return;
    minuterie.current = window.setTimeout(() => {
      changer((e) => {
        if (e.premiereVente) return e;
        const credits = offre.prix;
        return {
          ...e,
          premiereVente: true,
          solde: e.solde + credits,
          mesOffres: e.mesOffres.map((o) => (o.id === offre.id ? { ...o, restantes: Math.max(0, o.restantes - 1) } : o)),
          mouvements: [{ id: `v-${Date.now()}`, at: Date.now(), montant: credits, quoi: offre.titre, avec: voisin.nom }, ...e.mouvements],
        };
      });
      setVente(`🎉 ${voisin.nom} vient de prendre « ${offre.titre} » : +${offre.prix} crédits.`);
      window.setTimeout(() => setVente(null), 5200);
    }, 2600);
  };

  const prendre = (o: Offre) => {
    const bon: Bon = {
      id: `${o.id}-${Date.now()}`,
      code: codeDe(`${commerce.id}|${o.id}|${Date.now()}`),
      at: Date.now(),
      titre: o.titre,
      commerce: o.commerce,
      ville: o.ville,
      prix: o.prix,
      conditions: o.conditions,
      photo: o.photo,
    };
    changer((e) => ({
      ...e,
      solde: e.solde - o.prix,
      prises: { ...e.prises, [o.id]: (e.prises[o.id] ?? 0) + 1 },
      bons: [bon, ...e.bons],
      mouvements: [{ id: bon.id, at: bon.at, montant: -o.prix, quoi: o.titre, avec: o.commerce }, ...e.mouvements],
    }));
    setAPrendre(null);
    setPris(bon);
  };

  return (
    <div className="ec">
      <StylesEchanges />
      <div className="ec-haut">
        <button type="button" className="ec-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <button type="button" className="ec-solde" key={etat.solde} onClick={() => setVue("solde")}>
          💰 {etat.solde} crédits
        </button>
      </div>

      <div className="ec-onglets" role="tablist">
        {(
          [
            ["decouvrir", "Découvrir"],
            ["offres", `Mes offres${etat.mesOffres.length ? ` · ${etat.mesOffres.length}` : ""}`],
            ["solde", `Mon solde${etat.bons.length ? ` · ${etat.bons.length}` : ""}`],
          ] as const
        ).map(([id, mot]) => (
          <button key={id} type="button" role="tab" aria-selected={vue === id} className={vue === id ? "on" : ""} onClick={() => setVue(id)}>
            {mot}
          </button>
        ))}
      </div>

      {vente && (
        <p className="ec-vente" role="status">
          {vente}
        </p>
      )}

      {vue === "decouvrir" && (
        <section className="ec-decouvrir">
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
            <button type="button" className={`ec-envies${envies ? " on" : ""}`} onClick={() => setEnvies((x) => !x)} aria-pressed={envies}>
              ♡ Mes envies
            </button>
          </div>
          <p className="ec-gris">
            Au prix public de chaque commerçant. <span className="ec-exemple">Exemple</span>
          </p>
          {visibles.length === 0 && <p className="ec-vide">Pas encore d’envie ici : touche ♡ sur une offre pour la garder.</p>}
          {visibles.map((o) => (
            <CarteOffre
              key={o.id}
              o={o}
              envie={etat.envies.includes(o.id)}
              onEnvie={() => changer((e) => ({ ...e, envies: e.envies.includes(o.id) ? e.envies.filter((x) => x !== o.id) : [...e.envies, o.id] }))}
              onPrendre={() => setAPrendre(o)}
            />
          ))}
        </section>
      )}

      {vue === "offres" && (
        <MesOffres
          commerce={commerce}
          dossier={dossier}
          etat={etat}
          onAjouter={(o) => {
            const premiere = !etat.premiereVente && etat.mesOffres.length === 0;
            changer((e) => ({ ...e, mesOffres: [...e.mesOffres, o] }));
            if (premiere) simulerUneVente(o);
          }}
          onRetirer={(id) => changer((e) => ({ ...e, mesOffres: e.mesOffres.filter((x) => x.id !== id) }))}
          onPlafond={(p) => changer((e) => ({ ...e, plafond: p }))}
          onDecouvrir={() => setVue("decouvrir")}
        />
      )}

      {vue === "solde" && (
        <section className="ec-solde-vue">
          <div className="ec-gros-solde">
            <b>{etat.solde}</b>
            <span>crédits à dépenser</span>
            <em>1 crédit = 1 € au prix public, chez n’importe quel commerçant, dans n’importe quelle ville.</em>
          </div>
          {etat.bons.length > 0 && <h3>Mes bons à utiliser</h3>}
          {etat.bons.map((b) => (
            <BonPris key={b.id} b={b} ouvert={ouvert === b.id} onOuvrir={() => setOuvert((x) => (x === b.id ? null : b.id))} />
          ))}
          <h3>Mon historique</h3>
          <ul className="ec-histo">
            {etat.mouvements.map((m) => (
              <li key={m.id}>
                <span>
                  <b>{m.quoi}</b>
                  <em>
                    {m.avec} · {quand(m.at)}
                  </em>
                </span>
                <i className={m.montant >= 0 ? "plus" : "moins"}>
                  {m.montant >= 0 ? "+" : "−"}
                  {Math.abs(m.montant)}
                </i>
              </li>
            ))}
          </ul>
          <section className="ec-aide">
            <h3>Les règles</h3>
            <p>
              <b>Le prix, c’est le prix public</b> : celui de ta carte ou de ta page. Personne ne gonfle ses tarifs pour gagner plus de crédits.
            </p>
            <p>
              <b>Tu gardes la main</b> : tes quantités, tes heures creuses, et un plafond de crédits reçus par mois.
            </p>
            <p>
              <b>L’avance de {AVANCE} crédits</b> te permet de prendre avant d’avoir donné. Au-delà, il faut donner pour recevoir.
            </p>
            <p>
              <b>Un avis après chaque bon utilisé</b> : un commerçant qui ne tient pas ses offres se voit vite.
            </p>
            <p className="ec-gris">
              Chaque échange entre professionnels se facture : demande l’avis de ton comptable. Les crédits sont une démonstration.
            </p>
          </section>
        </section>
      )}

      {aPrendre && (
        <div className="ec-feuille" role="dialog" aria-label="Prendre cette offre">
          <div className="ec-feuille-c">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aPrendre.photo} alt="" style={aPrendre.cadrage ? { objectPosition: aPrendre.cadrage } : undefined} />
            <h2>{aPrendre.titre}</h2>
            <p className="ec-gris">
              {aPrendre.commerce}
              {aPrendre.ville ? ` · ${aPrendre.ville}` : ""} · {aPrendre.conditions}
            </p>
            {etat.solde >= aPrendre.prix ? (
              <>
                <p className="ec-calcul">
                  Ton solde : <b>{etat.solde}</b> → <b>{etat.solde - aPrendre.prix}</b> crédits
                </p>
                <button type="button" className="cz-go grand" onClick={() => prendre(aPrendre)}>
                  Prendre pour {aPrendre.prix} crédits
                </button>
              </>
            ) : (
              <>
                <p className="ec-calcul">
                  Il te manque <b>{aPrendre.prix - etat.solde}</b> crédits.
                </p>
                <p className="ec-gris">Mets une offre en jeu : chaque fois qu’un commerçant la prend, tu gagnes son prix en crédits.</p>
                <button
                  type="button"
                  className="cz-go"
                  onClick={() => {
                    setAPrendre(null);
                    setVue("offres");
                  }}
                >
                  Ajouter une offre
                </button>
              </>
            )}
            <button type="button" className="cz-lien" onClick={() => setAPrendre(null)}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {pris && (
        <div className="ec-feuille" role="dialog" aria-label="C’est à toi">
          <div className="ec-feuille-c">
            <h2 className="ec-bravo">C’est à toi !</h2>
            <BonPris b={pris} ouvert onOuvrir={() => undefined} />
            <button
              type="button"
              className="cz-go"
              onClick={() => {
                setPris(null);
                setVue("solde");
              }}
            >
              Voir mes bons
            </button>
            <button type="button" className="cz-lien" onClick={() => setPris(null)}>
              Continuer à découvrir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ UNE OFFRE D'UN AUTRE COMMERÇANT ═════════════════════════════════════ */
function CarteOffre({ o, envie, onEnvie, onPrendre }: { o: Offre; envie: boolean; onEnvie: () => void; onPrendre: () => void }) {
  const epuise = o.restantes <= 0;
  return (
    <article className={`ec-offre${o.hotel ? " hotel" : ""}`}>
      <div className="ec-offre-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={o.photo} alt="" style={o.cadrage ? { objectPosition: o.cadrage } : undefined} />
        <span className="ec-prix">{o.prix} crédits</span>
        {o.hotel && <span className="ec-hotel">🏨 Hôtel</span>}
        <button type="button" className={`ec-coeur${envie ? " on" : ""}`} onClick={onEnvie} aria-pressed={envie} aria-label={envie ? "Retirer de mes envies" : "Garder dans mes envies"}>
          {envie ? "♥" : "♡"}
        </button>
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
        <h3>{o.titre}</h3>
        <p>
          {o.conditions} · {epuise ? "épuisé" : `plus que ${o.restantes}`}
        </p>
        <button type="button" className="ec-prendre" disabled={epuise} onClick={onPrendre}>
          {epuise ? "Épuisé" : `Prendre · ${o.prix} crédits`}
        </button>
      </div>
    </article>
  );
}

/* ═══ SES OFFRES ══════════════════════════════════════════════════════════ */
function MesOffres({
  commerce,
  dossier,
  etat,
  onAjouter,
  onRetirer,
  onPlafond,
  onDecouvrir,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  etat: Etat;
  onAjouter: (o: MonOffre) => void;
  onRetirer: (id: string) => void;
  onPlafond: (p: number) => void;
  onDecouvrir: () => void;
}) {
  const m = MODELES[commerce.famille];
  const [form, setForm] = useState(etat.mesOffres.length === 0);
  const [titre, setTitre] = useState(m.titre);
  const [prix, setPrix] = useState(m.prix);
  const [quantite, setQuantite] = useState(4);
  const [conditions, setConditions] = useState(m.conditions[0]);
  const [photo, setPhoto] = useState(commerce.photo ?? m.photo);
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
    <section className="ec-mes-offres">
      <div className="ec-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Ce que tu offres</h2>
          <p>Aux autres commerçants, au prix public. Chaque fois qu’un commerçant en prend une, tu gagnes son prix en crédits.</p>
        </div>
      </div>

      {etat.mesOffres.map((o) => (
        <article key={o.id} className="ec-mienne">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.photo} alt="" />
          <span>
            <b>{o.titre}</b>
            <em>
              {o.prix} € × {o.quantite} · reste {o.restantes}
            </em>
            <small>{o.conditions}</small>
          </span>
          <button type="button" className="cz-lien" onClick={() => onRetirer(o.id)}>
            Retirer
          </button>
        </article>
      ))}

      {form ? (
        <div className="ec-form">
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
          <div className="ec-deux">
            <label className="ec-champ">
              <span>Prix public</span>
              <div className="ec-euros">
                <input type="number" inputMode="numeric" min={5} max={2000} value={prix} onChange={(e) => setPrix(Math.max(0, Math.min(2000, Number(e.target.value) || 0)))} />
                <i>€</i>
              </div>
            </label>
            <div className="ec-champ">
              <span>Combien</span>
              <div className="ec-pas">
                <button type="button" onClick={() => setQuantite((q) => Math.max(1, q - 1))} aria-label="Un de moins">
                  −
                </button>
                <b>{quantite}</b>
                <button type="button" onClick={() => setQuantite((q) => Math.min(20, q + 1))} aria-label="Un de plus">
                  +
                </button>
              </div>
            </div>
          </div>
          <p className="ec-total">
            {prix} € × {quantite} = <b>{prix * quantite} crédits</b> à gagner
          </p>
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
          <button
            type="button"
            className="cz-go grand"
            disabled={!titre.trim() || prix < 5}
            onClick={() => {
              onAjouter({ id: `o-${Date.now()}`, titre: titre.trim(), prix, quantite, restantes: quantite, conditions, photo });
              setForm(false);
            }}
          >
            🎁 Mettre en jeu
          </button>
          {etat.mesOffres.length > 0 && (
            <button type="button" className="cz-lien" onClick={() => setForm(false)}>
              Annuler
            </button>
          )}
        </div>
      ) : (
        <>
          <button type="button" className="ec-ajouter" onClick={() => setForm(true)}>
            ＋ Ajouter une offre
          </button>
          <button type="button" className="cz-go" onClick={onDecouvrir}>
            Découvrir les offres des autres <s aria-hidden="true">→</s>
          </button>
        </>
      )}

      <div className="ec-champ ec-plafond">
        <span>Je reçois au plus, par mois</span>
        <div className="ec-puces">
          {PLAFONDS.map((p) => (
            <button key={p} type="button" className={etat.plafond === p ? "on" : ""} onClick={() => onPlafond(p)}>
              {p ? `${p} crédits` : "Sans plafond"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function BonPris({ b, ouvert, onOuvrir }: { b: Bon; ouvert: boolean; onOuvrir: () => void }) {
  const qr = useQr(ouvert ? `ClikMe · Bon ${b.code} · ${b.titre} (${b.prix} crédits) chez ${b.commerce} · Exemple` : null);
  return (
    <article className={`ec-recu${ouvert ? " ouvert" : ""}`}>
      <button type="button" className="ec-recu-h" onClick={onOuvrir} aria-expanded={ouvert}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.photo} alt="" />
        <span>
          <b>{b.titre}</b>
          <em>
            {b.commerce}
            {b.ville ? ` · ${b.ville}` : ""} · {b.prix} crédits
          </em>
          <small>{b.conditions}</small>
        </span>
        <i>{ouvert ? "▲" : "QR"}</i>
      </button>
      {ouvert && (
        <div className="ec-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt={`Code ${b.code}`} /> : <span className="ec-qr-vide" />}
          <b>{b.code}</b>
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
.ec-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.ec-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.ec-solde{border:0;border-radius:999px;padding:9px 14px;background:var(--ambre);color:#2A1608;font-weight:900;font-size:15px;
  animation:ec-pouls .5s ease-out;}
@keyframes ec-pouls{from{transform:scale(1.18);}to{transform:none;}}
.ec-exemple{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;
  border-radius:999px;background:rgba(245,162,58,.18);color:var(--ambre);vertical-align:middle;}
.ec-gris{color:var(--gris);font-size:14px;line-height:1.4;margin:0;}
.ec-onglets{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:5px;border-radius:999px;background:var(--nappe);
  border:1px solid var(--trait);}
.ec-onglets button{height:38px;border:0;border-radius:999px;background:none;color:var(--gris);font-weight:800;font-size:13.5px;}
.ec-onglets button.on{background:var(--ambre);color:#2A1608;}
.ec-vente{margin:0;padding:12px 14px;border-radius:16px;background:rgba(124,240,162,.12);border:1px solid rgba(124,240,162,.45);
  color:#C9F7D7;font-weight:700;font-size:14px;animation:ec-pouls .4s ease-out;}
.ec-decouvrir,.ec-mes-offres,.ec-solde-vue,.ec-form{display:flex;flex-direction:column;gap:12px;}
.ec-villes{display:flex;flex-wrap:wrap;gap:8px;}
.ec-villes button{height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);
  color:var(--creme);font-weight:800;font-size:14px;}
.ec-villes button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.ec-villes .ec-envies{margin-left:auto;}
.ec-villes .ec-envies.on{background:rgba(255,46,154,.16);color:#FFC2E0;border-color:var(--rose);}
.ec-vide{margin:0;padding:18px;border-radius:18px;border:1px dashed var(--trait);text-align:center;font-size:14px;color:var(--gris);}
.ec-offre{border-radius:22px;overflow:hidden;background:var(--nappe);border:1px solid var(--trait);}
.ec-offre.hotel{border-color:rgba(245,162,58,.55);box-shadow:0 0 26px rgba(245,162,58,.14);}
.ec-offre-photo{position:relative;}
.ec-offre-photo img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;}
.ec-prix{position:absolute;left:12px;bottom:12px;padding:7px 12px;border-radius:999px;background:var(--ambre);color:#2A1608;
  font-family:var(--font-clikme),sans-serif;font-weight:900;font-size:16px;}
.ec-hotel{position:absolute;left:12px;top:12px;padding:5px 10px;border-radius:999px;background:rgba(18,12,9,.72);color:var(--creme);
  font-size:12.5px;font-weight:800;}
.ec-coeur{position:absolute;right:12px;top:12px;width:42px;height:42px;border-radius:50%;border:0;background:rgba(18,12,9,.72);
  color:#fff;font-size:20px;}
.ec-coeur.on{background:var(--rose);}
.ec-offre-t{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;}
.ec-qui{display:flex;align-items:center;gap:10px;}
.ec-qui img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ec-qui b{display:block;font-size:14.5px;}
.ec-qui em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-offre h3{margin:2px 0 0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;line-height:1.2;}
.ec-offre p{margin:0;font-size:13.5px;color:var(--gris);}
.ec-prendre{margin-top:4px;height:46px;border:0;border-radius:999px;background:var(--rose);color:#fff;font-weight:900;font-size:15px;
  box-shadow:0 10px 24px -10px rgba(255,46,154,.7);}
.ec-prendre:disabled{background:var(--nappe2);color:var(--gris);box-shadow:none;}
.ec-intro{display:grid;grid-template-columns:56px 1fr;gap:12px;align-items:center;padding:14px;border-radius:22px;
  background:var(--nappe);border:1px solid var(--trait);}
.ec-intro img{width:56px;height:56px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ec-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;}
.ec-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.ec-mienne{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:10px;border-radius:18px;
  background:var(--nappe);border:1px solid rgba(245,162,58,.4);}
.ec-mienne img{width:56px;height:56px;border-radius:12px;object-fit:cover;}
.ec-mienne b{display:block;font-size:15px;}
.ec-mienne em{display:block;font-style:normal;font-size:13px;font-weight:800;color:var(--ambre);}
.ec-mienne small{display:block;font-size:12px;color:var(--gris);}
.ec-ajouter{height:48px;border-radius:16px;border:1px dashed rgba(245,162,58,.6);background:none;color:var(--ambre);font-weight:800;font-size:15px;}
.ec-photo{position:relative;padding:0;border:1px solid var(--trait);border-radius:20px;overflow:hidden;background:var(--nappe2);}
.ec-photo img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;}
.ec-photo span{position:absolute;right:10px;bottom:10px;padding:7px 12px;border-radius:999px;background:rgba(18,12,9,.72);
  color:var(--creme);font-size:13px;font-weight:700;}
.ec-champ{display:flex;flex-direction:column;gap:7px;}
.ec-champ > span{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.ec-champ input{height:46px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);
  font-size:16px;width:100%;min-width:0;}
.ec-deux{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.ec-euros{position:relative;}
.ec-euros i{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-style:normal;font-weight:800;color:var(--gris);}
.ec-pas{display:grid;grid-template-columns:46px 1fr 46px;align-items:center;height:46px;border-radius:14px;border:1px solid var(--trait);
  background:var(--nappe);overflow:hidden;}
.ec-pas button{height:100%;border:0;background:var(--nappe2);color:var(--creme);font-size:20px;font-weight:900;}
.ec-pas b{text-align:center;font-size:18px;}
.ec-total{margin:0;font-size:14px;color:var(--gris);}
.ec-total b{color:var(--ambre);}
.ec-puces{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.ec-puces button{height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);
  color:var(--creme);font-weight:700;font-size:14px;}
.ec-puces button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.ec-astuce{font-style:normal;font-size:13px;color:var(--gris);}
.ec-plafond{margin-top:6px;padding-top:12px;border-top:1px solid var(--trait);}
.ec-gros-solde{display:flex;flex-direction:column;align-items:center;gap:2px;padding:20px 14px;border-radius:22px;text-align:center;
  background:linear-gradient(160deg,rgba(245,162,58,.2),rgba(255,46,154,.08));border:1px solid rgba(245,162,58,.45);}
.ec-gros-solde b{font-family:var(--font-clikme),sans-serif;font-size:52px;line-height:1;color:var(--ambre);}
.ec-gros-solde span{font-weight:800;}
.ec-gros-solde em{margin-top:6px;font-style:normal;font-size:13px;color:var(--gris);}
.ec-solde-vue h3,.ec-aide h3{margin:6px 0 0;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.ec-histo{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}
.ec-histo li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;
  background:var(--nappe);border:1px solid var(--trait);}
.ec-histo b{display:block;font-size:14px;}
.ec-histo em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-histo i{font-style:normal;font-weight:900;font-size:16px;}
.ec-histo i.plus{color:#7CF0A2;}
.ec-histo i.moins{color:#FF8FB8;}
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
.ec-qr img,.ec-qr-vide{width:180px;height:180px;border-radius:14px;background:#FFF4E6;}
.ec-qr b{font-family:var(--font-clikme),sans-serif;font-size:20px;letter-spacing:.08em;}
.ec-qr p{margin:0;font-size:13px;color:var(--gris);text-align:center;}
.ec-aide{padding:12px 14px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.ec-aide p{margin:6px 0 0;font-size:13.5px;line-height:1.4;color:var(--gris);}
.ec-aide b{color:var(--creme);}
.ec-feuille{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,7,5,.7);}
.ec-feuille-c{width:100%;max-width:560px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;
  padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));border-radius:26px 26px 0 0;background:#1C1411;
  border-top:1px solid rgba(245,162,58,.4);animation:ec-monte .28s ease-out;}
@keyframes ec-monte{from{transform:translateY(40px);opacity:0;}to{transform:none;opacity:1;}}
.ec-feuille-c > img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:18px;}
.ec-feuille-c h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:22px;font-weight:800;}
.ec-feuille-c .cz-lien{align-self:center;}
.ec-calcul{margin:0;font-size:15px;}
.ec-calcul b{color:var(--ambre);font-size:18px;}
.ec-bravo{text-align:center;font-size:30px !important;color:#fff;animation:ec-pouls .5s ease-out;}
`,
      }}
    />
  );
}
