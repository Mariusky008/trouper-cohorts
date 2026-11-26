"use client";

/**
 * 👥 L'ESPACE D'UN GROUPE, ET « UN GROUPE AVEC MES PROCHES » (Mes groupes, le lot G4, 26 novembre 2026 ; la maquette G0
 * validée, planche « Groupe »).
 *
 * L'espace : son identité (sa passion, son nom, son mot), son salon attitré — toujours ouvert, même vide (qui y est, ou
 * qui y est passé) — puis ses onglets : 🎬 Aujourd'hui (lot G6, `groupe-jour.tsx`), 📅 Rendez-vous et 💬 Discussion
 * (lot G5, `groupe-vie.tsx`), 📖 Journal (lot G7, `groupe-journal.tsx`), 👥 Membres. Jamais un onglet vide.
 *
 * Créer : un nom, une passion, des proches, un mot. Le groupe existe tout de suite pour moi ; mes proches le voient dans
 * Mes groupes, et le gardent s'ils veulent.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { THEMES_DECOUVRIR, type IdTheme } from "@/lib/direct/decouvrir";
import { OngletAujourdhui, STYLES_AUJOURDHUI } from "./groupe-jour";
import { OngletJournal, STYLES_JOURNAL } from "./groupe-journal";
import type { TeleDuJour } from "@/lib/direct/tele-du-jour";
import { NouveauRdv, OngletDiscussion, OngletMembres, OngletRendezVous, STYLES_VIE_DU_GROUPE, useVieDuGroupe } from "./groupe-vie";
import { MOT_GROUPE_MAX, NOM_GROUPE_MAX, PHRASES_GROUPES_GARDES as PG, PHRASES_PROPOSITIONS as P, PHRASES_VIE_DU_GROUPE as PV, PHRASES_AUJOURDHUI as PJ, PHRASES_JOURNAL as PJO, heureLisible, type GroupeVue, type PlaceGroupe } from "@/lib/direct/groupes";

export const salonDuGroupe = (id: string) => `/univers/salons?groupe=${encodeURIComponent(id)}`;

/** Une figurine en petit (sa tête si `tete`). */
export function Figurine({ p, tete }: { p: PlaceGroupe; tete?: boolean }) {
  return (
    <span className={tete ? "ge-tete" : "ge-fig"} title={p.prenom}>
      {p.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.src} alt={p.prenom} draggable={false} />
      ) : (
        <span aria-hidden="true">🙂</span>
      )}
    </span>
  );
}

/** 🛋️ L'espace d'un groupe, en plein écran. */
export function EspaceGroupe({ g, tele, onFermer }: { g: GroupeVue; tele: TeleDuJour | null; onFermer: () => void }) {
  const t = THEMES_DECOUVRIR.find((x) => x.id === g.theme);
  const { vie, setVie, aujourdhui, setAujourdhui } = useVieDuGroupe(g.id);
  const [onglet, setOnglet] = useState<"jour" | "rdv" | "discussion" | "journal" | "membres">("jour");
  const [feuille, setFeuille] = useState<"rdv" | "idee" | null>(null);
  const [dit, setDit] = useState("");
  const minuterie = useRef(0);
  const dire = (x: string) => {
    setDit(x);
    window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => setDit(""), 3200);
  };
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="ge" role="dialog" aria-label={g.nom} data-espace-groupe={g.id}>
      <div className="ge-corps">
        <div className="ge-identite">
          <div className="ge-barre">
            <button type="button" className="ge-retour" onClick={onFermer} aria-label={PG.retour} data-fermer-groupe>
              ‹
            </button>
            <span className="ge-compte" data-membres-compte>
              {PG.membres(g.membres.length)}
            </span>
          </div>
          <div className="ge-nom">
            <span className="ge-e" aria-hidden="true">
              {g.e}
            </span>
            <div>
              <h1>{g.nom}</h1>
              {g.mot && <p className="ge-mot">« {g.mot} »</p>}
            </div>
          </div>
          {t && (
            <div className="ge-themes">
              <span className="ge-theme">
                {t.e} {t.court}
              </span>
            </div>
          )}
        </div>

        {/* 🛋️ son salon attitré : toujours là */}
        <div className="ge-salon" data-salon-groupe>
          <span className="ge-ecran" aria-hidden="true">
            <i>▶</i>
          </span>
          <span className="ge-assis">
            {g.ici.map((p) => (
              <Figurine key={p.q} p={p} />
            ))}
          </span>
          {!g.ici.length && (
            <p className="ge-passage" data-passage>
              {g.passage ? PG.passe(g.passage.prenom, heureLisible(g.passage.le)) : PG.salonVide}
            </p>
          )}
          {g.ici.length > 0 && <p className="ge-passage ici">{PG.enLigne(g.ici.length)}</p>}
          <a className="ge-entrer" href={salonDuGroupe(g.id)} data-entrer-groupe>
            {PG.entrer}
          </a>
        </div>

        {/* 📅💬👥 (lot G5) les onglets : jamais un onglet vide */}
        <div className="gv-onglets" role="tablist">
          {(["jour", "rdv", "discussion", "journal", "membres"] as const).map((x) => (
            <button key={x} type="button" role="tab" className={`gv-onglet${onglet === x ? " pris" : ""}`} aria-selected={onglet === x} onClick={() => setOnglet(x)} data-onglet={x}>
              {x === "jour" ? PJ.onglet : x === "rdv" ? PV.ongletRdv : x === "discussion" ? PV.ongletDiscussion : x === "journal" ? PJO.onglet : PV.ongletMembres}
            </button>
          ))}
        </div>
        {onglet === "jour" ? (
          aujourdhui && (
            <OngletAujourdhui
              gid={g.id}
              etiquette={PJ.etiquette(t?.e ?? g.e, t?.court ?? "")}
              a={aujourdhui}
              setA={setAujourdhui}
              tele={tele}
              onDit={dire}
              onSujet={() => setOnglet("discussion")}
              onProchaine={() => {
                setOnglet("rdv");
                setFeuille("rdv");
              }}
            />
          )
        ) : onglet === "journal" ? (
          <OngletJournal gid={g.id} />
        ) : onglet === "membres" || !vie ? (
          onglet === "membres" && <OngletMembres membres={g.membres} />
        ) : onglet === "rdv" ? (
          <OngletRendezVous gid={g.id} vie={vie} setVie={setVie} salon={salonDuGroupe(g.id)} onNouveau={() => setFeuille("rdv")} onDit={dire} />
        ) : (
          <OngletDiscussion gid={g.id} vie={vie} setVie={setVie} onIdee={() => setFeuille("idee")} onDit={dire} />
        )}
      </div>
      {feuille && (
        <NouveauRdv
          gid={g.id}
          idee={feuille === "idee"}
          onFermer={() => setFeuille(null)}
          onAjoute={(r, m) => {
            setFeuille(null);
            setVie((v) => (v ? { rdv: r ? [...v.rdv.filter((x) => x.id !== r.id), r].sort((a, b) => a.quand - b.quand) : v.rdv, messages: m ? [...v.messages, m] : v.messages } : v));
            dire(feuille === "idee" ? PV.ideeEnvoyee : PV.nouveauDit);
          }}
        />
      )}
      {dit && (
        <p className="gv-dit" role="status" data-dit>
          {dit}
        </p>
      )}
      <style>{STYLES_ESPACE + STYLES_VIE_DU_GROUPE + STYLES_AUJOURDHUI + STYLES_JOURNAL}</style>
    </div>,
    document.body,
  );
}

type Proche = { cle: string; prenom: string; image?: string; lien?: string };

/** 👥 Un groupe avec mes proches, tout de suite. */
export function CreerGroupe({ adulte, passions, onFermer, onCree }: { adulte: boolean; passions: string[]; onFermer: () => void; onCree: (g: GroupeVue) => void }) {
  const themes = useMemo(() => {
    const l = THEMES_DECOUVRIR.filter((t) => adulte || !t.adultes);
    return [...l.filter((t) => passions.includes(t.id)), ...l.filter((t) => !passions.includes(t.id))];
  }, [adulte, passions]);
  const [nom, setNom] = useState("");
  const [theme, setTheme] = useState<IdTheme>(themes[0]?.id ?? "series");
  const [mot, setMot] = useState("");
  const [proches, setProches] = useState<Proche[] | null>(null);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/proches", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { proches?: Proche[] }) => !fini && setProches((j.proches ?? []).filter((p) => p.lien === "proches")))
      .catch(() => !fini && setProches([]));
    return () => {
      fini = true;
    };
  }, []);
  const t = THEMES_DECOUVRIR.find((x) => x.id === theme);
  const nomVu = nom.trim() || (t ? `${t.court[0].toUpperCase()}${t.court.slice(1)} ensemble` : "");

  async function creer() {
    if (envoi) return;
    setEnvoi(true);
    setErreur("");
    const r = await fetch("/api/direct/mes-groupes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "creer-groupe", nom: nomVu, theme, mot: mot.trim(), cles: choisis }) }).catch(() => null);
    const j = ((await r?.json().catch(() => null)) ?? {}) as { groupe?: GroupeVue; error?: string };
    setEnvoi(false);
    if (!r?.ok || !j.groupe) return setErreur(j.error || "Pas de réseau : réessaie dans un instant.");
    onCree(j.groupe);
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="ge" role="dialog" aria-label={PG.creerTitre} data-creer-groupe>
      <div className="ge-haut">
        <strong>{PG.creerTitre}</strong>
        <button type="button" className="ge-retour petit" onClick={onFermer} aria-label="Fermer">
          ✕
        </button>
      </div>
      <div className="ge-corps ge-form">
        <label className="ge-champ">
          <span>{P.sonNom}</span>
          <input type="text" maxLength={NOM_GROUPE_MAX} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={nomVu} data-nom-groupe />
        </label>
        <div>
          <p className="ge-etiquette">{P.passion}</p>
          <div className="ge-rang">
            {themes.map((x) => (
              <button key={x.id} type="button" className={`ge-puce${theme === x.id ? " pris" : ""}`} aria-pressed={theme === x.id} onClick={() => setTheme(x.id)} data-theme={x.id}>
                {x.e} {x.court}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="ge-etiquette">{PG.creerChoisir}</p>
          {proches && !proches.length ? (
            <p className="ge-aucun">{PG.creerAucun}</p>
          ) : (
            <div className="ge-rang">
              {(proches ?? []).map((p) => {
                const pris = choisis.includes(p.cle);
                return (
                  <button key={p.cle} type="button" className={`ge-proche${pris ? " pris" : ""}`} aria-pressed={pris} onClick={() => setChoisis((l) => (pris ? l.filter((x) => x !== p.cle) : [...l, p.cle]))} data-proche={p.cle}>
                    <span className="ge-tete">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt="" draggable={false} /> : <span aria-hidden="true">🙂</span>}
                      {pris && <i className="ge-coche">✓</i>}
                    </span>
                    <b>{p.prenom}</b>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <label className="ge-champ">
          <span>{P.mot}</span>
          <input type="text" maxLength={MOT_GROUPE_MAX} value={mot} onChange={(e) => setMot(e.target.value)} placeholder={P.motIndice} data-mot-groupe />
        </label>
        {erreur && (
          <p className="ge-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
      <div className="ge-bas">
        <button type="button" className="ge-publier" onClick={() => void creer()} disabled={envoi || !choisis.length} data-creer>
          {PG.creerPublier}
        </button>
      </div>
      <style>{STYLES_ESPACE}</style>
    </div>,
    document.body,
  );
}

/** Les figurines en petit (partagées avec l'écran Mes groupes). */
export const STYLES_FIGURINES_GROUPE = `
.ge-fig{display:block;width:48px;height:78px}
.ge-fig img{width:100%;height:100%;object-fit:contain;object-position:50% 100%}
.ge-tete{position:relative;display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;overflow:hidden;background:#3a2430;flex:none}
.ge-tete img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
`;

const STYLES_ESPACE = STYLES_FIGURINES_GROUPE + `
.ge{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:#120c09;color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;animation:ge-monte .28s cubic-bezier(.2,.9,.3,1.1)}
@keyframes ge-monte{from{transform:translateY(24px);opacity:0}}
@media (prefers-reduced-motion: reduce){.ge{animation:none}}
.ge-corps{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;max-width:560px;width:100%;margin:0 auto;padding-bottom:28px;box-sizing:border-box}
.ge-identite{padding:calc(12px + env(safe-area-inset-top)) 16px 16px;background:linear-gradient(160deg,#d6247f,#5a1d4a 70%,#120c09)}
.ge-barre{display:flex;align-items:center;justify-content:space-between}
.ge-retour{min-width:44px;min-height:44px;border:0;border-radius:50%;background:rgba(18,12,9,.55);color:#FFF4E6;font:inherit;font-size:22px;cursor:pointer}
.ge-retour.petit{font-size:16px}
.ge-compte{display:inline-flex;align-items:center;min-height:40px;padding:0 13px;border-radius:999px;background:rgba(18,12,9,.45);font-weight:700;font-size:13.5px}
.ge-nom{display:flex;align-items:center;gap:12px;margin-top:6px}
.ge-e{font-size:52px;line-height:1}
.ge-nom h1{margin:0;font-size:26px;font-weight:900;letter-spacing:-.03em;line-height:1.05;overflow-wrap:anywhere}
.ge-mot{margin:2px 0 0;font-family:Caveat,cursive;font-weight:700;font-size:19px;line-height:1.05}
.ge-themes{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.ge-theme{display:inline-flex;align-items:center;min-height:32px;padding:0 13px;border-radius:999px;background:rgba(18,12,9,.45);font-weight:700;font-size:13.5px}
.ge-salon{position:relative;flex:none;height:200px;margin:0 16px;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#3a2340,#2a1a22 65%,#4a2e24 65%);box-shadow:0 0 0 1px rgba(255,196,140,.14)}
.ge-ecran{position:absolute;left:50%;top:14px;width:170px;height:92px;transform:translateX(-50%);border-radius:10px;border:5px solid #0d0a14;background:linear-gradient(135deg,#ff6fb5,#5a1d7a);display:flex;align-items:center;justify-content:center}
.ge-ecran i{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.9);color:#222;font-style:normal;font-size:13px}
.ge-assis{position:absolute;left:0;right:0;bottom:4px;display:flex;justify-content:center;gap:2px}
.ge-passage{position:absolute;left:12px;bottom:14px;max-width:56%;margin:0;padding:6px 10px;border-radius:12px;background:rgba(18,12,9,.8);font-size:12.5px;line-height:1.3}
.ge-passage.ici{bottom:auto;top:12px;color:#3ddc97;font-weight:800}
.ge-entrer{position:absolute;right:12px;bottom:14px;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:999px;background:#f5a23a;color:#2a1500;font-weight:800;font-size:14.5px;text-decoration:none}
.ge-rub{margin:6px 0 0;padding:0 16px;color:#F2C46B;font-size:17px;font-weight:800}
.ge-membres{display:flex;flex-wrap:wrap;gap:12px;padding:0 16px}
.ge-membre{display:flex;flex-direction:column;align-items:center;gap:4px;width:64px;text-align:center}
.ge-membre b{font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.ge-seuls{margin:4px 16px 0;text-align:center;color:#a8927e;font-size:12px}
.ge-haut{display:flex;align-items:center;gap:8px;padding:calc(12px + env(safe-area-inset-top)) 16px 6px}
.ge-haut strong{flex:1;font-size:21px;font-weight:800;letter-spacing:-.02em}
.ge-form{gap:16px;padding-top:6px;padding-bottom:110px}
.ge-champ{display:flex;flex-direction:column;gap:6px;padding:0 16px}
.ge-champ span,.ge-etiquette{color:#F2C46B;font-weight:800;font-size:15px}
.ge-etiquette{margin:0 0 8px;padding:0 16px}
.ge-champ input{min-height:48px;padding:0 14px;border:1px solid rgba(255,196,140,.3);border-radius:14px;background:#1c1411;color:#FFF4E6;font:inherit;font-size:16px}
.ge-rang{display:flex;gap:8px;overflow-x:auto;padding:2px 16px 4px;scrollbar-width:none}
.ge-rang::-webkit-scrollbar{display:none}
.ge-puce{flex:none;min-height:40px;padding:0 14px;border:1px solid rgba(255,196,140,.28);border-radius:999px;background:#1c1411;color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;white-space:nowrap;cursor:pointer}
.ge-puce.pris{border-color:#ff2e9a;background:rgba(255,46,154,.2);color:#fff}
.ge-proche{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;width:72px;padding:6px 0;border:0;border-radius:16px;background:none;color:#FFF4E6;font:inherit;cursor:pointer}
.ge-proche b{font-size:12.5px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ge-proche .ge-tete{opacity:.7}
.ge-proche.pris .ge-tete{opacity:1;box-shadow:0 0 0 3px #3ddc97}
.ge-coche{position:absolute;right:0;bottom:0;width:20px;height:20px;border-radius:50%;background:#3ddc97;color:#06301a;font-style:normal;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center}
.ge-aucun{margin:0 16px;color:#cdb8a4;font-size:14px}
.ge-erreur{margin:0 16px;padding:10px 14px;border-radius:14px;background:rgba(255,80,80,.14);color:#ffd0d0;font-size:14px}
.ge-bas{position:absolute;left:0;right:0;bottom:0;padding:14px 16px calc(18px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(18,12,9,0),#120c09 35%)}
.ge-publier{display:block;width:100%;max-width:528px;margin:0 auto;min-height:54px;border:0;border-radius:999px;background:linear-gradient(135deg,#ff4fb0,#ff2e9a);color:#fff;font:inherit;font-weight:800;font-size:17px;box-shadow:0 10px 26px rgba(255,46,154,.45);cursor:pointer}
.ge-publier:disabled{opacity:.5;cursor:default}
`;
