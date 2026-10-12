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
 *
 * ⚖️ PAS D'AMIS SOUS LA MAIN ? « Demander aux gens de Vevey » publie l'avant et
 * l'après dans La ville pour 48 heures, où chacun vote d'un appui, et ouvre un
 * salon public pour en discuter. Rien ne part sans l'écran d'accord : son
 * visage sera visible de toute la ville, et c'est elle qui le dit. Voir
 * `lib/direct/avant-apres.ts`.
 */
import { useEffect, useState } from "react";
import { publierAvantApres, retirerAvantApres, type PublicationAA } from "@/lib/direct/avant-apres-client";
import { monPrenom } from "@/lib/direct/salons";
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
  /** ⚖️ SA photo, celle d'avant l'essai : sans elle, pas d'avant/après dans La ville. */
  avant?: string;
  /** La pièce essayée, pour « Essayer moi aussi » sous la publication. */
  piece?: string;
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
  /* ⚖️ LA VILLE : l'accord, l'envoi, puis c'est en ligne (ou retiré). */
  const [ville, setVille] = useState<"non" | "accord" | "envoi" | "publie" | "retire">("non");
  const [prenom, setPrenom] = useState(() => monPrenom());
  const [daccord, setDaccord] = useState(false);
  const [pub, setPub] = useState<PublicationAA | null>(null);
  const [souci, setSouci] = useState("");
  const { avis } = useAvisAmis();
  const suivi = lien ? avis.find((a) => a.e === lien.e) : undefined;

  /* LE LIEN, PUIS L'ESSAI — pendant qu'on lit. Refusé (le téléphone venait
     d'avoir sa Maison par un autre chemin) : une fois encore, avec un lien neuf. */
  useEffect(() => {
    let vivant = true;
    const details = {
      image: essai.image,
      quoi: essai.quoi,
      ...(essai.prix ? { prix: essai.prix } : {}),
      ...(essai.magasin ? { magasin: essai.magasin } : {}),
      ...(essai.carte ? { carte: essai.carte } : {}),
      ...(essai.page ? { page: essai.page } : {}),
      ...(essai.ceci ? { ceci: essai.ceci } : {}),
    };
    void (async () => {
      for (const neuf of [false, true]) {
        const l = await preparerAvis(essai.ville, neuf);
        if (!vivant) return;
        if (!l) return setEtape("impossible");
        const ok = await rangerEssaiAvis(l, details);
        if (!vivant) return;
        if (ok) {
          setLien(l);
          suivreAvisIci(l.e);
          return setEtape((x) => (x === "prepare" ? "pret" : x));
        }
      }
      setEtape((x) => (x === "prepare" ? "impossible" : x));
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

  const nomVille = essai.ville ? essai.ville.charAt(0).toUpperCase() + essai.ville.slice(1) : "";
  const peutDemanderALaVille = Boolean(essai.avant && essai.ville);

  const publier = async () => {
    if (!essai.avant || !essai.ville || !daccord || !prenom.trim()) return;
    setVille("envoi");
    setSouci("");
    const r = await publierAvantApres({
      ville: essai.ville,
      qui: prenom,
      avant: essai.avant,
      apres: essai.image,
      quoi: essai.quoi,
      ...(essai.prix ? { prix: essai.prix } : {}),
      ...(essai.magasin ? { magasin: essai.magasin } : {}),
      ...(essai.carte ? { carte: essai.carte } : {}),
      ...(essai.piece ? { piece: essai.piece } : {}),
      ...(essai.page ? { page: essai.page } : {}),
      ...(lien ? { avis: lien.e } : {}),
    });
    if (!r.ok) {
      setSouci(r.erreur);
      setVille("accord");
      return;
    }
    setPub(r.pub);
    setVille("publie");
  };

  const toutRetirer = async () => {
    if (!pub || !window.confirm("Tout retirer ? La publication, les deux photos et la discussion disparaissent tout de suite.")) return;
    if (await retirerAvantApres(pub.id)) setVille("retire");
    else setSouci("Le retrait n’a pas pu se faire : réessayez dans un instant.");
  };

  if (ville !== "non") {
    return (
      <Porte>
        <div className="dr-voile" onClick={ville === "envoi" ? undefined : fermer}>
          <div className="dr-feuille cmv-feuille" role="dialog" aria-modal="true" aria-label={`Avant ou après ? Demander à ${nomVille}`} onClick={(ev) => ev.stopPropagation()}>
            {ville === "publie" && pub ? (
              <>
                <div className="cmv-aa-ok">
                  <span aria-hidden="true">🎉</span>
                  <h3>C’est en ligne&nbsp;!</h3>
                  <p>
                    Les gens de {nomVille} votent d’un appui pendant 48&nbsp;h. Leurs votes, ceux de la discussion et ceux de vos amis
                    s’additionnent.
                  </p>
                </div>
                <a className="dr-cta" href={`/ville/${pub.ville}?onglet=ville`}>
                  Voir dans La ville
                </a>
                {pub.salon && (
                  <a className="dr-lien cmv-aa-lien" href={`/ville/${pub.ville}?salon=p:${pub.salon}`}>
                    💬 Ouvrir la discussion
                  </a>
                )}
                {souci && <p className="cmv-note cmv-aa-souci">{souci}</p>}
                <button type="button" className="dr-lien cmv-aa-retirer" onClick={() => void toutRetirer()}>
                  Tout retirer maintenant
                </button>
                <button type="button" className="dr-lien" onClick={fermer}>
                  Fermer
                </button>
              </>
            ) : ville === "retire" ? (
              <>
                <p className="cmv-note">C’est retiré : la publication, les deux photos et la discussion ont disparu.</p>
                <button type="button" className="dr-cta" onClick={fermer}>
                  Fermer
                </button>
              </>
            ) : (
              <>
                <h3 className="cmv-aa-titre">Avant ou après&nbsp;? Demandez à {nomVille}</h3>
                <div className="cmv-aa-duo">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={essai.avant} alt="" />
                    <figcaption>Avant</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={essai.image} alt="" />
                    <figcaption className="apres">Après</figcaption>
                  </figure>
                </div>
                <ul className="cmv-aa-regles">
                  <li>
                    <b>Tout {nomVille}</b> verra ces deux photos, avec votre prénom, pendant <b>48&nbsp;h</b>.
                  </li>
                  <li>Chacun vote d’un appui : avant, ou après. Une discussion publique s’ouvre pour en parler.</li>
                  <li>Vous pouvez tout retirer à tout moment ; au bout de 48&nbsp;h, tout s’efface.</li>
                </ul>
                <label className="cmv-aa-prenom">
                  <span>Votre prénom</span>
                  <input value={prenom} onChange={(ev) => setPrenom(ev.target.value)} maxLength={30} placeholder="Votre prénom" autoComplete="given-name" />
                </label>
                <label className="cmv-aa-accord">
                  <input type="checkbox" checked={daccord} onChange={(ev) => setDaccord(ev.target.checked)} />
                  <span>C’est bien moi sur la photo, et j’accepte que mon visage soit visible par toute la ville pendant 48&nbsp;h.</span>
                </label>
                {souci && <p className="cmv-note cmv-aa-souci">{souci}</p>}
                <button type="button" className="dr-cta" disabled={!daccord || !prenom.trim() || ville === "envoi"} onClick={() => void publier()}>
                  {ville === "envoi" ? "Publication…" : `Publier dans La ville`}
                </button>
                <button type="button" className="dr-lien" disabled={ville === "envoi"} onClick={() => setVille("non")}>
                  Retour
                </button>
              </>
            )}
          </div>
        </div>
        <StylesDressing />
        <style>{STYLE}</style>
      </Porte>
    );
  }

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
          {/* ⚖️ PAS D'AMIS SOUS LA MAIN : TOUTE LA VILLE VOTE. */}
          {peutDemanderALaVille && (
            <button type="button" className="dr-lien cmv-aa-ouvrir" onClick={() => setVille("accord")}>
              <span aria-hidden="true">⚖️</span> Pas d’amis sous la main&nbsp;? Demandez aux gens de {nomVille}
            </button>
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
.cmv-aa-ouvrir{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 14px !important;border-radius:16px;
  border:1.5px dashed rgba(255,46,154,.6) !important;color:#FFD2EA !important;font-weight:800;text-align:center;line-height:1.3;}
.cmv-aa-titre{margin:0 !important;text-align:left !important;font-size:22px !important;font-weight:900;color:#fff;line-height:1.2;}
.cmv-aa-duo{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.cmv-aa-duo figure{position:relative;margin:0;}
.cmv-aa-duo img{display:block;width:100%;aspect-ratio:4 / 5;object-fit:cover;object-position:top;border-radius:14px;background:#2a1a0f;}
.cmv-aa-duo figcaption{position:absolute;left:8px;top:8px;padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:800;letter-spacing:.06em;
  text-transform:uppercase;background:rgba(18,12,9,.75);color:#FFF4E6;}
.cmv-aa-duo figcaption.apres{background:rgba(255,46,154,.85);}
.cmv-aa-regles{margin:0;padding:0 0 0 18px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.4;color:#D9C3A8;}
.cmv-aa-regles b{color:#fff;}
.cmv-aa-prenom{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:700;color:#D9C3A8;}
.cmv-aa-prenom input{height:46px;padding:0 14px;border-radius:14px;border:1px solid rgba(255,240,230,.2);background:rgba(255,244,230,.06);color:#fff;font:inherit;font-size:16px;}
.cmv-aa-accord{display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:14px;background:rgba(255,46,154,.08);border:1px solid rgba(255,46,154,.35);
  font-size:14px;line-height:1.4;color:#FFE9F4;cursor:pointer;}
.cmv-aa-accord input{flex:none;width:22px;height:22px;margin:0;accent-color:#FF2E9A;}
.cmv-aa-souci{color:#FFB4B4 !important;}
.cmv-aa-ok{text-align:center;}
.cmv-aa-ok span{font-size:40px;}
.cmv-aa-ok h3{margin:4px 0 6px !important;font-size:24px !important;font-weight:900;color:#fff;}
.cmv-aa-ok p{margin:0;font-size:14.5px;line-height:1.45;color:#D9C3A8;}
.cmv-aa-lien{text-align:center;font-weight:800;}
.cmv-aa-retirer{color:#FFB4B4 !important;}
.cmv-feuille .dr-cta:disabled{opacity:.5;}
`;
