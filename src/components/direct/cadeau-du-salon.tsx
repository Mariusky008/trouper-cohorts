"use client";

// 🎁 LE CADEAU DANS UN SALON D'ENSEMBLE — public ou privé.
//
// « C'est juste s'il y a un salon d'ouvert, public ou privé, il peut l'envoyer
// dedans. » Le commerce dont on parle dans un salon y lance son cadeau ; les
// membres du salon participent, sans rien faire d'autre qu'y être. La mode et
// la déco peuvent aussi, au choix, l'offrir à ceux qui ont gardé une de leurs
// pièces en favori : là, rien n'est écrit dans le salon — chacun l'apprend sur
// son téléphone.
//
// LE SALON D'UNE SOIRÉE EST LE MÊME QUE CELUI DE « DÉCOUVRIR CETTE SOIRÉE » :
// même clé, donc même cadeau, vu des deux portes (voir `decouverte-soiree.tsx`).
//
// UN CROCHET PLUTÔT QU'UN COMPOSANT : le salon d'Ensemble pose ces pièces à
// quatre endroits différents de son écran (la pastille, l'épingle en tête du
// fil, la carte parmi les messages, les calques par-dessus la feuille).

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { MessageSalon, Salon } from "@/lib/direct/salons";
import { ecrireDansSalon, heureCourte } from "@/lib/direct/salons";
import {
  abonnerCadeaux,
  AUCUN_CADEAU,
  chargerCadeaux,
  finDuCadeau,
  lancerCadeau,
  oublierCadeau,
  ticketVu,
  tirer,
  validerCode,
} from "@/lib/direct/cadeaux";
import { abonnerPiecesGardees, chargerPiecesGardees, piecesGardeesVides } from "@/lib/direct/pieces-gardees";
import { combienDe, parmiLisible, type Parmi, type ProfilCadeau } from "@/lib/site-internet/cadeau-offert";
import { CarteCadeau, CoteCommercant, EcranGagne, reste, StylesCadeau, TicketEpingle, type SourceCadeau } from "@/components/direct/cadeau-offert";

/**
 * CEUX QUI ONT GARDÉ UNE PIÈCE, DANS LA DÉMONSTRATION. Des voisins de
 * démonstration, comme les amis qui répondent dans les salons ; la personne
 * qui tient le téléphone s'y ajoute dès qu'elle a gardé une pièce de ce
 * commerce.
 */
const FAVORIS_DEMO = ["Inès", "Hugo", "Maëlle", "Nora", "Jules", "Sacha"];

export function useCadeauDuSalon({
  salon,
  profil,
  par,
  idCommerce,
  demo,
  membre,
  monNom,
  estMoi,
  fantomeDe,
  monFantome,
  onRejoindre,
}: {
  salon?: Salon;
  /** Le métier du commerce dont parle le salon ; rien : pas de cadeau ici. */
  profil: ProfilCadeau | null;
  /** Le commerce qui offre. */
  par: string;
  idCommerce?: string;
  demo: boolean;
  /** Je suis dans ce salon (pas seulement en lecture). */
  membre: boolean;
  monNom: string;
  estMoi: (qui: string) => boolean;
  fantomeDe: (qui: string) => string;
  monFantome: string;
  onRejoindre?: () => void;
}) {
  const cle = salon?.cle ?? "";
  const soiree = cle.startsWith("soiree|");
  const cadeaux = useSyncExternalStore(abonnerCadeaux, chargerCadeaux, () => AUCUN_CADEAU);
  const cadeau = cle ? cadeaux[cle] : undefined;
  const pieces = useSyncExternalStore(abonnerPiecesGardees, chargerPiecesGardees, piecesGardeesVides);
  const [cote, setCote] = useState(false);
  const [voirTicket, setVoirTicket] = useState(false);
  const [maintenant, setMaintenant] = useState(0);

  const finCadeau = cadeau ? finDuCadeau(cadeau) : 0;
  useEffect(() => {
    if (!finCadeau) return;
    const t = () => setMaintenant(Date.now());
    // L'HEURE DU TÉLÉPHONE, LUE TOUT DE SUITE PUIS CHAQUE SECONDE.
    t();
    const i = window.setInterval(t, 1000);
    return () => window.clearInterval(i);
  }, [finCadeau]);

  // ─── QUI PARTICIPE ───
  const commerces = new Set(["Le commerce", par]);
  const membres = salon ? [...new Set([salon.parQui, ...salon.presents, ...salon.viennent])].filter((q) => q && !commerces.has(q)) : [];
  const viennent = salon ? salon.viennent.filter((q) => !commerces.has(q)) : [];
  const jeViens = viennent.some(estMoi);
  const jaiGarde = pieces.some((p) => p.lieu === par || (!!idCommerce && p.carte === idCommerce));
  const favoris = [...FAVORIS_DEMO, ...(jaiGarde ? [monNom] : [])];
  const sources: SourceCadeau[] = soiree
    ? [{ parmi: "viennent", mot: "Comptent venir", combien: viennent.length }]
    : [
        { parmi: "salon", mot: "Ce salon", combien: membres.length + (membre && !membres.some(estMoi) ? 1 : 0) },
        ...(profil?.favoris ? [{ parmi: "favoris" as Parmi, mot: "Ont gardé une pièce", combien: favoris.length }] : []),
      ];
  const candidats = (parmi: Parmi) => {
    if (parmi === "favoris") return favoris.map((nom) => ({ nom, ...(nom === monNom && jaiGarde ? { moi: true } : {}) }));
    const noms = parmi === "viennent" ? viennent : membres;
    const liste = noms.map((nom) => ({ nom: estMoi(nom) ? monNom : nom, ...(estMoi(nom) ? { moi: true } : {}) }));
    if (parmi === "salon" && membre && !liste.some((x) => x.moi)) liste.push({ nom: monNom, moi: true });
    return liste;
  };
  const jeParticipe = !cadeau ? false : cadeau.parmi === "favoris" ? jaiGarde : cadeau.parmi === "viennent" ? jeViens : membre;

  // ─── LE TIRAGE ─── n'importe quel écran ouvert sur ce salon peut le faire ; une seule fois.
  useEffect(() => {
    if (!cadeau || cadeau.gagnants || !maintenant || maintenant < cadeau.tirageLe) return;
    tirer(cle, candidats(cadeau.parmi));
    // `candidats` se recalcule à chaque rendu ; le tirage n'a lieu qu'une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadeau, cle, maintenant]);

  const jaiGagne = !!cadeau?.gagnants?.some((g) => g.moi);

  const lancer = (o: { nombre: number; quoi: string; duree: number; parmi: Parmi }) => {
    if (!profil || !salon) return;
    const c = lancerCadeau(cle, { ...o, par, mots: { emoji: profil.emoji, un: profil.un, plusieurs: profil.plusieurs, merci: profil.merci, sur: profil.sur } });
    // DANS LE SALON, LA CARTE ; POUR LES FAVORIS, RIEN DANS LE FIL : la conversation n'est pas leur adresse.
    if (o.parmi !== "favoris")
      ecrireDansSalon(cle, {
        qui: par,
        voix: "ami",
        texte: `🎁 ${combienDe(c.mots, c.nombre)} ! Tirage au sort parmi ${parmiLisible(c.parmi)}.`,
        quand: heureCourte(),
        cadeau: c.id,
      });
    setMaintenant(Date.now());
    setCote(false);
  };

  const fermerTicket = () => {
    ticketVu(cle);
    setVoirTicket(false);
  };

  /** La pastille de la démonstration : le geste du commerçant, joué sur le téléphone. */
  const pastille: ReactNode =
    demo && profil && salon?.ouvert !== false ? (
      <button type="button" className="cg-pastille" onClick={() => setCote(true)}>
        🎁 Démo · {profil.cote.toLowerCase()} <span aria-hidden="true">›</span>
      </button>
    ) : null;

  /** En tête du fil : mon ticket tant qu'il vaut, ou le tirage des favoris qui tourne. */
  const entete: ReactNode = !cadeau || !maintenant ? null : jaiGagne ? (
    <TicketEpingle cadeau={cadeau} maintenant={maintenant} onOuvrir={() => setVoirTicket(true)} />
  ) : cadeau.parmi === "favoris" ? (
    <p className="cg-etat">
      🎁 {combienDe(cadeau.mots, cadeau.nombre)} par {cadeau.par}, parmi ceux qui ont gardé une pièce
      {cadeau.gagnants
        ? ` : ${cadeau.gagnants.map((g) => g.nom).join(", ")}.`
        : ` · tirage dans ${reste(cadeau.tirageLe - maintenant)}`}
    </p>
  ) : null;

  /** La carte d'un message de lancement ; rien pour un message ordinaire. */
  const carte = (m: Pick<MessageSalon, "id" | "cadeau">): ReactNode =>
    m.cadeau ? (
      <CarteCadeau
        key={m.id}
        cadeau={cadeau?.id === m.cadeau ? cadeau : undefined}
        maintenant={maintenant}
        fantomeDe={fantomeDe}
        monFantome={monFantome}
        jeParticipe={jeParticipe}
        onParticiper={soiree ? undefined : onRejoindre}
        onTicket={() => setVoirTicket(true)}
      />
    ) : null;

  const calques: ReactNode = !salon ? null : (
      <>
        {cote && profil && (
          <CoteCommercant
            profil={profil}
            lieu={par}
            cadeau={cadeau}
            maintenant={maintenant}
            sources={sources}
            onLancer={lancer}
            onValider={(code) => validerCode(cle, code)}
            onNouvelle={() => {
              oublierCadeau(cle);
              setVoirTicket(false);
            }}
            onFermer={() => setCote(false)}
          />
        )}
        {cadeau && jaiGagne && (voirTicket || !cadeau.vu) && !cote && (
          <EcranGagne
            cadeau={cadeau}
            maintenant={maintenant}
            monFantome={monFantome}
            prenom={monNom === "Vous" ? "" : monNom}
            onFermer={fermerTicket}
            onValiderDemo={
              demo
                ? () => {
                    const g = cadeau.gagnants?.find((x) => x.moi);
                    if (g) validerCode(cle, g.code);
                  }
                : undefined
            }
          />
        )}
        <StylesCadeau />
      </>
    );

  return { pastille, entete, carte, calques };
}
