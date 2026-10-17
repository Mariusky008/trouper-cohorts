"use client";

// 🔁 L'ÉCHANGE ENTRE COMMERÇANTS, EN VRAI — chez un commerçant venu par son
// lien pro (`/p/<jeton>`). Même écran que la démonstration
// (`echanges-comptoir.tsx` : les trois étapes, la pile à glisser, les
// panneaux ; `echanges-cadeaux.tsx` : le cadeau du voisin), mais tout passe
// par la base :
//   · son offre est publiée pour TOUS les commerçants ClikMe qui échangent ;
//   · « Je prends » réserve vraiment (le serveur vérifie son solde et la
//     limite du mois de l'autre, d'un seul tenant) ;
//   · « J'offre » réserve un lot de cadeaux pour SES clients chez un voisin ;
//     il en remet un bon à chaque client (QR, ou son WhatsApp) ;
//   · il gagne quand il VALIDE le code d'un commerçant, ou d'un client d'un
//     voisin, venu chez lui — en tapant le code, ou en scannant le QR avec
//     l'appareil photo du téléphone (la page `/bon/<code>` s'ouvre et valide
//     si ce téléphone est le sien). Pour un cadeau : « venu à combien ? ».
//
// LES RÈGLES : jamais d'euros ; 50 € d'avance par personne de l'équipe ;
// tant qu'il doit, ni pause ni refus ; un bon expire au bout de 30 jours ;
// l'échange s'ouvre dans une ville à partir de 12 commerçants — avant,
// l'écran montre combien ils sont et propose d'inviter un voisin.
//
// RIEN D'INVENTÉ : les offres sont celles de vrais commerçants. Tant qu'il n'y
// en a pas, l'écran le dit. Tant que les migrations ne sont pas appliquées, la
// carte de l'accueil dit « bientôt ».
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { CLE_ACCES_COMPTOIR, chezNom, phraseDuCadeau, type BonReel, type EtatEchanges, type MonLotDeCadeaux } from "@/lib/echanges/echanges";
import { annoncerLeCadeau } from "@/lib/direct/comptoir-en-ligne";
import {
  DetailDuSolde,
  Depart,
  Feuille,
  Pile,
  ReglesDuReseau,
  StylesEchanges,
  carteEnOffre,
  nomAffiche,
  soitEnProduits,
  useQr,
  visageDe,
  type Envie,
  type Mien,
  type Offre,
} from "./echanges-comptoir";
import {
  CeQueLeReseauAmene,
  FeuilleDonner,
  FeuilleMonCadeau,
  FeuilleOffrir,
  FeuilleVenus,
  LotsDeCadeaux,
  MonCadeauLigne,
  Onglets,
  StylesCadeaux,
  VilleFermee,
  afficheDuCadeau,
  messageInvitation,
  type CarteCadeau,
  type Onglet,
} from "./echanges-cadeaux";
import { BoutonSon, FeteDuMatch, GainQuiMonte, StylesMagie, jouer, vibrer } from "./echanges-magie";

const ROUTE = "/api/site-internet/pro/echanges";

type Reponse = { etat?: EtatEchanges; ok?: boolean; message?: string; code?: string; cadeau?: string; client?: boolean; bon?: string; error?: string };
type Reel = { slug: string; token: string };

async function appeler(reel: Reel, action: string, extra: Record<string, unknown> = {}): Promise<Reponse> {
  try {
    const r = await fetch(ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token, action, ...extra }),
    });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    if (!r.ok) return { error: j.error || "Le réseau ne répond pas. Réessaie dans un instant." };
    return j;
  } catch {
    return { error: "Le réseau ne répond pas. Réessaie dans un instant." };
  }
}

function retenirAcces(commerce: CommerceComptoir) {
  if (!commerce.reel) return;
  try {
    window.localStorage.setItem(CLE_ACCES_COMPTOIR, JSON.stringify({ slug: commerce.reel.slug, token: commerce.reel.token, nom: commerce.nom }));
  } catch {
    /* stockage interdit : la page du bon proposera de taper le code au comptoir */
  }
}

const versMien = (e: EtatEchanges, commerce: CommerceComptoir): Mien | undefined =>
  e.mien ? { duJour: e.mien.duJour, titre: e.mien.titre, prix: e.mien.prix, parMois: e.mien.parMois, equipe: e.mien.equipe, photo: e.mien.photo || commerce.photo || "" } : undefined;

const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/* ═══ LA CARTE DE L'ACCUEIL ═══════════════════════════════════════════════ */
/** Son état d'échanges en base, lu une fois — `null` tant qu'il n'est pas lu, ou sans réponse. */
export function useEchangesReels(commerce: CommerceComptoir): EtatEchanges | null {
  return useEtatEtPanne(commerce).etat;
}

/** Le même, avec `panne` : le serveur n'a pas répondu (la carte le dit, au lieu de rester vide). */
function useEtatEtPanne(commerce: CommerceComptoir): { etat: EtatEchanges | null; panne: boolean } {
  const [etat, setEtat] = useState<EtatEchanges | null>(null);
  const [panne, setPanne] = useState(false);
  useEffect(() => {
    if (!commerce.reel) return;
    retenirAcces(commerce);
    let fini = false;
    appeler(commerce.reel, "etat").then((r) => {
      if (fini) return;
      if (r.etat) setEtat(r.etat);
      else setPanne(true);
    });
    return () => {
      fini = true;
    };
  }, [commerce]);
  return { etat, panne };
}

export function CarteEchangesReelle({ commerce, onOuvrir }: { commerce: CommerceComptoir; onOuvrir: () => void }) {
  const { etat, panne } = useEtatEtPanne(commerce);

  /* LA CARTE EST TOUJOURS LÀ, ET DIT OÙ ON EN EST. « L'échange entre
     commerçants n'apparaît pas » : cachée tant que la base n'était pas
     créée, elle ne laissait rien deviner. Désormais :
       · « Bientôt disponible » — la base n'est pas encore créée (migration) ;
       · « Indisponible pour l'instant » — le serveur n'a pas répondu. */
  if (!etat) {
    if (!panne) return null;
    return (
      <button type="button" className="cz-relance cz-echanges" onClick={onOuvrir}>
        <span className="cz-relance-i">🔁</span>
        <span>
          <b>Échanger avec les commerçants</b>
          <em>Indisponible pour l’instant. Réessaie dans un moment.</em>
        </span>
        <s aria-hidden="true">→</s>
      </button>
    );
  }
  if (!etat.pret) {
    return (
      <button type="button" className="cz-relance cz-echanges" onClick={onOuvrir}>
        <span className="cz-relance-i">🔁</span>
        <span>
          <b>Échanger avec les commerçants</b>
          <em>Bientôt disponible : offre ton produit aux autres commerçants ClikMe, prends ce que tu veux chez eux, et offre à tes clients les cadeaux des voisins.</em>
        </span>
        <s aria-hidden="true">→</s>
      </button>
    );
  }
  const aValider = etat.recus.filter((b) => b.statut === "reserve").length;
  const morceaux = etat.mien
    ? [
        etat.maVille.ouverte
          ? `Tu peux dépenser ${etat.compte.aDepenser} € chez les autres commerçants.`
          : `${etat.maVille.offres} commerçants sur ${etat.maVille.seuil} à ${etat.maVille.nom || "ta ville"} : l’échange s’ouvre bientôt.`,
        aValider > 0 ? `${aValider} ${aValider > 1 ? "bons" : "bon"} à valider.` : "",
        etat.reseau.clientsRecus > 0 ? `🎁 ${etat.reseau.clientsRecus} ${etat.reseau.clientsRecus > 1 ? "clients venus" : "client venu"} grâce aux voisins.` : "",
        etat.compte.du > 0 ? `Tu dois ${etat.compte.du} € au réseau.` : "",
      ]
    : ["Offre ton produit aux autres commerçants ClikMe, prends ce que tu veux chez eux, et offre à tes clients les cadeaux des voisins."];
  return (
    <button type="button" className={`cz-relance cz-echanges${!etat.mien || aValider > 0 ? " chaud" : ""}`} onClick={onOuvrir}>
      <span className="cz-relance-i">🔁</span>
      <span>
        <b>Échanger avec les commerçants</b>
        <em>{morceaux.filter(Boolean).join(" ")}</em>
      </span>
      <s aria-hidden="true">→</s>
    </button>
  );
}

/* ═══ L'ÉCRAN ═════════════════════════════════════════════════════════════ */
export function EchangesReels({ commerce, dossier, onRetour }: { commerce: CommerceComptoir; dossier: string; onRetour: () => void }) {
  const reel = commerce.reel as Reel;
  const [etat, setEtat] = useState<EtatEchanges | null>(null);
  const [erreur, setErreur] = useState("");
  const [modifier, setModifier] = useState(false);

  const charger = useCallback(async () => {
    const r = await appeler(reel, "etat");
    if (r.etat) {
      setEtat(r.etat);
      setErreur("");
    } else setErreur(r.error || "Lecture impossible pour l'instant.");
  }, [reel]);

  useEffect(() => {
    let fini = false;
    appeler(reel, "etat").then((r) => {
      if (fini) return;
      if (r.etat) setEtat(r.etat);
      else setErreur(r.error || "Lecture impossible pour l'instant.");
    });
    // REVENIR SUR L'ÉCRAN RELIT TOUT : un commerçant a pu réserver entre-temps.
    const auRetour = () => {
      if (document.visibilityState === "visible") void charger();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      fini = true;
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [reel, charger]);

  const mien = etat ? versMien(etat, commerce) : undefined;
  /* Ce qu'il pourra s'offrir (étape 3 du départ) : de VRAIES offres du réseau — la moins chère, celle du
     milieu, la plus chère. Aucune offre encore : la rangée ne s'affiche pas. */
  const envies = useMemo<Envie[]>(() => {
    const tri = [...(etat?.offres ?? [])].filter((o) => o.prix > 0).sort((a, b) => a.prix - b.prix);
    const choix = tri.length <= 3 ? tri : [tri[0], tri[Math.floor(tri.length / 2)], tri[tri.length - 1]];
    return choix.map((o) => ({ id: o.id, photo: o.photo || visageDe(o.branche, o.metier), prix: o.prix, mot: o.titre }));
  }, [etat?.offres]);

  return (
    <div className="ec">
      <StylesEchanges />
      <div className="ec-haut">
        <button type="button" className="ec-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <BoutonSon />
      </div>
      <StylesMagie />
      <StylesCadeaux />
      {!etat ? (
        <div className="ec-fin-pile">
          {erreur ? (
            <>
              <p>{erreur}</p>
              <button type="button" className="cz-lien" onClick={() => void charger()}>
                Réessayer
              </button>
            </>
          ) : (
            <p>Un instant…</p>
          )}
        </div>
      ) : !etat.pret ? (
        <div className="ec-fin-pile">
          <p>
            <b>L’échange entre commerçants ouvre bientôt.</b> Tu pourras offrir ton produit aux autres commerçants ClikMe, prendre ce que tu veux chez eux, et offrir à tes clients les cadeaux des voisins.
          </p>
        </div>
      ) : !mien || modifier ? (
        <Depart
          commerce={commerce}
          dossier={dossier}
          initial={mien}
          envies={envies}
          reel
          onFini={async (m) => {
            const r = await appeler(reel, "offre", {
              titre: m.titre,
              prix: m.prix,
              parMois: m.parMois,
              duJour: m.duJour,
              equipe: m.equipe ?? 1,
              // UNE PHOTO PRISE À L'ÉTAPE 1 part avec l'offre ; sinon le serveur garde celle qu'il a.
              ...(m.photo.startsWith("data:image/") ? { photo: m.photo } : {}),
              accepte: true,
            });
            if (!r.etat) return r.error || "Publication impossible pour l'instant.";
            setEtat(r.etat);
            setModifier(false);
            return null;
          }}
        />
      ) : (
        <PageReelle commerce={commerce} reel={reel} etat={etat} mien={mien} setEtat={setEtat} onModifier={() => setModifier(true)} />
      )}
    </div>
  );
}

type Panneau = "solde" | "comment" | "bons" | "valider" | "offre" | "moncadeau";

function PageReelle({
  commerce,
  reel,
  etat,
  mien,
  setEtat,
  onModifier,
}: {
  commerce: CommerceComptoir;
  reel: Reel;
  etat: EtatEchanges;
  mien: Mien;
  setEtat: (e: EtatEchanges) => void;
  onModifier: () => void;
}) {
  const famille = commerce.famille;
  const { compte, maVille } = etat;
  const [onglet, setOnglet] = useState<Onglet>("moi");
  const [ville, setVille] = useState(maVille.slug);
  const [vus, setVus] = useState<string[]>([]);
  const [vusCadeaux, setVusCadeaux] = useState<string[]>([]);
  const [choisie, setChoisie] = useState<Offre | null>(null);
  const [aOffrir, setAOffrir] = useState<CarteCadeau | null>(null);
  const [donne, setDonne] = useState<{ lotId: string; code: string } | null>(null);
  const [venus, setVenus] = useState<{ bon: string; texte: string } | null>(null);
  const [recu, setRecu] = useState<BonReel | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<Panneau | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [code, setCode] = useState("");
  /** La scène « C'est à toi ! » qui précède le QR, et le « +180 € » qui monte du solde. */
  const [fete, setFete] = useState<{ bon: BonReel; offre: Offre } | null>(null);
  const [gain, setGain] = useState<{ n: number; cle: number } | null>(null);
  const aValider = etat.recus.filter((b) => b.statut === "reserve");
  const [annonce, setAnnonce] = useState<{ texte: string; mauvais?: boolean } | null>(() =>
    aValider.length > 0
      ? { texte: `🎉 ${aValider.length > 1 ? `${aValider.length} commerçants ont` : "Un commerçant a"} réservé ton produit. Quand ils viennent, valide leur code dans « À valider ».` }
      : null,
  );

  useEffect(() => {
    if (!annonce) return;
    const t = window.setTimeout(() => setAnnonce(null), 6500);
    return () => window.clearTimeout(t);
  }, [annonce]);

  /* LES OFFRES DES AUTRES, au format de la pile — seulement dans les villes ouvertes. */
  const offres: Array<Offre & { villeSlug: string }> = useMemo(
    () =>
      etat.offres
        .filter((o) => o.villeOuverte)
        .map((o) => ({
          id: o.id,
          commerce: o.commerce,
          prenom: "",
          metier: o.metier || "Commerce",
          visage: visageDe(o.branche, o.metier),
          ville: o.ville,
          villeSlug: o.villeSlug,
          titre: o.titre,
          prix: o.prix,
          photo: o.photo,
          ou: o.aPied || o.ville,
          parMois: o.parMois,
          restant: o.restant,
        })),
    [etat.offres],
  );
  /* LES VILLES OUVERTES : la sienne d'abord. */
  const villes = useMemo(() => etat.villes.map((v) => ({ slug: v.slug, nom: v.slug === maVille.slug ? "📍 Ta ville" : v.nom })), [etat.villes, maVille.slug]);
  const deLaVille = offres.filter((o) => o.villeSlug === ville);
  const pile = deLaVille.filter((o) => !vus.includes(o.id) && (o.restant ?? 1) > 0);
  const nomVille = ville === maVille.slug ? "de ta ville" : `de ${villes.find((v) => v.slug === ville)?.nom ?? "cette ville"}`;
  const duApres = choisie ? Math.max(0, compte.pris + choisie.prix - compte.gagne) : 0;

  /* LES CADEAUX DES VOISINS : sa ville seulement — un client ne traverse pas la France pour un dessert. */
  const cadeaux: CarteCadeau[] = useMemo(
    () =>
      etat.cadeaux
        .filter((c) => c.villeSlug === maVille.slug)
        .map((c) => ({
          id: c.id,
          commerce: c.commerce,
          metier: c.metier || "Commerce",
          visage: visageDe(c.branche, c.metier),
          titre: c.titre,
          prix: c.prix,
          photo: c.photo,
          ou: c.aPied || c.ville,
          restant: c.restant,
        })),
    [etat.cadeaux, maVille.slug],
  );
  const pileCadeaux = cadeaux.filter((c) => !vusCadeaux.includes(c.id) && (c.restant ?? 1) > 0);
  const lotDonne = donne ? etat.mesCadeaux.find((l) => l.id === donne.lotId) : undefined;

  const agir = async (action: string, extra: Record<string, unknown> = {}) => {
    setEnvoi(true);
    const r = await appeler(reel, action, extra);
    setEnvoi(false);
    if (r.etat) setEtat(r.etat);
    if (r.error) setAnnonce({ texte: r.error, mauvais: true });
    else if (r.message) setAnnonce({ texte: r.message, mauvais: r.ok === false });
    return r;
  };

  const prendre = async (o: Offre) => {
    const r = await agir("prendre", { fournisseur: o.id });
    setChoisie(null);
    const bon = r.ok && r.code ? r.etat?.pris.find((b) => b.code === r.code) : undefined;
    if (bon) setFete({ bon, offre: o });
  };

  /* DONNER LE PROCHAIN BON D'UN LOT : le serveur le marque « remis », et rend son code. */
  const donnerUnBon = async (lot: MonLotDeCadeaux) => {
    const r = await agir("donner", { cadeau: lot.id });
    if (r.ok && r.code) setDonne({ lotId: lot.id, code: r.code });
  };

  const annoncer = async (lot: MonLotDeCadeaux) => {
    setEnvoi(true);
    setAnnonce({ texte: "📣 L’affiche se prépare…" });
    try {
      const affiche = await afficheDuCadeau({ photo: lot.photo, titre: lot.titre, chez: lot.chez, occasion: lot.occasion, de: commerce.nom });
      const r = await annoncerLeCadeau(commerce, { texte: phraseDuCadeau({ titre: lot.titre, chez: lot.chez, occasion: lot.occasion }), affiche, jusqua: lot.expire });
      setAnnonce(
        r.ok
          ? { texte: `C’est en ligne : ${r.ou.join(", ")}${r.reseaux?.length ? ` 📣 En route vers ${r.reseaux.join(", ")}.` : "."}` }
          : { texte: r.erreur ?? "L’annonce n’a pas pu partir.", mauvais: true },
      );
    } catch {
      setAnnonce({ texte: "L’affiche n’a pas pu être préparée sur ce téléphone.", mauvais: true });
    }
    setEnvoi(false);
  };

  const inviter = () => {
    const manque = Math.max(1, maVille.seuil - maVille.offres);
    window.open(`https://wa.me/?text=${encodeURIComponent(messageInvitation(maVille.nom, manque, window.location.origin))}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="ec-page">
      {!etat.mien?.actif && (
        <div className="ec-regle">
          Ton offre est en pause : les autres commerçants ne la voient pas, et tu ne peux pas prendre chez eux.{" "}
          <button type="button" className="cz-lien" disabled={envoi} onClick={() => void agir("pause", { actif: true })}>
            La réactiver
          </button>
        </div>
      )}

      <button type="button" className="ec-solde" onClick={() => setPanneau("solde")}>
        <span>{maVille.ouverte ? "Tu peux dépenser" : "À l’ouverture, tu pourras dépenser"}</span>
        <b key={compte.aDepenser}>{compte.aDepenser} €</b>
        {compte.du > 0 && <i>Tu dois {compte.du} €</i>}
        <s aria-hidden="true">›</s>
        {gain && <GainQuiMonte key={gain.cle} montant={gain.n} />}
      </button>

      {!maVille.ouverte ? (
        <VilleFermee
          nom={maVille.nom}
          offres={maVille.offres}
          seuil={maVille.seuil}
          visages={maVille.deja.map((d) => d.photo || visageDe(d.branche, d.metier))}
          onInviter={inviter}
          demo={`/autour-de-moi/assistante?metier=${encodeURIComponent(commerce.famille)}&ouvrir=echanges`}
        />
      ) : (
        <>
          <Onglets onglet={onglet} onChanger={setOnglet} pastille={etat.mesCadeaux.filter((l) => l.aDonner > 0).length} />
          {onglet === "moi" ? (
            <>
              {villes.length > 1 && (
                <div className="ec-villes">
                  {villes.map((v) => (
                    <button key={v.slug} type="button" className={ville === v.slug ? "on" : ""} onClick={() => setVille(v.slug)}>
                      {v.nom}
                    </button>
                  ))}
                </div>
              )}

              {pile.length > 0 ? (
                <Pile
                  key={pile[0].id}
                  offres={pile}
                  indice={vus.length === 0}
                  onPasser={(o) => setVus((v) => [...v, o.id])}
                  onPrendre={(o) => (setVus((v) => [...v, o.id]), setChoisie(o))}
                />
              ) : offres.length === 0 ? (
                <div className="ec-fin-pile">
                  <p>
                    <b>Tu es parmi les premiers.</b> Dès qu’un autre commerçant ClikMe publie son offre, elle apparaît ici.
                  </p>
                </div>
              ) : (
                <div className="ec-fin-pile">
                  <p>
                    {deLaVille.length === 0
                      ? `Pas encore d’offre ${nomVille}.`
                      : deLaVille.every((o) => o.restant === 0)
                        ? `Les commerçants ${nomVille} ont déjà donné tout ce qu’ils pouvaient ce mois-ci.`
                        : `Tu as vu toutes les offres ${nomVille}.`}
                  </p>
                  {deLaVille.some((o) => (o.restant ?? 1) > 0) && (
                    <button type="button" className="cz-lien" onClick={() => setVus((v) => v.filter((id) => !deLaVille.some((o) => o.id === id)))}>
                      Les revoir
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <CeQueLeReseauAmene reseau={etat.reseau} aDesLots={etat.mesCadeaux.some((l) => l.aDonner > 0 || l.donnes > l.utilises)} />
              <LotsDeCadeaux
                lots={etat.mesCadeaux}
                envoi={envoi}
                onDonner={(l) => void donnerUnBon(l)}
                onAnnoncer={(l) => void annoncer(l)}
                onReprendre={(l) => void agir("reprendre", { cadeau: l.id })}
              />
              {pileCadeaux.length > 0 ? (
                <Pile
                  key={pileCadeaux[0].id}
                  offres={pileCadeaux.map(carteEnOffre)}
                  indice={vusCadeaux.length === 0}
                  tampon="J’OFFRE"
                  bouton={(o) => `J’offre · ${o.prix} € le cadeau`}
                  astuce="Glisse : à droite tu l’offres à tes clients, à gauche tu passes."
                  onPasser={(o) => setVusCadeaux((v) => [...v, o.id])}
                  onPrendre={(o) => {
                    setVusCadeaux((v) => [...v, o.id]);
                    setAOffrir(cadeaux.find((c) => c.id === o.id) ?? null);
                  }}
                />
              ) : (
                <div className="ec-fin-pile">
                  <p>
                    {cadeaux.length === 0
                      ? "Aucun commerçant de ta ville ne propose encore de cadeau. Propose le tien : les autres suivront."
                      : cadeaux.every((c) => c.restant === 0)
                        ? "Les cadeaux de ta ville ont tous été offerts ce mois-ci."
                        : "Tu as vu tous les cadeaux de ta ville."}
                  </p>
                  {cadeaux.some((c) => (c.restant ?? 1) > 0) && (
                    <button type="button" className="cz-lien" onClick={() => setVusCadeaux([])}>
                      Les revoir
                    </button>
                  )}
                </div>
              )}
              <MonCadeauLigne cadeau={etat.mien?.cadeau ?? null} onOuvrir={() => setPanneau("moncadeau")} />
            </>
          )}
        </>
      )}

      <nav className="ec-tiroirs" aria-label="Plus d’informations">
        <button type="button" className={aValider.length > 0 ? "chaud" : ""} onClick={() => setPanneau("valider")}>
          À valider{aValider.length > 0 ? ` · ${aValider.length}` : ""}
        </button>
        <button type="button" onClick={() => setPanneau("bons")}>
          Mes bons{etat.pris.length > 0 ? ` · ${etat.pris.length}` : ""}
        </button>
        <button type="button" onClick={() => setPanneau("offre")}>
          Mon offre
        </button>
        <button type="button" onClick={() => setPanneau("comment")}>
          Comment ça marche
        </button>
      </nav>

      {annonce && (
        <button type="button" className={`ec-toast${annonce.mauvais ? " mauvais" : ""}`} role="status" onClick={() => setAnnonce(null)}>
          {annonce.texte}
        </button>
      )}

      {panneau === "solde" && (
        <Feuille titre="Mon solde" onFermer={() => setPanneau(null)}>
          <DetailDuSolde decouvert={compte.decouvert} equipe={compte.equipe} gagne={compte.gagne} pris={compte.pris} reste={compte.aDepenser} du={compte.du} mien={mien} famille={famille} />
        </Feuille>
      )}

      {panneau === "comment" && (
        <Feuille titre="Comment ça marche" onFermer={() => setPanneau(null)}>
          <ReglesDuReseau decouvert={compte.decouvert} equipe={compte.equipe} seuil={maVille.seuil} />
        </Feuille>
      )}

      {panneau === "valider" && (
        <Feuille titre="À valider" onFermer={() => setPanneau(null)}>
          <p className="ec-gris">Un commerçant, ou le client d’un voisin, vient avec un bon : scanne son QR avec l’appareil photo de ton téléphone, ou tape son code.</p>
          <form
            className="ec-code"
            onSubmit={async (e) => {
              e.preventDefault();
              const avant = compte.gagne;
              const r = await agir("valider", { code });
              if (r.ok) {
                setCode("");
                // ON VOIT LE GAIN : le panneau se ferme, « +180 € » monte du solde, la pièce tinte.
                const n = (r.etat?.compte.gagne ?? avant) - avant;
                setPanneau(null);
                if (n > 0) {
                  setGain({ n, cle: Date.now() });
                  jouer("piece");
                  vibrer([20, 40, 20]);
                }
                // UN CADEAU DU VOISIN : « venu à combien ? ».
                if (r.client && r.bon) setVenus({ bon: r.bon, texte: r.message ?? "" });
              }
            }}
          >
            <input
              id="ec-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CLK-XXXXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-label="Code du bon"
            />
            <button type="submit" className="cz-go" disabled={envoi || code.replace(/[^A-Z0-9]/gi, "").length < 6}>
              Valider
            </button>
          </form>
          {etat.cadeauxAServir.length > 0 && <h3 className="ec-sous-titre">Tes cadeaux chez les clients des voisins</h3>}
          {etat.cadeauxAServir.map((c) => (
            <div key={`${c.de}|${c.titre}`} className="ec-ligne-bon">
              <span>
                <b>🎁 {c.de}</b>
                <em>
                  offre {c.titre.charAt(0).toLowerCase()}
                  {c.titre.slice(1)} à ses clients · {c.n} {c.n > 1 ? "bons en circulation" : "bon en circulation"}
                </em>
              </span>
            </div>
          ))}
          {aValider.length > 0 && <h3 className="ec-sous-titre">Réservé chez toi</h3>}
          {aValider.map((b) => (
            <div key={b.id} className="ec-ligne-bon">
              <span>
                <b>{b.autre}</b>
                <em>
                  {b.titre} · {b.prix} € · jusqu’au {dateCourte(b.expire)}
                </em>
              </span>
              <button type="button" className="cz-lien" disabled={envoi || compte.du > 0} onClick={() => void agir("annuler", { bon: b.id })}>
                Je ne peux pas
              </button>
            </div>
          ))}
          {aValider.length > 0 && compte.du > 0 && <p className="ec-petit">Tant que tu dois au réseau, tu ne peux pas refuser un bon : c’est en servant que ta dette baisse.</p>}
          {etat.recus.some((b) => b.statut === "utilise") && <h3 className="ec-sous-titre">Déjà validés</h3>}
          {etat.recus
            .filter((b) => b.statut === "utilise")
            .slice(0, 20)
            .map((b) => (
              <div key={b.id} className="ec-ligne-bon fait">
                <span>
                  <b>{b.pour === "client" ? `🎁 Client envoyé par ${b.autre}` : b.autre}</b>
                  <em>
                    {b.titre} · +{b.prix} €{b.venus && b.venus > 1 ? ` · venu à ${b.venus}` : ""}
                  </em>
                </span>
                <i>✓</i>
              </div>
            ))}
        </Feuille>
      )}

      {panneau === "bons" && (
        <Feuille titre="Mes bons" onFermer={() => setPanneau(null)}>
          {etat.pris.length === 0 && <p className="ec-gris">Tu n’as encore rien pris. Glisse une carte vers la droite pour prendre une offre.</p>}
          {etat.pris.map((b) => (
            <BonVue
              key={b.id}
              b={b}
              ouvert={ouvert === b.id}
              onOuvrir={() => setOuvert((x) => (x === b.id ? null : b.id))}
              onAnnuler={envoi ? undefined : () => void agir("annuler", { bon: b.id })}
            />
          ))}
        </Feuille>
      )}

      {panneau === "offre" && (
        <Feuille titre="Mon offre" onFermer={() => setPanneau(null)}>
          <article className="ec-resume">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mien.photo || visageDe(commerce.branche, commerce.metier)} alt="" />
            <div>
              <b>
                {nomAffiche(mien)} · {mien.prix} €
              </b>
              <em>
                Jusqu’à {mien.parMois} par mois · {compte.equipe} {compte.equipe > 1 ? "personnes en profitent" : "personne en profite"}
                {etat.mien?.actif ? "" : " · en pause"}
              </em>
            </div>
          </article>
          {compte.du > 0 && <p className="ec-gris">📣 Tant que tu dois, ton offre passe en tête chez les autres commerçants, et elle reste visible.</p>}
          <button
            type="button"
            className="cz-go"
            onClick={() => {
              setPanneau(null);
              onModifier();
            }}
          >
            Modifier mon offre
          </button>
          <button
            type="button"
            className="cz-lien"
            disabled={envoi || (Boolean(etat.mien?.actif) && compte.du > 0)}
            onClick={() => void agir("pause", { actif: !etat.mien?.actif })}
          >
            {etat.mien?.actif ? "Mettre mon offre en pause" : "Réactiver mon offre"}
          </button>
        </Feuille>
      )}

      {panneau === "moncadeau" && (
        <FeuilleMonCadeau
          famille={famille}
          initial={etat.mien?.cadeau ?? null}
          onEnregistrer={async (c) => {
            const r = await agir("cadeau", c);
            if (r.ok) setPanneau(null);
            return r.ok ? null : r.error || r.message || "Enregistrement impossible.";
          }}
          onRetirer={async () => {
            const r = await agir("cadeau", { retirer: true });
            if (r.ok) setPanneau(null);
          }}
          onFermer={() => setPanneau(null)}
        />
      )}

      {choisie && (
        <div className="ec-feuille" role="dialog" aria-label="Je prends">
          <div className="ec-feuille-c">
            {choisie.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={choisie.photo} alt="" />
            )}
            <h2>{choisie.titre}</h2>
            <p className="ec-gris">
              Chez {choisie.commerce}
              {choisie.ou ? ` · ${choisie.ou}` : ""}
            </p>
            {compte.aDepenser >= choisie.prix ? (
              <>
                <p className="ec-calcul">
                  Après : tu pourras encore dépenser <b>{compte.aDepenser - choisie.prix} €</b>.
                </p>
                {duApres > 0 && (
                  <p className="ec-calcul petit">
                    Tu devras {duApres} € au réseau, {soitEnProduits(mien, famille, duApres)}, à rendre en ton produit.
                  </p>
                )}
                <button type="button" className="cz-go grand" disabled={envoi || !etat.mien?.actif} onClick={() => void prendre(choisie)}>
                  {envoi ? "Réservation…" : `Je prends · ${choisie.prix} €`}
                </button>
              </>
            ) : (
              <p className="ec-calcul">
                Il te manque <b>{choisie.prix - compte.aDepenser} €</b>. Dès qu’un commerçant prend ton produit, tu peux reprendre.
              </p>
            )}
            <button type="button" className="cz-lien" onClick={() => setChoisie(null)}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {aOffrir && (
        <FeuilleOffrir
          cadeau={aOffrir}
          famille={famille}
          aDepenser={compte.aDepenser}
          onOffrir={async (quantite, occasion) => {
            const r = await agir("offrir", { fournisseur: aOffrir.id, quantite, occasion });
            if (!r.ok) return r.error || r.message || "L’offre n’a pas pu être enregistrée.";
            setAOffrir(null);
            jouer("match");
            vibrer([20, 40, 30]);
            setAnnonce({ texte: `🎁 ${quantite} cadeaux prêts ${chezNom(aOffrir.commerce)}. Donne un bon à chaque client concerné, et annonce-le partout.` });
            return null;
          }}
          onFermer={() => setAOffrir(null)}
        />
      )}

      {donne && lotDonne && (
        <FeuilleDonner
          lot={lotDonne}
          code={donne.code}
          lien={`${window.location.origin}/bon/${donne.code}`}
          restants={lotDonne.aDonner}
          onEncore={() => void donnerUnBon(lotDonne)}
          onFermer={() => setDonne(null)}
        />
      )}

      {venus && (
        <FeuilleVenus
          texte={venus.texte}
          onChoisir={(n) => {
            const bon = venus.bon;
            setVenus(null);
            void agir("venus", { bon, n });
          }}
          onFermer={() => setVenus(null)}
        />
      )}

      {fete && (
        <FeteDuMatch
          moi={mien.photo || visageDe(commerce.branche, commerce.metier)}
          eux={fete.offre.photo || fete.offre.visage}
          titre={fete.offre.titre}
          commerce={fete.offre.commerce}
          prix={fete.offre.prix}
          onQr={() => {
            setRecu(fete.bon);
            setFete(null);
          }}
          onFermer={() => setFete(null)}
        />
      )}

      {recu && (
        <div className="ec-feuille" role="dialog" aria-label="Ton bon">
          <div className="ec-feuille-c">
            <h2 className="ec-bravo">Ton bon</h2>
            <BonVue b={recu} ouvert onOuvrir={() => undefined} />
            <p className="ec-gris ec-centre">Ces {recu.prix} € sont déjà déduits de ce que tu peux dépenser. Tu retrouves ce bon dans « Mes bons ».</p>
            <button type="button" className="cz-go" onClick={() => setRecu(null)}>
              C’est noté
            </button>
          </div>
        </div>
      )}
      <StylesReels />
    </section>
  );
}

/** Un bon qu'il a pris : son QR (l'adresse de la page du bon), son code, son état. */
function BonVue({ b, ouvert, onOuvrir, onAnnuler }: { b: BonReel; ouvert: boolean; onOuvrir: () => void; onAnnuler?: () => void }) {
  const lien = typeof window === "undefined" ? `/bon/${b.code}` : `${window.location.origin}/bon/${b.code}`;
  const qr = useQr(ouvert && b.statut === "reserve" ? lien : null);
  const etatDuBon =
    b.statut === "utilise"
      ? "Utilisé ✓"
      : b.statut === "annule"
        ? "Annulé"
        : b.statut === "expire"
          ? "Expiré : le montant t’est revenu"
          : `Réservé : à présenter ${chezNom(b.autre)} avant le ${dateCourte(b.expire)}`;
  return (
    <article className={`ec-recu${ouvert ? " ouvert" : ""}`}>
      <button type="button" className="ec-recu-h" onClick={onOuvrir} aria-expanded={ouvert}>
        {b.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.photo} alt="" />
        ) : (
          <span className="ec-recu-vide">🎟️</span>
        )}
        <span>
          <b>{b.titre}</b>
          <em>
            {b.autre}
            {b.autreVille ? ` · ${b.autreVille}` : ""} · {b.prix} €
          </em>
          <small className={b.statut === "utilise" ? "fait" : ""}>{etatDuBon}</small>
        </span>
        <i>{ouvert ? "▲" : b.statut === "reserve" ? "QR" : "›"}</i>
      </button>
      {ouvert && (
        <div className="ec-qr">
          {b.statut === "reserve" && (qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`Code ${b.code}`} />
          ) : (
            <span className="ec-qr-vide" />
          ))}
          <b>{b.code}</b>
          {b.statut === "reserve" ? (
            <>
              <p>Présente ce code {chezNom(b.autre)} : il le scanne avec son téléphone, ou il le tape dans son comptoir. Il gagne alors {b.prix} €.</p>
              {onAnnuler && (
                <button type="button" className="cz-lien" onClick={onAnnuler}>
                  Annuler la réservation
                </button>
              )}
            </>
          ) : (
            <p>
              {b.statut === "utilise"
                ? `Validé : ${b.autre} a gagné ${b.prix} €.`
                : b.statut === "expire"
                  ? `Pas utilisé en 30 jours : les ${b.prix} € te sont revenus.`
                  : "Ce bon a été annulé : rien n’a été dépensé."}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function StylesReels() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ec-tiroirs button.chaud{border-color:rgba(124,240,162,.55);color:#C9F7D7;background:rgba(124,240,162,.1);}
.ec-toast.mauvais{border-color:rgba(255,46,154,.5);background:#2A1220;color:#FFC9E2;}
.ec-code{display:grid;grid-template-columns:1fr auto;gap:8px;}
.ec-code input{min-width:0;width:100%;height:52px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);
  font-family:var(--font-clikme),sans-serif;font-size:20px;font-weight:800;letter-spacing:.08em;}
.ec-code .cz-go{height:52px;padding:0 20px;}
.ec-ligne-bon{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;
  background:var(--nappe);border:1px solid var(--trait);}
.ec-ligne-bon span{display:flex;flex-direction:column;gap:2px;min-width:0;}
.ec-ligne-bon b{font-size:14.5px;}
.ec-ligne-bon em{font-style:normal;font-size:13px;color:var(--gris);}
.ec-ligne-bon i{font-style:normal;font-weight:900;color:#7CF0A2;}
.ec-ligne-bon.fait{opacity:.8;}
`,
      }}
    />
  );
}
