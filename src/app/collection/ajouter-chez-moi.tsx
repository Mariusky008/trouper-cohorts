"use client";

/**
 * ＋ « AJOUTER CHEZ MOI » ET 🗑️ « L'ENLEVER » (`docs/univers/ma-maison.md`, sections 5 et 6 ; le lot M2, deuxième partie).
 *
 * - `AjouterChezMoi` : ce qu'on met soi-même chez soi, sans conversation — une photo du téléphone (réduite dans le
 *   téléphone, 1 600 pixels au plus, puis recopiée par le serveur), un film, un clip, une chanson (un nom, un lien
 *   facultatif : le titre et l'image viennent de la page), un livre, une recette, un voyage, une fierté, autre chose ; un
 *   mot, facultatif. « Mettre chez moi » : la maison revient avec lui à sa place.
 * - `EnleverDeChezMoi` (un appui long sur un objet) : ce qu'on a ajouté disparaît ; ce qu'on a gardé dans une
 *   conversation reste sur l'étagère partagée.
 * - `QuiPeutEntrer` (🚪, le lot M4) : ses proches (d'office), tout le monde (18 ans ou plus), lui seul ; et sa maison vue
 *   comme ses visiteurs la voient.
 * - `LaisserUneSurprise` (🎁, le lot M5) : en visite chez un proche, un objet (un bouquet, une tasse…) et un petit mot,
 *   posés emballés sur sa table basse (les souvenirs du lot 6 des visites).
 */
import { useRef, useState } from "react";
import {
  AJOUTS_MAISON,
  AJOUT_MOT_MAX,
  AJOUT_PHOTO,
  AJOUT_TITRE_MAX,
  OU_VA,
  PHRASES_AJOUT,
  PHRASES_BAS,
  PHRASES_CADEAU,
  PHRASES_VISITE,
  VISIBILITES_MAISON,
  type MaMaisonVue,
  type ObjetMaison,
  type QuoiAjout,
} from "@/lib/direct/ma-maison";
import type { Visibilite } from "@/lib/direct/monde";
import { MOT_SOUVENIR_MAX, OBJETS_SOUVENIR } from "@/lib/direct/visites";

const ROUTE = "/api/direct/ma-piece";
type Reponse = { ok?: boolean; id?: string; maison?: MaMaisonVue; error?: string };
async function envoyer(corps: Record<string, unknown>): Promise<Reponse> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    return r.ok ? j : { error: j.error || "Ça n’a pas marché : réessaie." };
  } catch {
    return { error: "Pas de réseau : réessaie dans un instant." };
  }
}

/** La photo du téléphone, réduite (1 600 pixels au plus), en JPEG. */
async function photoReduite(f: File): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, AJOUT_PHOTO.cote / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * k));
    c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const url = c.toDataURL("image/jpeg", 0.85);
    return url.length * 0.75 > AJOUT_PHOTO.octets ? null : url;
  } catch {
    return null;
  }
}

export function AjouterChezMoi({ onFermer, onAjoute }: { onFermer: () => void; onAjoute: (r: { maison: MaMaisonVue; id: string; ou: string }) => void }) {
  const [quoi, setQuoi] = useState<QuoiAjout | null>(null);
  const [titre, setTitre] = useState("");
  const [lien, setLien] = useState("");
  const [mot, setMot] = useState("");
  const [photo, setPhoto] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const a = AJOUTS_MAISON.find((x) => x.cle === quoi) ?? null;
  async function mettre() {
    if (!a || enCours) return;
    if (a.sorte === "photo" && !photo) return setErreur(PHRASES_AJOUT.sansPhoto);
    if (a.sorte !== "photo" && !titre.trim() && !(a.sorte !== "objet" && lien.trim())) return setErreur(PHRASES_AJOUT.sansNom);
    setEnCours(true);
    setErreur("");
    const r = await envoyer({ action: "ajouter", quoi: a.cle, titre, ...(lien.trim() ? { lien: lien.trim() } : {}), ...(mot.trim() ? { mot } : {}), ...(photo ? { image: photo } : {}) });
    setEnCours(false);
    if (!r.maison || !r.id) return setErreur(r.error || "Ça n’a pas marché : réessaie.");
    onAjoute({ maison: r.maison, id: r.id, ou: OU_VA[a.sorte] });
  }
  return (
    <div className="acm" role="dialog" aria-modal="true" aria-label={PHRASES_AJOUT.titre} data-ajouter onClick={onFermer}>
      <div className="acm-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="acm-tete">
          {a ? (
            <button type="button" className="acm-retour" onClick={() => {
                setQuoi(null);
                setErreur("");
              }}>
              {PHRASES_AJOUT.retour}
            </button>
          ) : (
            <b>＋ {PHRASES_AJOUT.titre}</b>
          )}
          <button type="button" className="acm-fermer" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        {!a ? (
          <>
            <p className="acm-doux">{PHRASES_AJOUT.quoi}</p>
            <div className="acm-choix">
              {AJOUTS_MAISON.map((x) => (
                <button key={x.cle} type="button" data-quoi={x.cle} onClick={() => setQuoi(x.cle)}>
                  <span aria-hidden="true">{x.emoji}</span>
                  {x.nom}
                </button>
              ))}
            </div>
            <p className="acm-doux petit">{PHRASES_AJOUT.rien}</p>
          </>
        ) : (
          <div className="acm-form">
            <b className="acm-quoi">
              {a.emoji} {a.nom} <small>· {OU_VA[a.sorte]}</small>
            </b>
            {a.sorte === "photo" && (
              <>
                <input
                  ref={fichier}
                  type="file"
                  accept="image/*"
                  hidden
                  data-fichier
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const url = await photoReduite(f);
                    if (!url) return setErreur("Cette photo ne s’ouvre pas : essaie une autre.");
                    setErreur("");
                    setPhoto(url);
                  }}
                />
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="acm-apercu" src={photo} alt="" data-apercu />
                ) : null}
                <button type="button" className="acm-secondaire" onClick={() => fichier.current?.click()}>
                  {photo ? PHRASES_AJOUT.autrePhoto : PHRASES_AJOUT.choisirPhoto}
                </button>
              </>
            )}
            <input className="acm-champ" data-champ="titre" maxLength={AJOUT_TITRE_MAX} placeholder={a.sorte === "photo" ? a.indice : `${PHRASES_AJOUT.nom} (${a.indice})`} value={titre} onChange={(e) => setTitre(e.target.value)} />
            {(a.sorte === "video" || a.sorte === "musique") && (
              <input className="acm-champ" data-champ="lien" inputMode="url" placeholder={PHRASES_AJOUT.lien} value={lien} onChange={(e) => setLien(e.target.value)} />
            )}
            {a.sorte !== "photo" && <input className="acm-champ" data-champ="mot" maxLength={AJOUT_MOT_MAX} placeholder={PHRASES_AJOUT.mot} value={mot} onChange={(e) => setMot(e.target.value)} />}
            {erreur && (
              <p className="acm-erreur" role="alert">
                {erreur}
              </p>
            )}
            <button type="button" className="acm-principal" data-mettre disabled={enCours} onClick={() => void mettre()}>
              {enCours ? PHRASES_AJOUT.enCours : PHRASES_AJOUT.mettre}
            </button>
          </div>
        )}
      </div>
      <style>{STYLES_AJOUTER}</style>
    </div>
  );
}

export function EnleverDeChezMoi({ objet, onFermer, onEnleve }: { objet: ObjetMaison; onFermer: () => void; onEnleve: (m: MaMaisonVue) => void }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  return (
    <div className="acm" role="dialog" aria-modal="true" aria-label={objet.titre} data-enlever onClick={onFermer}>
      <div className="acm-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="acm-tete">
          <b>
            {objet.emoji} {objet.titre}
          </b>
          <button type="button" className="acm-fermer" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        <p className="acm-doux">{objet.avec ? PHRASES_AJOUT.enleverAvec(objet.avec.prenom) : PHRASES_AJOUT.enleverMien}</p>
        {erreur && (
          <p className="acm-erreur" role="alert">
            {erreur}
          </p>
        )}
        <button
          type="button"
          className="acm-principal danger"
          data-confirmer
          disabled={enCours}
          onClick={async () => {
            setEnCours(true);
            const r = await envoyer({ action: "enlever", id: objet.id });
            setEnCours(false);
            if (!r.maison) return setErreur(r.error || "Ça n’a pas marché : réessaie.");
            onEnleve(r.maison);
          }}
        >
          {PHRASES_AJOUT.enlever}
        </button>
        <button type="button" className="acm-secondaire" onClick={onFermer}>
          {PHRASES_AJOUT.annuler}
        </button>
      </div>
      <style>{STYLES_AJOUTER}</style>
    </div>
  );
}

export function QuiPeutEntrer({ maison, onFermer, onChoisi }: { maison: MaMaisonVue; onFermer: () => void; onChoisi: (m: MaMaisonVue) => void }) {
  const [choix, setChoix] = useState<Visibilite>(maison.visibilite ?? "proches");
  const [adulte, setAdulte] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const dejaAdulte = maison.adulte === true;
  async function garder() {
    if (choix === "tous" && !dejaAdulte && !adulte) return setErreur(PHRASES_VISITE.adulteDit);
    setEnCours(true);
    setErreur("");
    const r = await envoyer({ action: "visibilite", v: choix, ...(choix === "tous" && !dejaAdulte ? { adulte: true } : {}) });
    setEnCours(false);
    if (!r.maison) return setErreur(r.error || "Ça n’a pas marché : réessaie.");
    onChoisi(r.maison);
  }
  return (
    <div className="acm" role="dialog" aria-modal="true" aria-label={PHRASES_VISITE.quiTitre} data-qui-entre onClick={onFermer}>
      <div className="acm-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="acm-tete">
          <b>🚪 {PHRASES_VISITE.quiTitre}</b>
          <button type="button" className="acm-fermer" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        <div className="acm-qui">
          {VISIBILITES_MAISON.map((x) => (
            <button
              key={x.v}
              type="button"
              className={choix === x.v ? "choisi" : ""}
              aria-pressed={choix === x.v}
              data-visibilite={x.v}
              onClick={() => {
                setChoix(x.v);
                setErreur("");
              }}
            >
              <b>{x.titre}</b>
              <span>{x.dit}</span>
            </button>
          ))}
        </div>
        {choix === "tous" && !dejaAdulte && (
          <label className="acm-adulte">
            <input
              type="checkbox"
              checked={adulte}
              onChange={(e) => {
                setAdulte(e.target.checked);
                setErreur("");
              }}
              data-adulte
            />
            {PHRASES_VISITE.adulte}
          </label>
        )}
        {erreur && (
          <p className="acm-erreur" role="alert">
            {erreur}
          </p>
        )}
        <button type="button" className="acm-principal" data-garder disabled={enCours} onClick={() => void garder()}>
          {enCours ? "…" : "C’est bon"}
        </button>
        {maison.cle && (
          <a className="acm-secondaire acm-lien" href={`/univers/chez/${maison.cle}?piece=1`} data-comme-eux>
            {PHRASES_VISITE.commeEux}
          </a>
        )}
      </div>
      <style>{STYLES_AJOUTER}</style>
    </div>
  );
}

export function LaisserUneSurprise({ cle, prenom, onFermer, onPosee }: { cle: string; prenom: string; onFermer: () => void; onPosee: () => void }) {
  const [objet, setObjet] = useState<string>("");
  const [mot, setMot] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  async function poser() {
    if (!objet || enCours) return;
    setEnCours(true);
    setErreur("");
    try {
      const r = await fetch("/api/direct/visites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "souvenir", cle, objet, ...(mot.trim() ? { mot } : {}) }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "Ça n’a pas marché : réessaie.");
      onPosee();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Ça n’a pas marché : réessaie.");
    } finally {
      setEnCours(false);
    }
  }
  return (
    <div className="acm" role="dialog" aria-modal="true" aria-label={`${PHRASES_CADEAU.laisserTitre} ${prenom}`} data-surprise onClick={onFermer}>
      <div className="acm-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="acm-tete">
          <b>
            🎁 {PHRASES_CADEAU.laisserTitre} {prenom}
          </b>
          <button type="button" className="acm-fermer" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        <p className="acm-doux">{PHRASES_CADEAU.laisserDit}</p>
        <div className="acm-choix">
          {OBJETS_SOUVENIR.map((o) => (
            <button key={o.cle} type="button" data-objet-surprise={o.cle} aria-pressed={objet === o.cle} className={objet === o.cle ? "choisi" : ""} onClick={() => setObjet(o.cle)}>
              <span aria-hidden="true">{o.emoji}</span>
              {o.nom}
            </button>
          ))}
        </div>
        <input className="acm-champ" data-champ="mot-surprise" maxLength={MOT_SOUVENIR_MAX} placeholder={PHRASES_CADEAU.motSurprise} value={mot} onChange={(e) => setMot(e.target.value)} />
        {erreur && (
          <p className="acm-erreur" role="alert">
            {erreur}
          </p>
        )}
        <button type="button" className="acm-principal" data-poser disabled={!objet || enCours} onClick={() => void poser()}>
          {enCours ? "…" : PHRASES_CADEAU.poser}
        </button>
      </div>
      <style>{STYLES_AJOUTER}</style>
    </div>
  );
}

/** Une ligne de « Pendant ton absence » : ce qui s'est passé, et de quoi y aller. */
export type LigneAbsence = { cle: string; e: string; texte: string; detail?: string; action?: { nom: string; faire: () => void } };

/**
 * 🛎️ (21 novembre 2026, la maquette) « PENDANT TON ABSENCE » : ce que ses proches ont laissé chez lui — qui a frappé, les
 * surprises sur la table, les réponses à sa question, ce qui est arrivé chez lui — chacun avec « Voir » ; jamais un compte
 * de visites.
 */
export function PendantTonAbsence({ lignes, onFermer }: { lignes: LigneAbsence[]; onFermer: () => void }) {
  return (
    <div className="acm" role="dialog" aria-modal="true" aria-label={PHRASES_BAS.absence} data-absence onClick={onFermer}>
      <div className="acm-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="acm-tete">
          <b>🛎️ {PHRASES_BAS.absence}</b>
          <button type="button" className="acm-fermer" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        <p className="acm-chapo">{PHRASES_BAS.absenceChapo}</p>
        {lignes.length ? (
          <ul className="acm-absence">
            {lignes.map((l) => (
              <li key={l.cle} data-ligne-absence={l.cle}>
                <span aria-hidden="true">{l.e}</span>
                <span>
                  <b>{l.texte}</b>
                  {l.detail && <small>{l.detail}</small>}
                </span>
                {l.action && (
                  <button type="button" onClick={l.action.faire}>
                    {l.action.nom}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="acm-chapo" data-absence-vide>
            {PHRASES_BAS.absenceVide}
          </p>
        )}
        <p className="acm-pied">{PHRASES_BAS.absencePied}</p>
      </div>
      <style>{STYLES_AJOUTER}</style>
    </div>
  );
}

const STYLES_AJOUTER = `
.acm-chapo{margin:0;color:#c9b29c;font-size:14px;line-height:1.45}
.acm-pied{margin:4px 0 0;color:#c9b29c;font-size:12.5px;line-height:1.4}
.acm-absence{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.acm-absence li{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.07)}
.acm-absence li>span:first-child{font-size:24px;flex:none}
.acm-absence li>span:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.acm-absence b{font-size:14.5px;line-height:1.3}
.acm-absence small{color:#c9b29c;font-size:12.5px}
.acm-absence button{flex:none;border:0;background:none;color:#ffd27a;font-weight:900;font-size:14px;cursor:pointer}
.acm{position:fixed;inset:0;z-index:35;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,5,8,.55);animation:acm-voile .2s ease-out}
.acm-feuille{width:100%;max-width:520px;max-height:88svh;overflow-y:auto;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#24180f;color:#FFF4E6;font-family:-apple-system,"SF Pro Rounded",system-ui,"Segoe UI",Roboto,sans-serif;animation:acm-monte .25s ease-out}
.acm-tete{display:flex;align-items:center;justify-content:space-between;gap:10px}
.acm-tete b{font-size:17px}
.acm-fermer{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
.acm-retour{border:0;background:none;color:#ffd27a;font:inherit;font-weight:800;font-size:15px;cursor:pointer;padding:4px 0}
.acm-doux{margin:0;color:#eee0d0;font-size:14.5px;line-height:1.45}
.acm-doux.petit{font-size:13px;opacity:.85}
.acm-choix{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.acm-choix button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px;border:1px solid #5a4232;border-radius:14px;background:rgba(255,255,255,.04);color:#FFF4E6;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
.acm-choix button span{font-size:24px;line-height:1}
.acm-choix button.choisi{border-color:#ffd27a;background:rgba(255,210,122,.14)}
.acm-form{display:flex;flex-direction:column;gap:10px}
.acm-quoi{font-size:16px}
.acm-quoi small{font-weight:600;color:#c9b29c}
.acm-champ{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #5a4232;border-radius:12px;background:#170f0a;color:#FFF4E6;font:inherit;font-size:16px}
.acm-apercu{max-width:100%;max-height:34svh;align-self:center;border-radius:8px;object-fit:contain}
.acm-principal{padding:13px;border:0;border-radius:999px;background:linear-gradient(135deg,#ff9a3c,#ff5e62);color:#fff;font:inherit;font-weight:900;font-size:16px;cursor:pointer}
.acm-principal.danger{background:#c0392b}
.acm-principal:disabled{opacity:.6}
.acm-secondaire{padding:11px;border:1px solid #5a4232;border-radius:999px;background:none;color:#FFF4E6;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.acm-erreur{margin:0;color:#ffb4a8;font-size:14px}
.acm-qui{display:flex;flex-direction:column;gap:8px}
.acm-qui button{display:flex;flex-direction:column;gap:3px;text-align:left;padding:12px 14px;border:1px solid #5a4232;border-radius:14px;background:rgba(255,255,255,.04);color:#FFF4E6;font:inherit;cursor:pointer}
.acm-qui button.choisi{border-color:#ffd27a;background:rgba(255,210,122,.12)}
.acm-qui b{font-size:15.5px}
.acm-qui span{font-size:13.5px;color:#eee0d0;line-height:1.4}
.acm-adulte{display:flex;align-items:center;gap:10px;font-size:15px}
.acm-adulte input{width:20px;height:20px}
.acm-lien{text-align:center;text-decoration:none;display:block}
@keyframes acm-voile{from{opacity:0}}
@keyframes acm-monte{from{transform:translateY(24px);opacity:0}}
@media (prefers-reduced-motion:reduce){.acm,.acm-feuille{animation:none}}
`;
