"use client";

// Espace Pro — PROPOSER PLUSIEURS FAÇONS DE PROFITER D'UNE OFFRE.
//
// UNE ANNONCE, JUSQU'À TROIS PORTES. Le commerçant écrit ce qu'il propose, donne
// son prix habituel, puis coche les façons qu'il accepte :
//
//   🎁 LE CADEAU          — prix normal, plus un avantage. Ne lui coûte rien
//                           sur son prix ; c'est la porte d'entrée.
//   ⚡ L'EXPRESS          — prix réduit à qui vient tout de suite. Il rémunère
//                           la vitesse, c'est-à-dire le remplissage d'un creux.
//   👥 TABLE À PARTAGER   — prix le plus bas à qui vient à plusieurs.
//
// CE N'EST PAS UN CHOIX EXCLUSIF, et c'est tout le sujet. Proposée seule, une
// remise se lit comme une promotion de plus. Proposées ensemble, les trois se
// lisent comme un échange : le commerce ne brade pas, il rémunère un
// comportement. C'est la descente des prix qui porte le message, pas chaque
// prix pris isolément.
//
// LE CHIFFRE EST ANNONCÉ AVANT LA SAISIE. Un commerçant qui découvre après coup
// qu'il s'est engagé sur quatre couverts à −30 % ne recommence pas. Le
// récapitulatif s'écrit sous ses yeux pendant qu'il tape.
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
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n.toFixed(2).replace(/[.,]00$/, "").replace(".", ",") : "";
};
const nb = (v: string): number => Number(String(v).replace(",", "."));

const LABEL: Record<string, string> = { cadeau: "Le cadeau", express: "L'express", collectif: "Table à partager" };

export function ProClik({ slug, token, ville }: { slug: string; token: string; ville: string }) {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [charge, setCharge] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [texte, setTexte] = useState("");
  const [heures, setHeures] = useState("24");
  const [prixNormal, setPrixNormal] = useState("");
  // Le cadeau est coché d'avance : c'est la seule façon qui ne coûte rien sur
  // le prix, donc celle qu'un commerçant hésitant peut accepter sans calcul.
  const [cadeau, setCadeau] = useState(true);
  const [cadeauQuantite, setCadeauQuantite] = useState("10");
  const [cadeauLibelle, setCadeauLibelle] = useState("");
  const [cadeauCondition, setCadeauCondition] = useState("");
  const [express, setExpress] = useState(false);
  const [expressPrix, setExpressPrix] = useState("");
  const [expressMinutes, setExpressMinutes] = useState("60");
  const [partage, setPartage] = useState(false);
  const [partagePrix, setPartagePrix] = useState("");
  const [partageObjectif, setPartageObjectif] = useState("4");

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
      texte,
      heures: Number(heures),
      prixNormal,
      cadeau,
      cadeauQuantite,
      cadeauLibelle,
      cadeauCondition,
      express,
      expressPrix,
      expressMinutes: Number(expressMinutes),
      partage,
      partagePrix,
      partageObjectif,
    }).catch(() => ({ error: "Connexion perdue." }) as Record<string, unknown>);
    setBusy(false);
    if (j.error) {
      setErr(String(j.error));
      return;
    }
    setOuvert(false);
    setTexte("");
    setPrixNormal("");
    setCadeauLibelle("");
    setCadeauCondition("");
    setExpressPrix("");
    setPartagePrix("");
    await recharger();
  };

  const arreter = async (id: string) => {
    await call({ action: "arreter", id }).catch(() => ({}));
    await recharger();
  };

  // ── L'APERÇU DE CE QUE VERRA L'HABITANT ───────────────────────────────────
  // Ce n'est pas une décoration : c'est la seule chose qui rend l'engagement
  // concret avant de le prendre. Le commerçant lit la même colonne de prix que
  // ses clients liront dans le fil, avec les mêmes mots.
  const pn = nb(prixNormal);
  const lignes: Array<{ cle: string; prix: number; label: string; sous: string }> = [];
  if (cadeau && Number.isFinite(pn) && pn > 0) {
    lignes.push({
      cle: "cadeau",
      prix: pn,
      label: LABEL.cadeau,
      sous: cadeauLibelle ? `${cadeauLibelle}${cadeauCondition ? ` · ${cadeauCondition}` : ""}` : "Prix normal + cadeau surprise",
    });
  }
  if (express && Number.isFinite(nb(expressPrix))) {
    lignes.push({ cle: "express", prix: nb(expressPrix), label: LABEL.express, sous: `Si le client arrive dans les ${expressMinutes} min` });
  }
  if (partage && Number.isFinite(nb(partagePrix))) {
    lignes.push({ cle: "collectif", prix: nb(partagePrix), label: LABEL.collectif, sous: `À partir de ${partageObjectif} personnes` });
  }

  // L'AVERTISSEMENT QUI COMPTE : une façon moins chère que la suivante casse la
  // descente des prix et rend la carte incompréhensible. On le dit ici plutôt
  // que de laisser la route refuser après coup.
  const desordre = lignes.length > 1 && lignes.some((l, i) => i > 0 && l.prix >= lignes[i - 1].prix);

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
      <div className="a-title">🤝 Faire venir du monde</div>
      <p className="pclik-intro">
        Proposez la même offre de plusieurs façons&nbsp;: au prix normal avec un cadeau,
        moins cher à qui vient tout de suite, moins cher encore à qui vient à plusieurs.
        Les habitants choisissent dans Le Direct de {ville || "votre ville"}.
      </p>

      {charge && vivantes.length > 0 && (
        <div className="pclik-liste">
          {vivantes.map((c) => (
            <div key={c.id} className="pclik-c">
              <div className="pclik-c-h">
                <span className="pclik-c-b">{LABEL[c.type] ?? c.type}</span>
                {c.titre}
              </div>
              <div className="pclik-c-s">
                {c.type === "collectif"
                  ? `${c.participants} sur ${c.objectif} personnes · ${euro(c.prix_groupe)} € au lieu de ${euro(c.prix_initial)} €`
                  : c.type === "express"
                    ? `${euro(c.prix_groupe)} € au lieu de ${euro(c.prix_initial)} €`
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
          ＋ Proposer une offre
        </button>
      ) : (
        <div className="pclik-f">
          <label className="pclik-l" htmlFor="clik-texte">
            Ce que vous proposez
          </label>
          <input
            id="clik-texte"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            maxLength={140}
            placeholder="Ex. Garbure landaise, magret grillé"
          />

          <div className="pclik-duo">
            <label>
              <span>Votre prix habituel</span>
              <input inputMode="decimal" value={prixNormal} onChange={(e) => setPrixNormal(e.target.value)} placeholder="19" />
            </label>
            <label>
              <span>Valable</span>
              <select value={heures} onChange={(e) => setHeures(e.target.value)}>
                <option value="3">3 heures</option>
                <option value="6">6 heures</option>
                <option value="24">aujourd&apos;hui</option>
                <option value="48">2 jours</option>
                <option value="168">1 semaine</option>
              </select>
            </label>
          </div>

          <div className="pclik-sec">Comment peut-on en profiter&nbsp;?</div>

          {/* ── 🎁 LE CADEAU ── */}
          <div className={`pclik-fac${cadeau ? " on" : ""}`}>
            <label className="pclik-tete">
              <input type="checkbox" checked={cadeau} onChange={(e) => setCadeau(e.target.checked)} />
              <span className="pclik-ic">🎁</span>
              <span>
                <b>Le cadeau</b>
                <em>Prix normal, plus un avantage. Ne vous coûte rien sur le prix.</em>
              </span>
            </label>
            {cadeau && (
              <div className="pclik-corps">
                <div className="pclik-duo">
                  <label>
                    <span>Combien</span>
                    <input inputMode="numeric" value={cadeauQuantite} onChange={(e) => setCadeauQuantite(e.target.value)} />
                  </label>
                  <label>
                    <span>Ce qu&apos;ils reçoivent</span>
                    <input value={cadeauLibelle} onChange={(e) => setCadeauLibelle(e.target.value)} maxLength={120} placeholder="Un café offert" />
                  </label>
                </div>
                <label className="pclik-l" htmlFor="clik-cond">
                  À partir de quel achat
                </label>
                <input
                  id="clik-cond"
                  value={cadeauCondition}
                  onChange={(e) => setCadeauCondition(e.target.value)}
                  maxLength={120}
                  placeholder="dès 10 € d'achat"
                />
                {/* Le seul champ dont on explique la raison, parce que c'est le
                    seul qui protège le commerçant de lui-même. */}
                <div className="pclik-pourquoi">
                  Obligatoire&nbsp;: sans condition d&apos;achat, vous donnez à des gens qui
                  n&apos;achètent rien — et vous arrêtez au bout de deux semaines.
                </div>
              </div>
            )}
          </div>

          {/* ── ⚡ L'EXPRESS ── */}
          <div className={`pclik-fac${express ? " on" : ""}`}>
            <label className="pclik-tete">
              <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
              <span className="pclik-ic">⚡</span>
              <span>
                <b>L&apos;express</b>
                <em>Moins cher à qui vient tout de suite. Remplit un creux.</em>
              </span>
            </label>
            {express && (
              <div className="pclik-corps">
                <div className="pclik-duo">
                  <label>
                    <span>Prix express</span>
                    <input inputMode="decimal" value={expressPrix} onChange={(e) => setExpressPrix(e.target.value)} placeholder="17" />
                  </label>
                  <label>
                    <span>Fenêtre</span>
                    <select value={expressMinutes} onChange={(e) => setExpressMinutes(e.target.value)}>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 heure</option>
                      <option value="90">1 h 30</option>
                      <option value="120">2 heures</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ── 👥 TABLE À PARTAGER ── */}
          <div className={`pclik-fac${partage ? " on" : ""}`}>
            <label className="pclik-tete">
              <input type="checkbox" checked={partage} onChange={(e) => setPartage(e.target.checked)} />
              <span className="pclik-ic">👥</span>
              <span>
                <b>Table à partager</b>
                <em>Le prix le plus bas, si plusieurs viennent ensemble.</em>
              </span>
            </label>
            {partage && (
              <div className="pclik-corps">
                <div className="pclik-duo">
                  <label>
                    <span>Prix de groupe</span>
                    <input inputMode="decimal" value={partagePrix} onChange={(e) => setPartagePrix(e.target.value)} placeholder="16" />
                  </label>
                  <label>
                    <span>À partir de</span>
                    <select value={partageObjectif} onChange={(e) => setPartageObjectif(e.target.value)}>
                      {[2, 3, 4, 5, 6, 8, 10, 12].map((v) => (
                        <option key={v} value={v}>
                          {v} personnes
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* L'APERÇU : la même colonne de prix que dans le fil. */}
          {lignes.length > 0 && (
            <div className="pclik-apercu">
              <div className="pclik-apercu-t">Ce que verront les habitants</div>
              {lignes.map((l) => (
                <div key={l.cle} className="pclik-ap">
                  <b>{euro(l.prix)} €</b>
                  <span>
                    <em>{l.label}</em>
                    {l.sous}
                  </span>
                </div>
              ))}
            </div>
          )}

          {desordre && (
            <div className="pclik-alerte">
              Les prix doivent descendre&nbsp;: le cadeau au prix normal, l&apos;express en
              dessous, la table à partager encore en dessous. Sinon la carte ne veut plus
              rien dire.
            </div>
          )}
          {err && <div className="pclik-err">{err}</div>}

          <div className="pclik-nav">
            <button type="button" className="pclik-annul" onClick={() => setOuvert(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="pclik-lance"
              onClick={lancer}
              disabled={busy || !texte.trim() || lignes.length === 0 || desordre}
            >
              {busy ? "Un instant…" : "Publier"}
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
.pclik-c-b{display:inline-block;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;
  color:#5A6560;background:#F5F3EF;border-radius:999px;padding:3px 8px;margin-right:7px;vertical-align:1px;}
.pclik-c-s{font-size:11.5px;color:#5A6560;margin-top:4px;}
.pclik-stop{position:absolute;top:10px;right:10px;background:none;border:1px solid #E6E2DA;border-radius:999px;
  padding:5px 11px;font-size:10.5px;font-weight:700;color:#7A8580;cursor:pointer;font-family:inherit;}
.pclik-go{width:100%;padding:13px;border-radius:24px;border:1px dashed #C9C3B6;background:#FAF8F4;
  font-size:13.5px;font-weight:700;color:#14201A;cursor:pointer;font-family:inherit;}
.pclik-f{border:1px solid #E6E2DA;border-radius:15px;padding:14px;background:#fff;}
.pclik-l{display:block;font-size:11px;font-weight:700;color:#5A6560;margin:12px 0 5px;}
.pclik-f input[type=text],.pclik-f input:not([type]),.pclik-f select,.pclik-f input[inputmode]{
  width:100%;padding:11px 12px;border:1px solid #D8D3C9;border-radius:11px;
  font-size:15px;font-family:inherit;color:#14201A;background:#fff;}
.pclik-duo{display:flex;gap:9px;margin-top:12px;}
.pclik-duo label{flex:1;}
.pclik-duo span{display:block;font-size:11px;font-weight:700;color:#5A6560;margin-bottom:5px;}
.pclik-sec{margin:18px 0 9px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:#5A6560;}

/* Les trois façons : des cases qu'on ouvre, jamais un choix exclusif. Une liste
   déroulante aurait dit « choisissez-en une » — l'inverse du message. */
.pclik-fac{border:1px solid #E6E2DA;border-radius:13px;margin-bottom:9px;overflow:hidden;background:#FCFBF9;}
.pclik-fac.on{border-color:#257A41;background:#fff;}
.pclik-tete{display:flex;align-items:flex-start;gap:10px;padding:12px;cursor:pointer;}
.pclik-tete input{margin-top:2px;width:18px;height:18px;flex:none;accent-color:#257A41;}
.pclik-ic{font-size:18px;line-height:1.1;flex:none;}
.pclik-tete b{display:block;font-size:13px;color:#14201A;}
.pclik-tete em{display:block;font-style:normal;font-size:11px;color:#5A6560;margin-top:3px;line-height:1.4;}
.pclik-corps{padding:0 12px 13px;}
.pclik-pourquoi{font-size:11px;color:#8A5A1A;background:#FBF2DF;border-radius:10px;padding:9px 11px;
  margin-top:8px;line-height:1.5;}

/* L'APERÇU : la même colonne de prix que dans le fil, aux mêmes mots. C'est ce
   qui rend l'engagement concret avant de le prendre. */
.pclik-apercu{margin-top:16px;background:#0E2A1C;border-radius:13px;padding:13px;}
.pclik-apercu-t{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:#8FA79A;margin-bottom:9px;}
.pclik-ap{display:flex;align-items:baseline;gap:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.09);}
.pclik-ap:first-of-type{border-top:none;}
.pclik-ap b{font-family:Georgia,serif;font-size:20px;font-weight:600;color:#fff;flex:none;min-width:72px;}
.pclik-ap span{font-size:11.5px;color:#CFE0D6;line-height:1.4;}
.pclik-ap em{display:block;font-style:normal;font-size:9px;letter-spacing:.11em;text-transform:uppercase;
  font-weight:800;color:#93D02C;margin-bottom:2px;}

.pclik-alerte{margin-top:11px;font-size:11.5px;color:#8A5A1A;background:#FBF2DF;border-radius:10px;
  padding:10px 12px;line-height:1.5;font-weight:600;}
.pclik-err{margin-top:10px;font-size:12px;color:#B2452C;font-weight:700;line-height:1.5;}
.pclik-nav{display:flex;gap:9px;margin-top:14px;}
.pclik-annul{flex:1;padding:12px;border-radius:22px;border:none;background:#F0EEE9;color:#3A453E;
  font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
.pclik-lance{flex:2;padding:12px;border-radius:22px;border:none;background:#257A41;color:#fff;
  font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;}
.pclik-lance:disabled{background:#D8D3C9;color:#7A8580;cursor:default;}
`;
