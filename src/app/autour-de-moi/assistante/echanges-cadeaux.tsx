"use client";

// 🎁 LE CADEAU DU VOISIN — offrir à SES clients un petit cadeau chez un
// commerçant d'à côté, payé avec ses crédits d'échange.
//
// « Offrez à vos clients les cadeaux de vos voisins, payés avec vos créneaux
// vides, pas avec votre argent. » Lou (coiffeuse) offre « pour toute
// coloration, ton dessert du jour chez Bergine » : son offre se démarque sans
// remise, Bergine gagne un client qui vient rarement seul, et chacun est
// montré à la clientèle de l'autre.
//
// Les pièces de l'écran, utilisées telles quelles par la démonstration
// (`echanges-comptoir.tsx`) et par le vrai comptoir (`echanges-reels.tsx`) :
// les deux onglets, ce que le réseau a amené, les lots offerts, « donner un
// bon », « offrir », « mon cadeau », « venu à combien ? » et la ville pas
// encore ouverte.
import { useState } from "react";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { CADEAU_PAR_MOIS, JOURS_VALIDITE, QUANTITES_CADEAU, chezNom, phraseDuCadeau, type EtatEchanges, type MonLotDeCadeaux } from "@/lib/echanges/echanges";
import { Feuille, useQr } from "./echanges-communs";
import { jouer, vibrer } from "./echanges-magie";

/** Le petit cadeau que chaque métier accepterait naturellement d'être offert — modifiable. */
export const MODELES_CADEAU: Record<FamilleDouble, { titre: string; prix: number }> = {
  table: { titre: "Un dessert du jour", prix: 7 },
  bar: { titre: "Un verre offert", prix: 6 },
  coiffure: { titre: "Un soin express", prix: 12 },
  ongles: { titre: "Une pose de vernis", prix: 12 },
  fleurs: { titre: "Une fleur de saison", prix: 5 },
  mode: { titre: "Un bon de 10 €", prix: 10 },
  createur: { titre: "Une petite bougie", prix: 8 },
  lunettes: { titre: "Un étui et un nettoyage", prix: 8 },
  seance: { titre: "Une séance découverte de 20 min", prix: 20 },
  librairie: { titre: "Un livre de poche", prix: 8 },
};

/** Pour quoi il offre, dit à SES clients : l'argument de vente, dans les mots de son métier. */
export const OCCASIONS: Record<FamilleDouble, string> = {
  table: "pour tout menu du midi",
  bar: "pour tout apéro à deux",
  coiffure: "pour toute coloration",
  ongles: "pour toute pose",
  fleurs: "pour tout bouquet de plus de 30 €",
  mode: "pour tout achat ce mois-ci",
  createur: "pour tout atelier",
  lunettes: "pour toute nouvelle paire",
  seance: "pour toute séance",
  librairie: "pour tout livre acheté",
};

/** Un cadeau d'un autre commerçant, tel que la pile et la feuille le montrent. */
export type CarteCadeau = { id: string; commerce: string; metier: string; visage: string; titre: string; prix: number; photo: string; ou: string; restant?: number };

const dateCourte = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : `dans ${JOURS_VALIDITE} jours`;
};
const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

/* ═══ LES DEUX ONGLETS ════════════════════════════════════════════════════ */
export type Onglet = "moi" | "clients";
export function Onglets({ onglet, onChanger, pastille = 0 }: { onglet: Onglet; onChanger: (o: Onglet) => void; pastille?: number }) {
  return (
    <div className="ec-onglets" role="tablist" aria-label="Pour qui">
      <button type="button" role="tab" aria-selected={onglet === "moi"} className={onglet === "moi" ? "on" : ""} onClick={() => onChanger("moi")}>
        🛍️ Pour moi
      </button>
      <button type="button" role="tab" aria-selected={onglet === "clients"} className={onglet === "clients" ? "on" : ""} onClick={() => onChanger("clients")}>
        🎁 Pour mes clients
        {pastille > 0 && <i aria-label={`${pastille} à donner`}>{pastille}</i>}
      </button>
    </div>
  );
}

/* ═══ CE QUE LE RÉSEAU LUI A AMENÉ — en clients, pas en euros ═════════════ */
export function CeQueLeReseauAmene({ reseau, aDesLots = false }: { reseau: EtatEchanges["reseau"]; aDesLots?: boolean }) {
  if (!reseau.clientsRecus && !reseau.clientsEnvoyes) {
    // L'EXPLICATION, UNE FOIS : dès qu'il a offert un lot, ses lots parlent d'eux-mêmes.
    if (aDesLots) return null;
    return (
      <p className="ec-reseau vide">
        🎁 <b>Offre à tes clients le cadeau d’un voisin</b>, payé avec ton solde : ton offre se démarque sans remise, et lui gagne un client.
      </p>
    );
  }
  return (
    <div className="ec-reseau">
      <p>
        <b>{reseau.clientsRecus}</b>
        <span>
          {pluriel(reseau.clientsRecus, "client venu", "clients venus")} chez toi grâce aux cadeaux des voisins
          {reseau.personnesRecues > reseau.clientsRecus ? `, ${reseau.personnesRecues} personnes en tout` : ""}
        </span>
      </p>
      <p>
        <b>{reseau.clientsEnvoyes}</b>
        <span>
          {reseau.clientsEnvoyes === 0
            ? "client envoyé chez tes voisins pour l’instant"
            : pluriel(reseau.clientsEnvoyes, "de tes clients envoyé chez tes voisins", "de tes clients envoyés chez tes voisins")}
        </span>
      </p>
    </div>
  );
}

/* ═══ SES LOTS DE CADEAUX ═════════════════════════════════════════════════ */
export function LotsDeCadeaux({
  lots,
  envoi = false,
  onDonner,
  onAnnoncer,
  onReprendre,
}: {
  lots: MonLotDeCadeaux[];
  envoi?: boolean;
  onDonner: (l: MonLotDeCadeaux) => void;
  onAnnoncer?: (l: MonLotDeCadeaux) => void;
  onReprendre?: (l: MonLotDeCadeaux) => void;
}) {
  const vivants = lots.filter((l) => l.aDonner > 0 || l.donnes > l.utilises);
  if (vivants.length === 0) return null;
  return (
    <div className="ec-lots">
      <h3 className="ec-sous-titre">Tes cadeaux en cours</h3>
      {vivants.map((l) => (
        <article key={l.id} className="ec-lot">
          <div className="ec-lot-h">
            {l.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photo} alt="" />
            ) : (
              <span className="ec-recu-vide">🎁</span>
            )}
            <span>
              <b>
                {l.titre} {chezNom(l.chez)}
              </b>
              {l.occasion && <em>{l.occasion}</em>}
              <small>
                {l.donnes} {pluriel(l.donnes, "donné", "donnés")} · {l.utilises} {pluriel(l.utilises, "venu", "venus")}
                {l.personnes > l.utilises ? ` (${l.personnes} personnes)` : ""} · {l.aDonner} à donner · jusqu’au {dateCourte(l.expire)}
              </small>
            </span>
          </div>
          <div className="ec-lot-b">
            {l.aDonner > 0 && (
              <button type="button" className="cz-go" disabled={envoi} onClick={() => onDonner(l)}>
                Donner un bon à un client
              </button>
            )}
            {onAnnoncer && l.aDonner > 0 && (
              <button type="button" className="ec-annoncer" disabled={envoi} onClick={() => onAnnoncer(l)}>
                📣 L’annoncer partout
              </button>
            )}
            {onReprendre && l.aDonner > 0 && (
              <button type="button" className="cz-lien" disabled={envoi} onClick={() => onReprendre(l)}>
                Reprendre les {l.aDonner} pas encore donnés
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

/* ═══ CE QU'IL ACCEPTE D'ÊTRE OFFERT ══════════════════════════════════════ */
export function MonCadeauLigne({ cadeau, onOuvrir }: { cadeau: { titre: string; prix: number; parMois: number } | null; onOuvrir: () => void }) {
  return (
    <button type="button" className={`ec-moncadeau${cadeau ? "" : " chaud"}`} onClick={onOuvrir}>
      <span aria-hidden="true">🎁</span>
      <span>
        {cadeau ? (
          <>
            <b>Ton cadeau pour les clients des voisins</b>
            <em>
              {cadeau.titre} · {cadeau.prix} € · jusqu’à {cadeau.parMois} par mois
            </em>
          </>
        ) : (
          <>
            <b>Fais venir les clients des voisins</b>
            <em>Propose un petit cadeau qu’ils offriront à leurs clients : chaque client servi te rapporte son prix.</em>
          </>
        )}
      </span>
      <s aria-hidden="true">›</s>
    </button>
  );
}

export function FeuilleMonCadeau({
  famille,
  initial,
  onEnregistrer,
  onRetirer,
  onFermer,
}: {
  famille: FamilleDouble;
  initial: { titre: string; prix: number; parMois: number } | null;
  onEnregistrer: (c: { titre: string; prix: number; parMois: number }) => Promise<string | null> | string | null;
  onRetirer?: () => void;
  onFermer: () => void;
}) {
  const m = MODELES_CADEAU[famille];
  const [titre, setTitre] = useState(initial?.titre ?? m.titre);
  const [prixTexte, setPrixTexte] = useState(String(initial?.prix ?? m.prix));
  const [parMois, setParMois] = useState(initial?.parMois ?? 10);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const prix = Math.round(Number(prixTexte.replace(",", ".")) || 0);
  const pret = titre.trim().length >= 2 && prix >= 2 && prix <= 60;
  return (
    <Feuille titre="Mon cadeau pour les clients des voisins" onFermer={onFermer}>
      <p className="ec-gris">
        Les autres commerçants l’offrent à <b>leurs</b> clients. À chaque client que tu sers, tu gagnes son prix, et c’est un nouveau client qui découvre ton commerce.
      </p>
      <div className="ec-champs ec-champs-cadeau">
        <label>
          <span>Le cadeau</span>
          <input value={titre} maxLength={60} onChange={(e) => setTitre(e.target.value)} />
        </label>
        <label>
          <span>Son prix</span>
          <span className="ec-euro">
            <input type="number" inputMode="numeric" min={2} max={60} value={prixTexte} onChange={(e) => setPrixTexte(e.target.value)} />
            <i aria-hidden="true">€</i>
          </span>
        </label>
      </div>
      <p className="ec-astuce">Son vrai prix, celui de ta carte. Un petit cadeau : entre 2 et 60 €.</p>
      <span className="ec-champ-t">Combien de clients des voisins peux-tu accueillir par mois ?</span>
      <div className="ec-puces quatre" role="group" aria-label="Combien par mois">
        {CADEAU_PAR_MOIS.map((n) => (
          <button key={n} type="button" className={parMois === n ? "on" : ""} aria-pressed={parMois === n} onClick={() => setParMois(n)}>
            {n}
          </button>
        ))}
      </div>
      {erreur && <p className="ec-erreur">{erreur}</p>}
      <button
        type="button"
        className="cz-go grand"
        disabled={!pret || envoi}
        onClick={async () => {
          setEnvoi(true);
          setErreur("");
          const r = await onEnregistrer({ titre: titre.trim(), prix, parMois });
          setEnvoi(false);
          if (r) setErreur(r);
        }}
      >
        {envoi ? "Un instant…" : initial ? "Enregistrer" : "Proposer mon cadeau"}
      </button>
      {initial && onRetirer && (
        <button type="button" className="cz-lien" disabled={envoi} onClick={onRetirer}>
          Ne plus le proposer
        </button>
      )}
    </Feuille>
  );
}

/* ═══ OFFRIR UN LOT À SES CLIENTS ═════════════════════════════════════════ */
export function FeuilleOffrir({
  cadeau,
  famille,
  aDepenser,
  onOffrir,
  onFermer,
}: {
  cadeau: CarteCadeau;
  famille: FamilleDouble;
  aDepenser: number;
  onOffrir: (quantite: number, occasion: string) => Promise<string | null> | string | null;
  onFermer: () => void;
}) {
  const restant = cadeau.restant ?? 60;
  const base = QUANTITES_CADEAU.filter((q) => q <= restant);
  const options = base.length ? base : restant > 0 ? [restant] : [];
  const possible = (q: number) => q * cadeau.prix <= aDepenser;
  const parDefaut = [...options].reverse().find((q) => q <= 10 && possible(q)) ?? options.find(possible) ?? options[0] ?? 0;
  const [quantite, setQuantite] = useState(parDefaut);
  const [occasion, setOccasion] = useState(OCCASIONS[famille]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const total = quantite * cadeau.prix;
  const phrase = phraseDuCadeau({ titre: cadeau.titre, chez: cadeau.commerce, occasion });
  return (
    <div className="ec-feuille" role="dialog" aria-label="Offrir à mes clients">
      <div className="ec-feuille-c">
        {cadeau.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cadeau.photo} alt="" />
        )}
        <h2>
          {cadeau.titre} {chezNom(cadeau.commerce)}
        </h2>
        <p className="ec-gris">
          {cadeau.ou ? `${cadeau.ou} · ` : ""}
          {cadeau.prix} € le cadeau, payé avec ton solde
        </p>
        {options.length === 0 ? (
          <p className="ec-calcul">{cadeau.commerce} a déjà été offert autant qu’il le peut ce mois-ci.</p>
        ) : (
          <>
            <span className="ec-champ-t">Combien de cadeaux pour tes clients ?</span>
            <div className="ec-puces" role="group" aria-label="Combien de cadeaux">
              {options.map((q) => (
                <button key={q} type="button" className={quantite === q ? "on" : ""} aria-pressed={quantite === q} disabled={!possible(q)} onClick={() => setQuantite(q)}>
                  {q}
                </button>
              ))}
            </div>
            <label className="ec-occasion">
              <span className="ec-champ-t">Pour quoi tu l’offres ?</span>
              <input value={occasion} maxLength={80} onChange={(e) => setOccasion(e.target.value)} placeholder={OCCASIONS[famille]} />
            </label>
            <p className="ec-phrase">{phrase}</p>
            {possible(quantite) ? (
              <>
                <p className="ec-calcul">
                  {quantite} × {cadeau.prix} € = <b>{total} €</b>. Après, tu pourras encore dépenser {aDepenser - total} €.
                </p>
                <p className="ec-calcul petit">
                  {cadeau.commerce} gagne {cadeau.prix} € à chaque client qui vient. Les bons pas donnés dans {JOURS_VALIDITE} jours te reviennent.
                </p>
              </>
            ) : (
              <p className="ec-calcul">
                Il te manque <b>{total - aDepenser} €</b> pour {quantite} cadeaux. Dès qu’un commerçant prend ton produit, tu peux offrir plus.
              </p>
            )}
            {erreur && <p className="ec-erreur">{erreur}</p>}
            <button
              type="button"
              className="cz-go grand"
              disabled={envoi || !possible(quantite) || quantite < 1}
              onClick={async () => {
                setEnvoi(true);
                setErreur("");
                const r = await onOffrir(quantite, occasion.trim());
                setEnvoi(false);
                if (r) setErreur(r);
              }}
            >
              {envoi ? "Un instant…" : `J’offre ${quantite} cadeaux · ${total} €`}
            </button>
          </>
        )}
        <button type="button" className="cz-lien" onClick={onFermer}>
          Pas maintenant
        </button>
      </div>
    </div>
  );
}

/* ═══ UN BON POUR SON CLIENT ══════════════════════════════════════════════
   Le client scanne le QR avec son téléphone (son bon s'ouvre chez lui), ou il
   le reçoit par le WhatsApp du commerçant. Jamais par ClikMe. */
export function FeuilleDonner({
  lot,
  code,
  lien,
  restants,
  onEncore,
  onSimuler,
  onFermer,
}: {
  lot: MonLotDeCadeaux;
  code: string;
  /** L'adresse de la page du bon (`/bon/<code>`) ; vide en démonstration. */
  lien: string;
  restants: number;
  onEncore?: () => void;
  /** Démonstration : simuler la visite du client chez le voisin. */
  onSimuler?: () => void;
  onFermer: () => void;
}) {
  const qr = useQr(lien || `ClikMe · Bon cadeau ${code} · ${lot.titre} ${chezNom(lot.chez)} · Exemple`);
  const phrase = phraseDuCadeau({ titre: lot.titre, chez: lot.chez, occasion: lot.occasion });
  const message = `${phrase}\nTon bon, valable jusqu’au ${dateCourte(lot.expire)} : ${lien}`;
  return (
    <div className="ec-feuille" role="dialog" aria-label="Un bon pour ton client">
      <div className="ec-feuille-c">
        <h2 className="ec-centre">Un bon pour ton client 🎁</h2>
        <div className="ec-qr">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`Code ${code}`} />
          ) : (
            <span className="ec-qr-vide" />
          )}
          <b>{code}</b>
          <p>
            {lot.titre} {chezNom(lot.chez)}, jusqu’au {dateCourte(lot.expire)}.
          </p>
        </div>
        <p className="ec-gris ec-centre">Ton client scanne ce QR avec son téléphone : son cadeau s’ouvre chez lui. Ou envoie-le-lui :</p>
        {lien ? (
          <a className="cz-go grand ec-wa" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
            Envoyer par WhatsApp
          </a>
        ) : (
          onSimuler && (
            <button type="button" className="ec-scan" onClick={onSimuler}>
              Simuler sa visite {chezNom(lot.chez)} (démo)
            </button>
          )
        )}
        {onEncore && restants > 0 && (
          <button type="button" className="cz-go" onClick={onEncore}>
            Un autre bon · encore {restants}
          </button>
        )}
        <button type="button" className="cz-lien" onClick={onFermer}>
          C’est fait
        </button>
      </div>
    </div>
  );
}

/* ═══ « VENU À COMBIEN ? » — au scan du bon cadeau, chez celui qui sert ════ */
export function FeuilleVenus({ texte, onChoisir, onFermer }: { texte: string; onChoisir: (n: number) => void; onFermer: () => void }) {
  return (
    <Feuille titre="Venu à combien ?" onFermer={onFermer}>
      <p className="ec-gris">{texte}</p>
      <div className="ec-puces quatre ec-venus" role="group" aria-label="Combien de personnes">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              jouer("note", n);
              vibrer(12);
              onChoisir(n);
            }}
          >
            {n === 6 ? "6+" : n}
          </button>
        ))}
      </div>
      <p className="ec-astuce">Le client et ceux qui l’accompagnent : c’est ce que le réseau t’a amené.</p>
    </Feuille>
  );
}

/* ═══ LA VILLE PAS ENCORE OUVERTE ═════════════════════════════════════════ */
export function VilleFermee({
  nom,
  offres,
  seuil,
  visages,
  onInviter,
}: {
  nom: string;
  offres: number;
  seuil: number;
  visages: string[];
  onInviter: () => void;
}) {
  const manque = Math.max(0, seuil - offres);
  return (
    <div className="ec-ville-fermee">
      <span className="ec-champ-t">📍 {nom || "Ta ville"}</span>
      <b>
        {offres} commerçant{offres > 1 ? "s" : ""} sur {seuil}
      </b>
      <div className="ec-jauge" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (offres / Math.max(1, seuil)) * 100)}%` }} />
      </div>
      {visages.length > 0 && (
        <div className="ec-visages" aria-hidden="true">
          {visages.slice(0, seuil).map((v, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k} src={v} alt="" />
          ))}
        </div>
      )}
      <p>
        L’échange s’ouvre dès <b>{seuil} commerçants</b> : il en manque {manque}. Ton offre est prête, elle sera dans la pile des autres dès l’ouverture.
      </p>
      <button type="button" className="cz-go" onClick={onInviter}>
        Inviter un commerçant voisin
      </button>
    </div>
  );
}

/* ═══ L'AFFICHE DU CADEAU — pour « L'annoncer partout » ═════════════════════
   Faite dans le téléphone, en 1080 × 1350 (le format d'un post) : la photo du
   voisin si elle se laisse dessiner, sinon un grand 🎁 ; puis l'occasion, le
   cadeau, et chez qui. Une image en clair, que la route des annonces accepte. */
function lignes(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let l = "";
  for (const m of mots) {
    const essai = l ? `${l} ${m}` : m;
    if (ctx.measureText(essai).width > largeur && l) {
      out.push(l);
      l = m;
    } else l = essai;
  }
  if (l) out.push(l);
  return out;
}

async function chargerImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((ok) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}

export async function afficheDuCadeau(a: { photo: string; titre: string; chez: string; occasion: string; de: string }): Promise<string> {
  const L = 1080;
  const H = 1350;
  const dessiner = (img: HTMLImageElement | null) => {
    const toile = document.createElement("canvas");
    toile.width = L;
    toile.height = H;
    const ctx = toile.getContext("2d");
    if (!ctx) return "";
    const fond = ctx.createLinearGradient(0, 0, L, H);
    fond.addColorStop(0, "#2A1A10");
    fond.addColorStop(1, "#120C09");
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, L, H);
    const hPhoto = 700;
    if (img) {
      const k = Math.max(L / img.width, hPhoto / img.height);
      const w = img.width * k;
      const h = img.height * k;
      ctx.drawImage(img, (L - w) / 2, (hPhoto - h) / 2, w, h);
      const voile = ctx.createLinearGradient(0, hPhoto - 220, 0, hPhoto);
      voile.addColorStop(0, "rgba(18,12,9,0)");
      voile.addColorStop(1, "rgba(18,12,9,1)");
      ctx.fillStyle = voile;
      ctx.fillRect(0, hPhoto - 220, L, 220);
    } else {
      ctx.font = "320px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎁", L / 2, 470);
    }
    ctx.textAlign = "left";
    const x = 80;
    let y = hPhoto + 40;
    ctx.fillStyle = "#F5A23A";
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.fillText("🎁  OFFERT", x, y);
    y += 70;
    if (a.occasion) {
      ctx.fillStyle = "#FFF4E6";
      ctx.font = "600 44px system-ui, sans-serif";
      for (const l of lignes(ctx, `${a.occasion.charAt(0).toUpperCase()}${a.occasion.slice(1)} :`, L - 2 * x).slice(0, 2)) {
        ctx.fillText(l, x, y);
        y += 58;
      }
      y += 10;
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 78px system-ui, sans-serif";
    for (const l of lignes(ctx, a.titre, L - 2 * x).slice(0, 3)) {
      ctx.fillText(l, x, y + 30);
      y += 92;
    }
    ctx.fillStyle = "#F5A23A";
    ctx.font = "800 54px system-ui, sans-serif";
    ctx.fillText(chezNom(a.chez).slice(0, 40), x, y + 40);
    ctx.fillStyle = "#CDB8A4";
    ctx.font = "600 36px system-ui, sans-serif";
    ctx.fillText(`Demande ton bon à ${a.de}`.slice(0, 52), x, H - 70);
    let url = toile.toDataURL("image/jpeg", 0.82);
    if (url.length > 880_000) url = toile.toDataURL("image/jpeg", 0.6);
    return url;
  };
  const img = await chargerImage(a.photo);
  try {
    return dessiner(img);
  } catch {
    // Une photo d'un autre domaine qui refuse d'être relue : l'affiche sans elle.
    return dessiner(null);
  }
}

/** Le message pour inviter un commerçant voisin, par son WhatsApp. */
export function messageInvitation(ville: string, manque: number, adresse: string): string {
  return `Je suis sur ClikMe : entre commerçants${ville ? ` de ${ville}` : ""}, on s’échange nos produits et on offre à nos clients les cadeaux des voisins. Il manque ${manque} commerçant${manque > 1 ? "s" : ""} pour ouvrir. Tu en es ? ${adresse}`;
}

export function StylesCadeaux() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ec-onglets{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:999px;background:var(--nappe);border:1px solid var(--trait);}
.ec-onglets button{position:relative;height:40px;border:0;border-radius:999px;background:none;color:var(--gris);font-weight:800;font-size:14px;
  transition:background .25s,color .25s;white-space:nowrap;}
.ec-onglets button.on{background:var(--rose);color:#fff;}
.ec-onglets button i{display:inline-grid;place-items:center;min-width:20px;height:20px;margin-left:6px;padding:0 5px;border-radius:999px;
  background:var(--ambre);color:#2A1608;font-style:normal;font-size:11.5px;font-weight:900;vertical-align:1px;}
.ec-reseau{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0;}
.ec-reseau p{margin:0;display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);}
.ec-reseau b{font-family:var(--font-clikme),sans-serif;font-size:26px;font-weight:900;color:#7CF0A2;line-height:1.05;}
.ec-reseau span{font-size:12.5px;line-height:1.3;color:var(--gris);}
.ec-reseau.vide{display:block;padding:11px 13px;border-radius:16px;border:1px dashed rgba(245,162,58,.55);background:rgba(245,162,58,.08);
  font-size:14px;line-height:1.45;color:var(--creme);}
.ec-reseau.vide b{font-family:inherit;font-size:inherit;font-weight:800;line-height:inherit;color:var(--ambre);}
.ec-lots{display:flex;flex-direction:column;gap:8px;}
.ec-lot{display:flex;flex-direction:column;gap:10px;padding:10px;border-radius:18px;background:var(--nappe);border:1px solid rgba(245,162,58,.45);}
.ec-lot-h{display:grid;grid-template-columns:56px minmax(0,1fr);gap:12px;align-items:center;}
.ec-lot-h > img{width:56px;height:56px;border-radius:12px;object-fit:cover;}
.ec-lot-h span{display:flex;flex-direction:column;gap:2px;min-width:0;}
.ec-lot-h b{font-size:15px;line-height:1.25;}
.ec-lot-h em{font-style:normal;font-size:13px;color:var(--ambre);font-weight:700;}
.ec-lot-h small{font-size:12.5px;color:var(--gris);line-height:1.35;}
.ec-lot-b{display:flex;flex-direction:column;gap:6px;}
.ec-annoncer{height:44px;border-radius:999px;border:1px solid rgba(245,162,58,.6);background:none;color:var(--ambre);font-weight:800;font-size:14.5px;}
.ec-moncadeau{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;padding:12px 14px;border-radius:18px;
  border:1px solid var(--trait);background:var(--nappe);color:var(--creme);text-align:left;}
.ec-moncadeau > span:first-child{font-size:24px;}
.ec-moncadeau b{display:block;font-size:14.5px;}
.ec-moncadeau em{display:block;font-style:normal;font-size:13px;line-height:1.35;color:var(--gris);}
.ec-moncadeau s{text-decoration:none;font-size:22px;color:var(--gris);}
.ec-moncadeau.chaud{border-color:rgba(124,240,162,.55);background:rgba(124,240,162,.08);}
.ec-champs-cadeau{padding:0;}
.ec-champ-t{display:block;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--ambre);}
.ec-occasion{display:flex;flex-direction:column;gap:6px;}
.ec-occasion input{width:100%;min-width:0;height:46px;padding:0 12px;border-radius:14px;border:1.5px solid var(--ambre);background:var(--fond);
  color:var(--creme);font-size:16px;font-weight:700;}
.ec-phrase{margin:0;padding:11px 13px;border-radius:16px;background:#FFF4E6;color:#2A1A10;font-weight:800;font-size:15px;line-height:1.35;}
.ec-puces button:disabled{opacity:.4;}
.ec-venus{grid-template-columns:repeat(3,1fr) !important;}
.ec-wa{display:grid;place-items:center;text-decoration:none;}
.ec-ville-fermee{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 14px;border-radius:22px;text-align:center;
  background:linear-gradient(160deg,rgba(245,162,58,.16),rgba(255,46,154,.06));border:1px solid rgba(245,162,58,.45);}
.ec-ville-fermee > b{font-family:var(--font-clikme),sans-serif;font-size:28px;font-weight:900;color:var(--ambre);}
.ec-ville-fermee p{margin:0;font-size:14.5px;line-height:1.45;color:var(--gris);}
.ec-ville-fermee p b{color:var(--creme);}
.ec-jauge{width:100%;height:10px;border-radius:99px;background:var(--nappe2);overflow:hidden;}
.ec-jauge i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--ambre),var(--rose));transition:width .6s;}
.ec-visages{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;}
.ec-visages img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:var(--nappe2);border:2px solid var(--creme);}
.ec-ruban{position:absolute;left:12px;top:12px;padding:5px 10px;border-radius:999px;background:rgba(18,12,9,.78);color:var(--creme);
  font-size:12.5px;font-weight:800;}
`,
      }}
    />
  );
}
