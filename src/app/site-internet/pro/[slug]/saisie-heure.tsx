"use client";

// SAISIE D'UNE HEURE, ET D'UNE PLAGE.
//
// Ce que remplaçait ce composant : deux menus déroulants de vingt-quatre lignes,
// groupés par moment de la journée. Le commerçant devait dérouler, chercher, et
// il n'obtenait qu'un instant — jamais « de 11 h à 17 h ». Une annonce qui dure
// six heures ne se saisissait pas.
//
// POURQUOI PAS `<input type="time">` : le navigateur affiche le format de SA
// langue. Un commerçant français dont le téléphone est en anglais y lit
// « 02:14 PM ». C'est la raison pour laquelle les menus existaient, et elle
// tient toujours.
//
// La solution : un champ texte libre qui accepte ce qu'on tape naturellement —
// « 11 », « 11h », « 11h30 », « 11:30 », « 1130 » — et qui se normalise en
// « 11 h 30 » dès qu'on en sort. Le commerçant écrit comme il parle, l'affichage
// reste en vingt-quatre heures, et rien ne dépend de la langue du téléphone.
import { useState } from "react";

/** Minuit → 1439 (23 h 59). `null` = rien de saisi ou illisible. */
export function lireHeure(brut: string): number | null {
  const t = String(brut || "").trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;

  // « 11h30 », « 11:30 », « 11.30 », « 11h », « 11 »
  const m = t.match(/^(\d{1,2})\s*(?:[h:.]\s*(\d{1,2})?)?$/);
  if (m) {
    const h = Number(m[1]);
    const mn = m[2] ? Number(m[2]) : 0;
    if (h > 23 || mn > 59) return null;
    return h * 60 + mn;
  }
  // « 1130 » — quatre chiffres collés, ce que tape quelqu'un de pressé.
  const c = t.match(/^(\d{2})(\d{2})$/);
  if (c) {
    const h = Number(c[1]);
    const mn = Number(c[2]);
    if (h > 23 || mn > 59) return null;
    return h * 60 + mn;
  }
  return null;
}

/** 690 → « 11 h 30 » · 660 → « 11 h ». Les minutes ne s'écrivent que si elles
 *  existent : « 11 h 00 » se lit comme un horaire de gare. */
export function ecrireHeure(min: number | null): string {
  if (min == null) return "";
  const h = Math.floor(min / 60);
  const mn = min % 60;
  return mn ? `${h} h ${String(mn).padStart(2, "0")}` : `${h} h`;
}

export function SaisieHeure({
  valeur,
  onChange,
  placeholder = "11h",
  label,
}: {
  valeur: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  label: string;
}) {
  // Texte tant qu'on tape, valeur normalisée dès qu'on sort. Normaliser à chaque
  // frappe empêcherait d'écrire « 11h30 » : le champ se réécrirait en « 1 h » au
  // premier caractère.
  const [texte, setTexte] = useState(() => ecrireHeure(valeur));
  const [faux, setFaux] = useState(false);

  // Resynchronisation quand la valeur change EN DEHORS du champ — changement
  // d'intention, remise à zéro du formulaire. Sans elle, l'ancienne heure
  // restait affichée alors que la réponse enregistrée était vide : le commerçant
  // lisait « 11 h » et publiait une annonce sans heure.
  const [vu, setVu] = useState(valeur);
  if (vu !== valeur) {
    setVu(valeur);
    setTexte(ecrireHeure(valeur));
    setFaux(false);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={`sh-in${faux ? " ko" : ""}`}
      value={texte}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => {
        setTexte(e.target.value);
        setFaux(false);
      }}
      onBlur={() => {
        const v = lireHeure(texte);
        if (texte.trim() && v == null) {
          setFaux(true);
          return;
        }
        setTexte(ecrireHeure(v));
        onChange(v);
      }}
    />
  );
}

/**
 * Une plage : début, et fin facultative.
 *
 * La fin est FACULTATIVE parce que les deux cas existent vraiment — « il me
 * reste 16 h 30 » est un instant, « ouvert de 11 h à 17 h » est une plage. Rendre
 * la fin obligatoire forcerait à inventer une heure de fin pour un créneau qui
 * n'en a pas.
 */
export function SaisiePlage({
  debut,
  fin,
  onChange,
}: {
  debut: number | null;
  fin: number | null;
  onChange: (debut: number | null, fin: number | null) => void;
}) {
  const incoherent = debut != null && fin != null && fin <= debut;
  return (
    <span className="sh">
      <SaisieHeure valeur={debut} onChange={(v) => onChange(v, fin)} placeholder="11h" label="Heure de début" />
      <span className="sh-sep">→</span>
      <SaisieHeure valeur={fin} onChange={(v) => onChange(debut, v)} placeholder="17h (facultatif)" label="Heure de fin" />
      {incoherent && (
        // On le signale sans bloquer : c'est peut-être « de 22 h à 1 h » chez un
        // restaurant. Le dire suffit, décider à sa place serait présomptueux.
        <span className="sh-note">La fin est avant le début — voulu&nbsp;?</span>
      )}
    </span>
  );
}

export const STYLES_SAISIE_HEURE = `
.sh{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;}
.sh-in{width:118px;padding:10px 12px;border:1px solid #D3DBD7;border-radius:11px;
  font-size:15px;font-family:inherit;color:#14201A;background:#fff;}
.sh-in::placeholder{color:#9DAAA3;}
.sh-in.ko{border-color:#D2634A;background:#FBE9E4;}
.sh-sep{color:#9DAAA3;font-size:14px;}
.sh-note{flex-basis:100%;font-size:10.5px;color:#8A6A22;}
`;
