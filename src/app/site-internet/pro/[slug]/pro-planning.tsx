"use client";

// 📅 MON PLANNING D'ANNONCES.
//
// « Qu'ils puissent préparer un jour du mois toute la semaine ou tout le mois
// à l'avance, pour ne pas avoir à le faire tous les jours. Avec une annonce
// qui tourne plusieurs jours d'affilée s'il le souhaite. »
//
// UN ÉCRAN, TROIS CHOSES : le mois qui vient, jour par jour (ce qui tourne
// déjà, ce qui est programmé) ; préparer une annonce (sa photo, son texte, son
// premier jour, combien de jours) ; et la liste de ce qui attend son jour, à
// retirer ou à dupliquer. Les règles sont dans `lib/direct/planning-annonces.ts`,
// le jour venu dans `lib/direct/planning-activation.ts`.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DUREE_MAX_JOURS,
  MAX_PAR_JOUR,
  SORTES_PLANNING,
  ajouterJours,
  jourEnClair,
  joursCouverts,
  joursDeLaFin,
  periodeEnClair,
  type AnnoncePlanifiee,
  type FamillePlanifiee,
} from "@/lib/direct/planning-annonces";

type EnLigne = { id: string; texte: string; photo: string | null; famille: string; publieLe: string; expireLe: string | null };
type Etat = {
  planning: AnnoncePlanifiee[];
  enLigne: EnLigne[];
  photos: string[];
  vedettePossible: boolean;
  restaurant: boolean;
  aujourdhui: string;
  horizon: string;
  maintenant: string;
  ville: string;
};

/** « mar. 14 » — la ligne d'un jour, courte. */
const jourCourt = (jour: string) => {
  const d = new Date(`${jour}T12:00:00Z`);
  return {
    sem: d.toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "short" }).replace(".", ""),
    num: d.getUTCDate(),
    mois: d.toLocaleDateString("fr-FR", { timeZone: "UTC", month: "short" }).replace(".", ""),
  };
};

/** « jeu. 15 oct » ou « jeu. 15 → sam. 17 oct » — une date de série, sur une puce. */
const dateCourte = (a: { jour: string; jours: number }) => {
  const d = jourCourt(a.jour);
  if (a.jours <= 1) return `${d.sem} ${d.num} ${d.mois}`;
  const f = jourCourt(ajouterJours(a.jour, a.jours - 1));
  return `${d.sem} ${d.num}${f.mois === d.mois ? "" : ` ${d.mois}`} → ${f.sem} ${f.num} ${f.mois}`;
};

/** Sa photo, ramenée à 1600 points en JPEG : une requête tient en 4,5 Mo, un téléphone fait 12 Mpx. */
function lirePhoto(f: File): Promise<string> {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      ko(new Error("Cette photo n’a pas pu être lue."));
    };
    img.src = url;
  });
}

export function ProPlanning({ slug, token }: { slug: string; token: string }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [lectureKo, setLectureKo] = useState("");
  const [err, setErr] = useState("");
  const [dit, setDit] = useState("");
  const [occupe, setOccupe] = useState("");
  const [toutLeMois, setToutLeMois] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  /* LE FORMULAIRE */
  const [photo, setPhoto] = useState("");
  const [famille, setFamille] = useState<FamillePlanifiee>("offre");
  const [texte, setTexte] = useState("");
  const [prix, setPrix] = useState("");
  const [jour, setJour] = useState("");
  const [jours, setJours] = useState(1);
  const [vedette, setVedette] = useState(true);
  const [repeter, setRepeter] = useState(false);
  /** L'annonce qu'on duplique, et le jour choisi pour la copie. */
  const [copie, setCopie] = useState<{ id: string; jour: string } | null>(null);

  const appeler = useCallback(
    async (body: Record<string, unknown>) => {
      const r = await fetch("/api/site-internet/pro/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, ...body }),
      });
      const j = (await r.json().catch(() => ({}))) as Partial<Etat> & { error?: string; ajoutees?: number; ignores?: string[] };
      if (!r.ok) throw new Error(j.error || "Action impossible.");
      return j as Etat & { ajoutees?: number; ignores?: string[] };
    },
    [slug, token],
  );

  const relire = useCallback(
    () =>
      appeler({ action: "lire" })
        .then((j) => {
          setEtat(j);
          setLectureKo("");
        })
        .catch((e: unknown) => setLectureKo(String((e as Error)?.message ?? e))),
    [appeler],
  );

  useEffect(() => {
    let vivant = true;
    appeler({ action: "lire" })
      .then((j) => {
        if (vivant) setEtat(j);
      })
      .catch((e: unknown) => {
        if (vivant) setLectureKo(String((e as Error)?.message ?? e));
      });
    return () => {
      vivant = false;
    };
  }, [appeler]);

  // RELIRE EN S'OUVRANT : l'onglet reste monté ; une annonce partie entre-temps doit s'y voir.
  useEffect(() => {
    const vu = (e: Event) => {
      if ((e as CustomEvent).detail === "planning") void relire();
    };
    window.addEventListener("pro-tab-shown", vu as EventListener);
    return () => window.removeEventListener("pro-tab-shown", vu as EventListener);
  }, [relire]);

  /* LE MOIS QUI VIENT, JOUR PAR JOUR */
  const jourDuMois = useMemo(() => {
    if (!etat) return [];
    const maintenant = new Date(etat.maintenant);
    const out: { jour: string; items: { cle: string; texte: string; photo: string | null; programmee: boolean; rang: string }[] }[] = [];
    for (let j = etat.aujourdhui; j <= etat.horizon; j = ajouterJours(j, 1)) out.push({ jour: j, items: [] });
    const ou = new Map(out.map((x) => [x.jour, x]));
    for (const a of etat.enLigne) {
      const couverts = joursDeLaFin(a.publieLe, a.expireLe, maintenant);
      couverts.forEach((j) => ou.get(j)?.items.push({ cle: `l-${a.id}`, texte: a.texte, photo: a.photo, programmee: false, rang: "" }));
    }
    for (const a of etat.planning) {
      joursCouverts(a).forEach((j, i) =>
        ou.get(j)?.items.push({ cle: `p-${a.id}`, texte: a.texte, photo: a.photo, programmee: true, rang: a.jours > 1 ? `jour ${i + 1}/${a.jours}` : "" }),
      );
    }
    return out;
  }, [etat]);
  const visibles = toutLeMois ? jourDuMois : jourDuMois.slice(0, 14);

  /* CE QUI ATTEND SON JOUR — une série (« chaque semaine ») tient sur UNE carte, avec ses dates. */
  const groupes = useMemo(() => {
    const out: { cle: string; tete: AnnoncePlanifiee; toutes: AnnoncePlanifiee[] }[] = [];
    const parSerie = new Map<string, (typeof out)[number]>();
    for (const a of [...(etat?.planning ?? [])].sort((x, y) => x.debut.localeCompare(y.debut))) {
      const g = a.serie ? parSerie.get(a.serie) : undefined;
      if (g) {
        g.toutes.push(a);
        continue;
      }
      const n = { cle: a.serie || a.id, tete: a, toutes: [a] };
      if (a.serie) parSerie.set(a.serie, n);
      out.push(n);
    }
    return out;
  }, [etat]);

  const ouvrir = (j?: string) => {
    if (!etat) return;
    setOuvert(true);
    setErr("");
    setDit("");
    setJour(j ?? etat.aujourdhui);
    setPhoto((p) => p || etat.photos[0] || "");
    setTimeout(() => document.getElementById("ppl-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const programmer = async () => {
    if (!etat) return;
    setErr("");
    setDit("");
    if (!photo) return setErr("Choisissez une photo : c’est elle qu’on voit en premier.");
    if (!texte.trim()) return setErr("Écrivez votre annonce.");
    setOccupe("ajouter");
    try {
      const j = await appeler({ action: "ajouter", texte, famille, photo, prix, jour, jours, vedette: enVedette, repeter });
      setEtat(j);
      const premier = j.planning.find((a) => a.jour === jour && a.texte === texte.trim());
      const quand = periodeEnClair({ jour, jours });
      setDit(
        (j.ajoutees && j.ajoutees > 1 ? `${j.ajoutees} annonces programmées, chaque semaine, à partir du ${jourEnClair(jour)}.` : `Programmée : ${quand}.`) +
          (j.ignores?.length ? ` Sautées (déjà ${MAX_PAR_JOUR} annonces ce jour-là) : ${j.ignores.map(jourEnClair).join(", ")}.` : "") +
          (!premier && jour === j.aujourdhui ? " Elle commence aujourd’hui : elle est déjà en ligne." : ""),
      );
      setOuvert(false);
      setTexte("");
      setPrix("");
      setRepeter(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setOccupe("");
    }
  };

  const agir = async (cle: string, body: Record<string, unknown>) => {
    setOccupe(cle);
    setErr("");
    setDit("");
    try {
      setEtat(await appeler(body));
      setCopie(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setOccupe("");
    }
  };

  const sorte = SORTES_PLANNING.find((x) => x.cle === famille) ?? SORTES_PLANNING[0];
  // EN VEDETTE DANS L'ESSAYAGE : une pièce s'essaie, une soirée ou un créneau non.
  const vedetteOfferte = !!etat?.vedettePossible && famille === "offre";
  const enVedette = vedetteOfferte && vedette;
  const sortes = SORTES_PLANNING.filter((x) => x.cle !== "menu" || etat?.restaurant);

  return (
    <div className="ppl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .ppl .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:800;}
          .pro .ppl .sub{font-size:13px;color:var(--soft);margin-top:5px;line-height:1.5;}
          .pro .ppl .regles{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
          .pro .ppl .regles span{font-size:11px;font-weight:800;color:#0A6B48;background:#E6F7F1;border-radius:9px;padding:4px 9px;}
          .pro .ppl .go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:14px;border:0;border-radius:15px;
            padding:14px 16px;font-family:inherit;font-size:15px;font-weight:800;color:#fff;background:var(--grad);cursor:pointer;}
          .pro .ppl .go:disabled{opacity:.6;cursor:default;}
          .pro .ppl .ok{margin-top:12px;background:#E6F7F1;color:#0A6B48;border-radius:11px;padding:10px 12px;font-size:13px;font-weight:700;line-height:1.45;}
          .pro .ppl .err{margin-top:12px;background:#FBE9E4;color:#C0442A;border-radius:11px;padding:10px 12px;font-size:12.5px;font-weight:700;}
          .pro .ppl .cal{margin-top:16px;border:1px solid var(--hair);border-radius:15px;background:var(--paper);overflow:hidden;}
          .pro .ppl .jr{display:grid;grid-template-columns:52px minmax(0,1fr) 34px;align-items:center;gap:10px;padding:8px 10px 8px 12px;
            border-top:1px solid var(--hair);min-height:46px;}
          .pro .ppl .jr:first-child{border-top:0;}
          .pro .ppl .jr.auj{background:#F4FBF8;}
          .pro .ppl .jr.we .num{color:#B4552F;}
          .pro .ppl .dt{display:flex;flex-direction:column;align-items:center;line-height:1.05;}
          .pro .ppl .dt .sem{font-size:10px;font-weight:800;text-transform:uppercase;color:var(--faint);letter-spacing:.04em;}
          .pro .ppl .dt .num{font-size:18px;font-weight:900;color:var(--ink);}
          .pro .ppl .dt .mo{font-size:9.5px;color:var(--faint);font-weight:700;}
          .pro .ppl .its{display:flex;flex-wrap:wrap;gap:5px;min-width:0;}
          .pro .ppl .it{display:inline-flex;align-items:center;gap:6px;max-width:100%;min-width:0;border-radius:10px;padding:3px 8px 3px 3px;
            font-size:11.5px;font-weight:700;color:var(--ink);background:#EEF1F4;}
          .pro .ppl .it.p{background:#FFF4DE;color:#7A4B00;}
          .pro .ppl .it.l{background:#E6F7F1;color:#0A6B48;}
          .pro .ppl .it i{flex:none;width:22px;height:22px;border-radius:7px;background:#ddd center/cover no-repeat;}
          .pro .ppl .it b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;font-weight:700;}
          .pro .ppl .it em{flex:none;font-style:normal;font-weight:800;opacity:.7;}
          .pro .ppl .rien{font-size:12px;color:var(--faint);}
          .pro .ppl .plus{width:30px;height:30px;border-radius:10px;border:1px dashed var(--hair);background:#fff;color:var(--violet);
            font-size:18px;font-weight:800;cursor:pointer;font-family:inherit;line-height:1;}
          .pro .ppl .plus:disabled{opacity:.35;cursor:default;}
          .pro .ppl .leg{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:11.5px;color:var(--soft);font-weight:600;}
          .pro .ppl .leg span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;}
          .pro .ppl .leg .l::before{background:#BFE9D8;}
          .pro .ppl .leg .p::before{background:#FFE2A8;}
          .pro .ppl .mois{display:block;margin:10px auto 0;border:0;background:none;font-family:inherit;font-size:13px;font-weight:800;color:var(--violet);cursor:pointer;}
          .pro .ppl .form{margin-top:16px;border:1px solid var(--hair);border-radius:16px;background:var(--paper);padding:14px;}
          .pro .ppl .lab{display:block;margin:14px 0 6px;font-size:12px;font-weight:800;color:var(--ink);}
          .pro .ppl .lab:first-child{margin-top:0;}
          .pro .ppl .phs{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
          .pro .ppl .ph{flex:none;width:68px;height:68px;border-radius:12px;border:2px solid transparent;background:#EEE center/cover no-repeat;cursor:pointer;padding:0;}
          .pro .ppl .ph.on{border-color:var(--violet);box-shadow:0 0 0 3px rgba(0,200,150,.18);}
          .pro .ppl .ph.add{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;background:#F7F5EF;border:1px dashed var(--hair);
            font-size:10.5px;font-weight:800;color:var(--soft);text-align:center;line-height:1.15;}
          .pro .ppl .ph.add span{font-size:20px;}
          .pro .ppl .chips{display:flex;flex-wrap:wrap;gap:6px;}
          .pro .ppl .chip{border:1px solid var(--hair);background:#fff;border-radius:999px;padding:8px 12px;font-family:inherit;font-size:12.5px;
            font-weight:800;color:var(--ink);cursor:pointer;}
          .pro .ppl .chip.on{background:var(--violet);border-color:transparent;color:#fff;}
          .pro .ppl textarea,.pro .ppl input[type=text],.pro .ppl input[type=date]{width:100%;box-sizing:border-box;border:1px solid var(--hair);
            border-radius:12px;padding:11px 12px;font-family:inherit;font-size:16px;color:var(--ink);background:#fff;}
          .pro .ppl textarea{min-height:76px;resize:vertical;line-height:1.4;}
          .pro .ppl .cpt{text-align:right;font-size:11px;color:var(--faint);margin-top:3px;}
          .pro .ppl .mini{display:block;margin:0 0 5px;font-size:12px;color:var(--soft);font-weight:600;}
          .pro .ppl .mini.ap{margin-top:12px;}
          .pro .ppl .duree{display:flex;gap:5px;}
          .pro .ppl .duree .chip{flex:1;min-width:0;padding:9px 0;text-align:center;white-space:nowrap;}
          .pro .ppl .chk{display:flex;gap:10px;align-items:flex-start;margin-top:12px;font-size:13px;color:var(--ink);line-height:1.4;cursor:pointer;}
          .pro .ppl .chk input{flex:none;width:20px;height:20px;margin:1px 0 0;accent-color:#00926E;}
          .pro .ppl .chk small{display:block;color:var(--soft);font-size:11.5px;}
          .pro .ppl .recap{margin-top:12px;font-size:12.5px;line-height:1.5;color:#0A6B48;background:#F4FBF8;border-radius:11px;padding:10px 12px;}
          .pro .ppl .annuler{display:block;margin:10px auto 0;border:0;background:none;font-family:inherit;font-size:13px;font-weight:700;color:var(--soft);cursor:pointer;}
          .pro .ppl .liste{margin-top:24px;padding-top:16px;border-top:1px solid var(--hair);}
          .pro .ppl .a{display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;border:1px solid var(--hair);border-radius:15px;background:var(--paper);
            padding:12px;margin-top:10px;}
          .pro .ppl .a .vig{width:64px;height:64px;border-radius:11px;background:#EEE center/cover no-repeat;}
          .pro .ppl .a .tx{font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.4;margin:0;}
          .pro .ppl .a .qd{font-size:11.5px;color:#B4552F;font-weight:800;margin-top:4px;}
          .pro .ppl .a .tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;}
          .pro .ppl .a .tags span{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-radius:8px;padding:3px 7px;
            background:#EEF1F4;color:var(--soft);}
          .pro .ppl .a .acts{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;}
          .pro .ppl .a button{border-radius:17px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;
            border:1px solid var(--hair);background:#fff;color:var(--ink);}
          .pro .ppl .a button.ret{color:#C0442A;}
          .pro .ppl .a button.pri{background:#00926E;border-color:transparent;color:#fff;}
          .pro .ppl .a button:disabled{opacity:.55;cursor:default;}
          .pro .ppl .dates{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;}
          .pro .ppl .date{display:inline-flex;align-items:center;gap:2px;border-radius:9px;background:#FFF4DE;color:#7A4B00;
            font-size:11.5px;font-weight:800;padding:2px 2px 2px 8px;}
          .pro .ppl .a .date button{border:0;background:none;padding:3px 6px;border-radius:7px;font-size:11px;color:#B4552F;}
          .pro .ppl .cp{display:flex;gap:7px;align-items:center;margin-top:9px;}
          .pro .ppl .cp input{flex:1;min-width:0;padding:8px 10px;font-size:15px;}
          .pro .ppl .vide{margin-top:12px;border:1px dashed var(--hair);border-radius:15px;padding:18px;text-align:center;font-size:13px;color:var(--soft);line-height:1.6;}
          `,
        }}
      />

      <div className="k">Mon planning d’annonces</div>
      <div className="sub">
        Préparez la semaine ou le mois en une fois. Chaque annonce part d’elle-même le jour venu — dans Le Direct de votre ville et sur
        votre page — puis s’arrête à la date prévue.
      </div>
      <div className="regles">
        <span>{DUREE_MAX_JOURS} jours au plus</span>
        <span>Jusqu’à un mois à l’avance</span>
        <span>{MAX_PAR_JOUR} annonces par jour</span>
      </div>

      {lectureKo && !etat ? <div className="err">Je n’ai pas pu lire votre planning : {lectureKo}</div> : null}
      {dit ? <div className="ok">✓ {dit}</div> : null}
      {err && !ouvert ? <div className="err">{err}</div> : null}

      {etat && !ouvert && (
        <button type="button" className="go" onClick={() => ouvrir()}>
          ＋ Préparer une annonce
        </button>
      )}

      {/* ═══ PRÉPARER UNE ANNONCE ═══ */}
      {etat && ouvert && (
        <div className="form" id="ppl-form">
          <span className="lab">1. Sa photo</span>
          <div className="phs">
            <label className="ph add">
              <span>📷</span>
              Prendre
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (f)
                    void lirePhoto(f)
                      .then(setPhoto)
                      .catch((e: Error) => setErr(e.message));
                }}
              />
            </label>
            {photo && !etat.photos.includes(photo) && (
              <button type="button" className="ph on" style={{ backgroundImage: `url(${JSON.stringify(photo)})` }} aria-label="Votre photo" />
            )}
            {etat.photos.map((u) => (
              <button
                type="button"
                key={u.slice(0, 80) + u.length}
                className={`ph${photo === u ? " on" : ""}`}
                style={{ backgroundImage: `url(${JSON.stringify(u)})` }}
                aria-label="Choisir cette photo"
                aria-pressed={photo === u}
                onClick={() => setPhoto(u)}
              />
            ))}
          </div>

          <span className="lab">2. Ce que vous annoncez</span>
          <div className="chips">
            {sortes.map((x) => (
              <button type="button" key={x.cle} className={`chip${famille === x.cle ? " on" : ""}`} aria-pressed={famille === x.cle} onClick={() => setFamille(x.cle)}>
                {x.label}
              </button>
            ))}
          </div>
          <textarea
            style={{ marginTop: 8 }}
            value={texte}
            maxLength={140}
            onChange={(ev) => setTexte(ev.target.value)}
            placeholder={`Ex. : ${sorte.exemple}`}
            aria-label="Le texte de l’annonce"
          />
          <div className="cpt">{texte.length}/140</div>
          <input type="text" value={prix} maxLength={20} onChange={(ev) => setPrix(ev.target.value)} placeholder="Prix (facultatif) — ex. 89 €" aria-label="Prix" />

          <span className="lab">3. Quand</span>
          <label>
            <span className="mini">À partir du</span>
            <input type="date" value={jour} min={etat.aujourdhui} max={etat.horizon} onChange={(ev) => setJour(ev.target.value)} aria-label="Premier jour" />
          </label>
          <span className="mini ap">Pendant</span>
          {/* SUR UNE LIGNE, MÊME À 320 : sept pastilles qui se partagent la largeur. */}
          <div className="duree">
            {Array.from({ length: DUREE_MAX_JOURS }, (_, i) => i + 1).map((n) => (
              <button type="button" key={n} className={`chip${jours === n ? " on" : ""}`} aria-pressed={jours === n} aria-label={`${n} jour${n > 1 ? "s" : ""}`} onClick={() => setJours(n)}>
                {n} j
              </button>
            ))}
          </div>

          {vedetteOfferte && (
            <label className="chk">
              <input type="checkbox" checked={vedette} onChange={(ev) => setVedette(ev.target.checked)} />
              <span>
                Aussi en vedette dans l’essayage de ma page
                <small>Vos client·es pourront l’essayer sur leur photo pendant toute la durée.</small>
              </span>
            </label>
          )}
          <label className="chk">
            <input type="checkbox" checked={repeter} onChange={(ev) => setRepeter(ev.target.checked)} />
            <span>
              La remettre chaque semaine
              <small>Le même jour, chaque semaine, jusqu’à un mois.</small>
            </span>
          </label>

          {jour && (
            <div className="recap">
              Elle partira le <b>{jourEnClair(jour)}</b>
              {jours > 1 ? (
                <>
                  {" "}
                  et restera en ligne jusqu’au <b>{jourEnClair(ajouterJours(jour, jours - 1))}</b> au soir
                </>
              ) : (
                " et restera en ligne toute la journée"
              )}
              , dans Le Direct{etat.ville ? " de votre ville" : ""} et sur votre page{enVedette ? ", en vedette dans l’essayage" : ""}.
            </div>
          )}

          {err ? <div className="err">{err}</div> : null}
          <button type="button" className="go" disabled={occupe === "ajouter"} onClick={() => void programmer()}>
            {occupe === "ajouter" ? "Programmation…" : repeter ? "Programmer chaque semaine" : "Programmer"}
          </button>
          <button type="button" className="annuler" onClick={() => setOuvert(false)}>
            Annuler
          </button>
        </div>
      )}

      {/* ═══ LE MOIS QUI VIENT ═══ */}
      {etat && (
        <>
          <div className="cal" aria-label="Le mois qui vient">
            {visibles.map(({ jour: j, items }) => {
              const c = jourCourt(j);
              const d = new Date(`${j}T12:00:00Z`).getUTCDay();
              const plein = items.length >= MAX_PAR_JOUR;
              return (
                <div key={j} className={`jr${j === etat.aujourdhui ? " auj" : ""}${d === 0 || d === 6 ? " we" : ""}`}>
                  <div className="dt">
                    <span className="sem">{j === etat.aujourdhui ? "auj." : c.sem}</span>
                    <span className="num">{c.num}</span>
                    <span className="mo">{c.mois}</span>
                  </div>
                  <div className="its">
                    {items.length ? (
                      items.map((it, i) => (
                        <span key={`${it.cle}-${i}`} className={`it ${it.programmee ? "p" : "l"}`} title={it.texte}>
                          <i style={it.photo ? { backgroundImage: `url(${JSON.stringify(it.photo)})` } : undefined} />
                          <b>{it.texte}</b>
                          {it.rang ? <em>{it.rang}</em> : null}
                        </span>
                      ))
                    ) : (
                      <span className="rien">—</span>
                    )}
                  </div>
                  <button type="button" className="plus" disabled={plein} aria-label={`Préparer une annonce pour le ${jourEnClair(j)}`} onClick={() => ouvrir(j)}>
                    ＋
                  </button>
                </div>
              );
            })}
          </div>
          <div className="leg">
            <span className="l">En ligne</span>
            <span className="p">Programmée</span>
          </div>
          {jourDuMois.length > 14 && (
            <button type="button" className="mois" onClick={() => setToutLeMois((v) => !v)}>
              {toutLeMois ? "Voir seulement deux semaines" : "Voir tout le mois"}
            </button>
          )}

          {/* ═══ CE QUI ATTEND SON JOUR ═══ */}
          <div className="liste">
            <div className="k">Programmées ({etat.planning.length})</div>
            {groupes.length === 0 && (
              <div className="vide">
                Rien de programmé pour l’instant.
                <br />
                Touchez «&nbsp;＋&nbsp;» à côté d’un jour pour y préparer une annonce.
              </div>
            )}
            {groupes.map(({ cle, tete: a, toutes }) => (
              <div className="a" key={cle}>
                <div className="vig" style={{ backgroundImage: `url(${JSON.stringify(a.photo)})` }} />
                <div>
                  <p className="tx">{a.texte}</p>
                  {toutes.length > 1 ? (
                    <>
                      <div className="qd">
                        Chaque semaine · {a.jours > 1 ? `${a.jours} jours` : "1 jour"}
                      </div>
                      {/* SES DATES, chacune retirable seule : la semaine où il ferme, il n'en enlève qu'une. */}
                      <div className="dates">
                        {toutes.map((x) => (
                          <span key={x.id} className="date">
                            {dateCourte(x)}
                            <button
                              type="button"
                              disabled={occupe === x.id}
                              aria-label={`Retirer celle du ${jourEnClair(x.jour)}`}
                              onClick={() => void agir(x.id, { action: "retirer", id: x.id })}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="qd">{periodeEnClair(a)}</div>
                  )}
                  <div className="tags">
                    <span>{SORTES_PLANNING.find((x) => x.cle === a.famille)?.label ?? a.famille}</span>
                    {a.prix ? <span>{a.prix}</span> : null}
                    {a.vedette ? <span>⭐ En vedette</span> : null}
                  </div>
                  {copie?.id === a.id ? (
                    <div className="cp">
                      <input type="date" value={copie.jour} min={etat.aujourdhui} max={etat.horizon} onChange={(ev) => setCopie({ id: a.id, jour: ev.target.value })} aria-label="Jour de la copie" />
                      <button type="button" className="pri" disabled={occupe === a.id || !copie.jour} onClick={() => void agir(a.id, { action: "dupliquer", id: a.id, jour: copie.jour })}>
                        Copier
                      </button>
                      <button type="button" onClick={() => setCopie(null)}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="acts">
                      <button type="button" disabled={occupe === a.id} onClick={() => setCopie({ id: a.id, jour: ajouterJours(a.jour, 7) <= etat.horizon ? ajouterJours(a.jour, 7) : a.jour })}>
                        Dupliquer…
                      </button>
                      {toutes.length > 1 ? (
                        <button type="button" className="ret" disabled={occupe === a.id} onClick={() => void agir(a.id, { action: "retirer", id: a.id, serie: true })}>
                          Retirer toutes les semaines
                        </button>
                      ) : (
                        <button type="button" className="ret" disabled={occupe === a.id} onClick={() => void agir(a.id, { action: "retirer", id: a.id })}>
                          Retirer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
