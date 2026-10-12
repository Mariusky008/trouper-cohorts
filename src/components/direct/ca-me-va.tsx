"use client";

/**
 * 🤔 « ÇA ME VA ? » — envoyer son essai à ses amis, et voir leurs votes.
 *
 *   · `FeuilleCaMeVa` : ouverte depuis le résultat d'un essai. Le lien se
 *     prépare et l'essai monte PENDANT qu'on lit la feuille : quand on appuie
 *     sur « Envoyer sur WhatsApp », tout est prêt, et l'aperçu du message
 *     montre déjà la pièce portée.
 *   · `AvisRecus` : posée sur l'application et sur la page des boutiques, elle
 *     s'ouvre d'elle-même quand de nouveaux votes sont arrivés.
 *
 * ON N'ANNONCE JAMAIS QUE C'EST ENVOYÉ : WhatsApp s'ouvre, c'est encore à la
 * personne d'appuyer sur « envoyer ». La feuille dit « les avis arriveront
 * ici », pas « vos amis ont reçu ».
 */
import { useEffect, useState } from "react";
import {
  REPONSES_AVIS,
  marquerAvisVus,
  nePlusSuivreAvisIci,
  avisSuiviIci,
  preparerAvis,
  quiAVote,
  rangerEssaiAvis,
  suivreAvis,
  suivreAvisIci,
  useAvisAmis,
  type Avis,
  type LienAvis,
} from "@/lib/direct/avis-amis-client";
import { Porte } from "@/components/direct/dressing/porte";
import { StylesDressing } from "@/components/direct/dressing/styles-dressing";

type Essai = {
  /** Le rendu, en `data:` — il monte dans la Maison derrière le lien. */
  image: string;
  quoi: string;
  prix?: string;
  magasin?: string;
  carte?: string;
  page?: string;
  ville?: string;
  /** « cette pièce », « cette coupe »… — ce que l'ami pourra essayer à son tour. */
  ceci?: string;
};

const texteDuMessage = (e: Essai, lien: string) =>
  `Ça me va ? 🤔 J’hésite pour « ${e.quoi} »${e.magasin ? ` chez ${e.magasin}` : ""}. Dis-moi en un appui : ${lien}`;

function Compte({ a }: { a: Avis }) {
  return (
    <p className="cmv-cpt">
      <span>
        {REPONSES_AVIS.oui.emoji} {a.oui}
      </span>
      <span>
        {REPONSES_AVIS.non.emoji} {a.non}
      </span>
      {a.votes.length > 0 && <em>{quiAVote(a)}</em>}
    </p>
  );
}

export function FeuilleCaMeVa({
  essai,
  onFermer,
  secours,
  salon,
}: {
  essai: Essai;
  onFermer: () => void;
  /** Sans vote possible (démonstration) : la photo part par la feuille de partage du téléphone. */
  secours?: () => void;
  /** Le salon de discussion, là où il existe : la même intention, dans ClikMe. */
  salon?: () => void;
}) {
  const [lien, setLien] = useState<LienAvis | null>(null);
  const [etape, setEtape] = useState<"prepare" | "pret" | "envoye" | "impossible">("prepare");
  const [copie, setCopie] = useState(false);
  const { avis } = useAvisAmis();
  const suivi = lien ? avis.find((a) => a.e === lien.e) : undefined;

  /* LE LIEN, PUIS L'ESSAI — pendant qu'on lit. Un seul aller par ouverture. */
  useEffect(() => {
    let vivant = true;
    void (async () => {
      const l = await preparerAvis(essai.ville);
      if (!vivant) return;
      if (!l) return setEtape("impossible");
      setLien(l);
      suivreAvisIci(l.e);
      const ok = await rangerEssaiAvis(l, {
        image: essai.image,
        quoi: essai.quoi,
        ...(essai.prix ? { prix: essai.prix } : {}),
        ...(essai.magasin ? { magasin: essai.magasin } : {}),
        ...(essai.carte ? { carte: essai.carte } : {}),
        ...(essai.page ? { page: essai.page } : {}),
        ...(essai.ceci ? { ceci: essai.ceci } : {}),
      });
      if (vivant) setEtape((x) => (x === "prepare" ? (ok ? "pret" : "impossible") : x));
    })();
    return () => {
      vivant = false;
    };
    // L'essai ne change pas tant que la feuille est ouverte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => void (lien && nePlusSuivreAvisIci(lien.e)), [lien]);

  const fermer = () => {
    if (suivi && suivi.votes.length > suivi.vus) marquerAvisVus(suivi.e);
    onFermer();
  };

  const parti = () => {
    if (!lien) return;
    suivreAvis(lien, { quoi: essai.quoi, ...(essai.prix ? { prix: essai.prix } : {}), ...(essai.magasin ? { magasin: essai.magasin } : {}), ...(essai.page ? { page: essai.page } : {}) });
    setEtape("envoye");
  };

  const parWhatsApp = () => {
    if (!lien) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(texteDuMessage(essai, lien.lien))}`, "_blank", "noopener,noreferrer");
    parti();
  };

  const autrement = async () => {
    if (!lien) return;
    const texte = texteDuMessage(essai, lien.lien);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Ça me va ?", text: texte });
        return parti();
      }
    } catch (err) {
      // REFERMÉ SANS RIEN CHOISIR : rien n'est parti.
      if ((err as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      parti();
    } catch {
      setCopie(false);
    }
  };

  return (
    <Porte>
      <div className="dr-voile" onClick={fermer}>
        <div className="dr-feuille cmv-feuille" role="dialog" aria-modal="true" aria-label="Ça me va ? Demander l’avis de vos amis" onClick={(ev) => ev.stopPropagation()}>
          <div className="cmv-tete">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={essai.image} alt="" />
            <div>
              <h3>Ça me va&nbsp;?</h3>
              <p>
                Vos amis voient votre essai de «&nbsp;{essai.quoi}&nbsp;» et votent d’un appui, sans application.
              </p>
            </div>
          </div>

          {etape === "impossible" ? (
            <>
              <p className="cmv-note">Le vote n’est pas disponible ici. Vous pouvez quand même envoyer la photo.</p>
              {secours && (
                <button type="button" className="dr-cta" onClick={() => (secours(), onFermer())}>
                  Envoyer la photo
                </button>
              )}
            </>
          ) : etape === "envoye" && suivi ? (
            <>
              <p className="cmv-note">{copie ? "Message copié : collez-le à vos amis. " : ""}Les avis s’affichent ici dès qu’ils arrivent.</p>
              <Compte a={suivi} />
              <button type="button" className="dr-cta cmv-wa" onClick={parWhatsApp}>
                Demander à d’autres amis
              </button>
            </>
          ) : (
            <>
              <button type="button" className="dr-cta cmv-wa" disabled={etape !== "pret"} onClick={parWhatsApp}>
                {etape === "pret" ? "Envoyer sur WhatsApp" : "Préparation de votre essai…"}
              </button>
              <button type="button" className="dr-lien cmv-autre" disabled={etape !== "pret"} onClick={() => void autrement()}>
                Autre application
              </button>
            </>
          )}
          {salon && (
            <button type="button" className="dr-lien cmv-salon" onClick={salon}>
              Ou en discuter dans un salon ClikMe
            </button>
          )}
          <button type="button" className="dr-lien" onClick={fermer}>
            Fermer
          </button>
        </div>
      </div>
      <StylesDressing />
      <style>{STYLE}</style>
    </Porte>
  );
}

/** LES VOTES ARRIVÉS ENTRE-TEMPS — elle ne questionne le serveur que si ce téléphone a demandé un avis. */
export function AvisRecus() {
  const { avis } = useAvisAmis();
  const a = avis.find((x) => x.votes.length > x.vus && !avisSuiviIci(x.e));
  if (!a) return null;
  const nouveaux = a.votes.length - a.vus;
  return (
    <Porte>
      <div className="dr-voile" onClick={() => marquerAvisVus(a.e)}>
        <div className="dr-feuille cmv-feuille" role="dialog" aria-modal="true" aria-label="Vos amis ont répondu" onClick={(ev) => ev.stopPropagation()}>
          <div className="cmv-tete">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image} alt="" />
            <div>
              <h3>{nouveaux > 1 ? `${nouveaux} nouveaux avis !` : "Un nouvel avis !"}</h3>
              <p>
                «&nbsp;{a.quoi}&nbsp;»{a.magasin ? `, chez ${a.magasin}` : ""}
              </p>
            </div>
          </div>
          <Compte a={a} />
          <button type="button" className="dr-cta" onClick={() => marquerAvisVus(a.e)}>
            Merci&nbsp;!
          </button>
          <a className="dr-lien cmv-revoir" href={a.lien} target="_blank" rel="noopener noreferrer">
            Revoir la page du vote
          </a>
        </div>
      </div>
      <StylesDressing />
      <style>{STYLE}</style>
    </Porte>
  );
}

const STYLE = `
.cmv-feuille{display:flex;flex-direction:column;gap:12px;}
.cmv-tete{display:flex;gap:14px;align-items:center;}
.cmv-tete img{width:84px;height:108px;flex:none;object-fit:cover;object-position:top;border-radius:14px;background:#2a1a0f;}
.cmv-tete h3{margin:0 0 4px !important;text-align:left !important;font-size:22px !important;font-weight:900;color:#fff;}
.cmv-tete p{margin:0;font-size:14px;line-height:1.4;color:#D9C3A8;}
.cmv-note{margin:0;font-size:14px;line-height:1.45;color:#D9C3A8;}
.cmv-cpt{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:0;padding:12px 14px;border-radius:14px;
  background:rgba(246,181,75,.1);border:1px solid rgba(246,181,75,.35);font-size:20px;font-weight:900;color:#fff;}
.cmv-cpt em{flex-basis:100%;font-style:normal;font-size:13.5px;font-weight:600;color:#D9C3A8;}
.cmv-wa:disabled,.cmv-autre:disabled{opacity:.55;}
.cmv-revoir{text-align:center;}
.cmv-feuille .dr-lien{margin:0 auto;}
`;
