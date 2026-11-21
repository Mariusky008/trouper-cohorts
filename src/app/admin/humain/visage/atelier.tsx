"use client";

/**
 * 📷 L'ATELIER DE L'ESSAI DU VISAGE (`lib/direct/visage-essai-serveur.ts` ; `docs/univers/decouvrir.md`, section 28) :
 * ajouter une personne (un prénom, une photo de face, son accord, « c'est moi »), puis « Fabriquer » — sa figurine, sa
 * découpe, ses cinq expressions, une étape par passage (« 🛠️ Tout fabriquer » les enchaîne pour tout le monde) ; ses
 * expressions posées sur sa figurine, pour juger d'un coup d'œil ; « ▶ Ouvrir le salon d'essai ».
 */
import { useCallback, useEffect, useState } from "react";
import { ETAPES_ESSAI, EXPRESSIONS_VISAGE, PERSONNES_ESSAI_MAX, PHRASES_VISAGE as P, type EtapeEssai, type EtatEssaiVisage, type PersonneEssaiVue } from "@/lib/direct/visage-essai";

const ROUTE = "/api/admin/direct/visage-essai";
const carte = { border: "1px solid #e4e4e7", borderRadius: 12, padding: "12px 14px", margin: "10px 0", background: "#fff" } as const;
const bouton = { border: "1px solid #d4d4d8", borderRadius: 8, padding: "5px 10px", background: "#fafafa", cursor: "pointer", fontSize: 13 } as const;
const fort = { ...bouton, background: "#111", color: "#fff", borderColor: "#111" } as const;
const NOMS: Record<EtapeEssai, string> = { figurine: "sa figurine", calques: "sa découpe", sourire: "😊", rire: "😂", surprise: "😮", bof: "😑", grimace: "😝" };
const reste = (p: PersonneEssaiVue) => ETAPES_ESSAI.find((e) => !p.faites.includes(e)) ?? null;

/** La photo, réduite sur le téléphone (1024 points au plus, en JPEG) : une adresse `data:`. */
async function reduire(f: File): Promise<string> {
  const url = URL.createObjectURL(f);
  try {
    const img = new Image();
    await new Promise((ok, ko) => {
      img.onload = ok;
      img.onerror = ko;
      img.src = url;
    });
    const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AtelierVisage() {
  const [etat, setEtat] = useState<EtatEssaiVisage | null>(null);
  const [erreur, setErreur] = useState("");
  const [note, setNote] = useState("");
  const [occupe, setOccupe] = useState<string | null>(null);
  const [prenom, setPrenom] = useState("");
  const [photo, setPhoto] = useState("");
  const [accord, setAccord] = useState(false);
  const [moi, setMoi] = useState(false);
  const [aEffacer, setAEffacer] = useState<string | null>(null);
  const [manque, setManque] = useState("");

  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { etat?: EtatEssaiVisage; error?: string };
    if (!r?.ok || !j.etat) return setErreur(j?.error || "La page ne répond pas.");
    setEtat(j.etat);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  const appeler = async (corps: Record<string, unknown>) => {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { etat?: EtatEssaiVisage; fait?: EtapeEssai; error?: string };
    if (j.etat) setEtat(j.etat);
    return { ok: Boolean(r?.ok), fait: j.fait, error: j.error || (r ? undefined : "La page ne répond pas."), etat: j.etat };
  };
  // (la photo choisie, ou glissée sur la zone : réduite sur le téléphone, puis montrée en vignette)
  const choisir = (f: File | undefined) => {
    if (!f) return;
    setManque("");
    void reduire(f).then(setPhoto, () => setManque("Cette photo ne se lit pas ici (une photo HEIC de l’iPhone ?) : essaie une photo en JPEG ou en PNG."));
  };
  const ajouter = async (e: React.FormEvent) => {
    e.preventDefault();
    // (ce qui manque est dit, au lieu d'un bouton qui ne répond pas)
    const m = !prenom.trim() ? "Écris son prénom." : !photo ? "Choisis d’abord sa photo (📷 juste au-dessus)." : !accord ? "Coche son accord." : "";
    setManque(m);
    if (m) return;
    setOccupe("ajouter");
    const r = await appeler({ action: "ajouter", prenom, photo, accord, moi });
    setOccupe(null);
    if (!r.ok) return setNote(r.error || "Ça n’a pas marché.");
    setNote(`« ${prenom.trim()} » est dans l’essai. « Fabriquer » fait sa figurine (une minute environ).`);
    setPrenom("");
    setPhoto("");
    setAccord(false);
    setMoi(false);
  };
  const agir = async (p: PersonneEssaiVue, corps: Record<string, unknown>, fait: string) => {
    setOccupe(p.id);
    if (corps.action === "fabriquer") setNote(`${p.prenom} : ${NOMS[reste(p) ?? "figurine"]}…`);
    const r = await appeler({ ...corps, id: p.id });
    setOccupe(null);
    setNote(r.ok ? (r.fait ? `${p.prenom} : ${NOMS[r.fait]} ✓` : fait) : r.error || "Ça n’a pas marché.");
  };
  // (🛠️ tout le monde : un passage après l'autre, tant qu'il reste quelque chose à faire ; on s'arrête à la première erreur)
  const tout = async () => {
    if (!etat) return;
    setOccupe("tout");
    let l = etat.personnes;
    for (let n = 0; n < l.length * ETAPES_ESSAI.length + 2; n++) {
      const p = l.find((x) => reste(x));
      if (!p) break;
      setNote(`${p.prenom} : ${NOMS[reste(p)!]}…`);
      const r = await appeler({ action: "fabriquer", id: p.id });
      if (r.etat) l = r.etat.personnes;
      if (!r.ok) {
        setOccupe(null);
        return setNote(`${p.prenom} : ${r.error || "ça n’a pas marché"}.`);
      }
    }
    setOccupe(null);
    setNote("Tout est fabriqué : ouvre le salon d’essai sur ton téléphone.");
  };

  if (erreur) return <p style={{ color: "#b91c1c" }}>{erreur}</p>;
  if (!etat) return <p>…</p>;
  const aFaire = etat.personnes.reduce((n, p) => n + ETAPES_ESSAI.length - p.faites.length, 0);
  return (
    <div data-atelier-visage>
      <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>{P.titre}</h1>
      <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>{P.chapo}</p>
      {!etat.moteurs.image && <p style={{ color: "#b45309" }}>Le moteur d’image n’est pas branché ici : la fabrication se fait sur le site en ligne.</p>}
      <p style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <a href="/univers/visage" style={{ ...fort, textDecoration: "none" }} data-salon-essai>
          {P.salon}
        </a>
        <button type="button" style={bouton} disabled={occupe !== null || !aFaire} onClick={() => void tout()} data-tout>
          🛠️ Tout fabriquer ({aFaire} étape{aFaire > 1 ? "s" : ""} à faire)
        </button>
      </p>
      {note && (
        <p style={{ background: "#ecfdf5", padding: "8px 12px", borderRadius: 8 }} data-note-visage>
          {note}
        </p>
      )}

      {etat.personnes.length < PERSONNES_ESSAI_MAX && (
        <form style={carte} onSubmit={(e) => void ajouter(e)} data-ajouter-personne>
          <b>Ajouter une personne</b> <small style={{ color: "#666" }}>({etat.personnes.length}/{PERSONNES_ESSAI_MAX})</small>
          <p style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "8px 0" }}>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" maxLength={20} style={{ ...bouton, cursor: "text", background: "#fff", fontSize: 15, padding: "8px 12px" }} data-prenom />
          </p>
          {/* (la photo : une zone bien visible — on la touche pour choisir, ou on y glisse la photo depuis l'ordinateur) */}
          <label
            data-zone-photo
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              choisir(e.dataTransfer.files?.[0]);
            }}
            style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0", padding: 12, border: "2px dashed #a1a1aa", borderRadius: 12, background: photo ? "#f0fdf4" : "#fafafa", cursor: "pointer" }}
          >
            <input type="file" accept="image/*" data-photo style={{ display: "none" }} onChange={(e) => choisir(e.target.files?.[0])} />
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10 }} data-vignette-photo />
            ) : (
              <span style={{ fontSize: 30 }} aria-hidden="true">
                📷
              </span>
            )}
            <span>
              <b style={{ display: "block", fontSize: 15 }}>{photo ? "✓ Sa photo est choisie" : "Choisir sa photo"}</b>
              <small style={{ color: "#666" }}>{photo ? "Toucher pour en changer" : "De face, bien éclairée — ou glisse-la ici"}</small>
            </span>
          </label>
          <label style={{ display: "block", fontSize: 14, margin: "4px 0" }}>
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} data-accord /> {P.accord}
          </label>
          <label style={{ display: "block", fontSize: 14, margin: "4px 0" }}>
            <input type="checkbox" checked={moi} onChange={(e) => setMoi(e.target.checked)} data-moi /> {P.moi}
          </label>
          {manque && (
            <p style={{ color: "#b91c1c", margin: "6px 0" }} data-manque>
              {manque}
            </p>
          )}
          <button type="submit" style={{ ...fort, fontSize: 15, padding: "8px 16px" }} disabled={occupe !== null}>
            {occupe === "ajouter" ? "…" : P.ajouter}
          </button>
        </form>
      )}

      {etat.personnes.map((p) => (
        <div key={p.id} style={carte} data-personne={p.id} data-faites={p.faites.length}>
          <b>{p.prenom}</b> {p.moi && <small style={{ color: "#be185d", fontWeight: 700 }}>· c’est moi</small>}{" "}
          <small style={{ color: "#666" }}>
            · {p.faites.length}/{ETAPES_ESSAI.length} étapes{p.photo ? " · photo encore là" : ""}
          </small>
          {p.erreur && <p style={{ color: "#b91c1c", margin: "6px 0" }}>{p.erreur}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
            {p.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.figurine} alt={p.prenom} style={{ height: 150, borderRadius: 8, background: "#f4f4f5" }} />
            )}
            {p.tete && (
              <figure style={{ margin: 0, textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.tete} alt="" style={{ height: 72, background: "#f4f4f5", borderRadius: 8 }} />
                <figcaption style={{ fontSize: 12 }}>🙂</figcaption>
              </figure>
            )}
            {EXPRESSIONS_VISAGE.map((e) =>
              p.expressions[e.cle] ? (
                <figure key={e.cle} style={{ margin: 0, textAlign: "center" }} data-expression={e.cle}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.expressions[e.cle]} alt={e.nom} style={{ height: 72, background: "#f4f4f5", borderRadius: 8 }} />
                  <figcaption style={{ fontSize: 12 }}>{e.e}</figcaption>
                </figure>
              ) : null,
            )}
          </div>
          <p style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: 0 }}>
            {reste(p) && (
              <button type="button" style={fort} disabled={occupe !== null} data-fabriquer={p.id} onClick={() => void agir(p, { action: "fabriquer" }, "")}>
                {occupe === p.id ? "…" : `🛠️ Fabriquer ${NOMS[reste(p)!]}`}
              </button>
            )}
            {!p.moi && (
              <button type="button" style={bouton} disabled={occupe !== null} data-c-est-moi={p.id} onClick={() => void agir(p, { action: "moi" }, `${p.prenom} : sa figurine fera ta tête.`)}>
                🙋 C’est moi
              </button>
            )}
            {p.faites.some((e) => EXPRESSIONS_VISAGE.some((x) => x.cle === e)) && (
              <button type="button" style={bouton} disabled={occupe !== null} data-refaire-expressions={p.id} onClick={() => void agir(p, { action: "refaire", quoi: "expressions" }, `${p.prenom} : ses expressions sont effacées. « Fabriquer » les refait.`)}>
                ↺ Refaire les expressions
              </button>
            )}
            <button
              type="button"
              style={bouton}
              disabled={occupe !== null}
              data-effacer={p.id}
              onClick={() => {
                if (aEffacer !== p.id) return setAEffacer(p.id);
                setAEffacer(null);
                void agir(p, { action: "effacer" }, `${p.prenom} : tout est effacé.`);
              }}
            >
              {aEffacer === p.id ? "🗑️ Oui, tout effacer" : "🗑️ Effacer"}
            </button>
          </p>
        </div>
      ))}
    </div>
  );
}
