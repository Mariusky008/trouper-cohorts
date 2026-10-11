"use client";

/**
 * 🌉 RETROUVER SON DRESSING CLIKME SUR LE DOMAINE D'UN MAGASIN.
 *
 * Sur `boutique-lafitte.fr`, la Maison posée sur clikme.fr n'est pas visible
 * (chaque domaine a ses cookies). Deux façons de la retrouver, sans rien
 * refaire :
 *
 *   · UN APPUI, si ce téléphone a déjà ClikMe : le pont vers clikme.fr, où
 *     l'on accepte de relier, puis retour ici (`lib/direct/pont-maison.ts`).
 *   · L'ADRESSE E-MAIL, sur un autre téléphone ou un autre navigateur : le
 *     code à six chiffres de Ma Maison, le même que « Emporter ma Maison ».
 *
 * `BandeauPont` dit au retour ce qui s'est passé (`?pont=ok|aucun|expire`).
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { SITE_URL } from "@/lib/site-url";
import { rechargerDressing, surLeDomaineDUnMagasin, villeDuDepot } from "@/lib/direct/dressing-depot";
import { Dessin, DESSINS_DRESSING } from "./dessins-dressing";

/** Rien à écouter : l'adresse ne change pas sous nos pieds. */
const rien = () => () => {};

export function RetrouverMonDressing() {
  const ici = useSyncExternalStore(rien, surLeDomaineDUnMagasin, () => false);
  const [email, setEmail] = useState<"ferme" | "adresse" | "code">("ferme");
  const [adresse, setAdresse] = useState("");
  const [code, setCode] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [souci, setSouci] = useState("");
  if (!ici) return null;
  const ville = villeDuDepot() ?? "";

  const poster = async (route: string, corps: object) => {
    setOccupe(true);
    setSouci("");
    try {
      const r = await fetch(route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!j.ok) setSouci(j.error || "Ça n’a pas marché. Réessayez.");
      return Boolean(j.ok);
    } catch {
      setSouci("Ça n’a pas marché. Réessayez.");
      return false;
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="dr-pont">
      <p className="dr-pont-t">Vous avez déjà un dressing sur ClikMe ?</p>
      <button
        type="button"
        className="dr-bis"
        onClick={() => window.location.assign(`${SITE_URL}/maison/relier?retour=${encodeURIComponent(window.location.href)}`)}
      >
        <Dessin d={DESSINS_DRESSING.cintre} /> Retrouver mon dressing ClikMe
      </button>
      {email === "ferme" ? (
        <button type="button" className="dr-lien" onClick={() => setEmail("adresse")}>
          Sur un autre téléphone ? Avec mon adresse e-mail
        </button>
      ) : email === "adresse" ? (
        <form
          className="dr-pont-f"
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (await poster("/api/direct/ma-maison/code", { email: adresse, ville })) setEmail("code");
          }}
        >
          <input className="dr-pont-c" type="email" inputMode="email" autoComplete="email" placeholder="Votre adresse e-mail" value={adresse} onChange={(e) => setAdresse(e.target.value)} required />
          <button type="submit" className="dr-cta" disabled={occupe}>
            Recevoir mon code
          </button>
        </form>
      ) : (
        <form
          className="dr-pont-f"
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (await poster("/api/direct/ma-maison/verifier", { email: adresse, code, ville })) await rechargerDressing();
          }}
        >
          <p className="dr-note">Le code vient de partir à {adresse}.</p>
          <input className="dr-pont-c" inputMode="numeric" autoComplete="one-time-code" placeholder="Les six chiffres" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
          <button type="submit" className="dr-cta" disabled={occupe || code.length !== 6}>
            Retrouver mon dressing
          </button>
        </form>
      )}
      {souci && <p className="dr-erreur">{souci}</p>}
    </div>
  );
}

const MOTS: Record<string, string> = {
  ok: "✓ Votre dressing ClikMe est relié à cette page.",
  aucun: "Pas de dressing ClikMe sur ce téléphone : vous pouvez en créer un ici, ou le retrouver avec votre adresse e-mail.",
  expire: "Le lien a expiré. Réessayez « Retrouver mon dressing ClikMe ».",
  indisponible: "Le dressing n’a pas pu être relié pour le moment. Réessayez dans un instant.",
};

/** Lu une fois au chargement : l'adresse est nettoyée juste après, le bandeau reste. */
let lu: string | null | undefined;
function etatDuPont(): string | null {
  if (lu !== undefined) return lu;
  try {
    const e = new URL(window.location.href).searchParams.get("pont");
    lu = e && MOTS[e] ? e : null;
  } catch {
    lu = null;
  }
  return lu;
}

/** Au retour du pont : ce qui s'est passé, dit une fois, puis l'adresse redevient propre. */
export function BandeauPont() {
  const etat = useSyncExternalStore(rien, etatDuPont, () => null);
  const [ferme, setFerme] = useState(false);
  useEffect(() => {
    if (!etat) return;
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("pont");
      window.history.replaceState(window.history.state, "", u.toString());
    } catch {
      /* adresse illisible : on la laisse */
    }
    const t = window.setTimeout(() => setFerme(true), 7000);
    return () => window.clearTimeout(t);
  }, [etat]);
  if (!etat || ferme) return null;
  return (
    <p className={`dr-bandeau ${etat === "ok" ? "ok" : ""}`} role="status" onClick={() => setFerme(true)}>
      {MOTS[etat]}
    </p>
  );
}
