"use client";

// 🧺 SES OFFRES — « 3 offres max et limite par offre ».
//
// « Il y a des choses que je peux échanger et d'autres que je peux seulement
// vendre, ou les deux. Et est-ce que je peux mettre plusieurs produits ou
// services ? »
//
// Sa PREMIÈRE OFFRE se pose aux trois étapes du départ (`Depart`, dans
// `echanges-comptoir.tsx`) : c'est sa monnaie, et elle dit s'il est en pause.
// Ici, « Mes offres » : il la retrouve, et en ajoute deux autres au plus.
// Chacune a sa limite du mois, et sa façon d'être payée :
//   · les deux (par défaut) — avec des crédits, ou à moitié prix ;
//   · en échange seulement — avec des crédits ;
//   · à moitié prix seulement — la moitié en euros sur place, et c'est tout
//     (pour écouler son stock : aucun crédit d'un côté ni de l'autre).
// Une librairie : en échange seulement (prix unique du livre).
//
// Utilisé tel quel par le vrai comptoir (`echanges-reels.tsx`) et par la
// démonstration (`echanges-comptoir.tsx`, où rien ne part).
import { useState } from "react";
import { MAX_OFFRES, PAR_MOIS, type AutreOffre, type Paiement } from "@/lib/echanges/echanges";
import { Feuille, reduirePhoto } from "./echanges-communs";

const ORDRE: Paiement[] = ["les_deux", "credits", "moitie"];
const MOTS: Record<Paiement, [string, string]> = {
  les_deux: ["Les deux", "crédits ou −50 %"],
  credits: ["Échange", "crédits seulement"],
  moitie: ["−50 %", "seulement"],
};

/** Ce que son choix veut dire, en une phrase. */
export function legendePaiement(p: Paiement, librairie = false): string {
  if (librairie) return "Des livres : en échange seulement (prix unique du livre).";
  if (p === "credits") return "En échange seulement : les commerçants te le paient avec leurs crédits, jamais à moitié prix.";
  if (p === "moitie") return "À moitié prix seulement, pour écouler ton stock : tu encaisses la moitié en euros, sur place, et c’est tout (pas de crédits).";
  return "Avec leurs crédits, ou à moitié prix : dans ce cas, tu encaisses la moitié en euros, sur place, et c’est tout.";
}

/** « Comment on te le paie ? » — trois choix, côte à côte. */
export function ChoixPaiementOffre({ valeur, onChange, librairie = false }: { valeur: Paiement; onChange: (p: Paiement) => void; librairie?: boolean }) {
  return (
    <div className="ec-paiement" role="group" aria-label="Comment on te le paie">
      {ORDRE.map((p) => (
        <button key={p} type="button" className={valeur === p ? "on" : ""} aria-pressed={valeur === p} disabled={librairie && p !== "credits"} onClick={() => onChange(p)}>
          <b>{MOTS[p][0]}</b>
          <small>{MOTS[p][1]}</small>
        </button>
      ))}
    </div>
  );
}

/** « Jusqu’à 4 par mois · crédits ou −50 % » */
const ligneDe = (parMois: number, p: Paiement) => `Jusqu’à ${parMois} par mois · ${p === "les_deux" ? "crédits ou −50 %" : p === "credits" ? "en échange seulement" : "à −50 % seulement"}`;

export type Brouillon = { id?: string; titre: string; prix: number; parMois: number; paiement: Paiement; photo: string };

export function PanneauOffres({
  principale,
  autres,
  actif,
  du,
  visage,
  envoi = false,
  exemple = false,
  librairie = false,
  onModifierPrincipale,
  onPause,
  onEnregistrer,
  onRetirer,
  onFermer,
}: {
  principale: { titre: string; prix: number; parMois: number; paiement: Paiement; photo: string; duJour: boolean };
  autres: AutreOffre[];
  /** En pause, toutes ses offres le sont. */
  actif: boolean;
  du: number;
  /** Son fantôme, quand une offre n'a pas de photo. */
  visage: string;
  envoi?: boolean;
  /** Démonstration : rien ne part, c'est marqué « Exemple ». */
  exemple?: boolean;
  librairie?: boolean;
  onModifierPrincipale: () => void;
  /** Le vrai comptoir seulement. */
  onPause?: () => void;
  /** `null` : c'est fait ; sinon, pourquoi pas. */
  onEnregistrer: (b: Brouillon) => Promise<string | null>;
  onRetirer: (a: AutreOffre) => void;
  onFermer: () => void;
}) {
  const [edition, setEdition] = useState<Brouillon | null>(null);
  const [aRetirer, setARetirer] = useState<AutreOffre | null>(null);
  const place = MAX_OFFRES - 1 - autres.length;

  if (edition) {
    return <FormulaireOffre initial={edition} visage={visage} envoi={envoi} librairie={librairie} onEnregistrer={onEnregistrer} onRetour={() => setEdition(null)} onFermer={onFermer} />;
  }

  if (aRetirer) {
    return (
      <Feuille titre={`Retirer « ${aRetirer.titre} » ?`} onFermer={() => setARetirer(null)}>
        <p className="ec-gris">Les commerçants ne la verront plus. Les bons déjà pris dessus restent valables : tu les sers comme prévu.</p>
        <button
          type="button"
          className="cz-go"
          disabled={envoi}
          onClick={() => {
            onRetirer(aRetirer);
            setARetirer(null);
          }}
        >
          Retirer cette offre
        </button>
        <button type="button" className="cz-lien" onClick={() => setARetirer(null)}>
          Annuler
        </button>
      </Feuille>
    );
  }

  return (
    <Feuille titre="Mes offres" onFermer={onFermer}>
      <p className="ec-gris">
        Jusqu’à <b>{MAX_OFFRES} produits ou services</b>. Pour chacun : combien par mois, et comment les commerçants te le paient.
      </p>
      <div className="ec-offres">
        <article className="ec-offre-l">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={principale.photo || visage} alt="" />
          <span>
            <b>
              {principale.duJour ? "Ton produit du jour" : principale.titre} · {principale.prix} €
            </b>
            <em>{ligneDe(principale.parMois, principale.paiement)}</em>
            <small>Ta première offre : ta monnaie dans le réseau</small>
          </span>
          <span className="ec-offre-b">
            <button type="button" onClick={onModifierPrincipale}>
              Modifier
            </button>
          </span>
        </article>
        {autres.map((a) => (
          <article key={a.id} className="ec-offre-l">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.photo || visage} alt="" />
            <span>
              <b>
                {a.titre} · {a.prix} €
              </b>
              <em>{ligneDe(a.parMois, a.paiement)}</em>
            </span>
            <span className="ec-offre-b">
              <button type="button" disabled={envoi} onClick={() => setEdition({ ...a })}>
                Modifier
              </button>
              <button type="button" disabled={envoi} onClick={() => setARetirer(a)}>
                Retirer
              </button>
            </span>
          </article>
        ))}
      </div>
      {place > 0 ? (
        <button
          type="button"
          className="ec-ajouter"
          disabled={envoi}
          onClick={() => setEdition({ titre: "", prix: 0, parMois: 4, paiement: librairie ? "credits" : "les_deux", photo: "" })}
        >
          <b>＋ Ajouter une offre</b>
          <small>
            {1 + autres.length} sur {MAX_OFFRES}
          </small>
        </button>
      ) : (
        <p className="ec-gris">Tu as tes {MAX_OFFRES} offres : retire-en une pour en mettre une autre.</p>
      )}
      {!actif && <p className="ec-regle">Tes offres sont en pause : les autres commerçants ne les voient pas.</p>}
      {du > 0 && <p className="ec-gris">📣 Tant que tu dois, tes offres passent en tête chez les autres commerçants, et elles restent visibles.</p>}
      {onPause && (
        <button type="button" className="cz-lien" disabled={envoi || (actif && du > 0)} onClick={onPause}>
          {actif ? "Mettre mes offres en pause" : "Réactiver mes offres"}
        </button>
      )}
      {exemple && <p className="ec-petit">Exemple : tout reste dans ce téléphone.</p>}
    </Feuille>
  );
}

/** Ajouter ou modifier sa 2e ou 3e offre : photo, ce que c'est, son prix, combien par mois, comment on la paie. */
function FormulaireOffre({
  initial,
  visage,
  envoi,
  librairie,
  onEnregistrer,
  onRetour,
  onFermer,
}: {
  initial: Brouillon;
  visage: string;
  envoi: boolean;
  librairie: boolean;
  onEnregistrer: (b: Brouillon) => Promise<string | null>;
  onRetour: () => void;
  onFermer: () => void;
}) {
  const [titre, setTitre] = useState(initial.titre);
  const [prixTexte, setPrixTexte] = useState(initial.prix ? String(initial.prix) : "");
  const [parMois, setParMois] = useState(initial.parMois);
  const [paiement, setPaiement] = useState<Paiement>(librairie ? "credits" : initial.paiement);
  const [photo, setPhoto] = useState(initial.photo);
  const [erreur, setErreur] = useState("");
  const prix = Math.round(Number(prixTexte.replace(",", ".")) || 0);
  const pret = titre.trim().length >= 2 && prix >= 5 && prix <= 2000;

  return (
    <Feuille titre={initial.id ? "Modifier cette offre" : "Ajouter une offre"} onFermer={onFermer}>
      <form
        className="ec-form-offre"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!pret || envoi) return;
          setErreur("");
          const r = await onEnregistrer({ id: initial.id, titre: titre.trim(), prix, parMois, paiement, photo });
          if (r) setErreur(r);
          else onRetour();
        }}
      >
        <div className="ec-produit">
          <label className="ec-photo-choix petite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo || visage} alt="" className={photo ? "" : "fantome"} />
            <span className="ec-photo-bouton">📷 {photo ? "Changer la photo" : "Ajouter une photo"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  setPhoto(await reduirePhoto(f, 900));
                } catch {
                  setErreur("Cette photo ne s'ouvre pas. Essaie avec une autre.");
                }
              }}
            />
          </label>
          <div className="ec-champs">
            <label>
              <span>Ce que j’offre</span>
              <input value={titre} maxLength={60} onChange={(e) => setTitre(e.target.value)} placeholder="Une séance découverte" />
            </label>
            <label>
              <span>Prix</span>
              <span className="ec-euro">
                <input type="number" inputMode="decimal" min={5} max={2000} value={prixTexte} onChange={(e) => setPrixTexte(e.target.value)} />
                <i aria-hidden="true">€</i>
              </span>
            </label>
          </div>
        </div>
        <h3 className="ec-sous-titre">Combien par mois, au plus ?</h3>
        <div className="ec-puces quatre petites" role="group" aria-label="Combien par mois">
          {PAR_MOIS.map((n) => (
            <button key={n} type="button" className={parMois === n ? "on" : ""} aria-pressed={parMois === n} onClick={() => setParMois(n)}>
              {n}
            </button>
          ))}
        </div>
        <h3 className="ec-sous-titre">Comment on te la paie ?</h3>
        <ChoixPaiementOffre valeur={paiement} onChange={setPaiement} librairie={librairie} />
        <p className="ec-astuce">{legendePaiement(paiement, librairie)}</p>
        {prix > 0 && prix < 5 && <p className="ec-astuce">À partir de 5 €.</p>}
        {erreur && <p className="ec-erreur">{erreur}</p>}
        <button type="submit" className="cz-go grand" disabled={!pret || envoi}>
          {envoi ? "Enregistrement…" : initial.id ? "Enregistrer" : "Ajouter cette offre"}
        </button>
        <button type="button" className="cz-lien" onClick={onRetour}>
          ‹ Mes offres
        </button>
      </form>
    </Feuille>
  );
}

export function StylesOffres() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ec-paiement{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.ec-paiement button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:44px;padding:4px 2px;border:0;border-radius:14px;
  background:none;color:var(--gris);transition:background .25s,color .25s;}
.ec-paiement button b{font-size:14px;font-weight:900;}
.ec-paiement button small{font-size:11px;line-height:1.15;}
.ec-paiement button.on{background:var(--rose);color:#fff;}
.ec-paiement button:disabled{opacity:.35;}
.ec-offres{display:flex;flex-direction:column;gap:8px;}
.ec-offre-l{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);}
.ec-offre-l img{width:52px;height:52px;border-radius:12px;object-fit:cover;background:var(--nappe2);}
.ec-offre-l > span:nth-child(2){display:flex;flex-direction:column;gap:2px;min-width:0;}
.ec-offre-l b{font-size:14.5px;overflow-wrap:anywhere;}
.ec-offre-l em{font-style:normal;font-size:12.5px;color:var(--gris);line-height:1.3;}
.ec-offre-l small{font-size:11.5px;color:var(--ambre);font-weight:700;}
.ec-offre-b{display:flex;flex-direction:column;gap:6px;flex-shrink:0;}
.ec-offre-b button{height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--trait);background:none;color:var(--creme);font-weight:800;font-size:12.5px;}
.ec-ajouter{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:54px;padding:0 16px;border-radius:16px;
  border:1.5px dashed rgba(245,162,58,.6);background:rgba(245,162,58,.08);color:var(--creme);}
.ec-ajouter b{font-size:15.5px;font-weight:900;}
.ec-ajouter small{font-size:12.5px;color:var(--gris);}
.ec-form-offre{display:flex;flex-direction:column;gap:10px;}
.ec-produit-paie{display:flex;flex-direction:column;gap:6px;padding:0 12px 12px;}
.ec-produit-paie > span{font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--ambre);}
.ec-produit-paie > small{font-size:11.5px;line-height:1.3;color:var(--gris);}
/* L'ÉTAPE 1 TIENT SUR UN ÉCRAN DE TÉLÉPHONE, avec la façon d'être payé : la photo se fait plus basse. */
.ec-depart .ec-photo-choix img{height:118px;}
.ec-photo-choix.petite img{height:120px;}
.ec-puces.quatre.petites button{height:48px;font-size:20px;border-radius:14px;}
`,
      }}
    />
  );
}
