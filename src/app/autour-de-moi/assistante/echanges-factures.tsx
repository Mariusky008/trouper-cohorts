"use client";

// 📄 « MES FACTURES » — la facture d'échange de chaque bon validé.
//
// « On peut générer une facture d'échange pour chaque bon validé, ensuite ce sera à eux de la
// déclarer ou pas. »
//
// Un bon validé chez lui est une vente : ClikMe en prépare la facture à son nom, dès qu'il a donné
// ses infos (une seule fois, la première fois qu'un bon est validé chez lui). Il voit celles qu'il a
// émises, celles qu'il a reçues des autres, et télécharge le relevé du mois pour son comptable.
// Hors de France (la Suisse) : le relevé seulement, en attendant l'échange en francs suisses.
//
// Utilisé par le vrai comptoir (`echanges-reels.tsx`) ; la démonstration montre `ExempleDeFacture`.
import { useEffect, useMemo, useState } from "react";
import {
  FORMES,
  NOTE_FACTURE_ELECTRONIQUE,
  TAUX_TVA,
  estSociete,
  euros,
  dateFr,
  moisDe,
  moisLisible,
  montantsTva,
  releveCsv,
  siretValide,
  tauxLisible,
  tvaIntraDe,
  type EchangeDuReleve,
  type EtatFactures,
  type FactureComplete,
  type FactureLigne,
  type InfosFacturation,
  type Nature,
} from "@/lib/echanges/factures";
import { FactureVue, StylesFacture } from "@/app/facture/facture-vue";
import { Feuille } from "./echanges-communs";

export type ReponseFactures = { ok?: boolean; message?: string; error?: string; factures?: EtatFactures };

/** Le relevé d'un mois, téléchargé : un fichier CSV que son comptable ouvre dans Excel. */
function telecharger(lignes: EchangeDuReleve[], mois: string) {
  const blob = new Blob([releveCsv(lignes)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clikme-echanges-${mois}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function PanneauFactures({
  charger,
  enregistrer,
  onFermer,
}: {
  charger: () => Promise<ReponseFactures>;
  enregistrer: (infos: InfosFacturation & { accepte: boolean }) => Promise<ReponseFactures>;
  onFermer: () => void;
}) {
  const [etat, setEtat] = useState<EtatFactures | null>(null);
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [annonce, setAnnonce] = useState("");

  useEffect(() => {
    let fini = false;
    charger().then((r) => {
      if (fini) return;
      if (r.factures) setEtat(r.factures);
      else setErreur(r.error || "Lecture impossible pour l’instant.");
    });
    return () => {
      fini = true;
    };
  }, [charger]);

  if (!etat) {
    return (
      <Feuille titre="Mes factures" onFermer={onFermer}>
        <StylesFactures />
        <p className="ec-gris">{erreur || "Un instant…"}</p>
      </Feuille>
    );
  }

  if (formulaire && etat.pays === "fr") {
    return (
      <Feuille titre="Mes infos de facturation" onFermer={onFermer}>
        <StylesFactures />
        <FormulaireInfos
          initial={etat.infos ?? etat.suggestion}
          conseille={etat.suggestion.taux}
          dejaDonnees={Boolean(etat.infos)}
          onEnregistrer={async (infos) => {
            const r = await enregistrer(infos);
            if (r.factures) {
              setEtat(r.factures);
              setFormulaire(false);
              setAnnonce(r.message ?? "");
              return null;
            }
            return r.error || "Tes infos n’ont pas pu être enregistrées.";
          }}
          onRetour={() => setFormulaire(false)}
        />
      </Feuille>
    );
  }

  return (
    <Feuille titre={etat.pays === "fr" ? "Mes factures" : "Mes échanges"} onFermer={onFermer}>
      <StylesFactures />
      {annonce && <p className="fa-ok">{annonce}</p>}
      {etat.pays !== "fr" ? (
        <>
          <p className="ec-gris">
            Le relevé de tes échanges validés, mois par mois, pour ton comptable. <b>Ce n’est pas une facture</b> : les factures d’échange suisses, en francs
            suisses, arrivent bientôt.
          </p>
          <Releve releve={etat.releve} />
        </>
      ) : !etat.infos ? (
        <>
          <div className="fa-carte">
            <b>{etat.aPreparer > 0 ? `📄 ${etat.aPreparer} facture${etat.aPreparer > 1 ? "s" : ""} t’attend${etat.aPreparer > 1 ? "ent" : ""}` : "📄 Tes factures d’échange"}</b>
            <p>
              Chaque bon validé chez toi est une vente : ClikMe en prépare la facture <b>à ton nom</b>, toute seule. Il nous faut tes infos une seule fois (1 minute).
            </p>
          </div>
          <button type="button" className="cz-go grand" onClick={() => setFormulaire(true)}>
            Compléter mes infos
          </button>
          {etat.recues.length > 0 && <ListeFactures titre="Reçues" lignes={etat.recues} vide="" />}
          <p className="ec-petit">C’est à toi, ou à ton comptable, de les déclarer.</p>
        </>
      ) : (
        <Factures etat={etat} onInfos={() => setFormulaire(true)} />
      )}
    </Feuille>
  );
}

function Factures({ etat, onInfos }: { etat: EtatFactures; onInfos: () => void }) {
  const [onglet, setOnglet] = useState<"emises" | "recues">("emises");
  const ceMois = moisDe(new Date().toISOString());
  const duMois = etat.releve.filter((l) => moisDe(l.date) === ceMois);
  const vendu = duMois.filter((l) => l.sens === "vendu").reduce((s, l) => s + l.ttc, 0);
  const achete = duMois.filter((l) => l.sens === "achete").reduce((s, l) => s + l.ttc, 0);
  return (
    <>
      <div className="fa-mois">
        <span>
          <em>Vendu ce mois-ci</em>
          <b>{euros(vendu)}</b>
        </span>
        <span>
          <em>Acheté ce mois-ci</em>
          <b>{euros(achete)}</b>
        </span>
      </div>
      <div className="ec-onglets" role="tablist">
        <button type="button" role="tab" aria-selected={onglet === "emises"} className={onglet === "emises" ? "on" : ""} onClick={() => setOnglet("emises")}>
          Émises<i>{etat.emises.length}</i>
        </button>
        <button type="button" role="tab" aria-selected={onglet === "recues"} className={onglet === "recues" ? "on" : ""} onClick={() => setOnglet("recues")}>
          Reçues<i>{etat.recues.length}</i>
        </button>
      </div>
      {onglet === "emises" ? (
        <ListeFactures lignes={etat.emises} vide="Pas encore de facture : elle se fait dès qu’un commerçant vient chercher ton produit et que tu valides son bon." />
      ) : (
        <>
          <ListeFactures lignes={etat.recues} vide="Aucune facture reçue pour l’instant." />
          {etat.enAttente.length > 0 && (
            <div className="fa-attente">
              <b>En attente de facture</b>
              {etat.enAttente.map((a, i) => (
                <p key={i}>
                  {a.titre} · {a.chez} · {dateFr(a.livree)}
                </p>
              ))}
              <p className="ec-petit">Ces commerçants n’ont pas encore donné leurs infos de facturation : leur facture arrivera ici dès que c’est fait.</p>
            </div>
          )}
        </>
      )}
      <Releve releve={etat.releve} />
      <button type="button" className="cz-lien" onClick={onInfos}>
        Mes infos de facturation ›
      </button>
      <p className="ec-petit">
        C’est à toi, ou à ton comptable, de les déclarer. {NOTE_FACTURE_ELECTRONIQUE}
      </p>
    </>
  );
}

function ListeFactures({ titre, lignes, vide }: { titre?: string; lignes: FactureLigne[]; vide: string }) {
  if (!lignes.length) return vide ? <p className="ec-gris">{vide}</p> : null;
  return (
    <div className="fa-liste">
      {titre && <h3 className="ec-sous-titre">{titre}</h3>}
      {lignes.map((f) => (
        <a key={f.id} className="fa-ligne" href={f.lien} target="_blank" rel="noopener noreferrer">
          <span>
            <b>{f.numero}</b>
            <em>
              {f.autre} · {f.designation}
            </em>
            <small>{dateFr(f.emise)}</small>
          </span>
          <strong>{euros(f.ttc)}</strong>
        </a>
      ))}
    </div>
  );
}

/** LE RELEVÉ DU MOIS, POUR SON COMPTABLE : les mois où il a échangé, et le CSV de celui qu'il choisit. */
function Releve({ releve }: { releve: EchangeDuReleve[] }) {
  const mois = useMemo(() => [...new Set(releve.map((l) => moisDe(l.date)).filter(Boolean))].sort().reverse().slice(0, 12), [releve]);
  const [choisi, setChoisi] = useState("");
  const m = choisi && mois.includes(choisi) ? choisi : (mois[0] ?? "");
  const lignes = releve.filter((l) => moisDe(l.date) === m);
  if (!mois.length) return <p className="ec-petit">Le relevé du mois, pour ton comptable, apparaîtra ici dès ton premier échange validé.</p>;
  return (
    <div className="fa-releve">
      <h3 className="ec-sous-titre">Pour ton comptable</h3>
      {mois.length > 1 && (
        <div className="ec-puces" role="group" aria-label="Mois du relevé">
          {mois.map((x) => (
            <button key={x} type="button" className={x === m ? "on" : ""} aria-pressed={x === m} onClick={() => setChoisi(x)}>
              {moisLisible(x)}
            </button>
          ))}
        </div>
      )}
      <p className="ec-gris">
        {moisLisible(m)} : {lignes.length} échange{lignes.length > 1 ? "s" : ""} validé{lignes.length > 1 ? "s" : ""}.
      </p>
      <button type="button" className="fa-csv" onClick={() => telecharger(lignes, m)}>
        Télécharger le relevé de {moisLisible(m)} (CSV)
      </button>
    </div>
  );
}

const NATURES: Array<[Nature, string]> = [
  ["biens", "Des produits"],
  ["services", "Des services"],
  ["mixte", "Les deux"],
];

function FormulaireInfos({
  initial,
  conseille,
  dejaDonnees,
  onEnregistrer,
  onRetour,
}: {
  initial: InfosFacturation;
  conseille: number | null;
  dejaDonnees: boolean;
  onEnregistrer: (infos: InfosFacturation & { accepte: boolean }) => Promise<string | null>;
  onRetour: () => void;
}) {
  const [f, setF] = useState<InfosFacturation>(initial);
  const [accepte, setAccepte] = useState(dejaDonnees);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const maj = (champ: Partial<InfosFacturation>) => setF((x) => ({ ...x, ...champ }));
  const siret = f.siret.replace(/\s/g, "");
  const siretOk = siretValide(siret);
  const societe = estSociete(f.forme);
  const pret = f.nomLegal.trim().length >= 2 && f.adresse.trim().length >= 5 && siretOk && (!societe || f.capital.trim()) && (f.franchise || f.taux) && accepte;

  return (
    <form
      className="fa-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!pret || envoi) return;
        setEnvoi(true);
        setErreur("");
        const r = await onEnregistrer({ ...f, siret, tvaIntra: f.franchise ? "" : tvaIntraDe(siret), accepte });
        setEnvoi(false);
        if (r) setErreur(r);
      }}
    >
      <p className="ec-gris">
        {dejaDonnees
          ? "Tu peux les corriger : seules tes prochaines factures changent, celles déjà faites restent comme elles sont."
          : "Une seule fois. Elles figurent sur tes factures, et seulement là."}
      </p>
      <label className="fa-champ">
        <span>Le nom légal de ton entreprise</span>
        <input value={f.nomLegal} onChange={(e) => maj({ nomLegal: e.target.value })} maxLength={120} autoComplete="organization" placeholder="Celui de ton Kbis ou de ton avis INSEE" />
      </label>
      <div className="fa-champ">
        <span>Sa forme</span>
        <div className="ec-puces" role="group" aria-label="Forme de l’entreprise">
          {FORMES.map((x) => (
            <button key={x} type="button" className={f.forme === x ? "on" : ""} aria-pressed={f.forme === x} onClick={() => maj({ forme: x })}>
              {x === "EI" ? "EI / micro" : x}
            </button>
          ))}
        </div>
      </div>
      {societe && (
        <label className="fa-champ">
          <span>Son capital</span>
          <input value={f.capital} onChange={(e) => maj({ capital: e.target.value })} maxLength={40} placeholder="Par exemple : 1 000 €" />
        </label>
      )}
      <label className="fa-champ">
        <span>Adresse de l’entreprise</span>
        <input value={f.adresse} onChange={(e) => maj({ adresse: e.target.value })} maxLength={200} autoComplete="street-address" />
      </label>
      <label className="fa-champ">
        <span>
          SIRET {siret.length > 0 && <i className={siretOk ? "bon" : "faux"}>{siretOk ? "✓" : `${siret.length}/14`}</i>}
        </span>
        <input value={f.siret} onChange={(e) => maj({ siret: e.target.value.replace(/[^\d ]/g, "") })} maxLength={17} inputMode="numeric" placeholder="14 chiffres" />
      </label>
      <label className="fa-champ">
        <span>Immatriculation (si tu en as une)</span>
        <input value={f.immatriculation} onChange={(e) => maj({ immatriculation: e.target.value })} maxLength={60} placeholder="RCS Dax, RM 40…" />
      </label>
      <div className="fa-champ">
        <span>La TVA</span>
        <div className="fa-choix">
          <button type="button" className={!f.franchise ? "on" : ""} aria-pressed={!f.franchise} onClick={() => maj({ franchise: false, taux: f.taux ?? (conseille as InfosFacturation["taux"]) ?? 20 })}>
            Je facture la TVA
          </button>
          <button type="button" className={f.franchise ? "on" : ""} aria-pressed={f.franchise} onClick={() => maj({ franchise: true, taux: null })}>
            Franchise : pas de TVA
          </button>
        </div>
        {!f.franchise && (
          <>
            <div className="ec-puces" role="group" aria-label="Taux de TVA">
              {TAUX_TVA.map((t) => (
                <button key={t} type="button" className={f.taux === t ? "on" : ""} aria-pressed={f.taux === t} onClick={() => maj({ taux: t })}>
                  {tauxLisible(t)}
                  {t === conseille ? " · le plus courant" : ""}
                </button>
              ))}
            </div>
            <p className="ec-petit">
              Le taux le plus courant pour ton métier est proposé : vérifie avec ton comptable.
              {siretOk ? ` Ton n° de TVA intracommunautaire : ${tvaIntraDe(siret)}.` : ""}
            </p>
          </>
        )}
      </div>
      <div className="fa-champ">
        <span>Tu vends surtout</span>
        <div className="ec-puces" role="group" aria-label="Ce que tu vends">
          {NATURES.map(([n, mot]) => (
            <button key={n} type="button" className={f.nature === n ? "on" : ""} aria-pressed={f.nature === n} onClick={() => maj({ nature: n })}>
              {mot}
            </button>
          ))}
        </div>
      </div>
      <label className="fa-accord">
        <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} />
        <span>J’accepte que ClikMe prépare en mon nom la facture de chaque bon validé chez moi. Je reste responsable de mes factures et de leur déclaration.</span>
      </label>
      {erreur && <p className="ec-erreur">{erreur}</p>}
      <button type="submit" className="cz-go grand" disabled={!pret || envoi}>
        {envoi ? "Enregistrement…" : dejaDonnees ? "Enregistrer" : "Enregistrer et faire mes factures"}
      </button>
      <button type="button" className="cz-lien" onClick={onRetour}>
        ‹ Retour
      </button>
    </form>
  );
}

/* ═══ LA DÉMONSTRATION : une facture d'exemple, entre deux commerces imaginaires ═══ */
const EXEMPLE_HT = montantsTva(50, 10);
export const FACTURE_EXEMPLE: FactureComplete = {
  numero: "ECH-2026-0001",
  emise: "2026-10-14T10:00:00.000Z",
  livree: "2026-10-14T10:00:00.000Z",
  contenu: {
    vendeur: {
      nom: "SARL Bergine",
      enseigne: "Chez Bergine",
      forme: "SARL",
      capital: "5 000 €",
      immatriculation: "RCS Dax",
      adresse: "18 rue Neuve, 40100 Dax",
      siret: "12345678200010",
      tvaIntra: tvaIntraDe("12345678200010"),
      franchise: false,
    },
    acheteur: { nom: "Lou Martin", enseigne: "L’Atelier de Lou", adresse: "4 rue des Carmes, 40100 Dax", siret: "", tvaIntra: "" },
    ligne: { designation: "Un dîner pour deux", detail: "", nature: "services", ttc: 50, ht: EXEMPLE_HT.ht, tva: EXEMPLE_HT.tva, taux: 10 },
    bon: { code: "CLK-7KQ2MX" },
  },
};

export function ExempleDeFacture({ onFermer }: { onFermer: () => void }) {
  return (
    <Feuille titre="Mes factures" onFermer={onFermer}>
      <StylesFactures />
      <StylesFacture />
      <p className="ec-gris">
        Chaque bon validé chez toi est une vente : ClikMe en prépare <b>la facture d’échange à ton nom</b>, toute seule, et l’autre commerçant la reçoit. Tu donnes
        tes infos une seule fois. C’est à toi, ou à ton comptable, de la déclarer.
      </p>
      <div className="fa-exemple">
        <FactureVue facture={FACTURE_EXEMPLE} exemple />
      </div>
      <p className="ec-petit">Chaque mois, un relevé de tous tes échanges, à envoyer à ton comptable.</p>
    </Feuille>
  );
}

export function StylesFactures() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.fa-carte{display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:18px;background:rgba(245,162,58,.1);border:1px solid rgba(245,162,58,.45);}
.fa-carte b{font-size:17px;}
.fa-carte p{margin:0;color:var(--creme);font-size:14.5px;line-height:1.45;}
.fa-ok{margin:0;padding:10px 12px;border-radius:14px;background:rgba(124,240,162,.12);border:1px solid rgba(124,240,162,.5);color:#C9F7D7;font-weight:700;font-size:14.5px;}
.fa-mois{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.fa-mois span{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);}
.fa-mois em{font-style:normal;font-size:12.5px;color:var(--gris);}
.fa-mois b{font-family:var(--font-clikme),sans-serif;font-size:20px;}
.fa-liste{display:flex;flex-direction:column;gap:8px;}
.fa-ligne{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:16px;background:var(--nappe);
  border:1px solid var(--trait);color:var(--creme);text-decoration:none;}
.fa-ligne > span{display:flex;flex-direction:column;gap:1px;min-width:0;}
.fa-ligne b{font-size:14.5px;}
.fa-ligne em{font-style:normal;font-size:13px;color:var(--gris);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fa-ligne small{font-size:12px;color:var(--gris);}
.fa-ligne strong{flex-shrink:0;font-size:15px;}
.fa-attente{display:flex;flex-direction:column;gap:4px;padding:12px;border-radius:16px;border:1px dashed var(--trait);}
.fa-attente p{margin:0;font-size:13.5px;color:var(--gris);}
.fa-releve{display:flex;flex-direction:column;gap:8px;padding-top:4px;}
.fa-csv{height:48px;border-radius:999px;border:1.5px solid var(--ambre);background:none;color:var(--ambre);font-weight:800;font-size:14.5px;padding:0 16px;}
.fa-form{display:flex;flex-direction:column;gap:14px;}
.fa-champ{display:flex;flex-direction:column;gap:6px;}
.fa-champ > span{font-size:13.5px;font-weight:700;color:var(--gris);}
.fa-champ > span i{font-style:normal;margin-left:6px;font-weight:800;}
.fa-champ > span i.bon{color:#7CF0A2;}
.fa-champ > span i.faux{color:#FF8FB8;}
.fa-champ input{width:100%;min-width:0;height:50px;padding:0 14px;border-radius:14px;border:1.5px solid var(--trait);background:var(--fond);
  color:var(--creme);font-size:16px;font-weight:600;}
.fa-champ input:focus{outline:none;border-color:var(--ambre);}
.fa-choix{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.fa-choix button{min-height:48px;padding:6px 10px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font-weight:800;font-size:14px;}
.fa-choix button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.fa-accord{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.4;}
.fa-accord input{width:22px;height:22px;flex-shrink:0;margin-top:1px;accent-color:#FF2E9A;}
.fa-exemple{margin:0 -4px;}
.fa-exemple .fx{padding:20px 14px;}
`,
      }}
    />
  );
}
