"use client";

// Espace Pro — LANCER UN CLIK.
//
// DEUX MÉCANIQUES, ET IL FAUT CHOISIR AVANT DE REMPLIR QUOI QUE CE SOIT. Le
// commerçant ne connaît pas notre vocabulaire : on lui présente donc deux
// situations, pas deux types techniques.
//
//   « À plusieurs, le prix baisse » — il fixe un nombre et deux prix.
//   « Pour les premiers »           — il met de côté un nombre d'avantages.
//
// LE CHIFFRE EST ANNONCÉ AVANT LA SAISIE. Un commerçant qui découvre après coup
// qu'il s'est engagé sur six couverts à −30 % ne recommencera pas. La phrase de
// contrôle (« six personnes à 16,80 € au lieu de 24 € ») s'écrit sous ses yeux
// pendant qu'il tape, et c'est elle qu'il relit avant de lancer.
//
// LA CONDITION D'ACHAT EST OBLIGATOIRE, et c'est le seul champ dont on explique
// la raison : sans elle, il distribue à des gens qui n'achètent rien.
import { useEffect, useState } from "react";

type Campagne = {
  id: string;
  type: string;
  titre: string;
  objectif: number | null;
  participants: number;
  prix_initial: string | number | null;
  prix_groupe: string | number | null;
  echeance: string;
  statut: string;
  restants?: number;
  total?: number;
};

const euro = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : "";
};

export function ProClik({ slug, token, ville }: { slug: string; token: string; ville: string }) {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [charge, setCharge] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<"collectif" | "cadeau">("collectif");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [texte, setTexte] = useState("");
  const [jours, setJours] = useState("7");
  // Collectif
  const [objectif, setObjectif] = useState("6");
  const [prixInitial, setPrixInitial] = useState("");
  const [prixGroupe, setPrixGroupe] = useState("");
  // Cadeau
  const [quantite, setQuantite] = useState("10");
  const [libelle, setLibelle] = useState("");
  const [conditionAchat, setConditionAchat] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/clik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return (await r.json().catch(() => ({}))) as Record<string, unknown>;
  };

  useEffect(() => {
    let mort = false;
    (async () => {
      const j = await call({ action: "get" }).catch(() => ({}) as Record<string, unknown>);
      if (mort) return;
      if (Array.isArray(j.campagnes)) setCampagnes(j.campagnes as Campagne[]);
      setCharge(true);
    })();
    return () => {
      mort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  const recharger = async () => {
    const j = await call({ action: "get" }).catch(() => ({}) as Record<string, unknown>);
    if (Array.isArray(j.campagnes)) setCampagnes(j.campagnes as Campagne[]);
  };

  const lancer = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    const j = await call({
      action: "creer",
      type,
      texte,
      jours: Number(jours),
      objectif: Number(objectif),
      prixInitial,
      prixGroupe,
      quantite: Number(quantite),
      libelle,
      conditionAchat,
    }).catch(() => ({ error: "Connexion perdue." }) as Record<string, unknown>);
    setBusy(false);
    if (j.error) {
      setErr(String(j.error));
      return;
    }
    setOuvert(false);
    setTexte("");
    setPrixInitial("");
    setPrixGroupe("");
    setLibelle("");
    setConditionAchat("");
    await recharger();
  };

  const arreter = async (id: string) => {
    await call({ action: "arreter", id }).catch(() => ({}));
    await recharger();
  };

  // LA PHRASE DE CONTRÔLE. Elle n'est pas décorative : c'est le seul endroit où
  // le commerçant voit son engagement en toutes lettres avant de le prendre.
  const pi = Number(String(prixInitial).replace(",", "."));
  const pg = Number(String(prixGroupe).replace(",", "."));
  const remise = Number.isFinite(pi) && Number.isFinite(pg) && pi > 0 && pg < pi
    ? Math.round(((pi - pg) / pi) * 100)
    : null;
  const recap =
    type === "collectif"
      ? remise != null
        ? `Si ${objectif} personnes s'engagent, chacune paie ${euro(pg)} € au lieu de ${euro(pi)} € — soit ${remise} % de remise, pour ${objectif} clients qui viennent chez vous.`
        : ""
      : libelle && conditionAchat
        // La condition est reprise TELLE QUELLE : le commerçant écrit « dès
        // 10 € d'achat », et une amorce « à partir de » produisait « à partir
        // de dès 10 € d'achat ». C'est sa phrase, on ne la préfixe pas.
        ? `Les ${quantite} premiers reçoivent « ${libelle} », ${conditionAchat}. Au-delà, il n'y a plus rien à donner.`
        : "";

  const vivantes = campagnes.filter((c) => ["active", "debloquee"].includes(c.statut));

  return (
    <div className="pclik">
      {/* LES STYLES VOYAGENT AVEC LE COMPOSANT, ils ne sont pas importés par la
          page. `page.tsx` est un composant SERVEUR et ce fichier est marqué
          « use client » : une constante exportée par-dessus cette frontière
          n'arrive pas comme une chaîne mais comme une référence client. Next
          l'avait remplacée par son message d'erreur, injecté tel quel dans la
          balise `<style>` — le formulaire s'affichait sans aucun style, et
          rien dans les journaux ne le signalait. */}
      <style dangerouslySetInnerHTML={{ __html: STYLES_PRO_CLIK }} />
      <div className="a-title">🤝 Faire venir un groupe</div>
      <p className="pclik-intro">
        Une offre qui ne se déclenche qu&apos;à plusieurs, ou un avantage réservé aux
        premiers. Dans les deux cas, elle paraît dans Le Direct de {ville || "votre ville"} et
        les habitants s&apos;y engagent depuis leur téléphone.
      </p>

      {charge && vivantes.length > 0 && (
        <div className="pclik-liste">
          {vivantes.map((c) => (
            <div key={c.id} className="pclik-c">
              <div className="pclik-c-h">{c.titre}</div>
              <div className="pclik-c-s">
                {c.type === "collectif"
                  ? `${c.participants} sur ${c.objectif} personnes · ${euro(c.prix_groupe)} € au lieu de ${euro(c.prix_initial)} €`
                  : `${c.restants ?? 0} sur ${c.total ?? 0} encore disponibles`}
              </div>
              <button type="button" className="pclik-stop" onClick={() => arreter(c.id)}>
                Arrêter
              </button>
            </div>
          ))}
        </div>
      )}

      {!ouvert ? (
        <button type="button" className="pclik-go" onClick={() => setOuvert(true)}>
          ＋ Lancer une offre de groupe
        </button>
      ) : (
        <div className="pclik-f">
          {/* Deux situations, pas deux types techniques. */}
          <div className="pclik-choix">
            <button
              type="button"
              className={type === "collectif" ? "on" : ""}
              onClick={() => setType("collectif")}
            >
              <b>À plusieurs, le prix baisse</b>
              <span>Vous fixez un nombre et deux prix</span>
            </button>
            <button type="button" className={type === "cadeau" ? "on" : ""} onClick={() => setType("cadeau")}>
              <b>Pour les premiers</b>
              <span>Vous mettez de côté un nombre d&apos;avantages</span>
            </button>
          </div>

          <label className="pclik-l" htmlFor="clik-texte">
            Ce que vous proposez
          </label>
          <input
            id="clik-texte"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            maxLength={140}
            placeholder={
              type === "collectif"
                ? "Ex. Le menu du soir à plusieurs"
                : "Ex. Une part de gâteau offerte aux dix premiers"
            }
          />

          {type === "collectif" ? (
            <>
              <div className="pclik-duo">
                <label>
                  <span>Prix habituel</span>
                  <input inputMode="decimal" value={prixInitial} onChange={(e) => setPrixInitial(e.target.value)} placeholder="24" />
                </label>
                <label>
                  <span>Prix de groupe</span>
                  <input inputMode="decimal" value={prixGroupe} onChange={(e) => setPrixGroupe(e.target.value)} placeholder="16,80" />
                </label>
              </div>
              <label className="pclik-l" htmlFor="clik-obj">
                À partir de combien de personnes
              </label>
              <select id="clik-obj" value={objectif} onChange={(e) => setObjectif(e.target.value)}>
                {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((v) => (
                  <option key={v} value={v}>
                    {v} personnes
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <div className="pclik-duo">
                <label>
                  <span>Combien</span>
                  <input inputMode="numeric" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="10" />
                </label>
                <label>
                  <span>Ce qu&apos;ils reçoivent</span>
                  <input value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={120} placeholder="Une part de gâteau basque" />
                </label>
              </div>
              <label className="pclik-l" htmlFor="clik-cond">
                À partir de quel achat
              </label>
              <input
                id="clik-cond"
                value={conditionAchat}
                onChange={(e) => setConditionAchat(e.target.value)}
                maxLength={120}
                placeholder="dès 10 € d'achat"
              />
              {/* Le seul champ dont on explique la raison, parce que c'est le
                  seul qui protège le commerçant de lui-même. */}
              <div className="pclik-pourquoi">
                Obligatoire&nbsp;: sans condition d&apos;achat, vous donnez à des gens qui
                n&apos;achètent rien — et vous arrêtez au bout de deux semaines.
              </div>
            </>
          )}

          <label className="pclik-l" htmlFor="clik-j">
            Jusqu&apos;à quand
          </label>
          <select id="clik-j" value={jours} onChange={(e) => setJours(e.target.value)}>
            <option value="1">demain</option>
            <option value="3">dans 3 jours</option>
            <option value="7">dans 1 semaine</option>
            <option value="14">dans 2 semaines</option>
            <option value="30">dans 1 mois</option>
          </select>

          {recap && <div className="pclik-recap">{recap}</div>}
          {err && <div className="pclik-err">{err}</div>}

          <div className="pclik-nav">
            <button type="button" className="pclik-annul" onClick={() => setOuvert(false)}>
              Annuler
            </button>
            <button type="button" className="pclik-lance" onClick={lancer} disabled={busy || !texte.trim()}>
              {busy ? "Un instant…" : "Lancer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const STYLES_PRO_CLIK = `
.pclik{margin-top:26px;}
.pclik-intro{font-size:13px;color:#5A6560;line-height:1.6;margin:6px 0 14px;}
.pclik-liste{display:flex;flex-direction:column;gap:9px;margin-bottom:13px;}
.pclik-c{border:1px solid #E6E2DA;border-radius:13px;padding:12px;background:#fff;position:relative;}
.pclik-c-h{font-size:13.5px;font-weight:700;color:#14201A;padding-right:70px;}
.pclik-c-s{font-size:11.5px;color:#5A6560;margin-top:4px;}
.pclik-stop{position:absolute;top:10px;right:10px;background:none;border:1px solid #E6E2DA;border-radius:999px;
  padding:5px 11px;font-size:10.5px;font-weight:700;color:#7A8580;cursor:pointer;font-family:inherit;}
.pclik-go{width:100%;padding:13px;border-radius:24px;border:1px dashed #C9C3B6;background:#FAF8F4;
  font-size:13.5px;font-weight:700;color:#14201A;cursor:pointer;font-family:inherit;}
.pclik-f{border:1px solid #E6E2DA;border-radius:15px;padding:14px;background:#fff;}
/* Les deux situations : des cases pleines, pas une liste déroulante. C'est le
   choix qui structure tout le reste du formulaire, il doit se voir. */
.pclik-choix{display:flex;gap:8px;margin-bottom:14px;}
.pclik-choix button{flex:1;text-align:left;padding:11px;border-radius:12px;border:1px solid #E6E2DA;
  background:#fff;cursor:pointer;font-family:inherit;}
.pclik-choix button.on{border-color:#257A41;background:#E9F6D6;}
.pclik-choix b{display:block;font-size:12.5px;color:#14201A;line-height:1.25;}
.pclik-choix span{display:block;font-size:10.5px;color:#5A6560;margin-top:4px;line-height:1.35;}
.pclik-l{display:block;font-size:11px;font-weight:700;color:#5A6560;margin:12px 0 5px;}
.pclik-f input,.pclik-f select{width:100%;padding:11px 12px;border:1px solid #D8D3C9;border-radius:11px;
  font-size:15px;font-family:inherit;color:#14201A;background:#fff;}
.pclik-duo{display:flex;gap:9px;margin-top:12px;}
.pclik-duo label{flex:1;}
.pclik-duo span{display:block;font-size:11px;font-weight:700;color:#5A6560;margin-bottom:5px;}
.pclik-pourquoi{font-size:11px;color:#8A5A1A;background:#FBF2DF;border-radius:10px;padding:9px 11px;
  margin-top:8px;line-height:1.5;}
/* LA PHRASE DE CONTRÔLE, en évidence : c'est l'engagement en toutes lettres. */
.pclik-recap{margin-top:14px;background:#0E2A1C;color:#fff;border-radius:12px;padding:12px 13px;
  font-size:13px;line-height:1.5;font-weight:600;}
.pclik-err{margin-top:10px;font-size:12px;color:#B2452C;font-weight:700;line-height:1.5;}
.pclik-nav{display:flex;gap:9px;margin-top:14px;}
.pclik-annul{flex:1;padding:12px;border-radius:22px;border:none;background:#F0EEE9;color:#3A453E;
  font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
.pclik-lance{flex:2;padding:12px;border-radius:22px;border:none;background:#257A41;color:#fff;
  font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;}
.pclik-lance:disabled{background:#D8D3C9;color:#7A8580;cursor:default;}
`;
