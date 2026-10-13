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
import { villeSlug } from "@/lib/direct/ville";
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

/* SANS ÉMOJI : passé par le lien d'ouverture de WhatsApp, il arrivait en « � ». */
const texteDuMessage = (e: Essai, lien: string) =>
  `Ça me va ? J’hésite pour « ${e.quoi} »${e.magasin ? ` chez ${e.magasin}` : ""}. Dis-moi en un appui : ${lien}`;

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
}: {
  essai: Essai;
  onFermer: () => void;
  /** Sans vote possible (démonstration) : la photo part par la feuille de partage du téléphone. */
  secours?: () => void;
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

  /* ⚖️ « TOUT VEVEY » SEULEMENT SI LA VILLE RÉPOND : sans sa migration, le
     choix n'apparaît pas — plutôt qu'un « Enregistrement impossible » au bout
     de l'écran d'accord. */
  const [villeOk, setVilleOk] = useState<boolean | null>(null);
  useEffect(() => {
    if (!essai.avant || !essai.ville) return;
    let vivant = true;
    fetch(`/api/direct/ville-fil?ville=${encodeURIComponent(villeSlug(essai.ville))}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ok?: boolean } | null) => vivant && setVilleOk(j?.ok === true))
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [essai.avant, essai.ville]);

  const fermer = () => {
    if (suivi && suivi.votes.length > suivi.vus) marquerAvisVus(suivi.e);
    onFermer();
  };
  // PAS DE BOUTON « FERMER » : on touche à côté, ou Échap — qui ne referme que
  // la feuille, pas l'essai dessous (elle passe la première et garde la touche).
  useEffect(() => {
    const touche = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      ev.stopImmediatePropagation();
      if (suivi && suivi.votes.length > suivi.vus) marquerAvisVus(suivi.e);
      onFermer();
    };
    window.addEventListener("keydown", touche, true);
    return () => window.removeEventListener("keydown", touche, true);
  }, [suivi, onFermer]);

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
  // AFFICHÉE D'EMBLÉE (pas de saut de mise en page), RETIRÉE si La ville ne répond pas.
  const peutDemanderALaVille = Boolean(essai.avant && essai.ville && villeOk !== false);

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
        <div className="dr-voile cmv-voile" onClick={ville === "envoi" ? undefined : fermer}>
          <div className="dr-feuille cmv-feuille" role="dialog" aria-modal="true" aria-label={`Avant ou après ? Demander à ${nomVille}`} onClick={(ev) => ev.stopPropagation()}>
            <i className="cmv-poignee" aria-hidden="true" />
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
              </>
            ) : ville === "retire" ? (
              <p className="cmv-note cmv-aa-retire">C’est retiré : la publication, les deux photos et la discussion ont disparu.</p>
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

  const pret = etape === "pret" || etape === "envoye";
  return (
    <Porte>
      <div className="dr-voile cmv-voile" onClick={fermer}>
        <div className="dr-feuille cmv-feuille" role="dialog" aria-modal="true" aria-label="Ça me va ? Qui va trancher ?" onClick={(ev) => ev.stopPropagation()}>
          <i className="cmv-poignee" aria-hidden="true" />
          {/* L'ESSAI EN GRAND : c'est lui qu'on demande de juger. */}
          <figure className={`cmv-photo${etape === "envoye" && suivi ? " petite" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={essai.image} alt="" />
            <figcaption>
              <b>Ça me va&nbsp;?</b>
              <span>
                «&nbsp;{essai.quoi}&nbsp;»{essai.magasin ? ` · ${essai.magasin}` : ""}
              </span>
            </figcaption>
          </figure>

          {etape === "envoye" && suivi && (
            <div className="cmv-suivi">
              <p className="cmv-note">{copie ? "Message copié : collez-le à vos amis. " : ""}Les avis de vos amis s’affichent ici dès qu’ils arrivent.</p>
              <Compte a={suivi} />
            </div>
          )}

          <p className="cmv-q">Qui va trancher&nbsp;?</p>
          <div className={`cmv-choix${peutDemanderALaVille ? "" : " seul"}`}>
            {etape === "impossible" ? (
              <button type="button" className="cmv-tuile amis" disabled={!secours} onClick={() => secours && (secours(), onFermer())}>
                <i aria-hidden="true">
                  <BulleIcone />
                </i>
                <b>Mes amis</b>
                <span>Le vote n’est pas disponible ici : envoyez-leur la photo.</span>
              </button>
            ) : (
              <button type="button" className="cmv-tuile amis" disabled={!pret} onClick={parWhatsApp}>
                <i aria-hidden="true">
                  <BulleIcone />
                </i>
                <b>{etape === "envoye" ? "D’autres amis" : "Mes amis"}</b>
                <span>{pret ? "Sur WhatsApp : ils votent d’un appui, sans application." : "Préparation de votre essai…"}</span>
              </button>
            )}
            {/* ⚖️ PAS D'AMIS SOUS LA MAIN : TOUTE LA VILLE VOTE. */}
            {peutDemanderALaVille && (
              <button type="button" className="cmv-tuile ville" onClick={() => setVille("accord")}>
                <i aria-hidden="true">
                  <VilleIcone />
                </i>
                <b>Tout {nomVille}</b>
                <span>Avant ou après&nbsp;? Les gens d’ici votent pendant 48&nbsp;h.</span>
              </button>
            )}
          </div>
          {etape !== "impossible" && (
            <button type="button" className="cmv-autre" disabled={!pret} onClick={() => void autrement()}>
              Autre messagerie (SMS, Messenger…)
            </button>
          )}
        </div>
      </div>
      <StylesDressing />
      <style>{STYLE}</style>
    </Porte>
  );
}

const BulleIcone = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4.5 18.8 6 15.3a7.6 7.6 0 1 1 3 2.6Z" />
    <path d="M9 10.5h6M9 13.5h4" />
  </svg>
);
const VilleIcone = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3.5 20.5h17M5.5 20.5V10l4-2.5V20.5M9.5 20.5V5l5 2.5v13M14.5 20.5v-9l4 1.6v7.4" />
    <path d="M12 10v.01M12 13v.01M7.5 13v.01M7.5 16v.01M16.5 15v.01" />
  </svg>
);

/** LES VOTES ARRIVÉS ENTRE-TEMPS — elle ne questionne le serveur que si ce téléphone a demandé un avis. */
export function AvisRecus() {
  const { avis } = useAvisAmis();
  const a = avis.find((x) => x.votes.length > x.vus && !avisSuiviIci(x.e));
  if (!a) return null;
  const nouveaux = a.votes.length - a.vus;
  return (
    <Porte>
      <div className="dr-voile cmv-voile" onClick={() => marquerAvisVus(a.e)}>
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
.cmv-voile{justify-content:center;}
.cmv-feuille{display:flex;flex-direction:column;gap:12px;max-width:440px;margin:0 auto;padding-top:10px !important;}
.cmv-poignee{display:block;width:44px;height:5px;margin:0 auto -2px;border-radius:999px;background:rgba(255,244,230,.22);}
@media (min-width:700px){
  .cmv-voile{align-items:center;padding:24px;}
  .cmv-feuille{border-radius:26px !important;border:1px solid rgba(255,240,230,.12);max-height:92vh;}
  .cmv-poignee{display:none;}
}
.cmv-photo{position:relative;margin:0;width:100%;aspect-ratio:4 / 5;max-height:44vh;border-radius:22px;overflow:hidden;background:#2a1a0f;flex:none;}
.cmv-photo.petite{max-height:26vh;}
.cmv-photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;}
.cmv-photo figcaption{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:3px;padding:48px 16px 14px;
  background:linear-gradient(180deg,rgba(18,12,9,0),rgba(18,12,9,.9));}
.cmv-photo b{font-size:30px;font-weight:900;line-height:1.05;color:#fff;letter-spacing:-.01em;}
.cmv-photo span{font-size:14px;line-height:1.3;color:#EADBC8;}
.cmv-suivi{display:flex;flex-direction:column;gap:8px;}
.cmv-q{margin:2px 0 -2px;text-align:center;font-size:12.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#C9B29A;}
.cmv-choix{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.cmv-choix.seul{grid-template-columns:1fr;}
.cmv-tuile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-height:132px;padding:14px;border-radius:20px;cursor:pointer;
  text-align:left;font:inherit;color:#fff;border:1.5px solid rgba(255,244,230,.2);background:rgba(255,244,230,.05);
  transition:transform .15s ease,border-color .15s ease;}
.cmv-tuile:active{transform:scale(.98);}
.cmv-tuile:disabled{opacity:.6;cursor:default;}
.cmv-choix.seul .cmv-tuile{min-height:0;display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:center;}
.cmv-choix.seul .cmv-tuile i{grid-row:span 2;}
.cmv-tuile.amis{background:linear-gradient(160deg,rgba(37,211,102,.2),rgba(37,211,102,.05));border-color:rgba(37,211,102,.55);}
.cmv-tuile.ville{background:linear-gradient(160deg,rgba(255,46,154,.22),rgba(255,46,154,.05));border-color:rgba(255,46,154,.6);}
.cmv-tuile i{display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:13px;font-style:normal;color:#fff;}
.cmv-tuile.amis i{background:#1FAF55;}
.cmv-tuile.ville i{background:#FF2E9A;}
.cmv-tuile svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
.cmv-tuile b{font-size:17px;font-weight:900;line-height:1.15;}
.cmv-tuile span{font-size:13px;line-height:1.35;color:#E6D6C4;}
.cmv-autre{display:block;margin:0 auto;padding:6px 10px;border:0;background:none;cursor:pointer;font:inherit;font-size:13.5px;font-weight:700;
  color:#BFA993;text-decoration:underline;text-underline-offset:3px;}
.cmv-autre:disabled{opacity:.5;cursor:default;}
.cmv-aa-retire{padding:18px 4px;text-align:center;}
.cmv-tete{display:flex;gap:14px;align-items:center;}
.cmv-tete img{width:84px;height:108px;flex:none;object-fit:cover;object-position:top;border-radius:14px;background:#2a1a0f;}
.cmv-tete h3{margin:0 0 4px !important;text-align:left !important;font-size:22px !important;font-weight:900;color:#fff;}
.cmv-tete p{margin:0;font-size:14px;line-height:1.4;color:#D9C3A8;}
.cmv-note{margin:0;font-size:14px;line-height:1.45;color:#D9C3A8;}
.cmv-cpt{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:0;padding:12px 14px;border-radius:14px;
  background:rgba(246,181,75,.1);border:1px solid rgba(246,181,75,.35);font-size:20px;font-weight:900;color:#fff;}
.cmv-cpt em{flex-basis:100%;font-style:normal;font-size:13.5px;font-weight:600;color:#D9C3A8;}
.cmv-revoir{text-align:center;}
.cmv-feuille .dr-lien{margin:0 auto;}
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
