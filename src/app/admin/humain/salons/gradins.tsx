"use client";

/**
 * 🎭 LES GRADINS DES SALONS OUVERTS, SUR LA PAGE DE L'ADMINISTRATEUR (`lib/direct/salons-gradins-serveur.ts` ;
 * `docs/univers/decouvrir.md`, section 27) : les onze lieux, chacun son décor et ses huit emplacements (la silhouette d'une
 * figurine assise sur chacun, à sa taille, numérotée dans l'ordre des places), « Fabriquer » (le décor, puis son relevé),
 * « Refaire », « Prendre le plan », « Valider » — seul un gradin validé va dans les salons.
 */
import { useCallback, useEffect, useState } from "react";
import { PHRASES_GRADINS as P, type EtatGradins, type GradinVue, type IdGradin } from "@/lib/direct/salons-gradins";
import { themeDe } from "@/lib/direct/decouvrir";

const ROUTE = "/api/admin/direct/gradins";
const carte = { border: "1px solid #e4e4e7", borderRadius: 12, padding: "12px 14px", margin: "10px 0", background: "#fff" } as const;
const bouton = { border: "1px solid #d4d4d8", borderRadius: 8, padding: "5px 10px", background: "#fafafa", cursor: "pointer", fontSize: 13 } as const;
const fort = { ...bouton, background: "#111", color: "#fff", borderColor: "#111" } as const;

/** Ce qui reste à faire pour un gradin : son décor, son relevé, ou rien. */
const reste = (g: GradinVue) => (!g.image ? "decor" : !g.places ? "releve" : null);

export function GradinsSalons() {
  const [etat, setEtat] = useState<EtatGradins | null>(null);
  const [erreur, setErreur] = useState("");
  const [note, setNote] = useState("");
  const [occupe, setOccupe] = useState<IdGradin | "tous" | null>(null);

  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { etat?: EtatGradins; error?: string };
    if (!r?.ok || !j.etat) return setErreur(j?.error || "La page ne répond pas.");
    setEtat(j.etat);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  const appeler = async (corps: Record<string, unknown>): Promise<{ ok: boolean; fait?: string; error?: string }> => {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { etat?: EtatGradins; fait?: string; error?: string };
    if (j.etat) setEtat(j.etat);
    return { ok: Boolean(r?.ok), fait: j.fait, error: j.error || (r ? undefined : "La page ne répond pas.") };
  };
  const agir = async (g: GradinVue, corps: Record<string, unknown>, fait: string) => {
    setOccupe(g.id);
    setNote(corps.action === "fabriquer" ? `${g.e} ${g.nom} : ${reste(g) === "decor" ? "le décor se dessine (une minute environ)…" : "le relevé…"}` : "");
    const r = await appeler({ ...corps, gradin: g.id });
    setOccupe(null);
    setNote(r.ok ? (r.fait === "decor" ? `${g.e} ${g.nom} : le décor est fait. Encore « Fabriquer » pour ses huit emplacements.` : r.fait === "releve" ? `${g.e} ${g.nom} : ses huit emplacements sont relevés. Regardez-les, puis validez.` : fait) : r.error || "Ça n’a pas marché.");
  };
  // (🛠️ tous : un passage après l'autre, tant qu'il reste quelque chose à faire — on s'arrête à la première erreur)
  const tous = async () => {
    if (!etat) return;
    setOccupe("tous");
    let l = etat.gradins;
    for (let n = 0; n < 2 * l.length + 2; n++) {
      const g = l.find((x) => reste(x));
      if (!g) break;
      setNote(`${g.e} ${g.nom} : ${reste(g) === "decor" ? "le décor se dessine" : "le relevé"}…`);
      const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "fabriquer", gradin: g.id }) }).catch(() => null);
      const j = (await r?.json().catch(() => ({}))) as { etat?: EtatGradins; error?: string };
      if (j.etat) {
        setEtat(j.etat);
        l = j.etat.gradins;
      }
      if (!r?.ok) {
        setOccupe(null);
        return setNote(`${g.e} ${g.nom} : ${j.error || "ça n’a pas marché"}.`);
      }
    }
    setOccupe(null);
    setNote("Tout est fabriqué : regardez chaque décor, puis validez ceux qui vous plaisent.");
  };

  if (erreur) return <p style={{ color: "#b91c1c" }}>{erreur}</p>;
  if (!etat) return <p>…</p>;
  const faits = etat.gradins.filter((g) => !reste(g)).length;
  return (
    <section data-gradins-admin style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 19, margin: "0 0 4px" }}>{P.titre}</h2>
      <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>{P.chapo}</p>
      {!etat.moteurs.image && <p style={{ color: "#b45309" }}>Le moteur d’image n’est pas branché ici : la fabrication se fait sur le site en ligne.</p>}
      {etat.moteurs.image && !etat.moteurs.regard && <p style={{ color: "#b45309" }}>Pas de modèle qui voit ici : les places seront celles du plan (le décor est dessiné dessus).</p>}
      <p style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" style={fort} disabled={occupe !== null || faits === etat.gradins.length} onClick={() => void tous()} data-tout-fabriquer>
          🛠️ Tout fabriquer ({etat.gradins.length - faits} à faire)
        </button>
        <small style={{ color: "#666" }}>
          {faits}/{etat.gradins.length} faits · {etat.gradins.filter((g) => g.valide).length} dans les salons
        </small>
      </p>
      {note && (
        <p style={{ background: "#ecfdf5", padding: "8px 12px", borderRadius: 8 }} data-note-gradins>
          {note}
        </p>
      )}
      {etat.gradins.map((g) => (
        <div key={g.id} style={carte} data-gradin={g.id} data-valide={g.valide ? "1" : undefined}>
          <b>
            {g.e} {g.nom}
          </b>{" "}
          <small style={{ color: "#666" }}>· {g.themes.map((t) => themeDe(t)?.nom ?? t).join(", ")}</small>{" "}
          <small style={{ color: g.valide ? "#047857" : "#92400e", fontWeight: 700 }}>· {g.valide ? P.valide : g.image && g.places ? P.aValider : P.aFaire}</small>
          {g.image && (
            <div style={{ position: "relative", width: "100%", maxWidth: 360, aspectRatio: "1", margin: "10px 0", borderRadius: 10, overflow: "hidden", background: "#eee" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.image} alt={g.nom} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              {g.places?.map((p, k) => (
                <span
                  key={k}
                  data-place-gradin={k}
                  style={{
                    position: "absolute",
                    left: `${p.x * 100}%`,
                    top: `${(p.y - p.hauteur) * 100}%`,
                    height: `${p.hauteur * 100}%`,
                    width: `${p.hauteur * 72}%`,
                    transform: "translateX(-50%)",
                    border: "2px dashed rgba(255,255,255,.9)",
                    borderRadius: 12,
                    background: "rgba(255,46,154,.22)",
                    color: "#fff",
                    font: "800 13px system-ui",
                    display: "grid",
                    placeItems: "center",
                    textShadow: "0 1px 3px #000",
                  }}
                >
                  {k + 1}
                </span>
              ))}
            </div>
          )}
          {g.places && (
            <p style={{ margin: "4px 0", color: "#555", fontSize: 13 }}>
              Les huit emplacements : {P.source[g.source ?? "plan"]}
              {g.releveRate ? ` (${g.releveRate})` : ""}. Les numéros : l’ordre où l’on s’assoit (devant, du milieu vers les bords, puis derrière).
            </p>
          )}
          <p style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 0" }}>
            {reste(g) && (
              <button type="button" style={fort} disabled={occupe !== null} data-fabriquer={g.id} onClick={() => void agir(g, { action: "fabriquer" }, "")}>
                {occupe === g.id ? "…" : `${P.fabriquer} ${reste(g) === "decor" ? "le décor" : "le relevé"}`}
              </button>
            )}
            {g.image && g.places && !g.valide && (
              <button type="button" style={fort} disabled={occupe !== null} data-valider={g.id} onClick={() => void agir(g, { action: "valider", oui: true }, `${g.e} ${g.nom} : dans les salons (${g.themes.map((t) => themeDe(t)?.nom ?? t).join(", ")}).`)}>
                {P.valider}
              </button>
            )}
            {g.valide && (
              <button type="button" style={bouton} disabled={occupe !== null} data-retirer={g.id} onClick={() => void agir(g, { action: "valider", oui: false }, `${g.e} ${g.nom} : retiré des salons (ils gardent leur pièce).`)}>
                {P.retirer}
              </button>
            )}
            {g.image && (
              <button type="button" style={bouton} disabled={occupe !== null} data-refaire-decor={g.id} onClick={() => void agir(g, { action: "refaire", quoi: "decor" }, `${g.e} ${g.nom} : le décor est effacé. « Fabriquer » le redessine.`)}>
                {P.refaireDecor}
              </button>
            )}
            {g.places && (
              <button type="button" style={bouton} disabled={occupe !== null} data-refaire-releve={g.id} onClick={() => void agir(g, { action: "refaire", quoi: "releve" }, `${g.e} ${g.nom} : le relevé est effacé. « Fabriquer » le refait.`)}>
                {P.refaireReleve}
              </button>
            )}
            {g.image && g.source !== "plan" && (
              <button type="button" style={bouton} disabled={occupe !== null} data-plan={g.id} onClick={() => void agir(g, { action: "plan" }, `${g.e} ${g.nom} : ses places sont celles du plan.`)}>
                {P.plan}
              </button>
            )}
          </p>
        </div>
      ))}
    </section>
  );
}
